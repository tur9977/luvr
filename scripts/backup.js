const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function backup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(__dirname, '..', 'backups', timestamp)

    // 創建備份目錄
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 備份數據
    const tables = ['posts', 'events', 'event_participants']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')

      if (error) throw error

      fs.writeFileSync(
        path.join(backupDir, `${table}.json`),
        JSON.stringify(data, null, 2)
      )
    }

    console.log(`Backup completed successfully in ${backupDir}`)

    // 自動 git add/commit/push
    try {
      execSync('git add .', { stdio: 'inherit' })
      execSync(`git commit -m "Backup: ${timestamp}"`, { stdio: 'inherit' })
      execSync('git push', { stdio: 'inherit' })
      console.log('Backup pushed to Git successfully!')
    } catch (err) {
      console.error('Git push failed:', err)
    }
  } catch (error) {
    console.error('Backup failed:', error)
    process.exit(1)
  }
}

backup() 