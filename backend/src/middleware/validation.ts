import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { createError } from './errorHandler'

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema
  query?: Joi.ObjectSchema
  params?: Joi.ObjectSchema
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = []

    // 验证请求体
    if (schema.body) {
      const { error } = schema.body.validate(req.body)
      if (error) {
        errors.push(...error.details.map(detail => detail.message))
      }
    }

    // 验证查询参数
    if (schema.query) {
      const { error } = schema.query.validate(req.query)
      if (error) {
        errors.push(...error.details.map(detail => detail.message))
      }
    }

    // 验证路径参数
    if (schema.params) {
      const { error } = schema.params.validate(req.params)
      if (error) {
        errors.push(...error.details.map(detail => detail.message))
      }
    }

    if (errors.length > 0) {
      const validationError = createError('参数验证失败', 400)
      validationError.name = 'VALIDATION_ERROR'
      ;(validationError as any).details = errors
      return next(validationError)
    }

    next()
  }
}

// 常用验证模式
export const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(50).required()
  }),
  createOrder: Joi.object({
    customerName: Joi.string().min(1).max(100).required(),
    customerIdCard: Joi.string().pattern(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/).optional()
  }),
  updateOrder: Joi.object({
    customerName: Joi.string().min(1).max(100).optional(),
    customerIdCard: Joi.string().pattern(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/).optional(),
    status: Joi.string().valid('in_progress', 'completed').optional(),
    notes: Joi.string().max(1000).optional()
  }),
  createCategory: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    sortOrder: Joi.number().integer().min(0).default(0)
  }),
  createMaterialItem: Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    fileTypes: Joi.array().items(Joi.string().valid('image', 'video', 'text')).min(1).required(),
    isRequired: Joi.boolean().default(false),
    sortOrder: Joi.number().integer().min(0).default(0)
  })
}
