import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const MAX_DURATION = 60 // 最大時長（秒）
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 最大文件大小（50MB）
const TARGET_BITRATE = '2M' // 目標比特率
const TARGET_RESOLUTION = '1280x720' // 目標分辨率（720p）

export async function processVideo(file: File): Promise<File> {
  // 檢查文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超過限制: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
  }

  // 創建 FFmpeg 實例
  const ffmpeg = new FFmpeg()
  
  // 加載 FFmpeg
  await ffmpeg.load({
    coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
  })

  // 寫入文件
  await ffmpeg.writeFile('input.mp4', await fetchFile(file))

  // 獲取視頻信息
  const info = await ffmpeg.ffprobe(['input.mp4'])
  const duration = info.format?.duration || 0
  
  // 檢查視頻時長
  if (duration > MAX_DURATION) {
    throw new Error(`視頻時長超過限制: ${Math.round(duration)}秒`)
  }

  // 壓縮視頻
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-b:v', TARGET_BITRATE,
    '-maxrate', TARGET_BITRATE,
    '-bufsize', TARGET_BITRATE,
    '-vf', `scale=${TARGET_RESOLUTION}`,
    '-c:a', 'aac',
    '-b:a', '128k',
    'output.mp4'
  ])

  // 讀取處理後的文件
  const data = await ffmpeg.readFile('output.mp4')
  const blob = new Blob([data], { type: 'video/mp4' })

  // 創建新的 File 對象
  return new File([blob], file.name, {
    type: 'video/mp4',
    lastModified: Date.now(),
  })
} 