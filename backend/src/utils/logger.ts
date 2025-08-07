import winston from 'winston'
import path from 'path'

const logLevel = process.env.LOG_LEVEL || 'info'
const logFile = process.env.LOG_FILE || 'logs/app.log'

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// 控制台输出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
  })
)

// 创建 logger 实例
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'creditsync-backend' },
  transports: [
    // 文件输出
    new winston.transports.File({
      filename: path.join(process.cwd(), logFile),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 错误日志单独文件
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs/error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
})

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }))
}

export default logger
