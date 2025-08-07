import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../utils/jwt'
import { User } from '../models/User'
import { createError } from './errorHandler'

// 扩展 Request 接口
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      userModel?: User
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      throw createError('访问令牌缺失', 401)
    }

    const decoded = verifyToken(token)
    
    // 验证用户是否存在且活跃
    const user = await User.findByPk(decoded.userId)
    if (!user || !user.isActive) {
      throw createError('用户不存在或已被禁用', 401)
    }

    req.user = decoded
    req.userModel = user
    next()
  } catch (error) {
    next(createError('无效的访问令牌', 401))
  }
}

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('未认证', 401))
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return next(createError('权限不足', 403))
    }

    next()
  }
}

export const requireAdmin = requireRole('admin')

export const requireCustomerService = requireRole(['admin', 'customer_service'])

// 可选认证中间件（用于协同链接等场景）
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = verifyToken(token)
      const user = await User.findByPk(decoded.userId)
      
      if (user && user.isActive) {
        req.user = decoded
        req.userModel = user
      }
    }
    
    next()
  } catch (error) {
    // 可选认证失败时不抛出错误，继续执行
    next()
  }
}
