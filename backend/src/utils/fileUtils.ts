import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

export const generateChecksum = async (filePath: string): Promise<string> => {
  const fileBuffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().slice(1)
}

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic']
  const ext = getFileExtension(filename)
  return imageExtensions.includes(ext)
}

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  const ext = getFileExtension(filename)
  return videoExtensions.includes(ext)
}

export const generateThumbnail = async (
  inputPath: string,
  outputPath: string,
  width: number = 200,
  height: number = 200
): Promise<void> => {
  if (isImageFile(inputPath)) {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath)
  }
  // 视频缩略图生成需要 FFmpeg，这里先跳过
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const sanitizeFilename = (filename: string): string => {
  // 移除或替换不安全的字符
  return filename
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200) // 限制文件名长度
}

export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = path.extname(originalName)
  const baseName = path.basename(originalName, ext)
  const sanitizedBaseName = sanitizeFilename(baseName)
  
  return `${timestamp}_${random}_${sanitizedBaseName}${ext}`
}
