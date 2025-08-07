import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  
  // 记录错误日志
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.name || 'INTERNAL_ERROR',
        message,
        stack: err.stack
      },
      timestamp: new Date().toISOString()
    })
  } else {
    // 生产环境返回简化错误信息
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : err.name || 'CLIENT_ERROR',
        message: statusCode >= 500 ? 'Internal Server Error' : message
      },
      timestamp: new Date().toISOString()
    })
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error(`Route ${req.originalUrl} not found`)
  error.statusCode = 404
  next(error)
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.isOperational = true
  return error
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
