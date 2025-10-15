'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { 
  Share2, 
  Link, 
  Mail, 
  Download, 
  Copy, 
  QrCode, 
  Facebook, 
  Twitter, 
  Linkedin,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Image as ImageIcon
} from 'lucide-react'

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
  shareId: string
  shareUrl: string
  token: string
  expiresAt?: string
  qrCode: string
  thumbnailUrl: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  imageData?: string
  onShareComplete?: (shareData: ShareData) => void
}

const defaultShareOptions: ShareOptions = {
  type: 'public',
  expiration: '7d',
  allowDownload: true,
  watermark: false,
  quality: 'high'
}

export default function ShareModal({ isOpen, onClose, imageData, onShareComplete }: ShareModalProps) {
  const [shareOptions, setShareOptions] = useState<ShareOptions>(defaultShareOptions)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleCreateShare = useCallback(async () => {
    if (!imageData) {
      toast({
        title: "Error",
        description: "No image to share",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      // Convert data URL to blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      const file = new File([blob], 'edited-image.png', { type: 'image/png' })

      // Create form data
      const formData = new FormData()
      formData.append('image', file)
      formData.append('options', JSON.stringify(shareOptions))

      const createResponse = await fetch('/api/shares/create', {
        method: 'POST',
        body: formData
      })

      const result = await createResponse.json()

      if (result.success) {
        setShareData(result.data)
        onShareComplete?.(result.data)
        
        toast({
          title: "Share Created!",
          description: "Your image has been successfully shared.",
        })
      } else {
        throw new Error(result.error || 'Failed to create share')
      }
    } catch (error) {
      console.error('Share creation error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create share",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [imageData, shareOptions, onShareComplete])

  const handleCopyLink = useCallback(async () => {
    if (!shareData?.shareUrl) return

    try {
      await navigator.clipboard.writeText(shareData.shareUrl)
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }, [shareData])

  const handleSocialShare = useCallback((platform: string) => {
    if (!shareData?.shareUrl) return

    const url = shareData.shareUrl
    const text = shareOptions.title || 'Check out my edited image!'

    let shareUrl = ''

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      default:
        return
    }

    window.open(shareUrl, '_blank', 'width=600,height=400')
  }, [shareData, shareOptions.title])

  const handleEmailShare = useCallback(() => {
    if (!shareData?.shareUrl) return

    const subject = encodeURIComponent(shareOptions.title || 'Check out my edited image!')
    const body = encodeURIComponent(`I wanted to share this edited image with you:\n\n${shareData.shareUrl}\n\n${shareOptions.description || ''}`)
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }, [shareData, shareOptions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Image
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Image Preview */}
          {imageData && (
            <div className="flex justify-center">
              <div className="relative group">
                <img 
                  src={imageData} 
                  alt="Preview" 
                  className="max-w-full max-h-64 rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          )}

          {!shareData ? (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="My edited image"
                      value={shareOptions.title || ''}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quality">Quality</Label>
                    <Select value={shareOptions.quality} onValueChange={(value: any) => setShareOptions(prev => ({ ...prev, quality: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Describe your image..."
                    value={shareOptions.description || ''}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allowDownload"
                    checked={shareOptions.allowDownload}
                    onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, allowDownload: checked as boolean }))}
                  />
                  <Label htmlFor="allowDownload">Allow downloads</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="watermark"
                    checked={shareOptions.watermark}
                    onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, watermark: checked as boolean }))}
                  />
                  <Label htmlFor="watermark">Add watermark</Label>
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <div>
                  <Label>Visibility</Label>
                  <Select value={shareOptions.type} onValueChange={(value: any) => setShareOptions(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Public - Anyone can view
                        </div>
                      </SelectItem>
                      <SelectItem value="unlisted">
                        <div className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Unlisted - Only with link
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Private - Password protected
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shareOptions.type === 'private' && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={shareOptions.password || ''}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Expiration</Label>
                  <Select value={shareOptions.expiration} onValueChange={(value: any) => setShareOptions(prev => ({ ...prev, expiration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          1 Hour
                        </div>
                      </SelectItem>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxViews">Maximum Views (Optional)</Label>
                  <Input
                    id="maxViews"
                    type="number"
                    placeholder="Unlimited"
                    min="1"
                    value={shareOptions.maxViews || ''}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, maxViews: e.target.value ? parseInt(e.target.value) : undefined }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Advanced options for power users:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Custom domain branding</li>
                    <li>Analytics tracking</li>
                    <li>Custom CSS styling</li>
                    <li>API access</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Share2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Share Created Successfully!</h3>
                <p className="text-muted-foreground">Your image is now ready to share</p>
              </div>

              {/* Share Link */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareData.shareUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopyLink} size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <Label>QR Code</Label>
                <div className="flex justify-center mt-2">
                  <img src={shareData.qrCode} alt="QR Code" className="w-32 h-32" />
                </div>
              </div>

              {/* Social Sharing */}
              <div className="space-y-2">
                <Label>Share on Social Media</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSocialShare('twitter')}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSocialShare('facebook')}
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSocialShare('linkedin')}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEmailShare}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Share Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Expires:</span>
                  <div className="font-medium">
                    {shareData.expiresAt ? new Date(shareData.expiresAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div className="font-medium capitalize">{shareOptions.type}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {shareData ? 'Close' : 'Cancel'}
            </Button>
            {!shareData && (
              <Button 
                onClick={handleCreateShare} 
                disabled={isGenerating}
              >
                {isGenerating ? 'Creating...' : 'Create Share'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}