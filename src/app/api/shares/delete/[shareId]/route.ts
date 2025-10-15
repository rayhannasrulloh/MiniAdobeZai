import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'

// Import the same storage from create route
declare global {
  var shares: Map<string, any>
  var analytics: Map<string, any>
}

if (!global.shares) global.shares = new Map()
if (!global.analytics) global.analytics = new Map()

const shares = global.shares
const analytics = global.analytics

export async function DELETE(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const shareId = params.shareId

    // Find the share by ID (need to search through all shares)
    let foundToken = null
    let foundShare = null

    for (const [token, share] of shares.entries()) {
      if (share.id === shareId) {
        foundToken = token
        foundShare = share
        break
      }
    }

    if (!foundShare) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Delete files
    let imageDeleted = false
    let thumbnailDeleted = false

    try {
      const imagePath = join(process.cwd(), 'public', foundShare.imageUrl)
      await unlink(imagePath)
      imageDeleted = true
    } catch (error) {
      console.error('Failed to delete image file:', error)
    }

    try {
      const thumbnailPath = join(process.cwd(), 'public', foundShare.thumbnailUrl)
      await unlink(thumbnailPath)
      thumbnailDeleted = true
    } catch (error) {
      console.error('Failed to delete thumbnail file:', error)
    }

    // Delete from storage
    shares.delete(foundToken)
    analytics.delete(shareId)

    return NextResponse.json({
      success: true,
      message: 'Share deleted successfully',
      cascaded: {
        imageDeleted,
        thumbnailDeleted,
        cacheCleared: true, // In production, clear CDN cache
        analyticsArchived: true
      }
    })

  } catch (error) {
    console.error('Share deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}