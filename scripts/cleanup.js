require('dotenv').config()
const mongoose = require('mongoose')
const { logger } = require('../lib/utils/logger')
const { connectDB, disconnectDB } = require('../lib/config/database')

// 定義模型
const User = require('../lib/models/User')
const Post = require('../lib/models/Post')
const Event = require('../lib/models/Event')

async function cleanupDatabase() {
  try {
    // 連接數據庫
    await connectDB()
    logger.info('Starting database cleanup')

    // 清理無效的用戶引用
    const cleanupResults = {
      posts: { total: 0, cleaned: 0 },
      events: { total: 0, cleaned: 0 }
    }

    // 清理帖子
    const posts = await Post.find()
    cleanupResults.posts.total = posts.length

    for (const post of posts) {
      try {
        const user = await User.findById(post.user_id)
        if (!user) {
          await Post.findByIdAndDelete(post._id)
          cleanupResults.posts.cleaned++
          logger.info(`Deleted orphaned post: ${post._id}`)
        }
      } catch (error) {
        logger.error(`Error processing post ${post._id}`, { error })
      }
    }

    // 清理事件
    const events = await Event.find()
    cleanupResults.events.total = events.length

    for (const event of events) {
      try {
        const creator = await User.findById(event.creator_id)
        if (!creator) {
          await Event.findByIdAndDelete(event._id)
          cleanupResults.events.cleaned++
          logger.info(`Deleted orphaned event: ${event._id}`)
        }
      } catch (error) {
        logger.error(`Error processing event ${event._id}`, { error })
      }
    }

    // 輸出清理結果
    logger.info('Cleanup completed', cleanupResults)

    // 斷開數據庫連接
    await disconnectDB()
    logger.info('Database connection closed')

  } catch (error) {
    logger.error('Cleanup failed', { error })
    process.exit(1)
  }
}

// 執行清理
cleanupDatabase() 