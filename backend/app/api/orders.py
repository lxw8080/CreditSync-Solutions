"""
订单管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.api.auth import get_current_user, get_db
from app.models.user import User
from app.models.order import Order

router = APIRouter()


@router.get("/")
async def get_orders(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取订单列表"""
    query = db.query(Order)
    
    # 客服只能看到自己创建的订单
    if current_user.role == "customer_service":
        query = query.filter(Order.creator_id == current_user.id)
    
    # 搜索过滤
    if search:
        query = query.filter(
            (Order.order_number.contains(search)) |
            (Order.customer_name.contains(search))
        )
    
    # 状态过滤
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    # 分页
    total = query.count()
    orders = query.offset((page - 1) * size).limit(size).all()
    
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": order.id,
                    "order_number": order.order_number,
                    "customer_name": order.customer_name,
                    "customer_id_card": order.customer_id_card,
                    "status": order.status,
                    "creator_id": order.creator_id,
                    "created_at": order.created_at,
                    "updated_at": order.updated_at
                }
                for order in orders
            ],
            "total": total,
            "page": page,
            "size": size
        },
        "message": "获取订单列表成功"
    }


@router.post("/")
async def create_order(
    customer_name: str = Form(...),
    customer_id_card: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建订单"""
    # 生成订单号
    order_number = f"ORD{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    order = Order(
        order_number=order_number,
        customer_name=customer_name,
        customer_id_card=customer_id_card,
        creator_id=current_user.id,
        status="in_progress"
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return {
        "success": True,
        "data": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_id_card": order.customer_id_card,
            "status": order.status,
            "creator_id": order.creator_id,
            "created_at": order.created_at
        },
        "message": "创建订单成功"
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取订单详情"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此订单")
    
    return {
        "success": True,
        "data": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_id_card": order.customer_id_card,
            "status": order.status,
            "creator_id": order.creator_id,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        },
        "message": "获取订单详情成功"
    }


@router.put("/{order_id}")
async def update_order(
    order_id: int,
    customer_name: Optional[str] = Form(None),
    customer_id_card: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新订单"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此订单")
    
    # 更新字段
    if customer_name is not None:
        order.customer_name = customer_name
    if customer_id_card is not None:
        order.customer_id_card = customer_id_card
    if status is not None:
        order.status = status
    
    db.commit()
    db.refresh(order)
    
    return {
        "success": True,
        "data": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_id_card": order.customer_id_card,
            "status": order.status,
            "updated_at": order.updated_at
        },
        "message": "更新订单成功"
    }


@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除订单"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    # 权限检查
    if current_user.role == "customer_service" and order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此订单")
    
    # 只能删除进行中的订单
    if order.status != "in_progress":
        raise HTTPException(status_code=400, detail="只能删除进行中的订单")
    
    db.delete(order)
    db.commit()
    
    return {
        "success": True,
        "message": "删除订单成功"
    }
