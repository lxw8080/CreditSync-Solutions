import client, { ApiResponse } from './client'
import { User } from './auth'

export interface Order {
  id: number
  orderNumber: string
  customerName: string
  customerIdCard?: string
  creatorId: number
  status: 'in_progress' | 'completed'
  submittedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  creator?: Pick<User, 'id' | 'username'>
  uploadedFiles?: UploadedFile[]
}

export interface UploadedFile {
  id: number
  orderId: number
  materialItemId: number
  fileName?: string
  originalName?: string
  filePath?: string
  fileSize?: number
  fileType?: string
  uploadTime: string
  uploaderId: number
  textContent?: string
  materialItem?: MaterialItem
  uploader?: Pick<User, 'id' | 'username'>
}

export interface MaterialItem {
  id: number
  categoryId: number
  name: string
  description?: string
  fileTypes: string[]
  isRequired: boolean
  sortOrder: number
  category?: MaterialCategory
}

export interface MaterialCategory {
  id: number
  name: string
  description?: string
  sortOrder: number
}

export interface CreateOrderRequest {
  customerName: string
  customerIdCard?: string
}

export interface UpdateOrderRequest {
  customerName?: string
  customerIdCard?: string
  status?: 'in_progress' | 'completed'
  notes?: string
}

export interface OrderListQuery {
  page?: number
  limit?: number
  search?: string
  status?: 'in_progress' | 'completed'
  creatorId?: number
}

export interface OrderListResponse {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const ordersApi = {
  // 获取订单列表
  getOrders: async (query: OrderListQuery = {}): Promise<OrderListResponse> => {
    const response = await client.get<ApiResponse<OrderListResponse>>('/orders', { params: query })
    return response.data.data
  },

  // 获取订单详情
  getOrderById: async (id: number): Promise<Order> => {
    const response = await client.get<ApiResponse<{ order: Order }>>(`/orders/${id}`)
    return response.data.data.order
  },

  // 创建订单
  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await client.post<ApiResponse<{ order: Order }>>('/orders', data)
    return response.data.data.order
  },

  // 更新订单
  updateOrder: async (id: number, data: UpdateOrderRequest): Promise<Order> => {
    const response = await client.put<ApiResponse<{ order: Order }>>(`/orders/${id}`, data)
    return response.data.data.order
  },

  // 删除订单
  deleteOrder: async (id: number): Promise<void> => {
    await client.delete<ApiResponse<null>>(`/orders/${id}`)
  }
}
