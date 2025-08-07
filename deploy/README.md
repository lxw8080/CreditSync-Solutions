# CreditSync Solutions 部署指南

## 概述

本文档提供了 CreditSync Solutions 客户资料收集管理系统的完整部署指南，包括开发环境、测试环境和生产环境的部署方式。

## 系统要求

### 最低配置
- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 100GB SSD
- **网络**: 100Mbps

### 推荐配置
- **CPU**: 4核
- **内存**: 8GB
- **硬盘**: 500GB SSD (系统) + 2TB HDD (文件存储)
- **网络**: 千兆网卡

### 软件依赖
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **Node.js**: >= 18.x
- **PostgreSQL**: >= 13.x
- **Redis**: >= 6.x
- **Nginx**: >= 1.18
- **Docker**: >= 20.x (可选)
- **Docker Compose**: >= 2.x (可选)

## 部署方式

### 方式一：Docker 部署（推荐）

#### 1. 准备环境

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 初始化数据库

```bash
# 进入应用容器
docker-compose exec app bash

# 运行数据库迁移
cd database && npm run migrate

# 插入初始数据
npm run seed
```

### 方式二：传统部署

#### 1. 安装系统依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server nginx

# CentOS/RHEL
sudo yum install -y nodejs npm postgresql-server postgresql-contrib redis nginx
```

#### 2. 配置数据库

```bash
# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE materials_db;
CREATE USER creditsync WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE materials_db TO creditsync;
\q
```

#### 3. 配置 Redis

```bash
# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis

# 设置密码（可选）
sudo vim /etc/redis/redis.conf
# 取消注释并设置: requirepass your_redis_password
sudo systemctl restart redis
```

#### 4. 部署应用

```bash
# 克隆代码
git clone <repository-url>
cd CreditSync\ Solutions

# 使用部署脚本
./deploy/scripts/deploy.sh production
```

#### 5. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp deploy/nginx/conf.d/default.conf /etc/nginx/sites-available/creditsync
sudo ln -s /etc/nginx/sites-available/creditsync /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 配置说明

### 环境变量

关键环境变量说明：

- `NODE_ENV`: 运行环境 (development/staging/production)
- `DB_PASSWORD`: 数据库密码（必须修改）
- `JWT_SECRET`: JWT 密钥（必须修改，至少32位）
- `REDIS_PASSWORD`: Redis 密码（建议设置）
- `MAX_FILE_SIZE`: 最大文件上传大小（字节）

### SSL 配置

生产环境建议启用 HTTPS：

```bash
# 获取 SSL 证书（Let's Encrypt）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 或者使用自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/creditsync.key \
  -out /etc/ssl/certs/creditsync.crt
```

## 监控和维护

### 系统监控

```bash
# 运行监控脚本
./deploy/scripts/monitor.sh

# 设置定时监控（每5分钟）
echo "*/5 * * * * /path/to/project/deploy/scripts/monitor.sh" | crontab -
```

### 数据备份

```bash
# 手动备份
./deploy/scripts/backup.sh

# 设置自动备份（每日凌晨2点）
echo "0 2 * * * /path/to/project/deploy/scripts/backup.sh" | crontab -
```

### 日志管理

```bash
# 查看应用日志
tail -f backend/logs/app.log

# 查看错误日志
tail -f backend/logs/error.log

# 使用 PM2 查看日志
pm2 logs creditsync-backend
```

## 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :3000
   
   # 检查服务状态
   sudo systemctl status postgresql redis nginx
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   sudo -u postgres psql -c "SELECT version();"
   
   # 检查连接配置
   pg_isready -h localhost -p 5432
   ```

3. **文件上传失败**
   ```bash
   # 检查上传目录权限
   ls -la backend/uploads/
   
   # 修复权限
   sudo chown -R www-data:www-data backend/uploads/
   sudo chmod -R 755 backend/uploads/
   ```

4. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   
   # 重启服务释放内存
   pm2 restart creditsync-backend
   ```

### 性能优化

1. **数据库优化**
   ```sql
   -- 分析查询性能
   EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'in_progress';
   
   -- 更新统计信息
   ANALYZE;
   ```

2. **应用优化**
   ```bash
   # 启用 PM2 集群模式
   pm2 start ecosystem.config.js --env production
   
   # 监控性能
   pm2 monit
   ```

## 安全建议

1. **系统安全**
   - 定期更新系统和软件包
   - 配置防火墙规则
   - 禁用不必要的服务
   - 使用非 root 用户运行应用

2. **应用安全**
   - 修改默认密码
   - 启用 HTTPS
   - 配置安全头
   - 定期备份数据

3. **网络安全**
   - 限制数据库访问
   - 使用 VPN 或专网
   - 配置访问控制列表
   - 监控异常访问

## 升级指南

### 应用升级

```bash
# 备份数据
./deploy/scripts/backup.sh

# 拉取最新代码
git pull origin main

# 重新部署
./deploy/scripts/deploy.sh production

# 运行数据库迁移
cd database && npm run migrate
```

### 系统升级

```bash
# 更新系统包
sudo apt update && sudo apt upgrade

# 重启服务
sudo systemctl restart postgresql redis nginx
pm2 restart all
```

## 联系支持

如遇到部署问题，请联系技术支持：

- **邮箱**: support@example.com
- **文档**: [在线文档地址]
- **问题反馈**: [GitHub Issues]

---

**注意**: 请在生产环境部署前仔细阅读本文档，并根据实际情况调整配置参数。
