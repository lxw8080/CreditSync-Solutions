import { Router } from 'express'
import { login, logout, getProfile, refreshToken } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest, commonSchemas } from '../middleware/validation'

const router = Router()

// 用户登录
router.post('/login',
  validateRequest({ body: commonSchemas.login }),
  login
)

// 用户登出
router.post('/logout',
  authenticateToken,
  logout
)

// 获取用户信息
router.get('/profile',
  authenticateToken,
  getProfile
)

// 刷新令牌
router.post('/refresh',
  authenticateToken,
  refreshToken
)

export default router
