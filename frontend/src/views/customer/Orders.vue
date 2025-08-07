<template>
  <div class="orders-container">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h3>订单管理</h3>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建订单
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchForm.search"
            placeholder="搜索订单号或客户姓名"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="searchForm.status_filter"
            placeholder="订单状态"
            clearable
          >
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 订单列表 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="orders"
        stripe
        @row-click="handleRowClick"
        style="cursor: pointer;"
      >
        <el-table-column prop="order_number" label="订单号" width="180" />
        <el-table-column prop="customer_name" label="客户姓名" width="120" />
        <el-table-column prop="customer_id_card" label="身份证号" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
              {{ row.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="primary" @click.stop="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click.stop="handleDelete(row)"
              :disabled="row.status === 'completed'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑订单对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingOrder ? '编辑订单' : '新建订单'"
      width="500px"
    >
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderRules"
        label-width="100px"
      >
        <el-form-item label="客户姓名" prop="customer_name">
          <el-input v-model="orderForm.customer_name" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="customer_id_card">
          <el-input v-model="orderForm.customer_id_card" placeholder="请输入身份证号（可选）" />
        </el-form-item>
        <el-form-item v-if="editingOrder" label="订单状态" prop="status">
          <el-select v-model="orderForm.status" placeholder="请选择状态">
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ editingOrder ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { orderApi, type Order } from '../../api'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const orders = ref<Order[]>([])
const showCreateDialog = ref(false)
const editingOrder = ref<Order | null>(null)

// 搜索表单
const searchForm = reactive({
  search: '',
  status_filter: ''
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 订单表单
const orderForm = reactive({
  customer_name: '',
  customer_id_card: '',
  status: 'in_progress'
})

// 表单引用和验证规则
const orderFormRef = ref<FormInstance>()
const orderRules: FormRules = {
  customer_name: [
    { required: true, message: '请输入客户姓名', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await orderApi.getOrders({
      page: pagination.page,
      size: pagination.size,
      search: searchForm.search || undefined,
      status_filter: searchForm.status_filter || undefined
    })
    
    if (response.success && response.data) {
      orders.value = response.data.items
      pagination.total = response.data.total
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchOrders()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchOrders()
}

// 行点击处理
const handleRowClick = (row: Order) => {
  handleViewDetail(row)
}

// 查看详情
const handleViewDetail = (order: Order) => {
  router.push(`/customer/orders/${order.id}`)
}

// 编辑订单
const handleEdit = (order: Order) => {
  editingOrder.value = order
  orderForm.customer_name = order.customer_name
  orderForm.customer_id_card = order.customer_id_card || ''
  orderForm.status = order.status
  showCreateDialog.value = true
}

// 删除订单
const handleDelete = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除订单 ${order.order_number} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await orderApi.deleteOrder(order.id)
    ElMessage.success('删除成功')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!orderFormRef.value) return
  
  try {
    await orderFormRef.value.validate()
    submitting.value = true
    
    if (editingOrder.value) {
      // 更新订单
      await orderApi.updateOrder(editingOrder.value.id, {
        customer_name: orderForm.customer_name,
        customer_id_card: orderForm.customer_id_card || undefined,
        status: orderForm.status
      })
      ElMessage.success('更新成功')
    } else {
      // 创建订单
      await orderApi.createOrder({
        customer_name: orderForm.customer_name,
        customer_id_card: orderForm.customer_id_card || undefined
      })
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    resetForm()
    fetchOrders()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingOrder.value = null
  orderForm.customer_name = ''
  orderForm.customer_id_card = ''
  orderForm.status = 'in_progress'
  orderFormRef.value?.resetFields()
}

// 监听对话框关闭
const handleDialogClose = () => {
  resetForm()
}

// 页面加载时获取数据
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 500;
}

.search-bar {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.table-container {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .orders-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-bar .el-row {
    flex-direction: column;
  }
  
  .search-bar .el-col {
    width: 100% !important;
    margin-bottom: 10px;
  }
  
  .pagination-container {
    text-align: center;
  }
}
</style>
