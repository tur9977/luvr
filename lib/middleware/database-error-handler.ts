import { NextApiRequest, NextApiResponse } from 'next'
import { DatabaseValidationError } from '../utils/database-validation'
import { logger } from '../utils/logger'

interface DatabaseError extends Error {
  code?: string
}

export function databaseErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      const dbError = error as DatabaseError
      logger.error('Database operation failed', { error: dbError })

      if (error instanceof DatabaseValidationError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        })
      }

      // 處理數據庫連接錯誤
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database Connection Error',
          message: 'Unable to connect to the database'
        })
      }

      // 處理重複鍵錯誤
      if (dbError.code === '23505') {
        return res.status(409).json({
          error: 'Duplicate Entry',
          message: 'A record with this data already exists'
        })
      }

      // 處理外鍵約束錯誤
      if (dbError.code === '23503') {
        return res.status(400).json({
          error: 'Reference Error',
          message: 'Referenced record does not exist'
        })
      }

      // 默認錯誤響應
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      })
    }
  }
} 