#!/bin/bash

# 数据库重置脚本

echo "警告: 此操作将删除所有数据库数据！"
read -p "确定要继续吗？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

echo "开始重置数据库..."

# 进入数据库目录
cd "$(dirname "$0")/.."

# 撤销所有迁移
echo "撤销数据库迁移..."
npx sequelize-cli db:migrate:undo:all

# 重新运行迁移
echo "重新运行迁移..."
npx sequelize-cli db:migrate

# 重新插入种子数据
echo "重新插入初始数据..."
npx sequelize-cli db:seed:all

echo "数据库重置完成！"
