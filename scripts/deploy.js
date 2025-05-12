const { execSync } = require('child_process')
const path = require('path')
require('dotenv').config()

async function deploy() {
  try {
    // 1. 執行備份
    console.log('Creating backup...')
    execSync('node scripts/backup.js', { stdio: 'inherit' })

    // 2. 執行數據庫遷移
    console.log('Running database migrations...')
    execSync('node scripts/migrate.js', { stdio: 'inherit' })

    // 3. 構建應用
    console.log('Building application...')
    execSync('npm run build', { stdio: 'inherit' })

    // 4. 提交到 Git
    console.log('Committing changes to Git...')
    const timestamp = new Date().toISOString()
    execSync('git add .', { stdio: 'inherit' })
    execSync(`git commit -m "Deploy: ${timestamp}"`, { stdio: 'inherit' })
    execSync('git push', { stdio: 'inherit' })

    console.log('Deployment completed successfully!')
  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
}

deploy() 