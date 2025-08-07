#!/bin/bash

# 数据备份脚本
# 备份数据库和上传文件

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 数据库配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-materials_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-your_password}

# 创建备份目录
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/files"
mkdir -p "$BACKUP_DIR/logs"

# 日志文件
LOG_FILE="$BACKUP_DIR/logs/backup_$DATE.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log "[INFO] $1"
}

log_error() {
    log "[ERROR] $1"
}

log_success() {
    log "[SUCCESS] $1"
}

# 数据库备份
backup_database() {
    log_info "开始数据库备份..."
    
    local backup_file="$BACKUP_DIR/database/db_$DATE.sql"
    local latest_link="$BACKUP_DIR/database/latest.sql"
    
    # 设置密码环境变量
    export PGPASSWORD="$DB_PASSWORD"
    
    # 执行备份
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges \
        --format=plain > "$backup_file" 2>>"$LOG_FILE"; then
        
        # 压缩备份文件
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        # 创建最新备份的软链接
        ln -sf "$(basename "$backup_file")" "$latest_link"
        
        # 获取备份文件大小
        local file_size=$(du -h "$backup_file" | cut -f1)
        log_success "数据库备份完成: $backup_file (大小: $file_size)"
        
        # 验证备份文件
        if [[ -s "$backup_file" ]]; then
            log_success "备份文件验证通过"
        else
            log_error "备份文件为空或不存在"
            return 1
        fi
    else
        log_error "数据库备份失败"
        return 1
    fi
    
    # 清理密码环境变量
    unset PGPASSWORD
}

# 文件备份
backup_files() {
    log_info "开始文件备份..."
    
    local upload_dir="$PROJECT_ROOT/backend/uploads"
    local backup_file="$BACKUP_DIR/files/files_$DATE.tar.gz"
    local latest_link="$BACKUP_DIR/files/latest.tar.gz"
    
    if [[ -d "$upload_dir" ]]; then
        # 创建文件备份
        if tar -czf "$backup_file" -C "$PROJECT_ROOT/backend" uploads 2>>"$LOG_FILE"; then
            # 创建最新备份的软链接
            ln -sf "$(basename "$backup_file")" "$latest_link"
            
            # 获取备份文件大小
            local file_size=$(du -h "$backup_file" | cut -f1)
            local file_count=$(tar -tzf "$backup_file" | wc -l)
            log_success "文件备份完成: $backup_file (大小: $file_size, 文件数: $file_count)"
        else
            log_error "文件备份失败"
            return 1
        fi
    else
        log_info "上传目录不存在，跳过文件备份"
    fi
}

# 配置备份
backup_config() {
    log_info "开始配置备份..."
    
    local config_backup="$BACKUP_DIR/config_$DATE.tar.gz"
    local config_files=(
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/backend/.env"
        "$PROJECT_ROOT/ecosystem.config.js"
        "$PROJECT_ROOT/docker-compose.yml"
        "$PROJECT_ROOT/deploy/nginx"
    )
    
    # 收集存在的配置文件
    local existing_files=()
    for file in "${config_files[@]}"; do
        if [[ -e "$file" ]]; then
            existing_files+=("$file")
        fi
    done
    
    if [[ ${#existing_files[@]} -gt 0 ]]; then
        if tar -czf "$config_backup" "${existing_files[@]}" 2>>"$LOG_FILE"; then
            local file_size=$(du -h "$config_backup" | cut -f1)
            log_success "配置备份完成: $config_backup (大小: $file_size)"
        else
            log_error "配置备份失败"
            return 1
        fi
    else
        log_info "未找到配置文件，跳过配置备份"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份文件..."
    
    local cleanup_count=0
    
    # 清理数据库备份
    find "$BACKUP_DIR/database" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -type f | while read -r file; do
        rm -f "$file"
        ((cleanup_count++))
        log_info "删除旧备份: $(basename "$file")"
    done
    
    # 清理文件备份
    find "$BACKUP_DIR/files" -name "files_*.tar.gz" -mtime +$RETENTION_DAYS -type f | while read -r file; do
        rm -f "$file"
        ((cleanup_count++))
        log_info "删除旧备份: $(basename "$file")"
    done
    
    # 清理配置备份
    find "$BACKUP_DIR" -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -type f | while read -r file; do
        rm -f "$file"
        ((cleanup_count++))
        log_info "删除旧备份: $(basename "$file")"
    done
    
    # 清理旧日志
    find "$BACKUP_DIR/logs" -name "backup_*.log" -mtime +$RETENTION_DAYS -type f | while read -r file; do
        rm -f "$file"
        ((cleanup_count++))
        log_info "删除旧日志: $(basename "$file")"
    done
    
    log_success "清理完成，删除了 $cleanup_count 个旧文件"
}

# 备份验证
verify_backups() {
    log_info "验证备份完整性..."
    
    local verification_failed=0
    
    # 验证数据库备份
    local latest_db_backup="$BACKUP_DIR/database/latest.sql"
    if [[ -L "$latest_db_backup" ]] && [[ -f "$latest_db_backup" ]]; then
        if zcat "$latest_db_backup" | head -n 10 | grep -q "PostgreSQL database dump"; then
            log_success "数据库备份验证通过"
        else
            log_error "数据库备份验证失败"
            ((verification_failed++))
        fi
    fi
    
    # 验证文件备份
    local latest_file_backup="$BACKUP_DIR/files/latest.tar.gz"
    if [[ -L "$latest_file_backup" ]] && [[ -f "$latest_file_backup" ]]; then
        if tar -tzf "$latest_file_backup" > /dev/null 2>&1; then
            log_success "文件备份验证通过"
        else
            log_error "文件备份验证失败"
            ((verification_failed++))
        fi
    fi
    
    return $verification_failed
}

# 发送备份报告
send_backup_report() {
    local status="$1"
    local report_file="$BACKUP_DIR/logs/backup_report_$DATE.txt"
    
    {
        echo "CreditSync Solutions 备份报告"
        echo "备份时间: $(date)"
        echo "备份状态: $status"
        echo "================================"
        echo
        
        echo "备份文件列表:"
        ls -lh "$BACKUP_DIR/database/" 2>/dev/null | tail -n +2 || echo "无数据库备份"
        echo
        ls -lh "$BACKUP_DIR/files/" 2>/dev/null | tail -n +2 || echo "无文件备份"
        echo
        
        echo "磁盘使用情况:"
        du -sh "$BACKUP_DIR"/* 2>/dev/null || echo "无备份目录"
        echo
        
        echo "备份日志:"
        tail -n 20 "$LOG_FILE" 2>/dev/null || echo "无日志文件"
        
    } > "$report_file"
    
    log_info "备份报告已生成: $report_file"
    
    # 如果配置了邮件，发送报告
    if command -v mail &> /dev/null && [[ -n "${BACKUP_EMAIL:-}" ]]; then
        mail -s "CreditSync 备份报告 - $status" "$BACKUP_EMAIL" < "$report_file"
        log_info "备份报告已发送至: $BACKUP_EMAIL"
    fi
}

# 主备份流程
main() {
    log_info "开始备份流程..."
    
    local backup_status="成功"
    local exit_code=0
    
    # 检查磁盘空间
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "磁盘空间不足，需要至少1GB空间"
        backup_status="失败"
        exit_code=1
    else
        # 执行备份
        if ! backup_database; then
            backup_status="部分失败"
            exit_code=1
        fi
        
        if ! backup_files; then
            backup_status="部分失败"
            exit_code=1
        fi
        
        if ! backup_config; then
            backup_status="部分失败"
            exit_code=1
        fi
        
        # 验证备份
        if ! verify_backups; then
            backup_status="验证失败"
            exit_code=1
        fi
        
        # 清理旧备份
        cleanup_old_backups
    fi
    
    # 生成报告
    send_backup_report "$backup_status"
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "备份流程完成"
    else
        log_error "备份流程存在问题"
    fi
    
    return $exit_code
}

# 信号处理
trap 'log_error "备份被中断"; exit 1' INT TERM

# 执行备份
main "$@"
