import { Router } from 'express'
import { uploadFile, uploadMultipleFiles, getFileInfo, deleteFile } from '../controllers/uploadController'
import { authenticateToken, requireCustomerService } from '../middleware/auth'
import { uploadSingle, uploadMultiple, handleUploadError } from '../middleware/upload'
import { validateRequest, commonSchemas } from '../middleware/validation'
import Joi from 'joi'

const router = Router()

// 所有上传路由都需要认证
router.use(authenticateToken)
router.use(requireCustomerService)

// 单文件上传
router.post('/',
  uploadSingle,
  handleUploadError,
  validateRequest({
    body: Joi.object({
      orderId: Joi.number().integer().positive().required(),
      materialItemId: Joi.number().integer().positive().required(),
      textContent: Joi.string().max(10000).optional()
    })
  }),
  uploadFile
)

// 多文件上传
router.post('/batch',
  uploadMultiple,
  handleUploadError,
  validateRequest({
    body: Joi.object({
      orderId: Joi.number().integer().positive().required(),
      materialItemId: Joi.number().integer().positive().required()
    })
  }),
  uploadMultipleFiles
)

// 获取文件信息
router.get('/:id',
  validateRequest({ params: Joi.object({ id: commonSchemas.id }) }),
  getFileInfo
)

// 删除文件
router.delete('/:id',
  validateRequest({ params: Joi.object({ id: commonSchemas.id }) }),
  deleteFile
)

export default router
