import client, { ApiResponse } from './client'

export interface User {
  id: number
  username: string
  role: 'admin' | 'customer_service'
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  // 用户登录
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await client.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return response.data.data
  },

  // 用户登出
  logout: async (): Promise<void> => {
    await client.post<ApiResponse<null>>('/auth/logout')
  },

  // 获取用户信息
  getProfile: async (): Promise<User> => {
    const response = await client.get<ApiResponse<{ user: User }>>('/auth/profile')
    return response.data.data.user
  },

  // 刷新令牌
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await client.post<ApiResponse<LoginResponse>>('/auth/refresh')
    return response.data.data
  }
}
