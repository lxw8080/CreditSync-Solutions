# 客户资料收集管理系统 (CreditSync Solutions)

## 项目概述
面向信贷业务的内部客户资料收集管理系统，支持PC端和移动端多场景使用，实现资料收集标准化、流程数字化和团队协同化。

## 技术栈
- **前端**: Vue.js 3 + Element Plus + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript + Sequelize
- **数据库**: PostgreSQL + Redis
- **文件存储**: 本地文件系统
- **部署**: Nginx + PM2

## 项目结构
```
CreditSync Solutions/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── views/          # 页面组件
│   │   ├── stores/         # Pinia状态管理
│   │   ├── api/            # API接口
│   │   └── utils/          # 工具函数
│   ├── public/
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/    # 控制器层
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑层
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由定义
│   │   ├── utils/          # 工具函数
│   │   └── config/         # 配置文件
│   ├── uploads/            # 文件存储目录
│   └── package.json
├── database/                 # 数据库相关
│   ├── migrations/         # 数据库迁移
│   ├── seeds/              # 初始数据
│   └── scripts/            # 数据库脚本
├── docs/                    # 项目文档
└── deploy/                  # 部署配置
```

## 核心功能
- ✅ 订单管理（创建、编辑、删除、状态管理）
- ✅ 资料上传（图片、视频、文本，保持原始格式）
- ✅ 时间戳记录（精确记录每项资料录入时间）
- ✅ 必填项校验（后台配置，前端强制校验）
- ✅ 协同操作（24小时有效期分享链接）
- ✅ 移动端支持（响应式设计，直拍直录）
- ✅ 后台管理（类目配置、用户管理、数据统计）

## 开发环境要求
- Node.js >= 18.x
- PostgreSQL >= 13.x
- Redis >= 6.x
- 推荐使用 pnpm 作为包管理器

## 快速开始

### 1. 安装依赖
```bash
# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../backend
pnpm install
```

### 2. 配置数据库
```bash
# 创建数据库
createdb materials_db

# 运行迁移
cd database
npm run migrate
```

### 3. 启动开发服务
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

## 部署说明
详见 `deploy/` 目录下的部署文档。

## 许可证
内部项目，仅供公司内部使用。
