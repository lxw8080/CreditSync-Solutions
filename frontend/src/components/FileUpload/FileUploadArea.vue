<template>
  <div class="file-upload-area">
    <!-- 文件拖拽上传区域 -->
    <div
      v-if="!textOnly"
      class="upload-dropzone"
      :class="{ 'is-dragover': isDragover, 'is-disabled': disabled }"
      @drop="handleDrop"
      @dragover="handleDragover"
      @dragenter="handleDragenter"
      @dragleave="handleDragleave"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        :multiple="multiple"
        :accept="acceptTypes"
        :disabled="disabled"
        style="display: none"
        @change="handleFileSelect"
      >
      
      <div class="upload-content">
        <el-icon class="upload-icon" size="48">
          <UploadFilled />
        </el-icon>
        <div class="upload-text">
          <p class="upload-title">点击或拖拽文件到此区域上传</p>
          <p class="upload-hint">
            支持 {{ acceptTypesText }}，单个文件最大 {{ maxSizeText }}
          </p>
        </div>
      </div>
      
      <!-- 移动端摄像头按钮 -->
      <div v-if="isMobile && supportsCamera" class="camera-controls">
        <el-button
          type="primary"
          :icon="Camera"
          class="camera-btn"
          @click.stop="openCamera('photo')"
        >
          拍照
        </el-button>
        <el-button
          v-if="supportsVideo"
          type="success"
          :icon="VideoCamera"
          class="camera-btn"
          @click.stop="openCamera('video')"
        >
          录像
        </el-button>
      </div>
    </div>
    
    <!-- 文本输入区域 -->
    <div v-if="supportsText" class="text-input-area">
      <el-input
        v-model="textContent"
        type="textarea"
        :rows="4"
        :placeholder="textOnly ? '请输入文本内容' : '或输入文本内容'"
        :disabled="disabled"
        maxlength="10000"
        show-word-limit
        @input="handleTextInput"
      />
    </div>
    
    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <el-progress
        :percentage="uploadProgress"
        :status="uploadStatus"
        :stroke-width="6"
      />
      <p class="progress-text">{{ progressText }}</p>
    </div>
    
    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-list">
      <div
        v-for="(file, index) in fileList"
        :key="index"
        class="file-item"
      >
        <el-icon class="file-icon">
          <Document v-if="file.type === 'text'" />
          <Picture v-else-if="file.type === 'image'" />
          <VideoPlay v-else />
        </el-icon>
        
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            {{ file.size ? formatFileSize(file.size) : '' }}
            <span class="timestamp">{{ formatTime(file.uploadTime) }}</span>
          </div>
        </div>
        
        <div class="file-actions">
          <el-button
            v-if="file.type !== 'text'"
            type="primary"
            size="small"
            :icon="View"
            @click="previewFile(file)"
          >
            预览
          </el-button>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            @click="removeFile(index)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled,
  Camera,
  VideoCamera,
  Document,
  Picture,
  VideoPlay,
  View,
  Delete
} from '@element-plus/icons-vue'
import { uploadsApi } from '@/api/uploads'
import type { UploadedFileInfo } from '@/api/uploads'

interface Props {
  orderId: number
  materialItemId: number
  fileTypes: string[] // ['image', 'video', 'text']
  multiple?: boolean
  disabled?: boolean
  maxSize?: number // bytes
  existingFiles?: UploadedFileInfo[]
}

interface Emits {
  (e: 'upload-success', file: UploadedFileInfo): void
  (e: 'upload-error', error: string): void
  (e: 'file-remove', fileId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false,
  maxSize: 100 * 1024 * 1024 // 100MB
})

const emit = defineEmits<Emits>()

// 响应式数据
const fileInputRef = ref<HTMLInputElement>()
const isDragover = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'success' | 'exception' | undefined>()
const progressText = ref('')
const textContent = ref('')
const fileList = ref<UploadedFileInfo[]>([])
const isMobile = ref(false)

// 计算属性
const textOnly = computed(() => 
  props.fileTypes.length === 1 && props.fileTypes.includes('text')
)

const supportsText = computed(() => props.fileTypes.includes('text'))
const supportsImage = computed(() => props.fileTypes.includes('image'))
const supportsVideo = computed(() => props.fileTypes.includes('video'))
const supportsCamera = computed(() => supportsImage.value)

const acceptTypes = computed(() => {
  const types: string[] = []
  if (supportsImage.value) {
    types.push('image/*')
  }
  if (supportsVideo.value) {
    types.push('video/*')
  }
  return types.join(',')
})

const acceptTypesText = computed(() => {
  const types: string[] = []
  if (supportsImage.value) types.push('图片')
  if (supportsVideo.value) types.push('视频')
  if (supportsText.value) types.push('文本')
  return types.join('、')
})

const maxSizeText = computed(() => {
  const mb = props.maxSize / (1024 * 1024)
  return `${mb}MB`
})

// 检查移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (time: string): string => {
  return new Date(time).toLocaleString()
}

// 拖拽事件处理
const handleDragover = (e: DragEvent) => {
  e.preventDefault()
  isDragover.value = true
}

const handleDragenter = (e: DragEvent) => {
  e.preventDefault()
  isDragover.value = true
}

const handleDragleave = (e: DragEvent) => {
  e.preventDefault()
  isDragover.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragover.value = false
  
  if (props.disabled) return
  
  const files = Array.from(e.dataTransfer?.files || [])
  handleFiles(files)
}

// 文件选择处理
const triggerFileInput = () => {
  if (!props.disabled && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  handleFiles(files)
  target.value = '' // 清空input，允许重复选择同一文件
}

// 文件处理
const handleFiles = async (files: File[]) => {
  if (files.length === 0) return
  
  // 验证文件
  const validFiles = files.filter(file => validateFile(file))
  if (validFiles.length === 0) return
  
  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadStatus.value = undefined
    
    if (validFiles.length === 1) {
      // 单文件上传
      progressText.value = '正在上传文件...'
      const uploadedFile = await uploadsApi.uploadFile({
        orderId: props.orderId,
        materialItemId: props.materialItemId,
        file: validFiles[0]
      })
      
      fileList.value.push(uploadedFile)
      emit('upload-success', uploadedFile)
      uploadProgress.value = 100
      uploadStatus.value = 'success'
      progressText.value = '上传完成'
    } else {
      // 多文件上传
      progressText.value = `正在上传 ${validFiles.length} 个文件...`
      const result = await uploadsApi.uploadMultipleFiles({
        orderId: props.orderId,
        materialItemId: props.materialItemId,
        files: validFiles
      })
      
      fileList.value.push(...result.files)
      result.files.forEach(file => emit('upload-success', file))
      
      if (result.failed.length > 0) {
        ElMessage.warning(`部分文件上传失败：${result.failed.join(', ')}`)
      }
      
      uploadProgress.value = 100
      uploadStatus.value = result.failed.length === 0 ? 'success' : 'exception'
      progressText.value = `上传完成，成功 ${result.files.length} 个`
    }
  } catch (error) {
    uploadStatus.value = 'exception'
    progressText.value = '上传失败'
    emit('upload-error', error instanceof Error ? error.message : '上传失败')
  } finally {
    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
    }, 2000)
  }
}

// 文件验证
const validateFile = (file: File): boolean => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  
  if (isImage && !supportsImage.value) {
    ElMessage.error('不支持图片文件')
    return false
  }
  
  if (isVideo && !supportsVideo.value) {
    ElMessage.error('不支持视频文件')
    return false
  }
  
  if (!isImage && !isVideo) {
    ElMessage.error('不支持的文件类型')
    return false
  }
  
  // 检查文件大小
  if (file.size > props.maxSize) {
    ElMessage.error(`文件大小超出限制（最大${maxSizeText.value}）`)
    return false
  }
  
  return true
}

// 文本输入处理
const handleTextInput = async () => {
  if (!textContent.value.trim()) return
  
  try {
    uploading.value = true
    progressText.value = '正在保存文本内容...'
    
    const uploadedFile = await uploadsApi.uploadFile({
      orderId: props.orderId,
      materialItemId: props.materialItemId,
      textContent: textContent.value
    })
    
    fileList.value.push(uploadedFile)
    emit('upload-success', uploadedFile)
    textContent.value = ''
    
    uploadProgress.value = 100
    uploadStatus.value = 'success'
    progressText.value = '保存完成'
  } catch (error) {
    uploadStatus.value = 'exception'
    progressText.value = '保存失败'
    emit('upload-error', error instanceof Error ? error.message : '保存失败')
  } finally {
    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
    }, 2000)
  }
}

// 移除文件
const removeFile = async (index: number) => {
  const file = fileList.value[index]
  try {
    await uploadsApi.deleteFile(file.id)
    fileList.value.splice(index, 1)
    emit('file-remove', file.id)
    ElMessage.success('文件删除成功')
  } catch (error) {
    ElMessage.error('文件删除失败')
  }
}

// 预览文件
const previewFile = (file: UploadedFileInfo) => {
  if (file.filePath) {
    const url = uploadsApi.getFileUrl(file.filePath)
    window.open(url, '_blank')
  }
}

// 打开摄像头
const openCamera = async (type: 'photo' | 'video') => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: type === 'video'
    })
    
    // TODO: 实现摄像头拍照/录像功能
    ElMessage.info('摄像头功能开发中...')
    
    // 关闭流
    stream.getTracks().forEach(track => track.stop())
  } catch (error) {
    ElMessage.error('无法访问摄像头')
  }
}

// 初始化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 加载已有文件
  if (props.existingFiles) {
    fileList.value = [...props.existingFiles]
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
.file-upload-area {
  .upload-dropzone {
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--el-fill-color-lighter);
    
    &:hover:not(.is-disabled) {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
    
    &.is-dragover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      transform: scale(1.02);
    }
    
    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .upload-content {
      .upload-icon {
        color: var(--el-color-primary);
        margin-bottom: 16px;
      }
      
      .upload-title {
        font-size: 16px;
        color: var(--el-text-color-primary);
        margin: 0 0 8px 0;
      }
      
      .upload-hint {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 0;
      }
    }
    
    .camera-controls {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
      
      .camera-btn {
        min-width: 80px;
      }
    }
  }
  
  .text-input-area {
    margin-top: 16px;
  }
  
  .upload-progress {
    margin-top: 16px;
    
    .progress-text {
      text-align: center;
      margin-top: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
  
  .file-list {
    margin-top: 16px;
    
    .file-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      margin-bottom: 8px;
      background: var(--el-bg-color);
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .file-icon {
        font-size: 24px;
        color: var(--el-color-primary);
        margin-right: 12px;
      }
      
      .file-info {
        flex: 1;
        
        .file-name {
          font-size: 14px;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }
        
        .file-meta {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          
          .timestamp {
            margin-left: 8px;
          }
        }
      }
      
      .file-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

@media (max-width: 768px) {
  .file-upload-area {
    .upload-dropzone {
      padding: 30px 16px;
      
      .upload-content {
        .upload-icon {
          font-size: 36px;
        }
        
        .upload-title {
          font-size: 14px;
        }
        
        .upload-hint {
          font-size: 12px;
        }
      }
    }
    
    .file-list {
      .file-item {
        flex-direction: column;
        align-items: stretch;
        
        .file-info {
          margin: 8px 0;
        }
        
        .file-actions {
          justify-content: center;
        }
      }
    }
  }
}
</style>
