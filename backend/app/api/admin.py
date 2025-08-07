"""
后台管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.auth import get_current_user, get_db
from app.models.user import User
from app.models.material import MaterialCategory, MaterialItem

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """要求管理员权限"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user


@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取资料分类列表"""
    categories = db.query(MaterialCategory).filter(
        MaterialCategory.is_active == True
    ).order_by(MaterialCategory.sort_order).all()
    
    result = []
    for category in categories:
        items = db.query(MaterialItem).filter(
            MaterialItem.category_id == category.id,
            MaterialItem.is_active == True
        ).order_by(MaterialItem.sort_order).all()
        
        result.append({
            "id": category.id,
            "name": category.name,
            "sort_order": category.sort_order,
            "items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "file_types": item.file_types,
                    "is_required": item.is_required,
                    "sort_order": item.sort_order
                }
                for item in items
            ]
        })
    
    return {
        "success": True,
        "data": result,
        "message": "获取资料分类成功"
    }


@router.post("/categories")
async def create_category(
    name: str,
    sort_order: int = 0,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """创建资料分类"""
    category = MaterialCategory(
        name=name,
        sort_order=sort_order
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {
        "success": True,
        "data": {
            "id": category.id,
            "name": category.name,
            "sort_order": category.sort_order
        },
        "message": "创建资料分类成功"
    }


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    name: Optional[str] = None,
    sort_order: Optional[int] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """更新资料分类"""
    category = db.query(MaterialCategory).filter(MaterialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="资料分类不存在")
    
    if name is not None:
        category.name = name
    if sort_order is not None:
        category.sort_order = sort_order
    
    db.commit()
    db.refresh(category)
    
    return {
        "success": True,
        "data": {
            "id": category.id,
            "name": category.name,
            "sort_order": category.sort_order
        },
        "message": "更新资料分类成功"
    }


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """删除资料分类"""
    category = db.query(MaterialCategory).filter(MaterialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="资料分类不存在")
    
    # 软删除
    category.is_active = False
    db.commit()
    
    return {
        "success": True,
        "message": "删除资料分类成功"
    }


@router.post("/categories/{category_id}/items")
async def create_material_item(
    category_id: int,
    name: str,
    file_types: List[str],
    is_required: bool = False,
    sort_order: int = 0,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """创建资料子项"""
    category = db.query(MaterialCategory).filter(MaterialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="资料分类不存在")
    
    item = MaterialItem(
        category_id=category_id,
        name=name,
        file_types=file_types,
        is_required=is_required,
        sort_order=sort_order
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return {
        "success": True,
        "data": {
            "id": item.id,
            "category_id": item.category_id,
            "name": item.name,
            "file_types": item.file_types,
            "is_required": item.is_required,
            "sort_order": item.sort_order
        },
        "message": "创建资料子项成功"
    }


@router.put("/items/{item_id}")
async def update_material_item(
    item_id: int,
    name: Optional[str] = None,
    file_types: Optional[List[str]] = None,
    is_required: Optional[bool] = None,
    sort_order: Optional[int] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """更新资料子项"""
    item = db.query(MaterialItem).filter(MaterialItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="资料子项不存在")
    
    if name is not None:
        item.name = name
    if file_types is not None:
        item.file_types = file_types
    if is_required is not None:
        item.is_required = is_required
    if sort_order is not None:
        item.sort_order = sort_order
    
    db.commit()
    db.refresh(item)
    
    return {
        "success": True,
        "data": {
            "id": item.id,
            "name": item.name,
            "file_types": item.file_types,
            "is_required": item.is_required,
            "sort_order": item.sort_order
        },
        "message": "更新资料子项成功"
    }


@router.delete("/items/{item_id}")
async def delete_material_item(
    item_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """删除资料子项"""
    item = db.query(MaterialItem).filter(MaterialItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="资料子项不存在")
    
    # 软删除
    item.is_active = False
    db.commit()
    
    return {
        "success": True,
        "message": "删除资料子项成功"
    }
