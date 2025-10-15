import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Import the same storage from create route (in production, use database)
// For now, we'll use a global store
declare global {
  var shares: Map<string, any>
  var analytics: Map<string, any>
  var rateLimits: Map<string, any>
}

if (!global.shares) global.shares = new Map()
if (!global.analytics) global.analytics = new Map()
if (!global.rateLimits) global.rateLimits = new Map()

const shares = global.shares
const analytics = global.analytics
const rateLimits = global.rateLimits

class SecurityManager {
  static checkRateLimit(ip: string, action: 'view' | 'download'): { allowed: boolean; retryAfter?: number } {
    const key = `${ip}:${action}`
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute
    const limits = {
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

    if (userAgent.length < 10) botScore += 0.2
    if (!userAgent.includes('Mozilla') && !userAgent.includes('WebKit')) botScore += 0.2

    return {
      isBot: botScore > 0.5,
      confidence: Math.min(botScore, 1)
    }
  }

  static getCountryFromIP(ip: string): string {
    // Simplified - in production use a proper IP geolocation service
    const countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'IN']
    return countries[Math.floor(Math.random() * countries.length)]
  }
}

class AccessTracker {
  static trackView(shareId: string, request: NextRequest) {
    const ip = request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || undefined
    const country = SecurityManager.getCountryFromIP(ip)

    const shareAnalytics = analytics.get(shareId)
    if (shareAnalytics) {
      shareAnalytics.views.push({
        timestamp: new Date(),
        ipAddress: ip,
        userAgent,
        referer,
        country
      })

      // Track referrers
      if (referer) {
        const domain = new URL(referer).hostname
        shareAnalytics.referrers.set(domain, (shareAnalytics.referrers.get(domain) || 0) + 1)
      }

      // Track countries
      shareAnalytics.countries.set(country, (shareAnalytics.countries.get(country) || 0) + 1)
    }
  }

  static trackDownload(shareId: string, request: NextRequest) {
    const ip = request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    const shareAnalytics = analytics.get(shareId)
    if (shareAnalytics) {
      shareAnalytics.downloads.push({
        timestamp: new Date(),
        ipAddress: ip,
        userAgent
      })
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const ip = request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    // Rate limiting
    const rateLimit = SecurityManager.checkRateLimit(ip, 'view')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      )
    }

    // Bot detection
    const botDetection = SecurityManager.detectBot(userAgent, ip)
    if (botDetection.isBot && botDetection.confidence > 0.8) {
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 403 }
      )
    }

    // Get share data
    const shareData = shares.get(token)
    if (!shareData) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Check expiration
    if (shareData.expiresAt && new Date() > shareData.expiresAt) {
      return NextResponse.json(
        { error: 'Share has expired' },
        { status: 410 }
      )
    }

    // Check view limit
    if (shareData.options.maxViews && shareData.viewCount >= shareData.options.maxViews) {
      return NextResponse.json(
        { error: 'View limit exceeded' },
        { status: 429 }
      )
    }

    // Check password protection
    if (shareData.options.password) {
      const { searchParams } = new URL(request.url)
      const password = searchParams.get('password')
      
      if (password !== shareData.options.password) {
        return NextResponse.json(
          { error: 'Password required or incorrect' },
          { status: 401 }
        )
      }
    }

    // Track view
    AccessTracker.trackView(shareData.id, request)
    shareData.viewCount++

    // Determine which image to serve
    const imageUrl = request.nextUrl.searchParams.get('download') === 'true' 
      ? shareData.imageUrl 
      : shareData.thumbnailUrl

    // Check download permissions
    if (request.nextUrl.searchParams.get('download') === 'true') {
      if (!shareData.options.allowDownload) {
        return NextResponse.json(
          { error: 'Download not allowed' },
          { status: 403 }
        )
      }

      // Download rate limiting
      const downloadRateLimit = SecurityManager.checkRateLimit(ip, 'download')
      if (!downloadRateLimit.allowed) {
        return NextResponse.json(
          { error: 'Download rate limit exceeded', retryAfter: downloadRateLimit.retryAfter },
          { status: 429 }
        )
      }

      AccessTracker.trackDownload(shareData.id, request)
      shareData.downloadCount++
    }

    // Serve image file
    try {
      const filePath = join(process.cwd(), 'public', imageUrl)
      const imageBuffer = await readFile(filePath)
      
      // Determine content type
      const ext = imageUrl.split('.').pop()?.toLowerCase()
      const contentType = ext === 'png' ? 'image/png' : 
                        ext === 'webp' ? 'image/webp' : 'image/jpeg'

      // Security headers
      const headers = new Headers({
        'Content-Type': contentType,
        'Cache-Control': shareData.options.type === 'public' 
          ? 'public, max-age=3600' 
          : 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Robots-Tag': shareData.options.type === 'public' ? 'all' : 'noindex',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'X-Rate-Limit-Remaining': rateLimit.allowed ? '99' : '0',
        'X-Share-Expires-At': shareData.expiresAt?.toISOString() || '',
        'X-Share-View-Count': shareData.viewCount.toString(),
        'X-Share-Max-Views': shareData.options.maxViews?.toString() || 'unlimited'
      })

      // Add download headers if requested
      if (request.nextUrl.searchParams.get('download') === 'true') {
        headers.set('Content-Disposition', `attachment; filename="${shareData.metadata.originalName}"`)
      }

      return new NextResponse(imageBuffer, { headers })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { error: 'Image file not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Share access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}