import { createClient } from '@supabase/supabase-js'
import winston from 'winston'
import path from 'path'

// 創建 logger 實例
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // 寫入所有日誌到 combined.log
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log') 
    }),
    // 寫入錯誤日誌到 error.log
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// 在開發環境下同時輸出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export const logError = (error: Error, context?: any) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context
  })
}

export const logInfo = (message: string, data?: any) => {
  logger.info({
    message,
    data
  })
}

export const logTransaction = (action: string, data: any) => {
  logger.info({
    type: 'transaction',
    action,
    data,
    timestamp: new Date().toISOString()
  })
}

export { logger } 