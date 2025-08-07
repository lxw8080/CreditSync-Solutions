# 客户资料收集管理系统

面向信贷业务的内部客户资料收集管理系统，支持PC端和移动端操作。

## 🚀 功能特性

### 核心功能
- **订单管理**: 创建、编辑、删除订单，支持客户信息管理
- **资料上传**: 支持图片、视频、文档上传，保持原始格式不压缩
- **协同操作**: 生成24小时有效的协同链接，支持二维码分享
- **移动端优化**: 支持移动端拍照录像功能
- **权限管理**: 客服端和管理端分离，权限控制

### 技术特性
- **响应式设计**: 适配PC端和移动端
- **实时同步**: 多端数据同步
- **文件安全**: 本地存储，不压缩原始文件
- **时间戳记录**: 完整的操作时间记录

## 🛠 技术栈

### 后端
- **框架**: FastAPI (Python)
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **认证**: JWT Token
- **文件处理**: 本地文件系统存储

### 前端
- **框架**: Vue.js 3 + TypeScript
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite

## 📦 项目结构

```
CreditSync Solutions/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据模型
│   │   ├── config/         # 配置文件
│   │   └── middleware/     # 中间件
│   ├── uploads/            # 文件上传目录
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   ├── api/           # API接口
│   │   ├── stores/        # 状态管理
│   │   └── router/        # 路由配置
│   └── package.json       # Node.js依赖
└── docs/                  # 文档目录
```

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端启动

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py  # 初始化数据库
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 访问地址
- 前端应用: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 👥 默认账户

### 管理员
- 用户名: `admin`
- 密码: `admin123`

### 客服
- 用户名: `cs001`
- 密码: `cs123456`

## 📱 使用说明

### 客服端操作
1. 登录系统
2. 创建订单，填写客户信息
3. 生成协同链接，分享给客户
4. 查看客户上传的资料

### 客户协同操作
1. 通过协同链接访问上传页面
2. 上传所需资料（支持拍照录像）
3. 实时查看上传进度

### 移动端功能
- 支持移动端响应式布局
- 原生拍照录像功能
- 触摸友好的操作界面

## 🔧 配置说明

### 后端配置 (backend/.env)
```env
# 数据库配置
DATABASE_URL=sqlite:///./materials.db

# JWT配置
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600

# 协同链接配置
COLLABORATION_TOKEN_EXPIRE_HOURS=24
```

## 🧪 API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `POST /api/auth/logout` - 用户登出

### 订单接口
- `GET /api/orders/` - 获取订单列表
- `POST /api/orders/` - 创建订单
- `GET /api/orders/{id}` - 获取订单详情
- `PUT /api/orders/{id}` - 更新订单
- `DELETE /api/orders/{id}` - 删除订单

### 协同接口
- `POST /api/collaboration/orders/{id}/create-link` - 创建协同链接
- `GET /api/collaboration/links/{token}` - 获取协同信息
- `POST /api/collaboration/links/{token}/upload` - 协同上传

## 📄 许可证

本项目仅供学习和内部使用。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📞 支持

如有问题，请联系开发团队。
