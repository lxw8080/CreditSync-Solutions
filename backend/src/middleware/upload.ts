import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import { ensureDirectoryExists, generateUniqueFilename, isImageFile, isVideoFile } from '../utils/fileUtils'
import { createError } from './errorHandler'

// 文件类型配置
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic']
const ALLOWED_VIDEO_TYPES = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1)
  
  // 检查文件类型
  if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(ext)) {
    return cb(createError(`不支持的文件类型: ${ext}`, 400))
  }
  
  // 检查MIME类型
  const isValidMime = 
    file.mimetype.startsWith('image/') || 
    file.mimetype.startsWith('video/')
  
  if (!isValidMime) {
    return cb(createError('无效的文件MIME类型', 400))
  }
  
  cb(null, true)
}

// 存储配置
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    try {
      const orderId = req.body.orderId || req.params.orderId
      if (!orderId) {
        return cb(createError('订单ID缺失', 400), '')
      }
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'orders', orderId.toString())
      await ensureDirectoryExists(uploadDir)
      
      // 根据文件类型创建子目录
      let subDir = 'files'
      if (isImageFile(file.originalname)) {
        subDir = 'images'
      } else if (isVideoFile(file.originalname)) {
        subDir = 'videos'
      }
      
      const finalDir = path.join(uploadDir, subDir)
      await ensureDirectoryExists(finalDir)
      
      cb(null, finalDir)
    } catch (error) {
      cb(error as Error, '')
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname)
    cb(null, uniqueName)
  }
})

// 创建multer实例
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // 单次最多上传10个文件
  }
})

// 单文件上传
export const uploadSingle = uploadMiddleware.single('file')

// 多文件上传
export const uploadMultiple = uploadMiddleware.array('files', 10)

// 错误处理中间件
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(createError('文件大小超出限制（最大100MB）', 400))
      case 'LIMIT_FILE_COUNT':
        return next(createError('文件数量超出限制（最多10个）', 400))
      case 'LIMIT_UNEXPECTED_FILE':
        return next(createError('意外的文件字段', 400))
      default:
        return next(createError(`文件上传错误: ${error.message}`, 400))
    }
  }
  next(error)
}
