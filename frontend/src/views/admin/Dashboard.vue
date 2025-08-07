<template>
  <div class="dashboard-container">
    <h3>仪表盘</h3>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">0</div>
            <div class="stat-label">总订单数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">0</div>
            <div class="stat-label">进行中订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">0</div>
            <div class="stat-label">已完成订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">0</div>
            <div class="stat-label">用户数量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>功能开发中</span>
      </template>
      <p>仪表盘功能正在开发中，敬请期待...</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 仪表盘组件
</script>

<style scoped>
.dashboard-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}
</style>
