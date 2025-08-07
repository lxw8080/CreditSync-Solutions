<template>
  <div class="order-detail-container">
    <div class="page-header">
      <el-button @click="$router.back()" :icon="ArrowLeft">返回</el-button>
      <h3>订单详情</h3>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="order" class="order-content">
      <!-- 订单基本信息 -->
      <el-card class="order-info-card">
        <template #header>
          <div class="card-header">
            <span>订单信息</span>
            <el-tag :type="order.status === 'completed' ? 'success' : 'warning'">
              {{ order.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ order.order_number }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ order.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ order.customer_id_card || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(order.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="order.status === 'completed' ? 'success' : 'warning'">
              {{ order.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 协同操作区域 -->
      <el-card class="collaboration-card">
        <template #header>
          <div class="card-header">
            <span>协同操作</span>
            <div class="header-actions">
              <el-button @click="handleCreateCollaborationLink">
                <el-icon><Share /></el-icon>
                生成协同链接
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="collaborationLink" class="collaboration-info">
          <el-alert
            title="协同链接已生成"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>客户可通过以下链接上传资料：</p>
              <div class="link-container">
                <el-input
                  :value="collaborationLink.url"
                  readonly
                  class="link-input"
                >
                  <template #append>
                    <el-button @click="copyLink">复制</el-button>
                  </template>
                </el-input>
              </div>
              <div class="qr-code-container">
                <img :src="collaborationLink.qr_code" alt="二维码" class="qr-code" />
                <p>扫描二维码快速访问</p>
              </div>
              <p class="expire-info">
                链接有效期至：{{ formatDate(collaborationLink.expires_at) }}
              </p>
            </template>
          </el-alert>
        </div>

        <div v-else class="no-collaboration">
          <el-empty description="暂未生成协同链接" />
        </div>
      </el-card>

      <!-- 资料上传区域 -->
      <el-card class="upload-card">
        <template #header>
          <div class="card-header">
            <span>资料上传</span>
            <el-button type="primary" @click="showUploadDialog = true">
              <el-icon><Upload /></el-icon>
              上传资料
            </el-button>
          </div>
        </template>

        <!-- 已上传文件列表 -->
        <div v-if="files.length > 0" class="files-list">
          <el-table :data="files" stripe>
            <el-table-column prop="file_name" label="文件名" />
            <el-table-column prop="file_type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getFileTypeColor(row.file_type)">
                  {{ getFileTypeText(row.file_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="file_size" label="大小" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.file_size) }}
              </template>
            </el-table-column>
            <el-table-column prop="upload_time" label="上传时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.upload_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="handleDeleteFile(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-else class="empty-files">
          <el-empty description="暂无上传文件" />
        </div>
      </el-card>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传资料" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="上传类型">
          <el-radio-group v-model="uploadType">
            <el-radio value="file">文件上传</el-radio>
            <el-radio value="camera" v-if="isMobile">拍照录像</el-radio>
            <el-radio value="text">文本输入</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="uploadType === 'file'" label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持图片、视频、文档格式，文件大小不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item v-if="uploadType === 'camera'" label="拍照录像">
          <div class="camera-container">
            <div class="camera-buttons">
              <el-button @click="openCamera('photo')" :icon="Camera">拍照</el-button>
              <el-button @click="openCamera('video')" :icon="VideoCamera">录像</el-button>
            </div>
            <div v-if="capturedMedia" class="captured-media">
              <img v-if="capturedMedia.type === 'photo'" :src="capturedMedia.url" alt="拍摄的照片" class="captured-image" />
              <video v-if="capturedMedia.type === 'video'" :src="capturedMedia.url" controls class="captured-video"></video>
              <div class="media-actions">
                <el-button size="small" @click="retakeMedia">重新拍摄</el-button>
                <el-button size="small" type="danger" @click="clearMedia">清除</el-button>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item v-if="uploadType === 'text'" label="文本内容">
          <el-input
            v-model="uploadForm.text_content"
            type="textarea"
            :rows="6"
            placeholder="请输入文本内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">
          上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Upload, UploadFilled, Share, Camera, VideoCamera } from '@element-plus/icons-vue'
import { orderApi, uploadApi, collaborationApi, type Order, type UploadedFile, type CollaborationLink } from '../../api'
import dayjs from 'dayjs'

const route = useRoute()

// 响应式数据
const loading = ref(true)
const uploading = ref(false)
const order = ref<Order | null>(null)
const files = ref<UploadedFile[]>([])
const showUploadDialog = ref(false)
const uploadType = ref<'file' | 'text' | 'camera'>('file')
const collaborationLink = ref<CollaborationLink | null>(null)
const isMobile = ref(false)
const capturedMedia = ref<{ type: 'photo' | 'video'; url: string; file: File } | null>(null)

// 上传表单
const uploadForm = reactive({
  text_content: ''
})

const uploadRef = ref()
const selectedFile = ref<File | null>(null)

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (size?: number) => {
  if (!size) return '-'
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / (1024 * 1024)).toFixed(1)}MB`
}

// 获取文件类型颜色
const getFileTypeColor = (type: string) => {
  switch (type) {
    case 'image': return 'success'
    case 'video': return 'warning'
    case 'text': return 'info'
    default: return ''
  }
}

// 获取文件类型文本
const getFileTypeText = (type: string) => {
  switch (type) {
    case 'image': return '图片'
    case 'video': return '视频'
    case 'text': return '文本'
    default: return '文档'
  }
}

// 获取订单详情
const fetchOrderDetail = async () => {
  const orderId = Number(route.params.id)
  if (!orderId) return
  
  try {
    const response = await orderApi.getOrder(orderId)
    if (response.success && response.data) {
      order.value = response.data
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '获取订单详情失败')
  }
}

// 获取文件列表
const fetchFiles = async () => {
  const orderId = Number(route.params.id)
  if (!orderId) return
  
  try {
    const response = await uploadApi.getOrderFiles(orderId)
    if (response.success && response.data) {
      files.value = response.data
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '获取文件列表失败')
  }
}

// 文件选择处理
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

// 文件移除处理
const handleFileRemove = () => {
  selectedFile.value = null
}

// 上传处理
const handleUpload = async () => {
  const orderId = Number(route.params.id)
  if (!orderId) return

  if (uploadType.value === 'file' && !selectedFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  if (uploadType.value === 'camera' && !capturedMedia.value) {
    ElMessage.warning('请先拍照或录像')
    return
  }

  if (uploadType.value === 'text' && !uploadForm.text_content.trim()) {
    ElMessage.warning('请输入文本内容')
    return
  }

  uploading.value = true
  try {
    let fileToUpload: File | undefined
    let textContent: string | undefined

    if (uploadType.value === 'file') {
      fileToUpload = selectedFile.value
    } else if (uploadType.value === 'camera') {
      fileToUpload = capturedMedia.value?.file
    } else if (uploadType.value === 'text') {
      textContent = uploadForm.text_content
    }

    await uploadApi.uploadFile({
      order_id: orderId,
      file: fileToUpload,
      text_content: textContent
    })

    ElMessage.success('上传成功')
    showUploadDialog.value = false
    resetUploadForm()
    fetchFiles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 删除文件
const handleDeleteFile = async (file: UploadedFile) => {
  try {
    await ElMessageBox.confirm('确定要删除这个文件吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await uploadApi.deleteFile(file.id)
    ElMessage.success('删除成功')
    fetchFiles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '删除失败')
    }
  }
}

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.text_content = ''
  selectedFile.value = null
  uploadRef.value?.clearFiles()
  clearMedia()
  uploadType.value = isMobile.value ? 'camera' : 'file'
}

// 创建协同链接
const handleCreateCollaborationLink = async () => {
  const orderId = Number(route.params.id)
  if (!orderId) return

  try {
    const response = await collaborationApi.createLink(orderId)
    if (response.success && response.data) {
      collaborationLink.value = response.data
      ElMessage.success(response.message || '协同链接创建成功')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '创建协同链接失败')
  }
}

// 复制链接
const copyLink = async () => {
  if (!collaborationLink.value) return

  try {
    await navigator.clipboard.writeText(collaborationLink.value.url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = collaborationLink.value.url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('链接已复制到剪贴板')
  }
}

// 检测是否为移动设备
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 打开相机
const openCamera = async (type: 'photo' | 'video') => {
  try {
    const constraints = {
      video: true,
      audio: type === 'video'
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // 创建临时的video元素用于预览
    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    video.muted = true
    video.style.width = '100%'
    video.style.maxWidth = '400px'
    video.style.height = 'auto'

    // 创建对话框显示相机预览
    const cameraDialog = document.createElement('div')
    cameraDialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `

    const controls = document.createElement('div')
    controls.style.cssText = `
      margin-top: 20px;
      display: flex;
      gap: 10px;
    `

    const captureBtn = document.createElement('button')
    captureBtn.textContent = type === 'photo' ? '拍照' : '开始录制'
    captureBtn.style.cssText = `
      padding: 10px 20px;
      background: #409eff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = '取消'
    cancelBtn.style.cssText = `
      padding: 10px 20px;
      background: #f56c6c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `

    controls.appendChild(captureBtn)
    controls.appendChild(cancelBtn)
    cameraDialog.appendChild(video)
    cameraDialog.appendChild(controls)
    document.body.appendChild(cameraDialog)

    let mediaRecorder: MediaRecorder | null = null
    let recordedChunks: Blob[] = []

    captureBtn.onclick = () => {
      if (type === 'photo') {
        // 拍照
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
            const url = URL.createObjectURL(blob)
            capturedMedia.value = { type: 'photo', url, file }
            cleanup()
          }
        }, 'image/jpeg', 0.8)
      } else {
        // 录像
        if (!mediaRecorder) {
          recordedChunks = []
          mediaRecorder = new MediaRecorder(stream)

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunks.push(event.data)
            }
          }

          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' })
            const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            capturedMedia.value = { type: 'video', url, file }
            cleanup()
          }

          mediaRecorder.start()
          captureBtn.textContent = '停止录制'
        } else {
          mediaRecorder.stop()
        }
      }
    }

    cancelBtn.onclick = cleanup

    function cleanup() {
      stream.getTracks().forEach(track => track.stop())
      document.body.removeChild(cameraDialog)
    }

  } catch (error) {
    console.error('无法访问相机:', error)
    ElMessage.error('无法访问相机，请检查权限设置')
  }
}

// 重新拍摄
const retakeMedia = () => {
  if (capturedMedia.value) {
    URL.revokeObjectURL(capturedMedia.value.url)
    capturedMedia.value = null
  }
  openCamera(capturedMedia.value?.type || 'photo')
}

// 清除媒体
const clearMedia = () => {
  if (capturedMedia.value) {
    URL.revokeObjectURL(capturedMedia.value.url)
    capturedMedia.value = null
  }
}

// 页面加载时获取数据
onMounted(async () => {
  loading.value = true
  checkMobile()
  try {
    await Promise.all([fetchOrderDetail(), fetchFiles()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.order-detail-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 500;
}

.loading-container {
  padding: 40px;
}

.order-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.files-list {
  margin-top: 16px;
}

.empty-files {
  padding: 40px 0;
}

.collaboration-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.collaboration-info {
  padding: 16px 0;
}

.link-container {
  margin: 16px 0;
}

.link-input {
  width: 100%;
}

.qr-code-container {
  text-align: center;
  margin: 20px 0;
}

.qr-code {
  width: 150px;
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.qr-code-container p {
  margin: 10px 0 0 0;
  color: #666;
  font-size: 14px;
}

.expire-info {
  color: #999;
  font-size: 14px;
  margin: 10px 0 0 0;
}

.no-collaboration {
  padding: 20px 0;
}

.camera-container {
  text-align: center;
}

.camera-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.captured-media {
  margin-top: 20px;
}

.captured-image,
.captured-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.media-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .order-detail-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
}
</style>
