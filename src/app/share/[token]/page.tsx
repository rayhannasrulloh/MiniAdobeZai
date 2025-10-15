'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { 
  Download, 
  Eye, 
  EyeOff, 
  Clock, 
  Shield, 
  Share2,
  AlertCircle,
  Loader2,
  Calendar,
  Image as ImageIcon
} from 'lucide-react'

interface ShareInfo {
  id: string
  imageUrl: string
  thumbnailUrl: string
  options: {
    type: 'public' | 'unlisted' | 'private'
    allowDownload: boolean
    watermark: boolean
    title?: string
    description?: string
  }
  createdAt: string
  expiresAt?: string
  viewCount: number
  maxViews?: number
  metadata: {
    originalName: string
    size: number
    format: string
    width: number
    height: number
  }
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    loadShareInfo()
  }, [token])

  const loadShareInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/shares/${token}`)
      
      if (response.status === 401) {
        setRequiresPassword(true)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load share')
      }

      // Get the image URL and metadata from headers
      const imageUrl = `/api/shares/${token}`
      const viewCount = response.headers.get('X-Share-View-Count')
      const maxViews = response.headers.get('X-Share-Max-Views')
      const expiresAt = response.headers.get('X-Share-Expires-At')

      // Create share info from response data
      const shareData: ShareInfo = {
        id: token,
        imageUrl,
        thumbnailUrl: `/api/shares/${token}`,
        options: {
          type: 'public', // Default, would be determined by server
          allowDownload: true,
          watermark: false
        },
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || undefined,
        viewCount: parseInt(viewCount || '0'),
        maxViews: maxViews && maxViews !== 'unlimited' ? parseInt(maxViews) : undefined,
        metadata: {
          originalName: 'shared-image.png',
          size: 0,
          format: 'png',
          width: 800,
          height: 600
        }
      }

      setShareInfo(shareData)
    } catch (error) {
      console.error('Error loading share:', error)
      setError(error instanceof Error ? error.message : 'Failed to load share')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/shares/${token}?password=${encodeURIComponent(password)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Invalid password')
      }

      // Reload share info with password
      await loadShareInfo()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid password",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    if (!shareInfo) return

    try {
      setIsDownloading(true)
      
      const response = await fetch(`/api/shares/${token}?download=true`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Download not allowed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = shareInfo.metadata.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: "Your image is being downloaded",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Download failed",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared image...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Share Not Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Editor
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <p className="text-sm text-muted-foreground">
              This share requires a password to view
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="submit" className="w-full">
                Unlock Share
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shareInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
              >
                ← Back to Editor
              </Button>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                <h1 className="text-lg font-semibold">Shared Image</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={shareInfo.options.type === 'public' ? 'default' : 'secondary'}>
                {shareInfo.options.type === 'public' && <Eye className="h-3 w-3 mr-1" />}
                {shareInfo.options.type === 'private' && <Shield className="h-3 w-3 mr-1" />}
                {shareInfo.options.type}
              </Badge>
              
              {shareInfo.options.allowDownload && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Image Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={shareInfo.imageUrl}
                    alt={shareInfo.options.title || 'Shared image'}
                    className="w-full h-full object-contain"
                  />
                  
                  {shareInfo.options.watermark && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      Shared via Photo Editor
                    </div>
                  )}
                </div>
                
                {shareInfo.options.title && (
                  <h2 className="text-xl font-semibold mt-4">{shareInfo.options.title}</h2>
                )}
                
                {shareInfo.options.description && (
                  <p className="text-muted-foreground mt-2">{shareInfo.options.description}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Share Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Views</span>
                  <span className="font-medium">
                    {shareInfo.viewCount}
                    {shareInfo.maxViews && ` / ${shareInfo.maxViews}`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(shareInfo.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {shareInfo.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="font-medium">
                      {new Date(shareInfo.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Download</span>
                  <Badge variant={shareInfo.options.allowDownload ? 'default' : 'secondary'}>
                    {shareInfo.options.allowDownload ? 'Allowed' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Image Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Filename</span>
                  <span className="font-medium text-sm">{shareInfo.metadata.originalName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Format</span>
                  <span className="font-medium uppercase">{shareInfo.metadata.format}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dimensions</span>
                  <span className="font-medium">
                    {shareInfo.metadata.width} × {shareInfo.metadata.height}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Size</span>
                  <span className="font-medium">
                    {(shareInfo.metadata.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCopyLink}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                
                {shareInfo.options.allowDownload && (
                  <Button 
                    className="w-full"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Image
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  Create Your Own
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}