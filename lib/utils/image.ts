export async function processImageForAvatar(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 創建 canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // 設置畫布大小為正方形
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      // 計算裁剪位置，使圖片居中
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      // 繪製圓形裁剪區域
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // 繪製圖片
      ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
      ctx.restore();

      // 轉換為 Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'));
            return;
          }

          // 創建新的 File 對象
          const processedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(processedFile);
        },
        'image/jpeg',
        0.9 // 質量設置為 90%
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
} 