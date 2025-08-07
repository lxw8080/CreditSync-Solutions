# 多阶段构建 Dockerfile

# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./
RUN npm ci --only=production

# 复制前端源码并构建
COPY frontend/ ./
RUN npm run build

# 阶段2: 构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./
RUN npm ci --only=production

# 复制后端源码并构建
COPY backend/ ./
RUN npm run build

# 阶段3: 生产环境
FROM node:18-alpine AS production

# 安装系统依赖
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制后端构建产物和依赖
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package*.json ./

# 复制前端构建产物
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./public

# 创建必要的目录
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/app.js"]
