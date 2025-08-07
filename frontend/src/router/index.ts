import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/customer',
    name: 'Customer',
    component: () => import('@/views/customer/CustomerLayout.vue'),
    meta: { title: '客服端', requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/customer/orders'
      },
      {
        path: 'orders',
        name: 'CustomerOrders',
        component: () => import('@/views/customer/OrderListView.vue'),
        meta: { title: '订单列表' }
      },
      {
        path: 'orders/create',
        name: 'CreateOrder',
        component: () => import('@/views/customer/CreateOrderView.vue'),
        meta: { title: '创建订单' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/customer/OrderDetailView.vue'),
        meta: { title: '订单详情' }
      }
    ]
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/OrderManageView.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/admin/CategoryManageView.vue'),
        meta: { title: '类目配置' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/admin/UserManageView.vue'),
        meta: { title: '用户管理' }
      }
    ]
  },
  {
    path: '/collaboration/:token',
    name: 'Collaboration',
    component: () => import('@/views/collaboration/CollaborationView.vue'),
    meta: { title: '协同编辑' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 客户资料收集系统` : '客户资料收集系统'
  
  // 检查认证状态
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // 检查管理员权限
  if (to.meta.requiresAdmin) {
    const userRole = localStorage.getItem('userRole')
    if (userRole !== 'admin') {
      next('/customer')
      return
    }
  }
  
  next()
})

export default router
