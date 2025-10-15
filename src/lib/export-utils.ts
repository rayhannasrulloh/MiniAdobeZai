export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'avif' | 'bmp' | 'tiff'
  quality: number
  width?: number
  height?: number
  maintainAspectRatio: boolean
  fileName: string
  preset: 'original' | 'web' | 'print' | 'social' | 'custom'
  metadata: boolean
  progressive: boolean
}

export interface FormatInfo {
  name: string
  description: string
  extension: string
  supportsTransparency: boolean
  supportsQuality: boolean
  maxSize: string
  mimeType: string
}

export const formatInfo: Record<string, FormatInfo> = {
  png: {
    name: 'PNG',
    description: 'Lossless compression, supports transparency',
    extension: '.png',
    supportsTransparency: true,
    supportsQuality: false,
    maxSize: 'Unlimited',
    mimeType: 'image/png'
  },
  jpeg: {
    name: 'JPEG',
    description: 'Lossy compression, smaller file sizes',
    extension: '.jpg',
    supportsTransparency: false,
    supportsQuality: true,
    maxSize: '65,535 × 65,535',
    mimeType: 'image/jpeg'
  },
  webp: {
    name: 'WebP',
    description: 'Modern format with excellent compression',
    extension: '.webp',
    supportsTransparency: true,
    supportsQuality: true,
    maxSize: '16,383 × 16,383',
    mimeType: 'image/webp'
  },
  avif: {
    name: 'AVIF',
    description: 'Next-gen format with best compression',
    extension: '.avif',
    supportsTransparency: true,
    supportsQuality: true,
    maxSize: '65,536 × 65,536',
    mimeType: 'image/avif'
  },
  bmp: {
    name: 'BMP',
    description: 'Uncompressed bitmap format',
    extension: '.bmp',
    supportsTransparency: false,
    supportsQuality: false,
    maxSize: '32,767 × 32,767',
    mimeType: 'image/bmp'
  },
  tiff: {
    name: 'TIFF',
    description: 'High-quality format for printing',
    extension: '.tiff',
    supportsTransparency: true,
    supportsQuality: false,
    maxSize: 'Unlimited',
    mimeType: 'image/tiff'
  }
}

export const presets = {
  original: {
    name: 'Original Size',
    description: 'Keep original dimensions',
    width: 0,
    height: 0,
    quality: 100
  },
  web: {
    name: 'Web Optimized',
    description: 'Optimized for web use',
    width: 1920,
    height: 1080,
    quality: 85
  },
  print: {
    name: 'Print Quality',
    description: 'High resolution for printing',
    width: 3000,
    height: 3000,
    quality: 95
  },
  social: {
    name: 'Social Media',
    description: 'Optimized for social platforms',
    width: 1080,
    height: 1080,
    quality: 90
  },
  custom: {
    name: 'Custom',
    description: 'Custom settings',
    width: 0,
    height: 0,
    quality: 100
  }
}

export class ImageExporter {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  async exportImage(
    imageData: string,
    options: ExportOptions,
    originalWidth: number,
    originalHeight: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Calculate dimensions
          let { width, height } = options
          
          if (!width || !height) {
            width = originalWidth
            height = originalHeight
          }

          if (options.maintainAspectRatio && (width !== originalWidth || height !== originalHeight)) {
            const aspectRatio = originalWidth / originalHeight
            if (width && !height) {
              height = Math.round(width / aspectRatio)
            } else if (height && !width) {
              width = Math.round(height * aspectRatio)
            }
          }

          // Set canvas dimensions
          this.canvas.width = width
          this.canvas.height = height

          // Clear canvas
          this.ctx.clearRect(0, 0, width, height)

          // Draw image
          this.ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob
          const mimeType = formatInfo[options.format].mimeType
          const quality = options.format === 'png' ? undefined : options.quality / 100

          this.canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create blob'))
              }
            },
            mimeType,
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageData
    })
  }

  async downloadImage(
    imageData: string,
    options: ExportOptions,
    originalWidth: number,
    originalHeight: number
  ): Promise<void> {
    try {
      const blob = await this.exportImage(imageData, options, originalWidth, originalHeight)
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${options.fileName}${formatInfo[options.format].extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(`Failed to download image: ${error}`)
    }
  }

  async getImageInfo(
    imageData: string
  ): Promise<{ width: number; height: number; size: number; format: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Calculate approximate file size for different formats
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          const formats = ['png', 'jpeg', 'webp']
          const sizes: Record<string, number> = {}

          Promise.all(
            formats.map(format => 
              new Promise<number>((resolveFormat) => {
                canvas.toBlob(
                  (blob) => {
                    resolveFormat(blob ? blob.size : 0)
                  },
                  `image/${format}`,
                  format === 'png' ? undefined : 0.9
                )
              })
            )
          ).then((sizesArray) => {
            formats.forEach((format, index) => {
              sizes[format] = sizesArray[index]
            })

            resolve({
              width: img.width,
              height: img.height,
              size: sizes.png || 0,
              format: 'png'
            })
          })
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageData
    })
  }

  async previewExport(
    imageData: string,
    options: ExportOptions,
    originalWidth: number,
    originalHeight: number,
    previewSize: number = 200
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Calculate preview dimensions
          let { width, height } = options
          
          if (!width || !height) {
            width = originalWidth
            height = originalHeight
          }

          if (options.maintainAspectRatio) {
            const aspectRatio = width / height
            if (width > height) {
              width = previewSize
              height = Math.round(previewSize / aspectRatio)
            } else {
              height = previewSize
              width = Math.round(previewSize * aspectRatio)
            }
          } else {
            width = Math.min(width, previewSize)
            height = Math.min(height, previewSize)
          }

          // Create preview canvas
          const previewCanvas = document.createElement('canvas')
          const previewCtx = previewCanvas.getContext('2d')!
          previewCanvas.width = width
          previewCanvas.height = height

          // Draw preview
          previewCtx.drawImage(img, 0, 0, width, height)

          // Convert to data URL
          const mimeType = formatInfo[options.format].mimeType
          const quality = options.format === 'png' ? undefined : options.quality / 100

          resolve(previewCanvas.toDataURL(mimeType, quality))
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageData
    })
  }

  calculateFileSize(
    width: number,
    height: number,
    format: string,
    quality: number = 90
  ): string {
    // Rough estimation of file size
    const pixels = width * height
    let baseSize = 0

    switch (format) {
      case 'png':
        baseSize = pixels * 4 // 4 bytes per pixel (RGBA)
        break
      case 'jpeg':
        baseSize = pixels * 3 * (quality / 100) // 3 bytes per pixel (RGB) with compression
        break
      case 'webp':
        baseSize = pixels * 3 * (quality / 100) * 0.8 // WebP is generally more efficient
        break
      case 'avif':
        baseSize = pixels * 3 * (quality / 100) * 0.5 // AVIF is very efficient
        break
      default:
        baseSize = pixels * 3
    }

    const sizeInBytes = Math.round(baseSize)
    const sizeInKB = sizeInBytes / 1024
    const sizeInMB = sizeInKB / 1024

    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(1)} MB`
    } else {
      return `${sizeInKB.toFixed(0)} KB`
    }
  }

  validateDimensions(width: number, height: number, format: string): boolean {
    const info = formatInfo[format]
    if (!info) return false

    const [maxWidth, maxHeight] = info.maxSize.split(' × ').map(s => parseInt(s.replace(',', '')))
    
    if (maxWidth && maxHeight) {
      return width <= maxWidth && height <= maxHeight
    }

    return true
  }
}

export const imageExporter = new ImageExporter()

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getRecommendedFormat(hasTransparency: boolean, fileSize: number): string {
  if (hasTransparency) {
    return fileSize > 1024 * 1024 ? 'webp' : 'png' // Use WebP for large images with transparency
  }
  return 'webp' // WebP is generally the best choice for images without transparency
}

export function getOptimalQuality(format: string, fileSize: number): number {
  switch (format) {
    case 'jpeg':
      return fileSize > 2 * 1024 * 1024 ? 80 : 90 // Lower quality for large JPEGs
    case 'webp':
      return fileSize > 2 * 1024 * 1024 ? 85 : 95
    case 'avif':
      return fileSize > 2 * 1024 * 1024 ? 80 : 90
    default:
      return 90
  }
}