"""
协同操作API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import qrcode
import io
import base64
from typing import Optional

from app.api.auth import get_current_user, get_db
from app.models.user import User
from app.models.order import Order
from app.models.collaboration import CollaborationLink
from app.models.upload import UploadedFile
from app.config import settings

router = APIRouter()


@router.post("/orders/{order_id}/create-link")
async def create_collaboration_link(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建协同操作链接"""
    # 检查订单是否存在
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权创建此订单的协同链接")
    
    # 检查是否已有有效的协同链接
    existing_link = db.query(CollaborationLink).filter(
        CollaborationLink.order_id == order_id,
        CollaborationLink.expires_at > datetime.utcnow()
    ).first()
    
    if existing_link:
        # 返回现有链接
        collaboration_url = f"{settings.FRONTEND_URL}/collaborate/{existing_link.token}"
        return {
            "success": True,
            "data": {
                "id": existing_link.id,
                "token": existing_link.token,
                "url": collaboration_url,
                "expires_at": existing_link.expires_at,
                "qr_code": generate_qr_code(collaboration_url)
            },
            "message": "获取协同链接成功"
        }
    
    # 创建新的协同链接
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=settings.COLLABORATION_TOKEN_EXPIRE_HOURS)
    
    collaboration_link = CollaborationLink(
        order_id=order_id,
        token=token,
        expires_at=expires_at,
        created_by=current_user.id
    )
    
    db.add(collaboration_link)
    db.commit()
    db.refresh(collaboration_link)
    
    collaboration_url = f"{settings.FRONTEND_URL}/collaborate/{token}"
    
    return {
        "success": True,
        "data": {
            "id": collaboration_link.id,
            "token": collaboration_link.token,
            "url": collaboration_url,
            "expires_at": collaboration_link.expires_at,
            "qr_code": generate_qr_code(collaboration_url)
        },
        "message": "创建协同链接成功"
    }


@router.get("/links/{token}")
async def get_collaboration_info(
    token: str,
    db: Session = Depends(get_db)
):
    """通过token获取协同操作信息"""
    collaboration_link = db.query(CollaborationLink).filter(
        CollaborationLink.token == token
    ).first()
    
    if not collaboration_link:
        raise HTTPException(status_code=404, detail="协同链接不存在")
    
    # 检查链接是否过期
    if collaboration_link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="协同链接已过期")
    
    # 获取订单信息
    order = db.query(Order).filter(Order.id == collaboration_link.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="关联订单不存在")
    
    return {
        "success": True,
        "data": {
            "order": {
                "id": order.id,
                "order_number": order.order_number,
                "customer_name": order.customer_name,
                "customer_id_card": order.customer_id_card,
                "status": order.status,
                "created_at": order.created_at
            },
            "expires_at": collaboration_link.expires_at,
            "remaining_hours": max(0, (collaboration_link.expires_at - datetime.utcnow()).total_seconds() / 3600)
        },
        "message": "获取协同信息成功"
    }


@router.post("/links/{token}/upload")
async def collaborate_upload(
    token: str,
    material_item_id: Optional[int] = Form(None),
    text_content: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """通过协同链接上传文件"""
    collaboration_link = db.query(CollaborationLink).filter(
        CollaborationLink.token == token
    ).first()
    
    if not collaboration_link:
        raise HTTPException(status_code=404, detail="协同链接不存在")
    
    # 检查链接是否过期
    if collaboration_link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="协同链接已过期")
    
    # 获取订单信息
    order = db.query(Order).filter(Order.id == collaboration_link.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="关联订单不存在")
    
    # 文本内容和文件至少要有一个
    if not text_content:
        raise HTTPException(status_code=400, detail="必须提供文本内容")
    
    upload_time = datetime.utcnow()
    
    # 创建上传记录（协同上传的uploader_id设为订单创建者）
    uploaded_file = UploadedFile(
        order_id=collaboration_link.order_id,
        material_item_id=material_item_id,
        file_name=None,
        file_path=None,
        file_size=None,
        file_type='text',
        upload_time=upload_time,
        uploader_id=order.creator_id,  # 使用订单创建者ID
        text_content=text_content
    )
    
    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)
    
    return {
        "success": True,
        "data": {
            "id": uploaded_file.id,
            "order_id": uploaded_file.order_id,
            "material_item_id": uploaded_file.material_item_id,
            "file_type": uploaded_file.file_type,
            "upload_time": uploaded_file.upload_time,
            "text_content": uploaded_file.text_content
        },
        "message": "协同上传成功"
    }


@router.get("/links/{token}/files")
async def get_collaboration_files(
    token: str,
    db: Session = Depends(get_db)
):
    """获取协同链接对应订单的文件列表"""
    collaboration_link = db.query(CollaborationLink).filter(
        CollaborationLink.token == token
    ).first()
    
    if not collaboration_link:
        raise HTTPException(status_code=404, detail="协同链接不存在")
    
    # 检查链接是否过期
    if collaboration_link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="协同链接已过期")
    
    files = db.query(UploadedFile).filter(
        UploadedFile.order_id == collaboration_link.order_id
    ).all()
    
    return {
        "success": True,
        "data": [
            {
                "id": f.id,
                "material_item_id": f.material_item_id,
                "file_name": f.file_name,
                "file_type": f.file_type,
                "file_size": f.file_size,
                "upload_time": f.upload_time,
                "text_content": f.text_content
            }
            for f in files
        ],
        "message": "获取文件列表成功"
    }


@router.delete("/orders/{order_id}/links/{link_id}")
async def delete_collaboration_link(
    order_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除协同链接"""
    # 检查订单是否存在
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此协同链接")
    
    # 查找协同链接
    collaboration_link = db.query(CollaborationLink).filter(
        CollaborationLink.id == link_id,
        CollaborationLink.order_id == order_id
    ).first()
    
    if not collaboration_link:
        raise HTTPException(status_code=404, detail="协同链接不存在")
    
    db.delete(collaboration_link)
    db.commit()
    
    return {
        "success": True,
        "message": "删除协同链接成功"
    }


def generate_qr_code(url: str) -> str:
    """生成二维码"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 转换为base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"
