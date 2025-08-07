import { Router } from 'express'

const router = Router()

// 获取资料分类
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route - categories list endpoint',
    data: []
  })
})

// 创建分类
router.post('/categories', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route - create category endpoint',
    data: null
  })
})

// 更新分类
router.put('/categories/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route - update category endpoint',
    data: null
  })
})

// 删除分类
router.delete('/categories/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route - delete category endpoint',
    data: null
  })
})

export default router
