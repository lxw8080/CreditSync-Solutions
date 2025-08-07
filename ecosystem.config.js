module.exports = {
  apps: [
    {
      name: 'creditsync-backend',
      script: './backend/dist/app.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'materials_db',
        DB_USER: 'postgres',
        DB_PASSWORD: 'your_password',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        JWT_SECRET: 'your_jwt_secret_key_here',
        JWT_EXPIRES_IN: '24h',
        FRONTEND_URL: 'http://localhost',
        MAX_FILE_SIZE: 104857600,
        UPLOAD_DIR: 'uploads',
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 进程管理
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      watch: false,
      
      // 内存和CPU限制
      max_memory_restart: '1G',
      
      // 健康检查
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // 集群配置
      instance_var: 'INSTANCE_ID',
      
      // 环境变量
      source_map_support: true,
      
      // 监控
      monitoring: false
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/creditsync-solutions.git',
      path: '/var/www/creditsync',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/creditsync-solutions.git',
      path: '/var/www/creditsync-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
}
