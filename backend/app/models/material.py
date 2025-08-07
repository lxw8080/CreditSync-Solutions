"""
资料分类和子项模型
"""
from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from .base import Base


class MaterialCategory(Base):
    """资料分类表"""
    __tablename__ = "material_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    items = relationship("MaterialItem", back_populates="category", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MaterialCategory(id={self.id}, name='{self.name}')>"


class MaterialItem(Base):
    """资料子项表"""
    __tablename__ = "material_items"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("material_categories.id"), nullable=False)
    name = Column(String(100), nullable=False)
    file_types = Column(JSON, nullable=True)  # ['image', 'video', 'text']
    is_required = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    category = relationship("MaterialCategory", back_populates="items")
    uploaded_files = relationship("UploadedFile", back_populates="material_item")
    
    def __repr__(self):
        return f"<MaterialItem(id={self.id}, name='{self.name}', is_required={self.is_required})>"
