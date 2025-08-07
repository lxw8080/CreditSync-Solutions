#!/bin/bash

# 部署脚本
# 使用方法: ./deploy.sh [environment]
# environment: development, staging, production

set -e

ENVIRONMENT=${1:-development}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "🚀 开始部署 CreditSync Solutions ($ENVIRONMENT 环境)"
echo "项目根目录: $PROJECT_ROOT"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查 Docker (如果使用 Docker 部署)
    if [[ "$ENVIRONMENT" == "production" ]] && ! command -v docker &> /dev/null; then
        log_warning "Docker 未安装，将使用传统部署方式"
    fi
    
    log_success "环境检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装后端依赖
    cd "$PROJECT_ROOT/backend"
    log_info "安装后端依赖..."
    npm ci --only=production
    
    # 安装前端依赖
    cd "$PROJECT_ROOT/frontend"
    log_info "安装前端依赖..."
    npm ci --only=production
    
    # 安装数据库依赖
    cd "$PROJECT_ROOT/database"
    log_info "安装数据库依赖..."
    npm ci --only=production
    
    cd "$PROJECT_ROOT"
    log_success "依赖安装完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建后端
    cd "$PROJECT_ROOT/backend"
    log_info "构建后端..."
    npm run build
    
    # 构建前端
    cd "$PROJECT_ROOT/frontend"
    log_info "构建前端..."
    npm run build
    
    cd "$PROJECT_ROOT"
    log_success "项目构建完成"
}

# 数据库迁移
migrate_database() {
    log_info "执行数据库迁移..."
    
    cd "$PROJECT_ROOT/database"
    
    # 检查数据库连接
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        log_error "无法连接到 PostgreSQL 数据库"
        exit 1
    fi
    
    # 运行迁移
    npm run migrate
    
    # 如果是首次部署，运行种子数据
    if [[ "$ENVIRONMENT" == "development" ]]; then
        log_info "插入种子数据..."
        npm run seed
    fi
    
    cd "$PROJECT_ROOT"
    log_success "数据库迁移完成"
}

# Docker 部署
deploy_with_docker() {
    log_info "使用 Docker 部署..."
    
    # 检查环境变量文件
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log_warning ".env 文件不存在，使用默认配置"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    fi
    
    # 构建和启动服务
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker 服务启动成功"
    else
        log_error "Docker 服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# 传统部署
deploy_traditional() {
    log_info "使用传统方式部署..."
    
    # 创建必要的目录
    mkdir -p "$PROJECT_ROOT/backend/logs"
    mkdir -p "$PROJECT_ROOT/backend/uploads"
    
    # 复制环境配置
    if [[ ! -f "$PROJECT_ROOT/backend/.env" ]]; then
        cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
        log_warning "请编辑 backend/.env 文件配置环境变量"
    fi
    
    # 使用 PM2 启动服务
    if command -v pm2 &> /dev/null; then
        log_info "使用 PM2 启动服务..."
        pm2 delete creditsync-backend 2>/dev/null || true
        pm2 start ecosystem.config.js --env $ENVIRONMENT
        pm2 save
        log_success "PM2 服务启动成功"
    else
        log_info "直接启动 Node.js 服务..."
        cd "$PROJECT_ROOT/backend"
        nohup node dist/app.js > logs/app.log 2>&1 &
        echo $! > app.pid
        log_success "Node.js 服务启动成功"
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "服务健康检查通过"
            return 0
        fi
        
        log_info "等待服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "服务健康检查失败"
    return 1
}

# 部署后清理
cleanup() {
    log_info "执行部署后清理..."
    
    # 清理临时文件
    find "$PROJECT_ROOT" -name "*.tmp" -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name ".DS_Store" -delete 2>/dev/null || true
    
    # 清理旧的日志文件（保留最近7天）
    find "$PROJECT_ROOT/backend/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    log_success "清理完成"
}

# 主部署流程
main() {
    log_info "开始部署流程..."
    
    check_environment
    install_dependencies
    build_project
    
    if [[ "$ENVIRONMENT" != "production" ]] || ! command -v docker &> /dev/null; then
        migrate_database
        deploy_traditional
    else
        deploy_with_docker
    fi
    
    if health_check; then
        cleanup
        log_success "🎉 部署完成！"
        log_info "访问地址: http://localhost:3000"
        log_info "管理员账号: admin / admin123456"
    else
        log_error "❌ 部署失败！"
        exit 1
    fi
}

# 信号处理
trap 'log_error "部署被中断"; exit 1' INT TERM

# 执行主流程
main "$@"
