<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>客户资料收集系统</h1>
        <p>请登录您的账户</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="userStore.loading"
            @click="handleLogin"
          >
            {{ userStore.loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>默认账户信息：</p>
        <p>管理员: admin / admin123456</p>
        <p>客服: customer_service_1 / cs123456</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElForm, ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { LoginRequest } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref<InstanceType<typeof ElForm>>()

// 登录表单数据
const loginForm = reactive<LoginRequest>({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    await userStore.login(loginForm)
    
    // 根据用户角色跳转到不同页面
    if (userStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/customer')
    }
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  
  @media (max-width: 480px) {
    padding: 30px 20px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: #303133;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #909399;
    font-size: 14px;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: center;
  
  p {
    color: #909399;
    font-size: 12px;
    margin: 4px 0;
    
    &:first-child {
      font-weight: 500;
      color: #606266;
    }
  }
}
</style>
