type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogMessage {
  level: LogLevel
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

class Logger {
  private static instance: Logger
  private logs: LogMessage[] = []

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const logMessage = this.formatMessage(level, message, metadata)
    this.logs.push(logMessage)
    
    // 在開發環境中輸出到控制台
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${logMessage.timestamp}] ${message}`, metadata || '')
    }
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata)
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata)
  }

  getLogs(): LogMessage[] {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }
}

export const logger = Logger.getInstance() 