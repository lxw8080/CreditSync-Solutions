import { Router } from 'express'
import {
  createCollaborationLink,
  getCollaborationInfo,
  getOrderCollaborationLinks,
  deactivateCollaborationLink,
  cleanupExpiredLinks
} from '../controllers/collaborationController'
import { authenticateToken, requireCustomerService, requireAdmin, optionalAuth } from '../middleware/auth'
import { validateRequest, commonSchemas } from '../middleware/validation'
import Joi from 'joi'

const router = Router()

// 创建协同链接（需要认证）
router.post('/',
  authenticateToken,
  requireCustomerService,
  validateRequest({
    body: Joi.object({
      orderId: Joi.number().integer().positive().required(),
      expiresInHours: Joi.number().integer().min(1).max(168).default(24) // 最长7天
    })
  }),
  createCollaborationLink
)

// 通过token访问订单（可选认证，支持匿名访问）
router.get('/:token',
  optionalAuth,
  validateRequest({
    params: Joi.object({
      token: Joi.string().length(32).required()
    })
  }),
  getCollaborationInfo
)

// 获取订单的协同链接列表（需要认证）
router.get('/order/:orderId',
  authenticateToken,
  requireCustomerService,
  validateRequest({
    params: Joi.object({
      orderId: commonSchemas.id
    })
  }),
  getOrderCollaborationLinks
)

// 停用协同链接（需要认证）
router.put('/:id/deactivate',
  authenticateToken,
  requireCustomerService,
  validateRequest({
    params: Joi.object({
      id: commonSchemas.id
    })
  }),
  deactivateCollaborationLink
)

// 清理过期链接（仅管理员）
router.post('/cleanup',
  authenticateToken,
  requireAdmin,
  cleanupExpiredLinks
)

export default router
