import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// In-memory storage for demo (replace with database in production)
const shares = new Map<string, ShareData>()
const analytics = new Map<string, AnalyticsData>()
const rateLimits = new Map<string, RateLimitData>()

interface ShareOptions {
  type: 'public' | 'unlisted' | 'private'
  expiration: '1h' | '24h' | '7d' | '30d' | 'never'
  allowDownload: boolean
  watermark: boolean
  quality: 'high' | 'medium' | 'low'
  password?: string
  maxViews?: number
  title?: string
  description?: string
}

interface ShareData {
  id: string
  token: string
  imageId: string
  imageUrl: string
  thumbnailUrl: string
  options: ShareOptions
  createdAt: Date
  expiresAt: Date | null
  viewCount: number
  downloadCount: number
  userId?: string
  metadata: {
    originalName: string
    size: number
    format: string
    width: number
    height: number
  }
}

interface AnalyticsData {
  shareId: string
  views: ViewEntry[]
  downloads: DownloadEntry[]
  referrers: Map<string, number>
  countries: Map<string, number>
  createdAt: Date
}

interface ViewEntry {
  timestamp: Date
  ipAddress: string
  userAgent: string
  referer?: string
  country?: string
}

interface DownloadEntry {
  timestamp: Date
  ipAddress: string
  userAgent: string
}

interface RateLimitData {
  count: number
  resetTime: number
  lastAccess: number
}

class ShareLinkGenerator {
  generateSecureToken(): string {
    const bytes = crypto.randomBytes(16)
    const timestamp = Date.now().toString(36)
    const checksum = crypto.createHash('md5').update(bytes.toString('hex')).digest('hex').substring(0, 8)
    return `${timestamp}-${bytes.toString('hex')}-${checksum}`
  }

  async generateUniqueToken(): Promise<string> {
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const token = this.generateSecureToken()
      if (!shares.has(token)) {
        return token
      }
      attempts++
    }

    throw new Error('Failed to generate unique token')
  }
}

class SecurityManager {
  static validateImage(buffer: Buffer): { valid: boolean; reason?: string } {
    // Check file size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return { valid: false, reason: 'File too large' }
    }

    // Check image signature
    const signatures = [
      { type: 'jpeg', signature: Buffer.from([0xFF, 0xD8, 0xFF]) },
      { type: 'png', signature: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) },
      { type: 'webp', signature: Buffer.from([0x52, 0x49, 0x46, 0x46]) }
    ]

    const isValidImage = signatures.some(sig => 
      buffer.subarray(0, sig.signature.length).equals(sig.signature)
    )

    if (!isValidImage) {
      return { valid: false, reason: 'Invalid image format' }
    }

    return { valid: true }
  }

  static checkRateLimit(ip: string, action: 'create' | 'view' | 'download'): { allowed: boolean; retryAfter?: number } {
    const key = `${ip}:${action}`
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute
    const limits = {
      create: 5,    // 5 shares per minute
      view: 100,    // 100 views per minute
      download: 10  // 10 downloads per minute
    }

    const current = rateLimits.get(key)

    if (!current || now > current.resetTime) {
      rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs,
        lastAccess: now
      })
      return { allowed: true }
    }

    if (current.count >= limits[action]) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((current.resetTime - now) / 1000) 
      }
    }

    current.count++
    current.lastAccess = now
    return { allowed: true }
  }

  static detectBot(userAgent: string, ip: string): { isBot: boolean; confidence: number } {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ]

    const botScore = botPatterns.reduce((score, pattern) => {
      return pattern.test(userAgent) ? score + 0.3 : score
    }, 0)

    // Additional heuristics
    if (userAgent.length < 10) botScore += 0.2
    if (!userAgent.includes('Mozilla') && !userAgent.includes('WebKit')) botScore += 0.2

    return {
      isBot: botScore > 0.5,
      confidence: Math.min(botScore, 1)
    }
  }
}

class ImageProcessor {
  static async processImage(buffer: Buffer, options: ShareOptions): Promise<{ 
    processed: Buffer; 
    thumbnail: Buffer; 
    metadata: any 
  }> {
    // For demo purposes, we'll just return the original buffer
    // In production, you'd use sharp or jimp for actual processing
    
    const metadata = {
      format: this.getImageFormat(buffer),
      size: buffer.length,
      width: 800, // Placeholder
      height: 600  // Placeholder
    }

    // Create thumbnail (simplified)
    const thumbnail = buffer.subarray(0, Math.min(buffer.length, 50 * 1024))

    return {
      processed: buffer,
      thumbnail,
      metadata
    }
  }

  static getImageFormat(buffer: Buffer): string {
    if (buffer.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) return 'jpeg'
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png'
    if (buffer.subarray(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46]))) return 'webp'
    return 'unknown'
  }

  static addWatermark(buffer: Buffer, text: string = "Shared via Photo Editor"): Buffer {
    // Simplified watermark - in production use image processing library
    return buffer
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const options = JSON.parse(formData.get('options') as string || '{}')

    // Rate limiting
    const ip = request.ip || 'unknown'
    const rateLimit = SecurityManager.checkRateLimit(ip, 'create')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      )
    }

    // Bot detection
    const userAgent = request.headers.get('user-agent') || ''
    const botDetection = SecurityManager.detectBot(userAgent, ip)
    if (botDetection.isBot && botDetection.confidence > 0.8) {
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 403 }
      )
    }

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate image
    const buffer = Buffer.from(await image.arrayBuffer())
    const validation = SecurityManager.validateImage(buffer)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      )
    }

    // Process image
    const processed = await ImageProcessor.processImage(buffer, options)

    // Generate unique token
    const tokenGenerator = new ShareLinkGenerator()
    const token = await tokenGenerator.generateUniqueToken()
    const shareId = crypto.randomUUID()

    // Calculate expiration
    const expirationMap = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'never': null
    }

    const expiresAt = options.expiration !== 'never' 
      ? new Date(Date.now() + expirationMap[options.expiration])
      : null

    // Save files (in production, use cloud storage)
    const uploadsDir = join(process.cwd(), 'public', 'shares')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    const fileName = `${shareId}.${processed.metadata.format}`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, processed.processed)

    const thumbnailName = `${shareId}_thumb.${processed.metadata.format}`
    const thumbnailPath = join(uploadsDir, thumbnailName)
    await writeFile(thumbnailPath, processed.thumbnail)

    // Create share data
    const shareData: ShareData = {
      id: shareId,
      token,
      imageId: shareId,
      imageUrl: `/shares/${fileName}`,
      thumbnailUrl: `/shares/${thumbnailName}`,
      options: {
        type: options.type || 'public',
        expiration: options.expiration || '7d',
        allowDownload: options.allowDownload !== false,
        watermark: options.watermark || false,
        quality: options.quality || 'high',
        password: options.password,
        maxViews: options.maxViews,
        title: options.title,
        description: options.description
      },
      createdAt: new Date(),
      expiresAt,
      viewCount: 0,
      downloadCount: 0,
      metadata: {
        originalName: image.name,
        ...processed.metadata
      }
    }

    // Store share data
    shares.set(token, shareData)
    analytics.set(shareId, {
      shareId,
      views: [],
      downloads: [],
      referrers: new Map(),
      countries: new Map(),
      createdAt: new Date()
    })

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${token}`

    // Generate QR code (simplified)
    const qrCode = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-size="12">QR Code</text>
        <text x="100" y="120" text-anchor="middle" font-size="8">${shareUrl.substring(0, 30)}...</text>
      </svg>
    `).toString('base64')}`

    return NextResponse.json({
      success: true,
      data: {
        shareId,
        shareUrl,
        token,
        expiresAt: expiresAt?.toISOString(),
        qrCode,
        thumbnailUrl: shareData.thumbnailUrl
      },
      analytics: {
        trackId: shareId,
        pixelUrl: `${baseUrl}/api/shares/${token}/track`
      }
    })

  } catch (error) {
    console.error('Share creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}