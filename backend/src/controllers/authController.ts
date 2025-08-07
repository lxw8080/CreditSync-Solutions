import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User'
import { comparePassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { createError, asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body

  // 查找用户
  const user = await User.findOne({ where: { username } })
  if (!user) {
    throw createError('用户名或密码错误', 401)
  }

  // 检查用户是否活跃
  if (!user.isActive) {
    throw createError('账户已被禁用', 401)
  }

  // 验证密码
  const isPasswordValid = await comparePassword(password, user.passwordHash)
  if (!isPasswordValid) {
    throw createError('用户名或密码错误', 401)
  }

  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await user.save()

  // 生成JWT令牌
  const token = generateToken(user)

  logger.info(`User ${username} logged in successfully`, {
    userId: user.id,
    role: user.role,
    ip: req.ip
  })

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: user.toJSON()
    },
    timestamp: new Date().toISOString()
  })
})

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // 在实际应用中，可以将token加入黑名单
  // 这里简单返回成功响应
  
  logger.info(`User ${req.user?.username} logged out`, {
    userId: req.user?.userId,
    ip: req.ip
  })

  res.json({
    success: true,
    message: '登出成功',
    data: null,
    timestamp: new Date().toISOString()
  })
})

export const getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userModel) {
    throw createError('用户信息不存在', 404)
  }

  res.json({
    success: true,
    message: '获取用户信息成功',
    data: {
      user: req.userModel.toJSON()
    },
    timestamp: new Date().toISOString()
  })
})

export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userModel) {
    throw createError('用户信息不存在', 404)
  }

  // 生成新的JWT令牌
  const token = generateToken(req.userModel)

  logger.info(`Token refreshed for user ${req.userModel.username}`, {
    userId: req.userModel.id,
    ip: req.ip
  })

  res.json({
    success: true,
    message: '令牌刷新成功',
    data: {
      token,
      user: req.userModel.toJSON()
    },
    timestamp: new Date().toISOString()
  })
})
