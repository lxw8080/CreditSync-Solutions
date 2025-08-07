import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type LoginRequest, type User } from '../api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCustomerService = computed(() => user.value?.role === 'customer_service')

  // 方法
  const login = async (credentials: LoginRequest) => {
    loading.value = true
    try {
      const response = await authApi.login(credentials)
      if (response.success && response.data) {
        token.value = response.data.access_token
        user.value = response.data.user
        
        // 保存到localStorage
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
        
        return response
      }
      throw new Error(response.message || '登录失败')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 清除本地状态
      token.value = null
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    }
  }

  const loadUserFromStorage = () => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user_info')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Failed to parse stored user info:', error)
        logout()
      }
    }
  }

  const fetchProfile = async () => {
    if (!token.value) return
    
    try {
      const response = await authApi.getProfile()
      if (response.success && response.data) {
        user.value = response.data
        localStorage.setItem('user_info', JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      logout()
    }
  }

  // 初始化时从localStorage加载用户信息
  loadUserFromStorage()

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isCustomerService,
    login,
    logout,
    loadUserFromStorage,
    fetchProfile
  }
})
