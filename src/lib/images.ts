/** Longest side of uploaded photos in pixels; plenty for receipts and service photos */
export const MAX_PHOTO_DIMENSION = 1920
export const PHOTO_QUALITY = 0.8

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image could not be decoded'))
    img.src = src
  })
}

/**
 * Downscale a photo and re-encode it as JPEG (data URL) so uploads stay small.
 * Phone photos shrink from several MB to a few hundred KB, and formats like HEIC
 * become viewable in every browser. Falls back to the original file when the
 * browser can't decode or re-encode it.
 */
export async function compressImage(file: File, maxDimension = MAX_PHOTO_DIMENSION, quality = PHOTO_QUALITY): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const { naturalWidth: width, naturalHeight: height } = img
    if (!width || !height) throw new Error('Image has no size')

    const scale = Math.min(1, maxDimension / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not available')
    // JPEG has no transparency; avoid black backgrounds for transparent PNGs
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (!dataUrl.startsWith('data:image/jpeg')) throw new Error('JPEG export not supported')
    return dataUrl
  } catch {
    return readAsDataUrl(file)
  } finally {
    URL.revokeObjectURL(url)
  }
}
