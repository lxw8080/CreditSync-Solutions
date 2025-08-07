"""
文件上传模型
"""
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class UploadedFile(Base):
    """上传文件表"""
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    material_item_id = Column(Integer, ForeignKey("material_items.id"), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    file_type = Column(String(50), nullable=True)  # image, video, text
    upload_time = Column(DateTime(timezone=True), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text_content = Column(Text, nullable=True)  # 文本类型资料内容
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    order = relationship("Order", back_populates="uploaded_files")
    material_item = relationship("MaterialItem", back_populates="uploaded_files")
    uploader = relationship("User", back_populates="uploaded_files")
    
    def __repr__(self):
        return f"<UploadedFile(id={self.id}, file_name='{self.file_name}', file_type='{self.file_type}')>"
