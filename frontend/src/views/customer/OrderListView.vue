<template>
  <div class="order-list-view">
    <div class="page-header">
      <h2>订单列表</h2>
      <el-button type="primary" :icon="Plus" @click="createOrder">
        创建订单
      </el-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery.search"
            placeholder="搜索订单号或客户姓名"
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="searchQuery.status"
            placeholder="订单状态"
            clearable
            style="width: 100%"
          >
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="10">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 订单表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="orders"
        class="order-table responsive-table"
        @row-click="viewOrder"
      >
        <el-table-column prop="orderNumber" label="订单号" min-width="140">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="viewOrder(row)">
              {{ row.orderNumber }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="customerName" label="客户姓名" min-width="100" />
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'completed' ? 'success' : 'warning'"
              :class="`status-${row.status}`"
            >
              {{ row.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column
          v-if="userStore.isAdmin"
          prop="creator.username"
          label="创建人"
          width="100"
        />
        
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="View"
              @click.stop="viewOrder(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="canDeleteOrder(row)"
              type="danger"
              size="small"
              :icon="Delete"
              @click.stop="deleteOrder(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  View,
  Delete
} from '@element-plus/icons-vue'
import { ordersApi, type Order, type OrderListQuery } from '@/api/orders'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const orders = ref<Order[]>([])

const searchQuery = reactive<OrderListQuery>({
  search: '',
  status: undefined
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 检查是否可以删除订单
const canDeleteOrder = (order: Order) => {
  if (userStore.isAdmin) return true
  return order.creatorId === userStore.user?.id && order.status === 'in_progress'
}

// 获取订单列表
const fetchOrders = async () => {
  try {
    loading.value = true
    const response = await ordersApi.getOrders({
      ...searchQuery,
      page: pagination.page,
      limit: pagination.limit
    })
    
    orders.value = response.orders
    pagination.total = response.pagination.total
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

// 重置搜索
const handleReset = () => {
  searchQuery.search = ''
  searchQuery.status = undefined
  pagination.page = 1
  fetchOrders()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchOrders()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchOrders()
}

// 创建订单
const createOrder = () => {
  router.push('/customer/orders/create')
}

// 查看订单
const viewOrder = (order: Order) => {
  router.push(`/customer/orders/${order.id}`)
}

// 删除订单
const deleteOrder = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除订单 ${order.orderNumber} 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await ordersApi.deleteOrder(order.id)
    ElMessage.success('订单删除成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete order:', error)
    }
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style lang="scss" scoped>
.order-list-view {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      color: #303133;
    }
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }
  
  .search-bar {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .el-col {
      margin-bottom: 16px;
      
      @media (min-width: 768px) {
        margin-bottom: 0;
      }
    }
  }
  
  .table-container {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    
    .order-table {
      .el-table__row {
        cursor: pointer;
        
        &:hover {
          background-color: #f5f7fa;
        }
      }
    }
  }
  
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    
    @media (max-width: 768px) {
      .el-pagination {
        justify-content: center;
      }
    }
  }
}
</style>
