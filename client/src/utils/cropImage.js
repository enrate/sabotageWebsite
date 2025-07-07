// Возвращает dataURL (base64) обрезанного изображения с компрессией
export default function getCroppedImg(imageSrc, crop, quality = 0.7, maxSize = 512) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Вычисляем размеры с учетом максимального размера
      let { width, height } = crop;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Улучшаем качество рендеринга
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        width,
        height
      );
      
      // Конвертируем в base64 с компрессией
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = reject;
  });
} 