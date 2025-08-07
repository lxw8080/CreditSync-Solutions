"""
协同操作模型
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class CollaborationLink(Base):
    """协同操作链接表"""
    __tablename__ = "collaboration_links"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    token = Column(String(100), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    order = relationship("Order", back_populates="collaboration_links")
    creator = relationship("User", back_populates="collaboration_links")
    
    def __repr__(self):
        return f"<CollaborationLink(id={self.id}, token='{self.token}', expires_at='{self.expires_at}')>"
