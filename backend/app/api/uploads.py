"""
文件上传API
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import os
import uuid
import aiofiles

from app.api.auth import get_current_user, get_db
from app.models.user import User
from app.models.order import Order
from app.models.upload import UploadedFile
from app.config import settings

router = APIRouter()


def get_file_type(filename: str) -> str:
    """根据文件扩展名判断文件类型"""
    ext = os.path.splitext(filename)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.heic', '.webp']:
        return 'image'
    elif ext in ['.mp4', '.mov', '.avi', '.mkv']:
        return 'video'
    else:
        return 'document'


@router.post("/")
async def upload_file(
    order_id: int = Form(...),
    material_item_id: Optional[int] = Form(None),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上传文件"""
    # 检查订单是否存在
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权上传文件到此订单")
    
    # 文本内容和文件至少要有一个
    if not text_content and not file:
        raise HTTPException(status_code=400, detail="必须提供文本内容或文件")
    
    upload_time = datetime.now()
    file_path = None
    file_size = None
    file_type = None
    file_name = None
    
    # 处理文件上传
    if file:
        # 检查文件大小
        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小超过限制")
        
        # 检查文件扩展名
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="不支持的文件格式")
        
        # 生成文件名和路径
        timestamp = int(upload_time.timestamp())
        unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}{ext}"
        order_dir = os.path.join(settings.UPLOAD_DIR, str(order_id))
        os.makedirs(order_dir, exist_ok=True)
        
        file_path = os.path.join(order_dir, unique_filename)
        file_name = file.filename
        file_size = file.size
        file_type = get_file_type(file.filename)
        
        # 保存文件
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    
    # 如果只有文本内容，设置文件类型为text
    if text_content and not file:
        file_type = 'text'
    
    # 创建上传记录
    uploaded_file = UploadedFile(
        order_id=order_id,
        material_item_id=material_item_id,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        upload_time=upload_time,
        uploader_id=current_user.id,
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
            "file_name": uploaded_file.file_name,
            "file_type": uploaded_file.file_type,
            "file_size": uploaded_file.file_size,
            "upload_time": uploaded_file.upload_time,
            "text_content": uploaded_file.text_content
        },
        "message": "文件上传成功"
    }


@router.get("/order/{order_id}")
async def get_order_files(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取订单的所有文件"""
    # 检查订单是否存在
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此订单的文件")
    
    files = db.query(UploadedFile).filter(UploadedFile.order_id == order_id).all()
    
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
                "uploader_id": f.uploader_id,
                "text_content": f.text_content
            }
            for f in files
        ],
        "message": "获取文件列表成功"
    }


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除文件"""
    uploaded_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 权限检查
    order = db.query(Order).filter(Order.id == uploaded_file.order_id).first()
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此文件")
    
    # 删除物理文件
    if uploaded_file.file_path and os.path.exists(uploaded_file.file_path):
        os.remove(uploaded_file.file_path)
    
    # 删除数据库记录
    db.delete(uploaded_file)
    db.commit()
    
    return {
        "success": True,
        "message": "删除文件成功"
    }
