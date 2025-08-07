import axios from 'axios'
import type { AxiosResponse } from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API接口类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  timestamp?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    username: string
    role: string
  }
}

export interface User {
  id: number
  username: string
  role: string
  is_active: boolean
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_id_card?: string
  status: string
  creator_id: number
  created_at: string
  updated_at: string
}

export interface MaterialCategory {
  id: number
  name: string
  sort_order: number
  items: MaterialItem[]
}

export interface MaterialItem {
  id: number
  name: string
  file_types: string[]
  is_required: boolean
  sort_order: number
}

export interface UploadedFile {
  id: number
  material_item_id?: number
  file_name?: string
  file_type: string
  file_size?: number
  upload_time: string
  uploader_id: number
  text_content?: string
}

export interface CollaborationLink {
  id: number
  token: string
  url: string
  expires_at: string
  qr_code: string
}

export interface CollaborationInfo {
  order: Order
  expires_at: string
  remaining_hours: number
}

// 认证相关API
export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },
  
  getProfile: (): Promise<ApiResponse<User>> => {
    return api.get('/auth/profile')
  },
  
  logout: (): Promise<ApiResponse> => {
    return api.post('/auth/logout')
  }
}

// 订单相关API
export const orderApi = {
  getOrders: (params?: {
    page?: number
    size?: number
    search?: string
    status_filter?: string
  }): Promise<ApiResponse<{
    items: Order[]
    total: number
    page: number
    size: number
  }>> => {
    return api.get('/orders', { params })
  },
  
  createOrder: (data: {
    customer_name: string
    customer_id_card?: string
  }): Promise<ApiResponse<Order>> => {
    const formData = new FormData()
    formData.append('customer_name', data.customer_name)
    if (data.customer_id_card) {
      formData.append('customer_id_card', data.customer_id_card)
    }
    return api.post('/orders', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },
  
  getOrder: (id: number): Promise<ApiResponse<Order>> => {
    return api.get(`/orders/${id}`)
  },
  
  updateOrder: (id: number, data: {
    customer_name?: string
    customer_id_card?: string
    status?: string
  }): Promise<ApiResponse<Order>> => {
    const formData = new FormData()
    if (data.customer_name) formData.append('customer_name', data.customer_name)
    if (data.customer_id_card) formData.append('customer_id_card', data.customer_id_card)
    if (data.status) formData.append('status', data.status)
    return api.put(`/orders/${id}`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },
  
  deleteOrder: (id: number): Promise<ApiResponse> => {
    return api.delete(`/orders/${id}`)
  }
}

// 文件上传相关API
export const uploadApi = {
  uploadFile: (data: {
    order_id: number
    material_item_id?: number
    text_content?: string
    file?: File
  }): Promise<ApiResponse<UploadedFile>> => {
    const formData = new FormData()
    formData.append('order_id', data.order_id.toString())
    if (data.material_item_id) {
      formData.append('material_item_id', data.material_item_id.toString())
    }
    if (data.text_content) {
      formData.append('text_content', data.text_content)
    }
    if (data.file) {
      formData.append('file', data.file)
    }
    return api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  getOrderFiles: (orderId: number): Promise<ApiResponse<UploadedFile[]>> => {
    return api.get(`/uploads/order/${orderId}`)
  },
  
  deleteFile: (id: number): Promise<ApiResponse> => {
    return api.delete(`/uploads/${id}`)
  }
}

// 管理员相关API
export const adminApi = {
  getCategories: (): Promise<ApiResponse<MaterialCategory[]>> => {
    return api.get('/admin/categories')
  },
  
  createCategory: (data: {
    name: string
    sort_order?: number
  }): Promise<ApiResponse<MaterialCategory>> => {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.sort_order !== undefined) {
      formData.append('sort_order', data.sort_order.toString())
    }
    return api.post('/admin/categories', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },
  
  updateCategory: (id: number, data: {
    name?: string
    sort_order?: number
  }): Promise<ApiResponse<MaterialCategory>> => {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.sort_order !== undefined) {
      formData.append('sort_order', data.sort_order.toString())
    }
    return api.put(`/admin/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },
  
  deleteCategory: (id: number): Promise<ApiResponse> => {
    return api.delete(`/admin/categories/${id}`)
  }
}

// 协同操作相关API
export const collaborationApi = {
  createLink: (orderId: number): Promise<ApiResponse<CollaborationLink>> => {
    return api.post(`/collaboration/orders/${orderId}/create-link`)
  },

  getInfo: (token: string): Promise<ApiResponse<CollaborationInfo>> => {
    return api.get(`/collaboration/links/${token}`)
  },

  uploadText: (token: string, data: {
    material_item_id?: number
    text_content: string
  }): Promise<ApiResponse<UploadedFile>> => {
    const formData = new FormData()
    if (data.material_item_id) {
      formData.append('material_item_id', data.material_item_id.toString())
    }
    formData.append('text_content', data.text_content)
    return api.post(`/collaboration/links/${token}/upload`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  getFiles: (token: string): Promise<ApiResponse<UploadedFile[]>> => {
    return api.get(`/collaboration/links/${token}/files`)
  },

  deleteLink: (orderId: number, linkId: number): Promise<ApiResponse> => {
    return api.delete(`/collaboration/orders/${orderId}/links/${linkId}`)
  }
}

export default api
