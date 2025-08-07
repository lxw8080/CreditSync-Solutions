import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { Order } from '../models/Order'
import { User } from '../models/User'
import { UploadedFile } from '../models/UploadedFile'
import { MaterialItem } from '../models/MaterialItem'
import { MaterialCategory } from '../models/MaterialCategory'
import { createError, asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

export const getOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 20, search, status, creatorId } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  // 构建查询条件
  const whereClause: any = {}
  
  // 非管理员只能查看自己创建的订单
  if (req.user?.role !== 'admin') {
    whereClause.creatorId = req.user?.userId
  } else if (creatorId) {
    whereClause.creatorId = creatorId
  }

  if (status) {
    whereClause.status = status
  }

  if (search) {
    whereClause[Op.or] = [
      { orderNumber: { [Op.iLike]: `%${search}%` } },
      { customerName: { [Op.iLike]: `%${search}%` } }
    ]
  }

  const { count, rows } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset
  })

  res.json({
    success: true,
    message: '获取订单列表成功',
    data: {
      orders: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    },
    timestamp: new Date().toISOString()
  })
})

export const getOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const order = await Order.findByPk(id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      },
      {
        model: UploadedFile,
        as: 'uploadedFiles',
        include: [
          {
            model: MaterialItem,
            as: 'materialItem',
            include: [
              {
                model: MaterialCategory,
                as: 'category'
              }
            ]
          },
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'username']
          }
        ]
      }
    ]
  })

  if (!order) {
    throw createError('订单不存在', 404)
  }

  // 权限检查：非管理员只能查看自己创建的订单
  if (req.user?.role !== 'admin' && order.creatorId !== req.user?.userId) {
    throw createError('无权访问此订单', 403)
  }

  res.json({
    success: true,
    message: '获取订单详情成功',
    data: { order },
    timestamp: new Date().toISOString()
  })
})

export const createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { customerName, customerIdCard } = req.body

  const orderNumber = Order.generateOrderNumber()

  const order = await Order.create({
    orderNumber,
    customerName,
    customerIdCard,
    creatorId: req.user!.userId,
    status: 'in_progress'
  })

  logger.info(`Order created: ${orderNumber}`, {
    orderId: order.id,
    creatorId: req.user!.userId,
    customerName
  })

  res.status(201).json({
    success: true,
    message: '订单创建成功',
    data: { order },
    timestamp: new Date().toISOString()
  })
})

export const updateOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const { customerName, customerIdCard, status, notes } = req.body

  const order = await Order.findByPk(id)
  if (!order) {
    throw createError('订单不存在', 404)
  }

  // 权限检查：非管理员只能修改自己创建的订单
  if (req.user?.role !== 'admin' && order.creatorId !== req.user?.userId) {
    throw createError('无权修改此订单', 403)
  }

  // 更新字段
  if (customerName !== undefined) order.customerName = customerName
  if (customerIdCard !== undefined) order.customerIdCard = customerIdCard
  if (notes !== undefined) order.notes = notes
  
  // 状态更新逻辑
  if (status !== undefined) {
    if (status === 'completed' && order.status === 'in_progress') {
      // 检查必填项是否完成
      const requiredItems = await MaterialItem.findAll({
        where: { isRequired: true, isActive: true }
      })

      const uploadedFiles = await UploadedFile.findAll({
        where: { orderId: order.id }
      })

      const uploadedItemIds = [...new Set(uploadedFiles.map(f => f.materialItemId))]
      const missingItems = requiredItems.filter(item => !uploadedItemIds.includes(item.id))

      if (missingItems.length > 0) {
        throw createError('存在未完成的必填项，无法提交订单', 400)
      }

      order.status = 'completed'
      order.submittedAt = new Date()
    } else if (status === 'in_progress') {
      order.status = 'in_progress'
      order.submittedAt = null
    }
  }

  await order.save()

  logger.info(`Order updated: ${order.orderNumber}`, {
    orderId: order.id,
    updatedBy: req.user!.userId,
    changes: { customerName, customerIdCard, status, notes }
  })

  res.json({
    success: true,
    message: '订单更新成功',
    data: { order },
    timestamp: new Date().toISOString()
  })
})

export const deleteOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const order = await Order.findByPk(id)
  if (!order) {
    throw createError('订单不存在', 404)
  }

  // 权限检查：非管理员只能删除自己创建的且状态为进行中的订单
  if (req.user?.role !== 'admin') {
    if (order.creatorId !== req.user?.userId) {
      throw createError('无权删除此订单', 403)
    }
    if (order.status === 'completed') {
      throw createError('已完成的订单无法删除', 400)
    }
  }

  await order.destroy()

  logger.info(`Order deleted: ${order.orderNumber}`, {
    orderId: order.id,
    deletedBy: req.user!.userId
  })

  res.json({
    success: true,
    message: '订单删除成功',
    data: null,
    timestamp: new Date().toISOString()
  })
})
