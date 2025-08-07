#!/bin/bash

# 数据库设置脚本

echo "开始设置数据库..."

# 检查 PostgreSQL 是否运行
if ! pg_isready -h localhost -p 5432; then
    echo "错误: PostgreSQL 服务未运行，请先启动 PostgreSQL"
    exit 1
fi

# 创建数据库（如果不存在）
echo "创建数据库..."
createdb materials_db 2>/dev/null || echo "数据库已存在，跳过创建"

# 创建测试数据库
echo "创建测试数据库..."
createdb materials_db_test 2>/dev/null || echo "测试数据库已存在，跳过创建"

# 进入数据库目录
cd "$(dirname "$0")/.."

# 运行迁移
echo "运行数据库迁移..."
npx sequelize-cli db:migrate

# 运行种子数据
echo "插入初始数据..."
npx sequelize-cli db:seed:all

echo "数据库设置完成！"
echo ""
echo "默认用户账号："
echo "管理员: admin / admin123456"
echo "客服1: customer_service_1 / cs123456"
echo "客服2: customer_service_2 / cs123456"
