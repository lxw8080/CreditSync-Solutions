#!/bin/bash

# 系统监控脚本
# 监控应用状态、资源使用情况和日志

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/deploy/logs/monitor.log"
ALERT_EMAIL="admin@example.com"

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log_with_timestamp "[INFO] $1"
}

log_warning() {
    log_with_timestamp "[WARNING] $1"
}

log_error() {
    log_with_timestamp "[ERROR] $1"
}

log_success() {
    log_with_timestamp "[SUCCESS] $1"
}

# 发送告警邮件
send_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
        log_info "告警邮件已发送: $subject"
    else
        log_warning "邮件命令不可用，无法发送告警"
    fi
}

# 检查服务状态
check_service_status() {
    log_info "检查服务状态..."
    
    # 检查 HTTP 服务
    if curl -f -s http://localhost:3000/health > /dev/null; then
        log_success "HTTP 服务正常"
    else
        log_error "HTTP 服务异常"
        send_alert "CreditSync 服务异常" "HTTP 服务无法访问，请检查应用状态"
        return 1
    fi
    
    # 检查数据库连接
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接异常"
        send_alert "CreditSync 数据库异常" "无法连接到 PostgreSQL 数据库"
        return 1
    fi
    
    # 检查 Redis 连接
    if redis-cli ping > /dev/null 2>&1; then
        log_success "Redis 连接正常"
    else
        log_warning "Redis 连接异常"
    fi
    
    return 0
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # CPU 使用率
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_warning "CPU 使用率过高: ${cpu_usage}%"
        send_alert "CreditSync 系统告警" "CPU 使用率过高: ${cpu_usage}%"
    else
        log_info "CPU 使用率: ${cpu_usage}%"
    fi
    
    # 内存使用率
    memory_usage=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        log_warning "内存使用率过高: ${memory_usage}%"
        send_alert "CreditSync 系统告警" "内存使用率过高: ${memory_usage}%"
    else
        log_info "内存使用率: ${memory_usage}%"
    fi
    
    # 磁盘使用率
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 80 ]]; then
        log_warning "磁盘使用率过高: ${disk_usage}%"
        send_alert "CreditSync 系统告警" "磁盘使用率过高: ${disk_usage}%"
    else
        log_info "磁盘使用率: ${disk_usage}%"
    fi
}

# 检查应用进程
check_application_processes() {
    log_info "检查应用进程..."
    
    if command -v pm2 &> /dev/null; then
        # 使用 PM2 管理的进程
        pm2_status=$(pm2 jlist | jq -r '.[] | select(.name=="creditsync-backend") | .pm2_env.status')
        if [[ "$pm2_status" == "online" ]]; then
            log_success "PM2 进程状态正常"
        else
            log_error "PM2 进程状态异常: $pm2_status"
            send_alert "CreditSync 进程异常" "PM2 进程状态: $pm2_status"
        fi
    else
        # 检查 Node.js 进程
        if pgrep -f "node.*app.js" > /dev/null; then
            log_success "Node.js 进程运行正常"
        else
            log_error "Node.js 进程未运行"
            send_alert "CreditSync 进程异常" "Node.js 进程未运行"
        fi
    fi
}

# 检查日志错误
check_application_logs() {
    log_info "检查应用日志..."
    
    local error_log="$PROJECT_ROOT/backend/logs/error.log"
    local app_log="$PROJECT_ROOT/backend/logs/app.log"
    
    # 检查最近5分钟的错误日志
    if [[ -f "$error_log" ]]; then
        error_count=$(find "$error_log" -newermt "5 minutes ago" -exec grep -c "ERROR" {} \; 2>/dev/null || echo "0")
        if [[ $error_count -gt 10 ]]; then
            log_warning "最近5分钟内发现 $error_count 个错误"
            send_alert "CreditSync 应用告警" "最近5分钟内发现 $error_count 个错误，请检查日志"
        else
            log_info "错误日志检查正常"
        fi
    fi
    
    # 检查应用日志大小
    if [[ -f "$app_log" ]]; then
        log_size=$(du -m "$app_log" | cut -f1)
        if [[ $log_size -gt 100 ]]; then
            log_warning "应用日志文件过大: ${log_size}MB"
        fi
    fi
}

# 检查文件上传目录
check_upload_directory() {
    log_info "检查文件上传目录..."
    
    local upload_dir="$PROJECT_ROOT/backend/uploads"
    
    if [[ -d "$upload_dir" ]]; then
        # 检查目录大小
        upload_size=$(du -sm "$upload_dir" | cut -f1)
        log_info "上传目录大小: ${upload_size}MB"
        
        if [[ $upload_size -gt 10240 ]]; then  # 10GB
            log_warning "上传目录过大: ${upload_size}MB"
            send_alert "CreditSync 存储告警" "上传目录大小超过10GB: ${upload_size}MB"
        fi
        
        # 检查目录权限
        if [[ ! -w "$upload_dir" ]]; then
            log_error "上传目录无写权限"
            send_alert "CreditSync 权限异常" "上传目录无写权限"
        fi
    else
        log_error "上传目录不存在"
        send_alert "CreditSync 配置异常" "上传目录不存在"
    fi
}

# 数据库备份检查
check_database_backup() {
    log_info "检查数据库备份..."
    
    local backup_dir="$PROJECT_ROOT/backups"
    local today=$(date +%Y%m%d)
    local backup_file="$backup_dir/db_$today.sql"
    
    if [[ -f "$backup_file" ]]; then
        log_success "今日数据库备份存在"
        
        # 检查备份文件大小
        backup_size=$(du -m "$backup_file" | cut -f1)
        if [[ $backup_size -lt 1 ]]; then
            log_warning "数据库备份文件过小，可能备份失败"
            send_alert "CreditSync 备份告警" "数据库备份文件过小: ${backup_size}MB"
        fi
    else
        log_warning "今日数据库备份不存在"
        send_alert "CreditSync 备份告警" "今日数据库备份文件不存在"
    fi
}

# 生成监控报告
generate_report() {
    local report_file="$PROJECT_ROOT/deploy/logs/monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "CreditSync Solutions 监控报告"
        echo "生成时间: $(date)"
        echo "================================"
        echo
        
        echo "系统信息:"
        echo "- 主机名: $(hostname)"
        echo "- 系统: $(uname -a)"
        echo "- 运行时间: $(uptime)"
        echo
        
        echo "服务状态:"
        curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "服务不可用"
        echo
        
        echo "资源使用:"
        echo "- CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
        echo "- 内存: $(free -h | grep Mem)"
        echo "- 磁盘: $(df -h /)"
        echo
        
        echo "进程信息:"
        if command -v pm2 &> /dev/null; then
            pm2 list
        else
            ps aux | grep -E "(node|postgres|redis)" | grep -v grep
        fi
        
    } > "$report_file"
    
    log_info "监控报告已生成: $report_file"
}

# 主监控流程
main() {
    log_info "开始系统监控检查..."
    
    local exit_code=0
    
    check_service_status || exit_code=1
    check_system_resources
    check_application_processes
    check_application_logs
    check_upload_directory
    check_database_backup
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "监控检查完成，系统运行正常"
    else
        log_error "监控检查发现问题，请及时处理"
    fi
    
    # 每小时生成一次详细报告
    if [[ $(date +%M) == "00" ]]; then
        generate_report
    fi
    
    return $exit_code
}

# 执行监控
main "$@"
