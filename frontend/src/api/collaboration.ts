import client, { ApiResponse } from './client'
import type { Order } from './orders'
import type { User } from './auth'

export interface CollaborationLink {
  id: number
  orderId: number
  token: string
  expiresAt: string
  createdBy: number
  accessCount: number
  lastAccessedAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  creator?: Pick<User, 'id' | 'username'>
  order?: Order
}

export interface CreateCollaborationRequest {
  orderId: number
  expiresInHours?: number
}

export interface CreateCollaborationResponse {
  link: CollaborationLink
  url: string
  qrCode: string // base64 data URL
}

export interface CollaborationInfoResponse {
  collaboration: CollaborationLink
  order: Order
}

export const collaborationApi = {
  // 创建协同链接
  createLink: async (data: CreateCollaborationRequest): Promise<CreateCollaborationResponse> => {
    const response = await client.post<ApiResponse<CreateCollaborationResponse>>('/collaboration', data)
    return response.data.data
  },

  // 通过token获取协同信息
  getCollaborationInfo: async (token: string): Promise<CollaborationInfoResponse> => {
    const response = await client.get<ApiResponse<CollaborationInfoResponse>>(`/collaboration/${token}`)
    return response.data.data
  },

  // 获取订单的协同链接列表
  getOrderLinks: async (orderId: number): Promise<CollaborationLink[]> => {
    const response = await client.get<ApiResponse<{ links: CollaborationLink[] }>>(`/collaboration/order/${orderId}`)
    return response.data.data.links
  },

  // 停用协同链接
  deactivateLink: async (id: number): Promise<CollaborationLink> => {
    const response = await client.put<ApiResponse<{ link: CollaborationLink }>>(`/collaboration/${id}/deactivate`)
    return response.data.data.link
  },

  // 清理过期链接（仅管理员）
  cleanupExpiredLinks: async (): Promise<number> => {
    const response = await client.post<ApiResponse<{ cleanedCount: number }>>('/collaboration/cleanup')
    return response.data.data.cleanedCount
  },

  // 生成协同链接URL
  generateCollaborationUrl: (token: string): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/collaboration/${token}`
  },

  // 检查链接是否有效
  isLinkValid: (link: CollaborationLink): boolean => {
    return link.isActive && new Date(link.expiresAt) > new Date()
  },

  // 格式化过期时间
  formatExpiresAt: (expiresAt: string): string => {
    const date = new Date(expiresAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    
    if (diffMs <= 0) {
      return '已过期'
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}天后过期`
    } else if (diffHours > 0) {
      return `${diffHours}小时后过期`
    } else {
      return `${diffMinutes}分钟后过期`
    }
  }
}
