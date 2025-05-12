const express = require('express')
const winston = require('winston')
const { createLogger, format, transports } = winston
const path = require('path')
const { logger } = require('./lib/utils/logger')

// 創建 Express 應用
const app = express()

// 配置 Winston 日誌
const winstonLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'luvr-api' },
  transports: [
    // 錯誤日誌
    new transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日誌
    new transports.File({ 
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
})

// 在開發環境中輸出到控制台
if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }))
}

// 請求日誌中間件
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    winstonLogger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    })
  })
  next()
})

// 錯誤處理中間件
app.use((err, req, res, next) => {
  winstonLogger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    status: err.status || 500
  })

  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message
    }
  })
})

// 啟動服務器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  winstonLogger.info(`Server is running on port ${PORT}`)
})

// 優雅關閉
process.on('SIGTERM', () => {
  winstonLogger.info('SIGTERM received. Shutting down gracefully')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  winstonLogger.error('Uncaught Exception', { error })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  winstonLogger.error('Unhandled Rejection', { reason, promise })
  process.exit(1)
}) 