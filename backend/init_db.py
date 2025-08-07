"""
数据库初始化脚本
"""
import asyncio
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.base import engine, SessionLocal, Base
from app.models import *
from app.config import settings

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_tables():
    """创建所有表"""
    print("创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")


def init_data():
    """初始化基础数据"""
    db = SessionLocal()
    try:
        print("初始化基础数据...")
        
        # 创建管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=pwd_context.hash("admin123"),
                role="admin"
            )
            db.add(admin_user)
            print("创建管理员用户: admin/admin123")
        else:
            # 更新现有用户密码
            admin_user.password_hash = pwd_context.hash("admin123")
            print("更新管理员用户密码: admin/admin123")
        
        # 创建测试客服用户
        cs_user = db.query(User).filter(User.username == "cs001").first()
        if not cs_user:
            cs_user = User(
                username="cs001",
                password_hash=pwd_context.hash("cs123456"),
                role="customer_service"
            )
            db.add(cs_user)
            print("创建客服用户: cs001/cs123456")
        else:
            # 更新现有用户密码
            cs_user.password_hash = pwd_context.hash("cs123456")
            print("更新客服用户密码: cs001/cs123456")
        
        # 创建资料分类
        categories_data = [
            {"name": "身份证明", "sort_order": 1},
            {"name": "收入证明", "sort_order": 2},
            {"name": "资产证明", "sort_order": 3},
            {"name": "其他资料", "sort_order": 4}
        ]
        
        for cat_data in categories_data:
            category = db.query(MaterialCategory).filter(
                MaterialCategory.name == cat_data["name"]
            ).first()
            if not category:
                category = MaterialCategory(**cat_data)
                db.add(category)
                print(f"创建资料分类: {cat_data['name']}")
        
        db.commit()
        
        # 创建资料子项
        items_data = [
            # 身份证明
            {"category_name": "身份证明", "name": "身份证正面", "file_types": ["image"], "is_required": True, "sort_order": 1},
            {"category_name": "身份证明", "name": "身份证反面", "file_types": ["image"], "is_required": True, "sort_order": 2},
            {"category_name": "身份证明", "name": "手持身份证照片", "file_types": ["image"], "is_required": True, "sort_order": 3},
            
            # 收入证明
            {"category_name": "收入证明", "name": "工资流水", "file_types": ["image", "text"], "is_required": True, "sort_order": 1},
            {"category_name": "收入证明", "name": "工作证明", "file_types": ["image", "text"], "is_required": False, "sort_order": 2},
            {"category_name": "收入证明", "name": "社保缴费记录", "file_types": ["image"], "is_required": False, "sort_order": 3},
            
            # 资产证明
            {"category_name": "资产证明", "name": "房产证", "file_types": ["image"], "is_required": False, "sort_order": 1},
            {"category_name": "资产证明", "name": "车辆行驶证", "file_types": ["image"], "is_required": False, "sort_order": 2},
            {"category_name": "资产证明", "name": "银行存款证明", "file_types": ["image"], "is_required": False, "sort_order": 3},
            
            # 其他资料
            {"category_name": "其他资料", "name": "补充说明", "file_types": ["text"], "is_required": False, "sort_order": 1},
            {"category_name": "其他资料", "name": "其他附件", "file_types": ["image", "video"], "is_required": False, "sort_order": 2}
        ]
        
        for item_data in items_data:
            category = db.query(MaterialCategory).filter(
                MaterialCategory.name == item_data["category_name"]
            ).first()
            if category:
                item = db.query(MaterialItem).filter(
                    MaterialItem.category_id == category.id,
                    MaterialItem.name == item_data["name"]
                ).first()
                if not item:
                    item = MaterialItem(
                        category_id=category.id,
                        name=item_data["name"],
                        file_types=item_data["file_types"],
                        is_required=item_data["is_required"],
                        sort_order=item_data["sort_order"]
                    )
                    db.add(item)
                    print(f"创建资料子项: {item_data['category_name']} - {item_data['name']}")
        
        db.commit()
        print("基础数据初始化完成")
        
    except Exception as e:
        print(f"初始化数据时出错: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """主函数"""
    print("开始初始化数据库...")
    create_tables()
    init_data()
    print("数据库初始化完成！")
    print("\n默认用户:")
    print("管理员: admin/admin123")
    print("客服: cs001/cs123456")


if __name__ == "__main__":
    main()
