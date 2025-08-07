import { Router } from 'express'
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from '../controllers/orderController'
import { authenticateToken, requireCustomerService } from '../middleware/auth'
import { validateRequest, commonSchemas } from '../middleware/validation'
import Joi from 'joi'

const router = Router()

// 所有订单路由都需要认证
router.use(authenticateToken)
router.use(requireCustomerService)

// 获取订单列表
router.get('/',
  validateRequest({
    query: commonSchemas.pagination.keys({
      search: Joi.string().max(100).optional(),
      status: Joi.string().valid('in_progress', 'completed').optional(),
      creatorId: Joi.number().integer().positive().optional()
    })
  }),
  getOrders
)

// 创建新订单
router.post('/',
  validateRequest({ body: commonSchemas.createOrder }),
  createOrder
)

// 获取订单详情
router.get('/:id',
  validateRequest({ params: Joi.object({ id: commonSchemas.id }) }),
  getOrderById
)

// 更新订单
router.put('/:id',
  validateRequest({
    params: Joi.object({ id: commonSchemas.id }),
    body: commonSchemas.updateOrder
  }),
  updateOrder
)

// 删除订单
router.delete('/:id',
  validateRequest({ params: Joi.object({ id: commonSchemas.id }) }),
  deleteOrder
)

export default router
