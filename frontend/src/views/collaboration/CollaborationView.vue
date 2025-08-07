<template>
  <div class="collaboration-view">
    <div class="container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <el-result
          icon="error"
          :title="error"
          sub-title="请检查链接是否正确或联系创建者"
        >
          <template #extra>
            <el-button type="primary" @click="$router.push('/login')">
              返回登录
            </el-button>
          </template>
        </el-result>
      </div>
      
      <!-- 协同编辑界面 -->
      <div v-else-if="collaborationInfo" class="collaboration-content">
        <!-- 协同信息提示 -->
        <div class="collaboration-info">
          <div class="collaboration-title">
            <el-icon><Share /></el-icon>
            协同编辑模式
          </div>
          <div class="collaboration-details">
            <p>您正在协同编辑订单：<strong>{{ order?.orderNumber }}</strong></p>
            <p>客户：{{ order?.customerName }}</p>
            <p>创建者：{{ order?.creator?.username }}</p>
            <p>链接过期时间：{{ formatExpiresAt(collaborationInfo.expiresAt) }}</p>
          </div>
        </div>
        
        <!-- 订单详情 -->
        <div class="order-detail">
          <div class="order-header">
            <h2>订单详情</h2>
            <el-tag
              :type="order?.status === 'completed' ? 'success' : 'warning'"
              size="large"
            >
              {{ order?.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </div>
          
          <div class="order-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号">
                {{ order?.orderNumber }}
              </el-descriptions-item>
              <el-descriptions-item label="客户姓名">
                {{ order?.customerName }}
              </el-descriptions-item>
              <el-descriptions-item label="身份证号" v-if="order?.customerIdCard">
                {{ order?.customerIdCard }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(order?.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(order?.updatedAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="提交时间" v-if="order?.submittedAt">
                {{ formatDate(order?.submittedAt) }}
              </el-descriptions-item>
            </el-descriptions>
            
            <div v-if="order?.notes" class="order-notes">
              <h4>备注信息</h4>
              <p>{{ order.notes }}</p>
            </div>
          </div>
        </div>
        
        <!-- 资料上传区域 -->
        <div class="materials-section">
          <h3>资料上传</h3>
          
          <div v-if="materialCategories.length === 0" class="no-materials">
            <el-empty description="暂无资料分类配置" />
          </div>
          
          <div v-else class="material-categories">
            <div
              v-for="category in materialCategories"
              :key="category.id"
              class="material-category"
            >
              <h4 class="category-title">{{ category.name }}</h4>
              <p v-if="category.description" class="category-description">
                {{ category.description }}
              </p>
              
              <div class="material-items">
                <div
                  v-for="item in category.materialItems"
                  :key="item.id"
                  class="material-item"
                  :class="{ 'is-required': item.isRequired }"
                >
                  <div class="item-header">
                    <h5 class="item-title">
                      <span v-if="item.isRequired" class="required-mark">*</span>
                      {{ item.name }}
                    </h5>
                    <p v-if="item.description" class="item-description">
                      {{ item.description }}
                    </p>
                  </div>
                  
                  <!-- 文件上传组件 -->
                  <FileUploadArea
                    v-if="order"
                    :order-id="order.id"
                    :material-item-id="item.id"
                    :file-types="item.fileTypes"
                    :multiple="true"
                    :disabled="order.status === 'completed'"
                    :existing-files="getItemFiles(item.id)"
                    @upload-success="handleUploadSuccess"
                    @upload-error="handleUploadError"
                    @file-remove="handleFileRemove"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="order?.status === 'in_progress'" class="action-buttons">
          <el-button
            type="success"
            size="large"
            :loading="submitting"
            @click="submitOrder"
          >
            提交订单
          </el-button>
          <el-button
            size="large"
            @click="saveProgress"
          >
            保存进度
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Share } from '@element-plus/icons-vue'
import { collaborationApi, type CollaborationInfoResponse } from '@/api/collaboration'
import { ordersApi, type Order } from '@/api/orders'
import type { UploadedFileInfo } from '@/api/uploads'
import FileUploadArea from '@/components/FileUpload/FileUploadArea.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const collaborationInfo = ref<CollaborationInfoResponse | null>(null)

// 计算属性
const order = computed(() => collaborationInfo.value?.order)
const materialCategories = computed(() => {
  if (!order.value?.uploadedFiles) return []
  
  // 从上传文件中提取资料分类信息
  const categoriesMap = new Map()
  
  order.value.uploadedFiles.forEach(file => {
    if (file.materialItem?.category) {
      const category = file.materialItem.category
      if (!categoriesMap.has(category.id)) {
        categoriesMap.set(category.id, {
          ...category,
          materialItems: []
        })
      }
      
      const categoryData = categoriesMap.get(category.id)
      const existingItem = categoryData.materialItems.find((item: any) => item.id === file.materialItem?.id)
      
      if (!existingItem && file.materialItem) {
        categoryData.materialItems.push(file.materialItem)
      }
    }
  })
  
  return Array.from(categoriesMap.values()).sort((a, b) => a.sortOrder - b.sortOrder)
})

// 格式化日期
const formatDate = (date?: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 格式化过期时间
const formatExpiresAt = (expiresAt: string) => {
  return collaborationApi.formatExpiresAt(expiresAt)
}

// 获取指定资料项的文件
const getItemFiles = (materialItemId: number): UploadedFileInfo[] => {
  if (!order.value?.uploadedFiles) return []
  return order.value.uploadedFiles.filter(file => file.materialItemId === materialItemId)
}

// 处理文件上传成功
const handleUploadSuccess = (file: UploadedFileInfo) => {
  if (order.value?.uploadedFiles) {
    order.value.uploadedFiles.push(file)
  }
  ElMessage.success('文件上传成功')
}

// 处理文件上传错误
const handleUploadError = (errorMessage: string) => {
  ElMessage.error(`文件上传失败: ${errorMessage}`)
}

// 处理文件删除
const handleFileRemove = (fileId: number) => {
  if (order.value?.uploadedFiles) {
    const index = order.value.uploadedFiles.findIndex(file => file.id === fileId)
    if (index > -1) {
      order.value.uploadedFiles.splice(index, 1)
    }
  }
}

// 保存进度
const saveProgress = () => {
  ElMessage.success('进度已自动保存')
}

// 提交订单
const submitOrder = async () => {
  if (!order.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要提交订单吗？提交后将无法继续编辑。',
      '确认提交',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    submitting.value = true
    
    await ordersApi.updateOrder(order.value.id, {
      status: 'completed'
    })
    
    // 更新本地状态
    if (order.value) {
      order.value.status = 'completed'
      order.value.submittedAt = new Date().toISOString()
    }
    
    ElMessage.success('订单提交成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to submit order:', error)
    }
  } finally {
    submitting.value = false
  }
}

// 加载协同信息
const loadCollaborationInfo = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const token = route.params.token as string
    if (!token) {
      throw new Error('协同链接无效')
    }
    
    const info = await collaborationApi.getCollaborationInfo(token)
    collaborationInfo.value = info
    
    // 设置页面标题
    document.title = `协同编辑 - ${info.order.orderNumber} - 客户资料收集系统`
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载协同信息失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCollaborationInfo()
})
</script>

<style lang="scss" scoped>
.collaboration-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .loading-container,
  .error-container {
    background: white;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .collaboration-content {
    .collaboration-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      
      .collaboration-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .collaboration-details {
        p {
          margin: 4px 0;
          opacity: 0.9;
        }
      }
    }
    
    .order-detail {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h2 {
          margin: 0;
          color: #303133;
        }
      }
      
      .order-notes {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ebeef5;
        
        h4 {
          margin: 0 0 8px 0;
          color: #606266;
        }
        
        p {
          margin: 0;
          color: #303133;
          line-height: 1.6;
        }
      }
    }
    
    .materials-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      h3 {
        margin: 0 0 20px 0;
        color: #303133;
      }
      
      .material-category {
        margin-bottom: 32px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .category-title {
          color: #409eff;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .category-description {
          color: #909399;
          font-size: 14px;
          margin: 0 0 16px 0;
        }
        
        .material-items {
          .material-item {
            border: 1px solid #ebeef5;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            &.is-required {
              border-color: #f56c6c;
              background: #fef0f0;
            }
            
            .item-header {
              margin-bottom: 16px;
              
              .item-title {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 14px;
                font-weight: 600;
                color: #303133;
                margin: 0 0 4px 0;
                
                .required-mark {
                  color: #f56c6c;
                }
              }
              
              .item-description {
                font-size: 12px;
                color: #909399;
                margin: 0;
              }
            }
          }
        }
      }
    }
    
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 20px;
    }
  }
}

@media (max-width: 768px) {
  .collaboration-view {
    padding: 16px;
    
    .order-detail {
      .order-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
    }
    
    .action-buttons {
      flex-direction: column;
      
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
