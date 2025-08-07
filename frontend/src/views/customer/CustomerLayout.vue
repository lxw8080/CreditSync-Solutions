<template>
  <div class="customer-layout">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <h1 class="system-title">客户资料收集系统</h1>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              {{ userStore.user?.username }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-container>
        <!-- 侧边导航 -->
        <el-aside class="layout-aside" :class="{ 'mobile-hidden': isMobile && !sidebarVisible }">
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            router
            :collapse="false"
          >
            <el-menu-item index="/customer/orders">
              <el-icon><List /></el-icon>
              <span>订单列表</span>
            </el-menu-item>
            <el-menu-item index="/customer/orders/create">
              <el-icon><Plus /></el-icon>
              <span>创建订单</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <!-- 主内容区域 -->
        <el-main class="layout-main">
          <div class="main-content">
            <!-- 移动端菜单按钮 -->
            <div v-if="isMobile" class="mobile-menu-btn">
              <el-button
                type="primary"
                :icon="Menu"
                circle
                @click="toggleSidebar"
              />
            </div>
            
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile && sidebarVisible"
      class="mobile-overlay"
      @click="closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  User,
  ArrowDown,
  SwitchButton,
  List,
  Plus,
  Menu
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式状态
const isMobile = ref(false)
const sidebarVisible = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)

// 检查是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    sidebarVisible.value = false
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

// 关闭侧边栏
const closeSidebar = () => {
  sidebarVisible.value = false
}

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // TODO: 打开个人信息对话框
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await userStore.logout()
        router.push('/login')
      } catch (error) {
        // 用户取消操作
      }
      break
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
.customer-layout {
  height: 100vh;
  
  .el-container {
    height: 100%;
  }
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .header-left {
    .system-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }
  
  .header-right {
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #606266;
      font-size: 14px;
      
      &:hover {
        color: #409eff;
      }
    }
  }
}

.layout-aside {
  width: 200px !important;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
    
    &:not(.mobile-hidden) {
      transform: translateX(0);
    }
  }
  
  .sidebar-menu {
    border: none;
    
    .el-menu-item {
      height: 48px;
      line-height: 48px;
      
      &:hover {
        background-color: #ecf5ff;
        color: #409eff;
      }
      
      &.is-active {
        background-color: #409eff;
        color: #fff;
        
        &::before {
          display: none;
        }
      }
    }
  }
}

.layout-main {
  padding: 0;
  background: #f5f7fa;
  
  .main-content {
    height: 100%;
    padding: 20px;
    position: relative;
    
    @media (max-width: 768px) {
      padding: 16px;
    }
  }
}

.mobile-menu-btn {
  position: fixed;
  top: 70px;
  left: 20px;
  z-index: 999;
  
  @media (min-width: 769px) {
    display: none;
  }
}

.mobile-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>
