export interface ImageFilter {
  name: string
  apply: (imageData: ImageData, kernelSize?: number) => ImageData
}

export interface FrequencyDomainFilter {
  name: string
  apply: (imageData: ImageData, cutoff?: number, order?: number) => ImageData
}

export interface Complex {
  real: number
  imag: number
}

export interface Point {
  x: number
  y: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export class ImageProcessor {
  static applyGrayscale(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      data[i] = gray     // Red
      data[i + 1] = gray // Green
      data[i + 2] = gray // Blue
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applySepia(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applyInvert(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]         // Red
      data[i + 1] = 255 - data[i + 1] // Green
      data[i + 2] = 255 - data[i + 2] // Blue
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applyBrightness(imageData: ImageData, value: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const adjustment = value * 255 / 100
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + adjustment))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment))
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applyContrast(imageData: ImageData, value: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const factor = (259 * (value + 255)) / (255 * (259 - value))
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128))
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128))
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128))
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applySaturation(imageData: ImageData, value: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const saturation = value / 100
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      data[i] = Math.max(0, Math.min(255, gray + saturation * (r - gray)))
      data[i + 1] = Math.max(0, Math.min(255, gray + saturation * (g - gray)))
      data[i + 2] = Math.max(0, Math.min(255, gray + saturation * (b - gray)))
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applyHighlights(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data
    const output = new Uint8ClampedArray(data)
    
    // Highlights adjustment - affects brighter areas more
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      
      // Create highlights mask (brighter areas are affected more)
      const highlightsMask = Math.pow(luminance / 255, 2)
      
      // Apply highlights adjustment
      const adjustment = amount * highlightsMask
      
      output[i] = Math.max(0, Math.min(255, r + adjustment))
      output[i + 1] = Math.max(0, Math.min(255, g + adjustment))
      output[i + 2] = Math.max(0, Math.min(255, b + adjustment))
    }
    
    return new ImageData(output, imageData.width, imageData.height)
  }

  static applyShadows(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data
    const output = new Uint8ClampedArray(data)
    
    // Shadows adjustment - affects darker areas more
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      
      // Create shadows mask (darker areas are affected more)
      const shadowsMask = Math.pow(1 - (luminance / 255), 2)
      
      // Apply shadows adjustment
      const adjustment = amount * shadowsMask
      
      output[i] = Math.max(0, Math.min(255, r + adjustment))
      output[i + 1] = Math.max(0, Math.min(255, g + adjustment))
      output[i + 2] = Math.max(0, Math.min(255, b + adjustment))
    }
    
    return new ImageData(output, imageData.width, imageData.height)
  }

  static applyVignette(imageData: ImageData, intensity: number, size: number, feather: number): ImageData {
    const data = imageData.data
    const output = new Uint8ClampedArray(data)
    const width = imageData.width
    const height = imageData.height
    const centerX = width / 2
    const centerY = height / 2
    
    // Calculate maximum distance from center
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
    const vignetteRadius = (size / 100) * maxDistance
    const featherRadius = (feather / 100) * maxDistance
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        
        // Calculate distance from center
        const dx = x - centerX
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Calculate vignette factor
        let vignetteFactor = 1
        
        if (distance > vignetteRadius - featherRadius) {
          // In the feather zone
          const featherStart = vignetteRadius - featherRadius
          const featherProgress = (distance - featherStart) / featherRadius
          vignetteFactor = 1 - (featherProgress * Math.abs(intensity) / 100)
        } else if (distance > vignetteRadius) {
          // Outside the vignette radius
          vignetteFactor = 1 - (Math.abs(intensity) / 100)
        }
        
        // Apply vignette
        if (intensity < 0) {
          // Dark vignette
          output[idx] = data[idx] * vignetteFactor
          output[idx + 1] = data[idx + 1] * vignetteFactor
          output[idx + 2] = data[idx + 2] * vignetteFactor
        } else {
          // Light vignette
          const lightVignetteFactor = 1 + ((1 - vignetteFactor) * intensity / 100)
          output[idx] = Math.min(255, data[idx] * lightVignetteFactor)
          output[idx + 1] = Math.min(255, data[idx + 1] * lightVignetteFactor)
          output[idx + 2] = Math.min(255, data[idx + 2] * lightVignetteFactor)
        }
        
        output[idx + 3] = data[idx + 3] // Keep alpha unchanged
      }
    }
    
    return new ImageData(output, width, height)
  }

  static applyToneCurve(imageData: ImageData, highlights: number, shadows: number): ImageData {
    const data = imageData.data
    const output = new Uint8ClampedArray(data)
    
    // Create tone curve points
    const shadowsPoint = 64 + shadows
    const midPoint = 128
    const highlightsPoint = 192 + highlights
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Apply tone curve to each channel
      output[i] = this.applyToneCurveChannel(r, shadowsPoint, midPoint, highlightsPoint)
      output[i + 1] = this.applyToneCurveChannel(g, shadowsPoint, midPoint, highlightsPoint)
      output[i + 2] = this.applyToneCurveChannel(b, shadowsPoint, midPoint, highlightsPoint)
    }
    
    return new ImageData(output, imageData.width, imageData.height)
  }

  private static applyToneCurveChannel(value: number, shadowsPoint: number, midPoint: number, highlightsPoint: number): number {
    if (value <= 64) {
      // Shadows region
      return Math.round((value / 64) * shadowsPoint)
    } else if (value <= 192) {
      // Midtones region
      const midProgress = (value - 64) / 128
      const midValue = shadowsPoint + (midPoint - shadowsPoint) * midProgress
      return Math.round(midValue)
    } else {
      // Highlights region
      const highlightProgress = (value - 192) / 63
      const highlightValue = midPoint + (highlightsPoint - midPoint) * highlightProgress
      return Math.round(highlightValue)
    }
  }

  static applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
    if (radius <= 0) return imageData
    
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)
    const kernel = this.generateGaussianKernel(radius)
    
    // Apply horizontal blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0
        
        for (let i = -radius; i <= radius; i++) {
          const xi = Math.max(0, Math.min(width - 1, x + i))
          const idx = (y * width + xi) * 4
          const weight = kernel[i + radius]
          
          r += imageData.data[idx] * weight
          g += imageData.data[idx + 1] * weight
          b += imageData.data[idx + 2] * weight
          a += imageData.data[idx + 3] * weight
        }
        
        const idx = (y * width + x) * 4
        output[idx] = r
        output[idx + 1] = g
        output[idx + 2] = b
        output[idx + 3] = a
      }
    }
    
    // Apply vertical blur
    const tempData = new ImageData(output, width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0
        
        for (let i = -radius; i <= radius; i++) {
          const yi = Math.max(0, Math.min(height - 1, y + i))
          const idx = (yi * width + x) * 4
          const weight = kernel[i + radius]
          
          r += tempData.data[idx] * weight
          g += tempData.data[idx + 1] * weight
          b += tempData.data[idx + 2] * weight
          a += tempData.data[idx + 3] * weight
        }
        
        const idx = (y * width + x) * 4
        output[idx] = r
        output[idx + 1] = g
        output[idx + 2] = b
        output[idx + 3] = a
      }
    }
    
    return new ImageData(output, width, height)
  }

  static applySharpen(imageData: ImageData, amount: number): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)
    
    const kernel = [
      0, -1 * amount, 0,
      -1 * amount, 1 + 4 * amount, -1 * amount,
      0, -1 * amount, 0
    ]
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const weight = kernel[(ky + 1) * 3 + (kx + 1)]
            
            r += imageData.data[idx] * weight
            g += imageData.data[idx + 1] * weight
            b += imageData.data[idx + 2] * weight
          }
        }
        
        const idx = (y * width + x) * 4
        output[idx] = Math.max(0, Math.min(255, r))
        output[idx + 1] = Math.max(0, Math.min(255, g))
        output[idx + 2] = Math.max(0, Math.min(255, b))
      }
    }
    
    return new ImageData(output, width, height)
  }

  static applyEdgeDetection(imageData: ImageData): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)
    
    // Sobel operators
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let pixelX = 0
        let pixelY = 0
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const gray = imageData.data[idx] * 0.299 + imageData.data[idx + 1] * 0.587 + imageData.data[idx + 2] * 0.114
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            
            pixelX += gray * sobelX[kernelIdx]
            pixelY += gray * sobelY[kernelIdx]
          }
        }
        
        const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY)
        const idx = (y * width + x) * 4
        output[idx] = magnitude
        output[idx + 1] = magnitude
        output[idx + 2] = magnitude
      }
    }
    
    return new ImageData(output, width, height)
  }

  private static generateGaussianKernel(radius: number): number[] {
    const size = radius * 2 + 1
    const kernel = new Array(size)
    let sum = 0
    
    for (let i = 0; i < size; i++) {
      const x = i - radius
      kernel[i] = Math.exp(-(x * x) / (2 * radius * radius))
      sum += kernel[i]
    }
    
    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum
    }
    
    return kernel
  }

  static cropImage(imageData: ImageData, cropArea: Rectangle): ImageData {
    const { x, y, width, height } = cropArea
    console.log(`cropImage: x=${x}, y=${y}, w=${width}, h=${height}, imageW=${imageData.width}, imageH=${imageData.height}`)
    
    // Round coordinates to integers and ensure they're within bounds
    const startX = Math.max(0, Math.floor(x))
    const startY = Math.max(0, Math.floor(y))
    const endX = Math.min(imageData.width, Math.floor(x + width))
    const endY = Math.min(imageData.height, Math.floor(y + height))
    
    const actualWidth = endX - startX
    const actualHeight = endY - startY
    
    console.log(`Actual crop: startX=${startX}, startY=${startY}, actualW=${actualWidth}, actualH=${actualHeight}`)
    
    if (actualWidth <= 0 || actualHeight <= 0) {
      console.error('Invalid crop dimensions after bounds checking')
      return new ImageData(1, 1)
    }
    
    const croppedData = new Uint8ClampedArray(actualWidth * actualHeight * 4)
    
    for (let row = 0; row < actualHeight; row++) {
      for (let col = 0; col < actualWidth; col++) {
        const sourceIdx = ((startY + row) * imageData.width + (startX + col)) * 4
        const targetIdx = (row * actualWidth + col) * 4
        
        // Ensure source index is within bounds
        if (sourceIdx + 3 < imageData.data.length) {
          croppedData[targetIdx] = imageData.data[sourceIdx]
          croppedData[targetIdx + 1] = imageData.data[sourceIdx + 1]
          croppedData[targetIdx + 2] = imageData.data[sourceIdx + 2]
          croppedData[targetIdx + 3] = imageData.data[sourceIdx + 3]
        } else {
          // Fill with transparent pixels if out of bounds
          croppedData[targetIdx] = 0
          croppedData[targetIdx + 1] = 0
          croppedData[targetIdx + 2] = 0
          croppedData[targetIdx + 3] = 0
        }
      }
    }
    
    return new ImageData(croppedData, actualWidth, actualHeight)
  }

  static resizeImage(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const resizedData = new Uint8ClampedArray(newWidth * newHeight * 4)
    const scaleX = imageData.width / newWidth
    const scaleY = imageData.height / newHeight
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const sourceX = Math.floor(x * scaleX)
        const sourceY = Math.floor(y * scaleY)
        const sourceIdx = (sourceY * imageData.width + sourceX) * 4
        const targetIdx = (y * newWidth + x) * 4
        
        resizedData[targetIdx] = imageData.data[sourceIdx]
        resizedData[targetIdx + 1] = imageData.data[sourceIdx + 1]
        resizedData[targetIdx + 2] = imageData.data[sourceIdx + 2]
        resizedData[targetIdx + 3] = imageData.data[sourceIdx + 3]
      }
    }
    
    return new ImageData(resizedData, newWidth, newHeight)
  }

  static rotateImage(imageData: ImageData, angle: number): ImageData {
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    
    const newWidth = Math.abs(imageData.width * cos) + Math.abs(imageData.height * sin)
    const newHeight = Math.abs(imageData.width * sin) + Math.abs(imageData.height * cos)
    
    const rotatedData = new Uint8ClampedArray(Math.floor(newWidth) * Math.floor(newHeight) * 4)
    
    const centerX = imageData.width / 2
    const centerY = imageData.height / 2
    const newCenterX = newWidth / 2
    const newCenterY = newHeight / 2
    
    for (let y = 0; y < Math.floor(newHeight); y++) {
      for (let x = 0; x < Math.floor(newWidth); x++) {
        const sourceX = Math.floor((x - newCenterX) * cos + (y - newCenterY) * sin + centerX)
        const sourceY = Math.floor(-(x - newCenterX) * sin + (y - newCenterY) * cos + centerY)
        
        if (sourceX >= 0 && sourceX < imageData.width && sourceY >= 0 && sourceY < imageData.height) {
          const sourceIdx = (sourceY * imageData.width + sourceX) * 4
          const targetIdx = (y * Math.floor(newWidth) + x) * 4
          
          rotatedData[targetIdx] = imageData.data[sourceIdx]
          rotatedData[targetIdx + 1] = imageData.data[sourceIdx + 1]
          rotatedData[targetIdx + 2] = imageData.data[sourceIdx + 2]
          rotatedData[targetIdx + 3] = imageData.data[sourceIdx + 3]
        }
      }
    }
    
    return new ImageData(rotatedData, Math.floor(newWidth), Math.floor(newHeight))
  }

  static flipImageHorizontal(imageData: ImageData): ImageData {
    const width = imageData.width
    const height = imageData.height
    const flippedData = new Uint8ClampedArray(imageData.data)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width / 2; x++) {
        const leftIdx = (y * width + x) * 4
        const rightIdx = (y * width + (width - 1 - x)) * 4
        
        // Swap pixels
        for (let i = 0; i < 4; i++) {
          const temp = flippedData[leftIdx + i]
          flippedData[leftIdx + i] = flippedData[rightIdx + i]
          flippedData[rightIdx + i] = temp
        }
      }
    }
    
    return new ImageData(flippedData, width, height)
  }

  static flipImageVertical(imageData: ImageData): ImageData {
    const width = imageData.width
    const height = imageData.height
    const flippedData = new Uint8ClampedArray(imageData.data)
    
    for (let y = 0; y < height / 2; y++) {
      for (let x = 0; x < width; x++) {
        const topIdx = (y * width + x) * 4
        const bottomIdx = ((height - 1 - y) * width + x) * 4
        
        // Swap pixels
        for (let i = 0; i < 4; i++) {
          const temp = flippedData[topIdx + i]
          flippedData[topIdx + i] = flippedData[bottomIdx + i]
          flippedData[bottomIdx + i] = temp
        }
      }
    }
    
    return new ImageData(flippedData, width, height)
  }

  // New methods for better canvas manipulation
  static rotateCanvas(canvas: HTMLCanvasElement, angle: number): void {
    console.log(`rotateCanvas called with angle: ${angle}`)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('No canvas context in rotateCanvas')
      return
    }
    
    console.log(`Canvas size before rotation: ${canvas.width}x${canvas.height}`)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    console.log(`Image data size: ${imageData.width}x${imageData.height}`)
    
    const rotatedData = this.rotateImage(imageData, angle)
    console.log(`Rotated data size: ${rotatedData.width}x${rotatedData.height}`)
    
    canvas.width = rotatedData.width
    canvas.height = rotatedData.height
    ctx.putImageData(rotatedData, 0, 0)
    console.log(`Canvas size after rotation: ${canvas.width}x${canvas.height}`)
  }

  static flipCanvasHorizontal(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const flippedData = this.flipImageHorizontal(imageData)
    ctx.putImageData(flippedData, 0, 0)
  }

  static flipCanvasVertical(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const flippedData = this.flipImageVertical(imageData)
    ctx.putImageData(flippedData, 0, 0)
  }

  // Morphological Operations
  static erode(imageData: ImageData, kernelSize: number = 3): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)
    const halfKernel = Math.floor(kernelSize / 2)
    
    // Create a binary image from grayscale
    const binary = new Uint8ClampedArray(width * height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114
      binary[i / 4] = gray > 128 ? 1 : 0
    }
    
    // Apply erosion
    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let shouldErode = false
        
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const idx = (y + ky) * width + (x + kx)
            if (binary[idx] === 0) {
              shouldErode = true
              break
            }
          }
          if (shouldErode) break
        }
        
        const outputIdx = (y * width + x) * 4
        if (shouldErode) {
          output[outputIdx] = 0
          output[outputIdx + 1] = 0
          output[outputIdx + 2] = 0
          output[outputIdx + 3] = 255
        } else {
          output[outputIdx] = 255
          output[outputIdx + 1] = 255
          output[outputIdx + 2] = 255
          output[outputIdx + 3] = 255
        }
      }
    }
    
    return new ImageData(output, width, height)
  }

  static dilate(imageData: ImageData, kernelSize: number = 3): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)
    const halfKernel = Math.floor(kernelSize / 2)
    
    // Create a binary image from grayscale
    const binary = new Uint8ClampedArray(width * height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114
      binary[i / 4] = gray > 128 ? 1 : 0
    }
    
    // Apply dilation
    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let shouldDilate = false
        
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const idx = (y + ky) * width + (x + kx)
            if (binary[idx] === 1) {
              shouldDilate = true
              break
            }
          }
          if (shouldDilate) break
        }
        
        const outputIdx = (y * width + x) * 4
        if (shouldDilate) {
          output[outputIdx] = 255
          output[outputIdx + 1] = 255
          output[outputIdx + 2] = 255
          output[outputIdx + 3] = 255
        } else {
          output[outputIdx] = 0
          output[outputIdx + 1] = 0
          output[outputIdx + 2] = 0
          output[outputIdx + 3] = 255
        }
      }
    }
    
    return new ImageData(output, width, height)
  }

  static opening(imageData: ImageData, kernelSize: number = 3): ImageData {
    // Opening = Erosion followed by Dilation
    const eroded = this.erode(imageData, kernelSize)
    const opened = this.dilate(eroded, kernelSize)
    return opened
  }

  static closing(imageData: ImageData, kernelSize: number = 3): ImageData {
    // Closing = Dilation followed by Erosion
    const dilated = this.dilate(imageData, kernelSize)
    const closed = this.erode(dilated, kernelSize)
    return closed
  }

  static morphologicalGradient(imageData: ImageData, kernelSize: number = 3): ImageData {
    // Gradient = Dilation - Erosion
    const dilated = this.dilate(imageData, kernelSize)
    const eroded = this.erode(imageData, kernelSize)
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(width * height * 4)
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      output[i] = dilated.data[i] - eroded.data[i]
      output[i + 1] = dilated.data[i + 1] - eroded.data[i + 1]
      output[i + 2] = dilated.data[i + 2] - eroded.data[i + 2]
      output[i + 3] = 255
    }
    
    return new ImageData(output, width, height)
  }

  static topHat(imageData: ImageData, kernelSize: number = 3): ImageData {
    // Top Hat = Original - Opening
    const opened = this.opening(imageData, kernelSize)
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(width * height * 4)
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      output[i] = Math.max(0, imageData.data[i] - opened.data[i])
      output[i + 1] = Math.max(0, imageData.data[i + 1] - opened.data[i + 1])
      output[i + 2] = Math.max(0, imageData.data[i + 2] - opened.data[i + 2])
      output[i + 3] = 255
    }
    
    return new ImageData(output, width, height)
  }

  static blackHat(imageData: ImageData, kernelSize: number = 3): ImageData {
    // Black Hat = Closing - Original
    const closed = this.closing(imageData, kernelSize)
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(width * height * 4)
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      output[i] = Math.max(0, closed.data[i] - imageData.data[i])
      output[i + 1] = Math.max(0, closed.data[i + 1] - imageData.data[i + 1])
      output[i + 2] = Math.max(0, closed.data[i + 2] - imageData.data[i + 2])
      output[i + 3] = 255
    }
    
    return new ImageData(output, width, height)
  }

  static adaptiveThreshold(imageData: ImageData, blockSize: number = 15, C: number = 2): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(width * height * 4)
    const halfBlock = Math.floor(blockSize / 2)
    
    // Convert to grayscale first
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      gray[i / 4] = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114
    }
    
    // Apply adaptive threshold
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0
        let count = 0
        
        // Calculate local threshold
        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            sum += gray[ny * width + nx]
            count++
          }
        }
        
        const threshold = (sum / count) - C
        const idx = (y * width + x) * 4
        const pixelValue = gray[y * width + x]
        
        if (pixelValue > threshold) {
          output[idx] = 255
          output[idx + 1] = 255
          output[idx + 2] = 255
        } else {
          output[idx] = 0
          output[idx + 1] = 0
          output[idx + 2] = 0
        }
        output[idx + 3] = 255
      }
    }
    
    return new ImageData(output, width, height)
  }

  static connectedComponents(imageData: ImageData): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(width * height * 4)
    const labels = new Int32Array(width * height)
    let currentLabel = 1
    
    // Convert to binary
    const binary = new Uint8ClampedArray(width * height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114
      binary[i / 4] = gray > 128 ? 1 : 0
    }
    
    // First pass: label components
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (binary[y * width + x] === 1 && labels[y * width + x] === 0) {
          // Flood fill
          const stack = [[x, y]]
          const componentColor = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
          }
          
          while (stack.length > 0) {
            const [cx, cy] = stack.pop()!
            const idx = cy * width + cx
            
            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue
            if (binary[idx] === 0 || labels[idx] !== 0) continue
            
            labels[idx] = currentLabel
            const outputIdx = idx * 4
            output[outputIdx] = componentColor.r
            output[outputIdx + 1] = componentColor.g
            output[outputIdx + 2] = componentColor.b
            output[outputIdx + 3] = 255
            
            // Add neighbors
            stack.push([cx + 1, cy])
            stack.push([cx - 1, cy])
            stack.push([cx, cy + 1])
            stack.push([cx, cy - 1])
          }
          
          currentLabel++
        }
      }
    }
    
    return new ImageData(output, width, height)
  }

  static watershed(imageData: ImageData): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(width * height * 4)
    
    // Convert to grayscale
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      gray[i / 4] = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114
    }
    
    // Simple watershed: find local minima and grow regions
    const labels = new Int32Array(width * height)
    let currentLabel = 1
    
    // Find local minima
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        const value = gray[idx]
        let isMinima = true
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue
            const nIdx = (y + dy) * width + (x + dx)
            if (gray[nIdx] <= value) {
              isMinima = false
              break
            }
          }
          if (!isMinima) break
        }
        
        if (isMinima && labels[idx] === 0) {
          const componentColor = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
          }
          
          // Grow region from minima
          const stack = [[x, y, value]]
          
          while (stack.length > 0) {
            const [cx, cy, threshold] = stack.shift()!
            
            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue
            const cIdx = cy * width + cx
            if (labels[cIdx] !== 0) continue
            
            if (gray[cIdx] <= threshold + 10) { // Allow some tolerance
              labels[cIdx] = currentLabel
              const outputIdx = cIdx * 4
              output[outputIdx] = componentColor.r
              output[outputIdx + 1] = componentColor.g
              output[outputIdx + 2] = componentColor.b
              output[outputIdx + 3] = 255
              
              // Add neighbors
              stack.push([cx + 1, cy, gray[cIdx]])
              stack.push([cx - 1, cy, gray[cIdx]])
              stack.push([cx, cy + 1, gray[cIdx]])
              stack.push([cx, cy - 1, gray[cIdx]])
            }
          }
          
          currentLabel++
        }
      }
    }
    
    return new ImageData(output, width, height)
  }

  // Image Enhancement Techniques
  static applyGammaCorrection(imageData: ImageData, gamma: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const gammaCorrection = 1 / gamma
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, 255 * Math.pow(data[i] / 255, gammaCorrection)))
      data[i + 1] = Math.max(0, Math.min(255, 255 * Math.pow(data[i + 1] / 255, gammaCorrection)))
      data[i + 2] = Math.max(0, Math.min(255, 255 * Math.pow(data[i + 2] / 255, gammaCorrection)))
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applyGlobalThreshold(imageData: ImageData, threshold: number = 128): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const binary = gray > threshold ? 255 : 0
      data[i] = binary
      data[i + 1] = binary
      data[i + 2] = binary
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  static applyAdaptiveThreshold(imageData: ImageData, blockSize: number = 15, C: number = 2): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = new Uint8ClampedArray(imageData.data)
    const output = new Uint8ClampedArray(imageData.data)
    
    // Convert to grayscale first
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }
    
    const halfBlock = Math.floor(blockSize / 2)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0
        let count = 0
        
        // Calculate local threshold
        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            sum += gray[ny * width + nx]
            count++
          }
        }
        
        const localThreshold = (sum / count) - C
        const idx = (y * width + x) * 4
        const pixelValue = gray[y * width + x]
        const binary = pixelValue > localThreshold ? 255 : 0
        
        output[idx] = binary
        output[idx + 1] = binary
        output[idx + 2] = binary
        output[idx + 3] = 255
      }
    }
    
    return new ImageData(output, width, height)
  }

  static applySmoothing(imageData: ImageData, type: 'mean' | 'gaussian' | 'median' = 'mean', kernelSize: number = 3): ImageData {
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)
    const halfKernel = Math.floor(kernelSize / 2)
    
    if (type === 'mean') {
      // Mean filter
      for (let y = halfKernel; y < height - halfKernel; y++) {
        for (let x = halfKernel; x < width - halfKernel; x++) {
          let r = 0, g = 0, b = 0, a = 0
          let count = 0
          
          for (let ky = -halfKernel; ky <= halfKernel; ky++) {
            for (let kx = -halfKernel; kx <= halfKernel; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4
              r += imageData.data[idx]
              g += imageData.data[idx + 1]
              b += imageData.data[idx + 2]
              a += imageData.data[idx + 3]
              count++
            }
          }
          
          const idx = (y * width + x) * 4
          output[idx] = r / count
          output[idx + 1] = g / count
          output[idx + 2] = b / count
          output[idx + 3] = a / count
        }
      }
    } else if (type === 'gaussian') {
      // Gaussian smoothing (similar to blur but with specific kernel size)
      return this.applyGaussianBlur(imageData, halfKernel)
    } else if (type === 'median') {
      // Median filter
      for (let y = halfKernel; y < height - halfKernel; y++) {
        for (let x = halfKernel; x < width - halfKernel; x++) {
          const rValues = [], gValues = [], bValues = [], aValues = []
          
          for (let ky = -halfKernel; ky <= halfKernel; ky++) {
            for (let kx = -halfKernel; kx <= halfKernel; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4
              rValues.push(imageData.data[idx])
              gValues.push(imageData.data[idx + 1])
              bValues.push(imageData.data[idx + 2])
              aValues.push(imageData.data[idx + 3])
            }
          }
          
          // Sort and get median
          rValues.sort((a, b) => a - b)
          gValues.sort((a, b) => a - b)
          bValues.sort((a, b) => a - b)
          aValues.sort((a, b) => a - b)
          
          const medianIdx = Math.floor(rValues.length / 2)
          const idx = (y * width + x) * 4
          output[idx] = rValues[medianIdx]
          output[idx + 1] = gValues[medianIdx]
          output[idx + 2] = bValues[medianIdx]
          output[idx + 3] = aValues[medianIdx]
        }
      }
    }
    
    return new ImageData(output, width, height)
  }

  static cropCanvas(canvas: HTMLCanvasElement, cropArea: Rectangle): void {
    console.log('cropCanvas called with:', cropArea)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('No canvas context in cropCanvas')
      return
    }
    
    console.log(`Canvas size before crop: ${canvas.width}x${canvas.height}`)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    console.log(`Image data size: ${imageData.width}x${imageData.height}`)
    console.log(`Crop area: x=${cropArea.x}, y=${cropArea.y}, w=${cropArea.width}, h=${cropArea.height}`)
    
    // Validate crop area is within image bounds
    if (cropArea.x < 0 || cropArea.y < 0 || 
        cropArea.x + cropArea.width > imageData.width || 
        cropArea.y + cropArea.height > imageData.height) {
      console.error('Crop area is outside image bounds!')
      return
    }
    
    const croppedData = this.cropImage(imageData, cropArea)
    console.log(`Cropped data size: ${croppedData.width}x${croppedData.height}`)
    
    // Check if cropped data has valid pixels
    let hasNonZeroPixels = false
    for (let i = 0; i < Math.min(100, croppedData.data.length); i += 4) {
      if (croppedData.data[i] !== 0 || croppedData.data[i+1] !== 0 || croppedData.data[i+2] !== 0) {
        hasNonZeroPixels = true
        break
      }
    }
    console.log(`Cropped data has non-zero pixels: ${hasNonZeroPixels}`)
    
    canvas.width = croppedData.width
    canvas.height = croppedData.height
    ctx.putImageData(croppedData, 0, 0)
    console.log(`Canvas size after crop: ${canvas.width}x${canvas.height}`)
  }

  // Export functions for different formats
  static exportAsPNG(canvas: HTMLCanvasElement, filename?: string): void {
    const link = document.createElement('a')
    link.download = filename || 'image.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  static exportAsJPEG(canvas: HTMLCanvasElement, quality: number = 0.9, filename?: string): void {
    const link = document.createElement('a')
    link.download = filename || 'image.jpg'
    link.href = canvas.toDataURL('image/jpeg', quality)
    link.click()
  }

  static exportAsBMP(canvas: HTMLCanvasElement, filename?: string): void {
    // BMP is not natively supported by toDataURL, so we need to convert it
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)
    if (!imageData) return
    
    const bmpData = this.convertToBMP(imageData)
    const blob = new Blob([bmpData], { type: 'image/bmp' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = filename || 'image.bmp'
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
  }

  private static convertToBMP(imageData: ImageData): ArrayBuffer {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    
    // BMP file header (14 bytes)
    const fileHeaderSize = 14
    const infoHeaderSize = 40
    const bytesPerPixel = 3 // RGB
    const rowSize = Math.ceil((bytesPerPixel * width) / 4) * 4 // Must be multiple of 4
    const pixelDataSize = rowSize * height
    const fileSize = fileHeaderSize + infoHeaderSize + pixelDataSize
    
    const buffer = new ArrayBuffer(fileSize)
    const view = new DataView(buffer)
    
    // File header
    view.setUint16(0, 0x4D42, false) // 'BM'
    view.setUint32(2, fileSize, true)
    view.setUint32(6, 0, true) // Reserved
    view.setUint32(10, fileHeaderSize + infoHeaderSize, true) // Pixel data offset
    
    // Info header
    view.setUint32(14, infoHeaderSize, true)
    view.setInt32(18, width, true)
    view.setInt32(22, height, true)
    view.setUint16(26, 1, true) // Planes
    view.setUint16(28, bytesPerPixel * 8, true) // Bits per pixel
    view.setUint32(30, 0, true) // Compression (0 = none)
    view.setUint32(34, pixelDataSize, true)
    view.setInt32(38, 2835, true) // Horizontal resolution (pixels/meter)
    view.setInt32(42, 2835, true) // Vertical resolution (pixels/meter)
    view.setUint32(46, 0, true) // Colors in palette
    view.setUint32(50, 0, true) // Important colors
    
    // Pixel data (BMP stores pixels bottom-to-top, BGR format)
    let offset = fileHeaderSize + infoHeaderSize
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        view.setUint8(offset++, data[i + 2]) // B
        view.setUint8(offset++, data[i + 1]) // G
        view.setUint8(offset++, data[i])     // R
      }
      // Pad row to multiple of 4 bytes
      const padding = rowSize - (width * bytesPerPixel)
      for (let p = 0; p < padding; p++) {
        view.setUint8(offset++, 0)
      }
    }
    
    return buffer
  }

  static exportWithFormat(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' | 'bmp', quality?: number, filename?: string): void {
    switch (format) {
      case 'png':
        this.exportAsPNG(canvas, filename)
        break
      case 'jpeg':
        this.exportAsJPEG(canvas, quality || 0.9, filename)
        break
      case 'bmp':
        this.exportAsBMP(canvas, filename)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  // Quick rotation functions
  static rotate90Clockwise(canvas: HTMLCanvasElement): void {
    this.rotateCanvas(canvas, 90)
  }

  static rotate90CounterClockwise(canvas: HTMLCanvasElement): void {
    this.rotateCanvas(canvas, -90)
  }

  static rotate180(canvas: HTMLCanvasElement): void {
    this.rotateCanvas(canvas, 180)
  }

  static flipHorizontal(canvas: HTMLCanvasElement): void {
    this.flipCanvasHorizontal(canvas)
  }

  static flipVertical(canvas: HTMLCanvasElement): void {
    this.flipCanvasVertical(canvas)
  }

  // ===== FREQUENCY DOMAIN OPERATIONS =====

  /**
   * Convert ImageData to 2D array of grayscale values
   */
  static imageToMatrix(imageData: ImageData): number[][] {
    const width = imageData.width
    const height = imageData.height
    const matrix: number[][] = []
    
    for (let y = 0; y < height; y++) {
      matrix[y] = []
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        // Convert to grayscale using luminance formula
        const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114
        matrix[y][x] = gray
      }
    }
    
    return matrix
  }

  /**
   * Convert 2D matrix back to ImageData
   */
  static matrixToImage(matrix: number[][], originalImageData: ImageData): ImageData {
    const height = matrix.length
    const width = matrix[0].length
    const data = new Uint8ClampedArray(width * height * 4)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const value = Math.max(0, Math.min(255, matrix[y][x]))
        data[i] = value     // Red
        data[i + 1] = value // Green
        data[i + 2] = value // Blue
        data[i + 3] = 255   // Alpha
      }
    }
    
    return new ImageData(data, width, height)
  }

  /**
   * 1D Discrete Fourier Transform (DFT)
   */
  static dft1d(signal: number[]): Complex[] {
    const N = signal.length
    const result: Complex[] = []
    
    for (let k = 0; k < N; k++) {
      let real = 0
      let imag = 0
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N
        real += signal[n] * Math.cos(angle)
        imag += signal[n] * Math.sin(angle)
      }
      
      result.push({ real, imag })
    }
    
    return result
  }

  /**
   * 1D Inverse Discrete Fourier Transform
   */
  static idft1d(spectrum: Complex[]): number[] {
    const N = spectrum.length
    const result: number[] = []
    
    for (let n = 0; n < N; n++) {
      let real = 0
      
      for (let k = 0; k < N; k++) {
        const angle = 2 * Math.PI * k * n / N
        real += spectrum[k].real * Math.cos(angle) - spectrum[k].imag * Math.sin(angle)
      }
      
      result.push(real / N)
    }
    
    return result
  }

  /**
   * 2D Discrete Fourier Transform using row-column approach
   */
  static fft2d(matrix: number[][]): Complex[][] {
    const height = matrix.length
    const width = matrix[0].length
    
    // Apply 1D DFT to each row
    const rowTransformed: Complex[][] = []
    for (let y = 0; y < height; y++) {
      rowTransformed[y] = this.dft1d(matrix[y])
    }
    
    // Apply 1D DFT to each column of the row-transformed matrix
    const result: Complex[][] = []
    for (let x = 0; x < width; x++) {
      const column: number[] = []
      for (let y = 0; y < height; y++) {
        column.push(rowTransformed[y][x].real)
      }
      const columnTransformed = this.dft1d(column)
      
      for (let y = 0; y < height; y++) {
        if (!result[y]) result[y] = []
        result[y][x] = columnTransformed[y]
      }
    }
    
    return result
  }

  /**
   * 2D Inverse Discrete Fourier Transform
   */
  static ifft2d(spectrum: Complex[][]): number[][] {
    const height = spectrum.length
    const width = spectrum[0].length
    
    // Apply 1D IDFT to each row
    const rowTransformed: number[][] = []
    for (let y = 0; y < height; y++) {
      rowTransformed[y] = this.idft1d(spectrum[y])
    }
    
    // Apply 1D IDFT to each column
    const result: number[][] = []
    for (let x = 0; x < width; x++) {
      const column: Complex[] = []
      for (let y = 0; y < height; y++) {
        column.push({ real: rowTransformed[y][x], imag: 0 })
      }
      const columnTransformed = this.idft1d(column)
      
      for (let y = 0; y < height; y++) {
        if (!result[y]) result[y] = []
        result[y][x] = columnTransformed[y]
      }
    }
    
    return result
  }

  /**
   * Get magnitude spectrum from complex spectrum
   */
  static getMagnitudeSpectrum(spectrum: Complex[][]): number[][] {
    const height = spectrum.length
    const width = spectrum[0].length
    const magnitude: number[][] = []
    
    for (let y = 0; y < height; y++) {
      magnitude[y] = []
      for (let x = 0; x < width; x++) {
        const real = spectrum[y][x].real
        const imag = spectrum[y][x].imag
        magnitude[y][x] = Math.sqrt(real * real + imag * imag)
      }
    }
    
    return magnitude
  }

  /**
   * Apply log transformation to magnitude spectrum for visualization
   */
  static logTransform(magnitude: number[][]): number[][] {
    const height = magnitude.length
    const width = magnitude[0].length
    const result: number[][] = []
    
    // Find maximum value for normalization
    let maxVal = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        maxVal = Math.max(maxVal, magnitude[y][x])
      }
    }
    
    for (let y = 0; y < height; y++) {
      result[y] = []
      for (let x = 0; x < width; x++) {
        // Add 1 to avoid log(0) and normalize
        const logVal = Math.log(1 + magnitude[y][x])
        const normalized = (logVal / Math.log(1 + maxVal)) * 255
        result[y][x] = normalized
      }
    }
    
    return result
  }

  /**
   * Create ideal low-pass filter mask
   */
  static createIdealLowPassFilter(width: number, height: number, cutoff: number): number[][] {
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const filter: number[][] = []
    
    for (let y = 0; y < height; y++) {
      filter[y] = []
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        filter[y][x] = distance <= cutoff ? 1 : 0
      }
    }
    
    return filter
  }

  /**
   * Create ideal high-pass filter mask
   */
  static createIdealHighPassFilter(width: number, height: number, cutoff: number): number[][] {
    const filter = this.createIdealLowPassFilter(width, height, cutoff)
    
    // Invert the low-pass filter
    for (let y = 0; y < filter.length; y++) {
      for (let x = 0; x < filter[0].length; x++) {
        filter[y][x] = filter[y][x] === 0 ? 1 : 0
      }
    }
    
    return filter
  }

  /**
   * Create Gaussian low-pass filter mask
   */
  static createGaussianLowPassFilter(width: number, height: number, cutoff: number): number[][] {
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const filter: number[][] = []
    const sigma = cutoff / 3 // Standard deviation
    
    for (let y = 0; y < height; y++) {
      filter[y] = []
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        filter[y][x] = Math.exp(-(distance * distance) / (2 * sigma * sigma))
      }
    }
    
    return filter
  }

  /**
   * Create Gaussian high-pass filter mask
   */
  static createGaussianHighPassFilter(width: number, height: number, cutoff: number): number[][] {
    const lowPass = this.createGaussianLowPassFilter(width, height, cutoff)
    const filter: number[][] = []
    
    for (let y = 0; y < lowPass.length; y++) {
      filter[y] = []
      for (let x = 0; x < lowPass[0].length; x++) {
        filter[y][x] = 1 - lowPass[y][x]
      }
    }
    
    return filter
  }

  /**
   * Create Butterworth low-pass filter mask
   */
  static createButterworthLowPassFilter(width: number, height: number, cutoff: number, order: number = 2): number[][] {
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const filter: number[][] = []
    
    for (let y = 0; y < height; y++) {
      filter[y] = []
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const denominator = 1 + Math.pow(distance / cutoff, 2 * order)
        filter[y][x] = 1 / denominator
      }
    }
    
    return filter
  }

  /**
   * Create Butterworth high-pass filter mask
   */
  static createButterworthHighPassFilter(width: number, height: number, cutoff: number, order: number = 2): number[][] {
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const filter: number[][] = []
    
    for (let y = 0; y < height; y++) {
      filter[y] = []
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const denominator = 1 + Math.pow(cutoff / distance, 2 * order)
        filter[y][x] = distance === 0 ? 0 : 1 / denominator
      }
    }
    
    return filter
  }

  /**
   * Apply frequency domain filter to image
   */
  static applyFrequencyFilter(imageData: ImageData, filterMask: number[][]): ImageData {
    // Convert image to matrix
    const matrix = this.imageToMatrix(imageData)
    
    // Apply 2D FFT
    const spectrum = this.fft2d(matrix)
    
    // Apply filter mask
    const filteredSpectrum: Complex[][] = []
    for (let y = 0; y < spectrum.length; y++) {
      filteredSpectrum[y] = []
      for (let x = 0; x < spectrum[0].length; x++) {
        filteredSpectrum[y][x] = {
          real: spectrum[y][x].real * filterMask[y][x],
          imag: spectrum[y][x].imag * filterMask[y][x]
        }
      }
    }
    
    // Apply inverse FFT
    const filteredMatrix = this.ifft2d(filteredSpectrum)
    
    // Convert back to ImageData
    return this.matrixToImage(filteredMatrix, imageData)
  }

  /**
   * Get frequency spectrum visualization
   */
  static getFrequencySpectrum(imageData: ImageData): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const spectrum = this.fft2d(matrix)
    const magnitude = this.getMagnitudeSpectrum(spectrum)
    
    // Shift the zero frequency to the center
    const shifted = this.shiftSpectrum(magnitude)
    const logTransformed = this.logTransform(shifted)
    
    return this.matrixToImage(logTransformed, imageData)
  }

  /**
   * Shift zero frequency to center for visualization
   */
  static shiftSpectrum(spectrum: number[][]): number[][] {
    const height = spectrum.length
    const width = spectrum[0].length
    const shifted: number[][] = []
    
    const halfHeight = Math.floor(height / 2)
    const halfWidth = Math.floor(width / 2)
    
    for (let y = 0; y < height; y++) {
      shifted[y] = []
      for (let x = 0; x < width; x++) {
        const sourceY = (y + halfHeight) % height
        const sourceX = (x + halfWidth) % width
        shifted[y][x] = spectrum[sourceY][sourceX]
      }
    }
    
    return shifted
  }

  /**
   * Ideal Low-Pass Filter
   */
  static applyIdealLowPass(imageData: ImageData, cutoff: number): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const filter = this.createIdealLowPassFilter(matrix[0].length, matrix.length, cutoff)
    return this.applyFrequencyFilter(imageData, filter)
  }

  /**
   * Ideal High-Pass Filter
   */
  static applyIdealHighPass(imageData: ImageData, cutoff: number): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const filter = this.createIdealHighPassFilter(matrix[0].length, matrix.length, cutoff)
    return this.applyFrequencyFilter(imageData, filter)
  }

  /**
   * Gaussian Low-Pass Filter
   */
  static applyGaussianLowPass(imageData: ImageData, cutoff: number): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const filter = this.createGaussianLowPassFilter(matrix[0].length, matrix.length, cutoff)
    return this.applyFrequencyFilter(imageData, filter)
  }

  /**
   * Gaussian High-Pass Filter
   */
  static applyGaussianHighPass(imageData: ImageData, cutoff: number): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const filter = this.createGaussianHighPassFilter(matrix[0].length, matrix.length, cutoff)
    return this.applyFrequencyFilter(imageData, filter)
  }

  /**
   * Butterworth Low-Pass Filter
   */
  static applyButterworthLowPass(imageData: ImageData, cutoff: number, order: number = 2): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const filter = this.createButterworthLowPassFilter(matrix[0].length, matrix.length, cutoff, order)
    return this.applyFrequencyFilter(imageData, filter)
  }

  /**
   * Butterworth High-Pass Filter
   */
  static applyButterworthHighPass(imageData: ImageData, cutoff: number, order: number = 2): ImageData {
    const matrix = this.imageToMatrix(imageData)
    const filter = this.createButterworthHighPassFilter(matrix[0].length, matrix.length, cutoff, order)
    return this.applyFrequencyFilter(imageData, filter)
  }

  /**
   * Homomorphic Filter for illumination correction
   */
  static applyHomomorphicFilter(imageData: ImageData, gammaH: number = 1.5, gammaL: number = 0.5, c: number = 1, cutoff: number = 30): ImageData {
    const matrix = this.imageToMatrix(imageData)
    
    // Log transform
    const logMatrix: number[][] = []
    for (let y = 0; y < matrix.length; y++) {
      logMatrix[y] = []
      for (let x = 0; x < matrix[0].length; x++) {
        logMatrix[y][x] = Math.log(1 + matrix[y][x])
      }
    }
    
    // FFT
    const spectrum = this.fft2d(logMatrix)
    
    // Create homomorphic filter
    const filter = this.createHomomorphicFilter(matrix[0].length, matrix.length, gammaH, gammaL, c, cutoff)
    
    // Apply filter
    const filteredSpectrum: Complex[][] = []
    for (let y = 0; y < spectrum.length; y++) {
      filteredSpectrum[y] = []
      for (let x = 0; x < spectrum[0].length; x++) {
        filteredSpectrum[y][x] = {
          real: spectrum[y][x].real * filter[y][x],
          imag: spectrum[y][x].imag * filter[y][x]
        }
      }
    }
    
    // IFFT
    const filteredMatrix = this.ifft2d(filteredSpectrum)
    
    // Exponential transform
    const result: number[][] = []
    for (let y = 0; y < filteredMatrix.length; y++) {
      result[y] = []
      for (let x = 0; x < filteredMatrix[0].length; x++) {
        result[y][x] = Math.exp(filteredMatrix[y][x]) - 1
      }
    }
    
    return this.matrixToImage(result, imageData)
  }

  /**
   * Create homomorphic filter mask
   */
  static createHomomorphicFilter(width: number, height: number, gammaH: number, gammaL: number, c: number, cutoff: number): number[][] {
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const filter: number[][] = []
    
    for (let y = 0; y < height; y++) {
      filter[y] = []
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const h = (gammaH - gammaL) * (1 - Math.exp(-c * (distance * distance) / (cutoff * cutoff))) + gammaL
        filter[y][x] = h
      }
    }
    
    return filter
  }

  // Transparency grid methods
  static drawTransparencyGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number = 10): void {
    const lighterColor = '#f0f0f0'
    const darkerColor = '#d0d0d0'
    
    // Create the checkerboard pattern
    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        const isLight = ((Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2) === 0
        ctx.fillStyle = isLight ? lighterColor : darkerColor
        ctx.fillRect(x, y, gridSize, gridSize)
      }
    }
  }

  static createTransparencyCanvas(width: number, height: number, gridSize: number = 10): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      this.drawTransparencyGrid(ctx, width, height, gridSize)
    }
    return canvas
  }

  static renderWithTransparency(ctx: CanvasRenderingContext2D, imageData: ImageData, x: number = 0, y: number = 0): void {
    // Draw transparency grid first
    this.drawTransparencyGrid(ctx, ctx.canvas.width, ctx.canvas.height)
    
    // Draw the image data on top
    ctx.putImageData(imageData, x, y)
  }
}

export const ENHANCEMENT_FILTERS = [
  {
    name: 'Gamma Correction',
    apply: (imageData) => ImageProcessor.applyGammaCorrection(imageData, 1.5)
  },
  {
    name: 'Global Threshold',
    apply: (imageData) => ImageProcessor.applyGlobalThreshold(imageData, 128)
  },
  {
    name: 'Mean Smoothing',
    apply: (imageData) => ImageProcessor.applySmoothing(imageData, 'mean', 3)
  },
  {
    name: 'Gaussian Smoothing',
    apply: (imageData) => ImageProcessor.applySmoothing(imageData, 'gaussian', 3)
  },
  {
    name: 'Median Smoothing',
    apply: (imageData) => ImageProcessor.applySmoothing(imageData, 'median', 3)
  }
]

export const MORPHOLOGICAL_FILTERS = [
  {
    name: 'Erosion',
    apply: (imageData, kernelSize = 3) => ImageProcessor.erode(imageData, kernelSize)
  },
  {
    name: 'Dilation',
    apply: (imageData, kernelSize = 3) => ImageProcessor.dilate(imageData, kernelSize)
  },
  {
    name: 'Opening',
    apply: (imageData, kernelSize = 3) => ImageProcessor.opening(imageData, kernelSize)
  },
  {
    name: 'Closing',
    apply: (imageData, kernelSize = 3) => ImageProcessor.closing(imageData, kernelSize)
  },
  {
    name: 'Morphological Gradient',
    apply: (imageData, kernelSize = 3) => ImageProcessor.morphologicalGradient(imageData, kernelSize)
  },
  {
    name: 'Top Hat',
    apply: (imageData, kernelSize = 3) => ImageProcessor.topHat(imageData, kernelSize)
  },
  {
    name: 'Black Hat',
    apply: (imageData, kernelSize = 3) => ImageProcessor.blackHat(imageData, kernelSize)
  }
]

export const SEGMENTATION_FILTERS = [
  {
    name: 'Adaptive Threshold',
    apply: (imageData) => ImageProcessor.adaptiveThreshold(imageData, 15, 2)
  },
  {
    name: 'Connected Components',
    apply: ImageProcessor.connectedComponents
  },
  {
    name: 'Watershed',
    apply: ImageProcessor.watershed
  }
]

export const FREQUENCY_DOMAIN_FILTERS = [
  {
    name: 'Frequency Spectrum',
    apply: (imageData) => ImageProcessor.getFrequencySpectrum(imageData)
  },
  {
    name: 'Ideal Low-Pass',
    apply: (imageData) => ImageProcessor.applyIdealLowPass(imageData, 30)
  },
  {
    name: 'Ideal High-Pass',
    apply: (imageData) => ImageProcessor.applyIdealHighPass(imageData, 30)
  },
  {
    name: 'Gaussian Low-Pass',
    apply: (imageData) => ImageProcessor.applyGaussianLowPass(imageData, 30)
  },
  {
    name: 'Gaussian High-Pass',
    apply: (imageData) => ImageProcessor.applyGaussianHighPass(imageData, 30)
  },
  {
    name: 'Butterworth Low-Pass',
    apply: (imageData) => ImageProcessor.applyButterworthLowPass(imageData, 30, 2)
  },
  {
    name: 'Butterworth High-Pass',
    apply: (imageData) => ImageProcessor.applyButterworthHighPass(imageData, 30, 2)
  },
  {
    name: 'Homomorphic Filter',
    apply: (imageData) => ImageProcessor.applyHomomorphicFilter(imageData, 1.5, 0.5, 1, 30)
  }
]

export const FILTERS: ImageFilter[] = [
  {
    name: 'Grayscale',
    apply: ImageProcessor.applyGrayscale
  },
  {
    name: 'Sepia',
    apply: ImageProcessor.applySepia
  },
  {
    name: 'Invert',
    apply: ImageProcessor.applyInvert
  },
  ...ENHANCEMENT_FILTERS,
  ...MORPHOLOGICAL_FILTERS,
  ...SEGMENTATION_FILTERS,
  ...FREQUENCY_DOMAIN_FILTERS
]