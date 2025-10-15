import { NextRequest, NextResponse } from 'next/server'

// Import the same storage from create route
declare global {
  var shares: Map<string, any>
  var analytics: Map<string, any>
}

if (!global.shares) global.shares = new Map()
if (!global.analytics) global.analytics = new Map()

const shares = global.shares
const analytics = global.analytics

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const body = await request.json()
    const { action, metadata } = body

    // Validate action
    if (!['view', 'download', 'share'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
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

    // Get analytics data
    const shareAnalytics = analytics.get(shareData.id)
    if (!shareAnalytics) {
      return NextResponse.json(
        { error: 'Analytics not found' },
        { status: 404 }
      )
    }

    // Track the action
    const timestamp = new Date()
    const entry = {
      timestamp,
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
      referer: metadata?.referer,
      country: metadata?.country || 'Unknown'
    }

    switch (action) {
      case 'view':
        shareAnalytics.views.push(entry)
        break
      case 'download':
        shareAnalytics.downloads.push(entry)
        break
      case 'share':
        // Track share actions (like social media shares)
        if (!shareAnalytics.shares) {
          shareAnalytics.shares = []
        }
        shareAnalytics.shares.push(entry)
        break
    }

    // Update referrer tracking
    if (metadata?.referer) {
      try {
        const domain = new URL(metadata.referer).hostname
        shareAnalytics.referrers.set(domain, (shareAnalytics.referrers.get(domain) || 0) + 1)
      } catch (e) {
        // Invalid URL, ignore
      }
    }

    // Update country tracking
    if (metadata?.country) {
      shareAnalytics.countries.set(metadata.country, (shareAnalytics.countries.get(metadata.country) || 0) + 1)
    }

    return NextResponse.json({
      success: true,
      tracked: {
        action,
        timestamp,
        shareId: shareData.id
      }
    })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    // Get share data
    const shareData = shares.get(token)
    if (!shareData) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Get analytics data
    const shareAnalytics = analytics.get(shareData.id)
    if (!shareAnalytics) {
      return NextResponse.json(
        { error: 'Analytics not found' },
        { status: 404 }
      )
    }

    // Calculate overview statistics
    const overview = {
      totalViews: shareAnalytics.views.length,
      totalDownloads: shareAnalytics.downloads.length,
      totalShares: shareAnalytics.shares?.length || 0,
      uniqueVisitors: new Set(shareAnalytics.views.map(v => v.ipAddress)).size,
      averageViewTime: 0, // Would need timing data
      createdAt: shareAnalytics.createdAt
    }

    // Generate timeline data (last 7 days)
    const now = new Date()
    const timeline = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayViews = shareAnalytics.views.filter(v => 
        v.timestamp >= date && v.timestamp < nextDate
      ).length
      
      const dayDownloads = shareAnalytics.downloads.filter(d => 
        d.timestamp >= date && d.timestamp < nextDate
      ).length
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        views: dayViews,
        downloads: dayDownloads
      })
    }

    // Convert Maps to arrays for JSON serialization
    const referrers = Array.from(shareAnalytics.referrers.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 referrers

    const countries = Array.from(shareAnalytics.countries.entries())
      .map(([country, views]) => ({ country, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10) // Top 10 countries

    return NextResponse.json({
      success: true,
      data: {
        overview,
        timeline,
        referrers,
        countries,
        shareInfo: {
          id: shareData.id,
          createdAt: shareData.createdAt,
          expiresAt: shareData.expiresAt,
          viewCount: shareData.viewCount,
          downloadCount: shareData.downloadCount,
          options: shareData.options
        }
      }
    })

  } catch (error) {
    console.error('Analytics retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}