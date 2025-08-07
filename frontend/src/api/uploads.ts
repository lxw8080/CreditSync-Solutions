import client, { ApiResponse } from './client'

export interface UploadFileRequest {
  orderId: number
  materialItemId: number
  file?: File
  textContent?: string
}

export interface UploadMultipleRequest {
  orderId: number
  materialItemId: number
  files: File[]
}

export interface UploadedFileInfo {
  id: number
  orderId: number
  materialItemId: number
  fileName?: string
  originalName?: string
  filePath?: string
  fileSize?: number
  fileType?: string
  mimeType?: string
  uploadTime: string
  uploaderId: number
  textContent?: string
  checksum?: string
  thumbnailPath?: string
  metadata?: any
}

export interface UploadResponse {
  file: UploadedFileInfo
}

export interface BatchUploadResponse {
  files: UploadedFileInfo[]
  failed: string[]
}

export const uploadsApi = {
  // 单文件上传
  uploadFile: async (data: UploadFileRequest): Promise<UploadedFileInfo> => {
    const formData = new FormData()
    formData.append('orderId', data.orderId.toString())
    formData.append('materialItemId', data.materialItemId.toString())
    
    if (data.file) {
      formData.append('file', data.file)
    }
    
    if (data.textContent) {
      formData.append('textContent', data.textContent)
    }

    const response = await client.post<ApiResponse<UploadResponse>>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data.data.file
  },

  // 多文件上传
  uploadMultipleFiles: async (data: UploadMultipleRequest): Promise<BatchUploadResponse> => {
    const formData = new FormData()
    formData.append('orderId', data.orderId.toString())
    formData.append('materialItemId', data.materialItemId.toString())
    
    data.files.forEach(file => {
      formData.append('files', file)
    })

    const response = await client.post<ApiResponse<BatchUploadResponse>>('/uploads/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data.data
  },

  // 获取文件信息
  getFileInfo: async (id: number): Promise<UploadedFileInfo> => {
    const response = await client.get<ApiResponse<{ file: UploadedFileInfo }>>(`/uploads/${id}`)
    return response.data.data.file
  },

  // 删除文件
  deleteFile: async (id: number): Promise<void> => {
    await client.delete<ApiResponse<null>>(`/uploads/${id}`)
  },

  // 获取文件下载URL
  getFileUrl: (filePath: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || '/api'}${filePath.replace(/^uploads/, '/uploads')}`
  },

  // 获取缩略图URL
  getThumbnailUrl: (thumbnailPath: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || '/api'}${thumbnailPath.replace(/^uploads/, '/uploads')}`
  }
}
