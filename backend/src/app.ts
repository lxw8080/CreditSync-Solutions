import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import path from 'path'

import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import { logger } from './utils/logger'
import { connectDatabase } from './config/database'

// 路由导入
import authRoutes from './routes/auth'
import orderRoutes from './routes/orders'
import uploadRoutes from './routes/uploads'
import adminRoutes from './routes/admin'
import collaborationRoutes from './routes/collaboration'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 中间件配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务 - 文件上传目录
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/collaboration', collaborationRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 错误处理中间件
app.use(notFoundHandler)
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDatabase()
    logger.info('Database connected successfully')
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

startServer()

export default app
