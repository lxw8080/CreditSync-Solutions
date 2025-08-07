import { Request, Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs/promises'
import { UploadedFile } from '../models/UploadedFile'
import { Order } from '../models/Order'
import { MaterialItem } from '../models/MaterialItem'
import { createError, asyncHandler } from '../middleware/errorHandler'
import { generateChecksum, generateThumbnail, isImageFile } from '../utils/fileUtils'
import { logger } from '../utils/logger'

export const uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, materialItemId, textContent } = req.body
  const uploadedFile = req.file

  // 验证订单存在
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw createError('订单不存在', 404)
  }

  // 权限检查：非管理员只能上传自己创建的订单
  if (req.user?.role !== 'admin' && order.creatorId !== req.user?.userId) {
    throw createError('无权上传文件到此订单', 403)
  }

  // 验证资料项存在
  const materialItem = await MaterialItem.findByPk(materialItemId)
  if (!materialItem) {
    throw createError('资料项不存在', 404)
  }

  // 检查订单状态
  if (order.status === 'completed') {
    throw createError('已完成的订单无法上传文件', 400)
  }

  const uploadTime = new Date()
  let fileRecord: UploadedFile

  try {
    if (textContent) {
      // 处理文本内容
      if (!materialItem.fileTypes.includes('text')) {
        throw createError('此资料项不支持文本内容', 400)
      }

      fileRecord = await UploadedFile.create({
        orderId: parseInt(orderId),
        materialItemId: parseInt(materialItemId),
        uploadTime,
        uploaderId: req.user!.userId,
        textContent,
        fileType: 'text'
      })
    } else if (uploadedFile) {
      // 处理文件上传
      const fileType = isImageFile(uploadedFile.originalname) ? 'image' : 'video'
      
      if (!materialItem.fileTypes.includes(fileType)) {
        throw createError(`此资料项不支持${fileType === 'image' ? '图片' : '视频'}文件`, 400)
      }

      // 生成文件校验和
      const checksum = await generateChecksum(uploadedFile.path)

      // 生成缩略图（仅图片）
      let thumbnailPath: string | undefined
      if (fileType === 'image') {
        try {
          const thumbnailDir = path.join(path.dirname(uploadedFile.path), 'thumbnails')
          await fs.mkdir(thumbnailDir, { recursive: true })
          thumbnailPath = path.join(thumbnailDir, `thumb_${uploadedFile.filename}`)
          await generateThumbnail(uploadedFile.path, thumbnailPath)
        } catch (error) {
          logger.warn('Failed to generate thumbnail:', error)
        }
      }

      // 创建文件记录
      fileRecord = await UploadedFile.create({
        orderId: parseInt(orderId),
        materialItemId: parseInt(materialItemId),
        fileName: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        filePath: uploadedFile.path,
        fileSize: uploadedFile.size,
        fileType,
        mimeType: uploadedFile.mimetype,
        uploadTime,
        uploaderId: req.user!.userId,
        checksum,
        thumbnailPath,
        metadata: {
          encoding: uploadedFile.encoding,
          fieldname: uploadedFile.fieldname
        }
      })
    } else {
      throw createError('未提供文件或文本内容', 400)
    }

    logger.info('File uploaded successfully', {
      fileId: fileRecord.id,
      orderId,
      materialItemId,
      uploaderId: req.user!.userId,
      fileType: fileRecord.fileType,
      fileName: fileRecord.fileName || 'text'
    })

    res.status(201).json({
      success: true,
      message: '文件上传成功',
      data: { file: fileRecord },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // 如果创建记录失败，删除已上传的文件
    if (uploadedFile?.path) {
      try {
        await fs.unlink(uploadedFile.path)
      } catch (unlinkError) {
        logger.error('Failed to cleanup uploaded file:', unlinkError)
      }
    }
    throw error
  }
})

export const uploadMultipleFiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, materialItemId } = req.body
  const uploadedFiles = req.files as Express.Multer.File[]

  if (!uploadedFiles || uploadedFiles.length === 0) {
    throw createError('未提供文件', 400)
  }

  // 验证订单和权限
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw createError('订单不存在', 404)
  }

  if (req.user?.role !== 'admin' && order.creatorId !== req.user?.userId) {
    throw createError('无权上传文件到此订单', 403)
  }

  // 验证资料项
  const materialItem = await MaterialItem.findByPk(materialItemId)
  if (!materialItem) {
    throw createError('资料项不存在', 404)
  }

  if (order.status === 'completed') {
    throw createError('已完成的订单无法上传文件', 400)
  }

  const uploadTime = new Date()
  const fileRecords: UploadedFile[] = []
  const failedFiles: string[] = []

  // 批量处理文件
  for (const file of uploadedFiles) {
    try {
      const fileType = isImageFile(file.originalname) ? 'image' : 'video'
      
      if (!materialItem.fileTypes.includes(fileType)) {
        failedFiles.push(`${file.originalname}: 不支持的文件类型`)
        continue
      }

      const checksum = await generateChecksum(file.path)

      let thumbnailPath: string | undefined
      if (fileType === 'image') {
        try {
          const thumbnailDir = path.join(path.dirname(file.path), 'thumbnails')
          await fs.mkdir(thumbnailDir, { recursive: true })
          thumbnailPath = path.join(thumbnailDir, `thumb_${file.filename}`)
          await generateThumbnail(file.path, thumbnailPath)
        } catch (error) {
          logger.warn(`Failed to generate thumbnail for ${file.originalname}:`, error)
        }
      }

      const fileRecord = await UploadedFile.create({
        orderId: parseInt(orderId),
        materialItemId: parseInt(materialItemId),
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType,
        mimeType: file.mimetype,
        uploadTime,
        uploaderId: req.user!.userId,
        checksum,
        thumbnailPath,
        metadata: {
          encoding: file.encoding,
          fieldname: file.fieldname
        }
      })

      fileRecords.push(fileRecord)
    } catch (error) {
      failedFiles.push(`${file.originalname}: ${error instanceof Error ? error.message : '上传失败'}`)
      
      // 清理失败的文件
      try {
        await fs.unlink(file.path)
      } catch (unlinkError) {
        logger.error('Failed to cleanup failed file:', unlinkError)
      }
    }
  }

  logger.info('Batch file upload completed', {
    orderId,
    materialItemId,
    uploaderId: req.user!.userId,
    successCount: fileRecords.length,
    failedCount: failedFiles.length
  })

  res.status(201).json({
    success: true,
    message: `批量上传完成，成功 ${fileRecords.length} 个，失败 ${failedFiles.length} 个`,
    data: {
      files: fileRecords,
      failed: failedFiles
    },
    timestamp: new Date().toISOString()
  })
})

export const getFileInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const file = await UploadedFile.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: MaterialItem, as: 'materialItem' }
    ]
  })

  if (!file) {
    throw createError('文件不存在', 404)
  }

  // 权限检查
  if (req.user?.role !== 'admin' && file.order?.creatorId !== req.user?.userId) {
    throw createError('无权访问此文件', 403)
  }

  res.json({
    success: true,
    message: '获取文件信息成功',
    data: { file },
    timestamp: new Date().toISOString()
  })
})

export const deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  const file = await UploadedFile.findByPk(id, {
    include: [{ model: Order, as: 'order' }]
  })

  if (!file) {
    throw createError('文件不存在', 404)
  }

  // 权限检查
  if (req.user?.role !== 'admin' && file.order?.creatorId !== req.user?.userId) {
    throw createError('无权删除此文件', 403)
  }

  // 检查订单状态
  if (file.order?.status === 'completed') {
    throw createError('已完成的订单无法删除文件', 400)
  }

  // 删除物理文件
  if (file.filePath) {
    try {
      await fs.unlink(file.filePath)
      
      // 删除缩略图
      if (file.thumbnailPath) {
        await fs.unlink(file.thumbnailPath)
      }
    } catch (error) {
      logger.warn('Failed to delete physical file:', error)
    }
  }

  // 删除数据库记录
  await file.destroy()

  logger.info('File deleted successfully', {
    fileId: file.id,
    orderId: file.orderId,
    deletedBy: req.user!.userId
  })

  res.json({
    success: true,
    message: '文件删除成功',
    data: null,
    timestamp: new Date().toISOString()
  })
})
