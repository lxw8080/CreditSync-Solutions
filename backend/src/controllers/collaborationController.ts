import { Request, Response, NextFunction } from 'express'
import QRCode from 'qrcode'
import { CollaborationLink } from '../models/CollaborationLink'
import { Order } from '../models/Order'
import { User } from '../models/User'
import { UploadedFile } from '../models/UploadedFile'
import { MaterialItem } from '../models/MaterialItem'
import { MaterialCategory } from '../models/MaterialCategory'
import { createError, asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

export const createCollaborationLink = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, expiresInHours = 24 } = req.body

  // 验证订单存在
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw createError('订单不存在', 404)
  }

  // 权限检查：非管理员只能为自己创建的订单生成协同链接
  if (req.user?.role !== 'admin' && order.creatorId !== req.user?.userId) {
    throw createError('无权为此订单创建协同链接', 403)
  }

  // 检查订单状态
  if (order.status === 'completed') {
    throw createError('已完成的订单无法创建协同链接', 400)
  }

  // 计算过期时间
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiresInHours)

  // 检查是否已有有效的协同链接
  const existingLink = await CollaborationLink.findOne({
    where: {
      orderId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }
  })

  let collaborationLink: CollaborationLink

  if (existingLink) {
    // 更新现有链接的过期时间
    existingLink.expiresAt = expiresAt
    await existingLink.save()
    collaborationLink = existingLink
  } else {
    // 创建新的协同链接
    collaborationLink = await CollaborationLink.create({
      orderId,
      expiresAt,
      createdBy: req.user!.userId
    })
  }

  // 生成访问URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const collaborationUrl = `${baseUrl}/collaboration/${collaborationLink.token}`

  // 生成二维码
  const qrCodeDataUrl = await QRCode.toDataURL(collaborationUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })

  logger.info('Collaboration link created', {
    linkId: collaborationLink.id,
    orderId,
    createdBy: req.user!.userId,
    expiresAt: collaborationLink.expiresAt
  })

  res.status(201).json({
    success: true,
    message: '协同链接创建成功',
    data: {
      link: collaborationLink,
      url: collaborationUrl,
      qrCode: qrCodeDataUrl
    },
    timestamp: new Date().toISOString()
  })
})

export const getCollaborationInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params

  const collaborationLink = await CollaborationLink.findOne({
    where: { token },
    include: [
      {
        model: Order,
        as: 'order',
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
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }
    ]
  })

  if (!collaborationLink) {
    throw createError('协同链接不存在', 404)
  }

  // 检查链接是否有效
  if (!collaborationLink.isValid()) {
    throw createError('协同链接已过期或已失效', 410)
  }

  // 记录访问
  await collaborationLink.recordAccess()

  logger.info('Collaboration link accessed', {
    linkId: collaborationLink.id,
    orderId: collaborationLink.orderId,
    accessCount: collaborationLink.accessCount,
    ip: req.ip
  })

  res.json({
    success: true,
    message: '获取协同信息成功',
    data: {
      collaboration: collaborationLink,
      order: collaborationLink.order
    },
    timestamp: new Date().toISOString()
  })
})

export const getOrderCollaborationLinks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params

  // 验证订单存在
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw createError('订单不存在', 404)
  }

  // 权限检查
  if (req.user?.role !== 'admin' && order.creatorId !== req.user?.userId) {
    throw createError('无权查看此订单的协同链接', 403)
  }

  const links = await CollaborationLink.findAll({
    where: { orderId },
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  res.json({
    success: true,
    message: '获取协同链接列表成功',
    data: { links },
    timestamp: new Date().toISOString()
  })
})

export const deactivateCollaborationLink = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const collaborationLink = await CollaborationLink.findByPk(id, {
    include: [
      {
        model: Order,
        as: 'order'
      }
    ]
  })

  if (!collaborationLink) {
    throw createError('协同链接不存在', 404)
  }

  // 权限检查：只有管理员或链接创建者或订单创建者可以停用链接
  const canDeactivate = 
    req.user?.role === 'admin' ||
    collaborationLink.createdBy === req.user?.userId ||
    collaborationLink.order?.creatorId === req.user?.userId

  if (!canDeactivate) {
    throw createError('无权停用此协同链接', 403)
  }

  collaborationLink.isActive = false
  await collaborationLink.save()

  logger.info('Collaboration link deactivated', {
    linkId: collaborationLink.id,
    orderId: collaborationLink.orderId,
    deactivatedBy: req.user!.userId
  })

  res.json({
    success: true,
    message: '协同链接已停用',
    data: { link: collaborationLink },
    timestamp: new Date().toISOString()
  })
})

export const cleanupExpiredLinks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // 只有管理员可以执行清理操作
  if (req.user?.role !== 'admin') {
    throw createError('权限不足', 403)
  }

  const expiredCount = await CollaborationLink.update(
    { isActive: false },
    {
      where: {
        isActive: true,
        expiresAt: { $lt: new Date() }
      }
    }
  )

  logger.info('Expired collaboration links cleaned up', {
    count: expiredCount[0],
    cleanedBy: req.user!.userId
  })

  res.json({
    success: true,
    message: `已清理 ${expiredCount[0]} 个过期的协同链接`,
    data: { cleanedCount: expiredCount[0] },
    timestamp: new Date().toISOString()
  })
})
