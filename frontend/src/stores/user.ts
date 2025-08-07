import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type User, type LoginRequest } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCustomerService = computed(() => user.value?.role === 'customer_service')

  // 设置认证信息
  const setAuth = (authData: { token: string; user: User }) => {
    token.value = authData.token
    user.value = authData.user
    localStorage.setItem('token', authData.token)
    localStorage.setItem('userRole', authData.user.role)
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
  }

  // 登录
  const login = async (credentials: LoginRequest) => {
    try {
      loading.value = true
      const authData = await authApi.login(credentials)
      setAuth(authData)
      ElMessage.success('登录成功')
      return authData
    } catch (error) {
      clearAuth()
      throw error
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      loading.value = true
      await authApi.logout()
      clearAuth()
      ElMessage.success('登出成功')
    } catch (error) {
      // 即使API调用失败，也要清除本地认证信息
      clearAuth()
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchProfile = async () => {
    try {
      loading.value = true
      const userData = await authApi.getProfile()
      user.value = userData
      return userData
    } catch (error) {
      clearAuth()
      throw error
    } finally {
      loading.value = false
    }
  }

  // 刷新令牌
  const refreshToken = async () => {
    try {
      const authData = await authApi.refreshToken()
      setAuth(authData)
      return authData
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  // 初始化用户信息（应用启动时调用）
  const initializeAuth = async () => {
    if (token.value && !user.value) {
      try {
        await fetchProfile()
      } catch (error) {
        clearAuth()
      }
    }
  }

  return {
    // 状态
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    
    // 计算属性
    isLoggedIn,
    isAdmin,
    isCustomerService,
    
    // 方法
    login,
    logout,
    fetchProfile,
    refreshToken,
    initializeAuth,
    setAuth,
    clearAuth
  }
})
