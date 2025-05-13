import winston from 'winston'
import path from 'path'

// 配置 winston logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error'
    })
  ]
})

// 在開發環境下同時輸出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export function errorHandler(error: Error, req: Request, res: Response) {
  // 記錄錯誤
  logger.error({
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })

  // 返回錯誤響應
  return new Response(
    JSON.stringify({ error: 'Internal Server Error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
} 