<template>
  <div class="collaborate-container">
    <div class="collaborate-header">
      <h1>客户资料协同上传</h1>
      <p>请按要求上传相关资料</p>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        :title="error.title"
        :sub-title="error.message"
      >
        <template #extra>
          <el-button @click="$router.push('/login')">返回登录</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="collaborationInfo" class="collaborate-content">
      <!-- 订单信息 -->
      <el-card class="order-info-card">
        <template #header>
          <div class="card-header">
            <span>订单信息</span>
            <el-tag type="info">
              剩余时间: {{ Math.floor(collaborationInfo.remaining_hours) }}小时
            </el-tag>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">
            {{ collaborationInfo.order.order_number }}
          </el-descriptions-item>
          <el-descriptions-item label="客户姓名">
            {{ collaborationInfo.order.customer_name }}
          </el-descriptions-item>
          <el-descriptions-item label="身份证号">
            {{ collaborationInfo.order.customer_id_card || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(collaborationInfo.order.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
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
            <el-table-column prop="file_name" label="文件名">
              <template #default="{ row }">
                {{ row.file_name || '文本内容' }}
              </template>
            </el-table-column>
            <el-table-column prop="file_type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getFileTypeColor(row.file_type)">
                  {{ getFileTypeText(row.file_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="upload_time" label="上传时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.upload_time) }}
              </template>
            </el-table-column>
            <el-table-column label="内容" min-width="200">
              <template #default="{ row }">
                <div v-if="row.text_content" class="text-content">
                  {{ row.text_content.length > 50 ? row.text_content.substring(0, 50) + '...' : row.text_content }}
                </div>
                <span v-else>-</span>
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
        <el-form-item label="上传方式">
          <el-radio-group v-model="uploadType">
            <el-radio value="text">文本输入</el-radio>
            <el-radio value="camera" v-if="isMobile">拍照录像</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="uploadType === 'text'" label="资料内容">
          <el-input
            v-model="uploadForm.text_content"
            type="textarea"
            :rows="6"
            placeholder="请输入资料内容或说明"
          />
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
import { ElMessage } from 'element-plus'
import { Upload, Camera, VideoCamera } from '@element-plus/icons-vue'
import { collaborationApi, type CollaborationInfo, type UploadedFile } from '../api'
import dayjs from 'dayjs'

const route = useRoute()

// 响应式数据
const loading = ref(true)
const uploading = ref(false)
const collaborationInfo = ref<CollaborationInfo | null>(null)
const files = ref<UploadedFile[]>([])
const showUploadDialog = ref(false)
const error = ref<{ title: string; message: string } | null>(null)
const uploadType = ref<'text' | 'camera'>('text')
const isMobile = ref(false)
const capturedMedia = ref<{ type: 'photo' | 'video'; url: string; file: File } | null>(null)

// 上传表单
const uploadForm = reactive({
  text_content: ''
})

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
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

// 获取协同信息
const fetchCollaborationInfo = async () => {
  const token = route.params.token as string
  if (!token) {
    error.value = {
      title: '无效链接',
      message: '协同链接格式不正确'
    }
    return
  }
  
  try {
    const response = await collaborationApi.getInfo(token)
    if (response.success && response.data) {
      collaborationInfo.value = response.data
      
      // 检查是否过期
      if (response.data.remaining_hours <= 0) {
        error.value = {
          title: '链接已过期',
          message: '该协同链接已过期，请联系客服重新生成'
        }
        return
      }
    }
  } catch (err: any) {
    console.error('获取协同信息失败:', err)
    if (err.response?.status === 404) {
      error.value = {
        title: '链接不存在',
        message: '该协同链接不存在或已被删除'
      }
    } else if (err.response?.status === 410) {
      error.value = {
        title: '链接已过期',
        message: '该协同链接已过期，请联系客服重新生成'
      }
    } else {
      error.value = {
        title: '加载失败',
        message: '无法加载协同信息，请稍后重试'
      }
    }
  }
}

// 获取文件列表
const fetchFiles = async () => {
  const token = route.params.token as string
  if (!token) return
  
  try {
    const response = await collaborationApi.getFiles(token)
    if (response.success && response.data) {
      files.value = response.data
    }
  } catch (err: any) {
    console.error('获取文件列表失败:', err)
  }
}

// 检测是否为移动设备
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 打开相机（复制之前的实现）
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

// 上传处理
const handleUpload = async () => {
  if (uploadType.value === 'text' && !uploadForm.text_content.trim()) {
    ElMessage.warning('请输入资料内容')
    return
  }

  if (uploadType.value === 'camera' && !capturedMedia.value) {
    ElMessage.warning('请先拍照或录像')
    return
  }

  const token = route.params.token as string
  if (!token) return

  uploading.value = true
  try {
    if (uploadType.value === 'text') {
      await collaborationApi.uploadText(token, {
        text_content: uploadForm.text_content
      })
    } else if (uploadType.value === 'camera') {
      // 对于协同页面，我们需要扩展API来支持文件上传
      // 暂时将图片转换为base64文本上传
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        await collaborationApi.uploadText(token, {
          text_content: `[${capturedMedia.value?.type === 'photo' ? '图片' : '视频'}] ${base64}`
        })

        ElMessage.success('上传成功')
        showUploadDialog.value = false
        uploadForm.text_content = ''
        clearMedia()
        fetchFiles()
        uploading.value = false
      }
      reader.readAsDataURL(capturedMedia.value.file)
      return
    }

    ElMessage.success('上传成功')
    showUploadDialog.value = false
    uploadForm.text_content = ''
    clearMedia()
    fetchFiles()
  } catch (err: any) {
    console.error('上传失败:', err)
    ElMessage.error(err.response?.data?.detail || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 页面加载时获取数据
onMounted(async () => {
  loading.value = true
  checkMobile()
  if (isMobile.value) {
    uploadType.value = 'camera'
  }
  try {
    await fetchCollaborationInfo()
    if (!error.value) {
      await fetchFiles()
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.collaborate-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.collaborate-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collaborate-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.collaborate-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.loading-container,
.error-container {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collaborate-content {
  max-width: 1200px;
  margin: 0 auto;
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

.text-content {
  word-break: break-all;
  line-height: 1.4;
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
  .collaborate-container {
    padding: 10px;
  }
  
  .collaborate-header {
    padding: 20px;
  }
  
  .collaborate-header h1 {
    font-size: 24px;
  }
  
  .collaborate-content {
    gap: 15px;
  }
}
</style>
