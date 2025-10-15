'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { 
  Upload, 
  Image as ImageIcon,
  Plus,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Tiktok,
  Palette,
  FileImage,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CanvasPreset {
  id: string
  name: string
  width: number
  height: number
  icon: React.ReactNode
  category: string
  color: string
}

const canvasPresets: CanvasPreset[] = [
  // Social Media Presets
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    icon: <Instagram className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    icon: <Instagram className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    icon: <Youtube className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-red-500 to-red-600'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    icon: <Facebook className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    width: 1200,
    height: 675,
    icon: <Twitter className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-sky-500 to-sky-600'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    width: 1200,
    height: 627,
    icon: <Linkedin className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-blue-600 to-blue-700'
  },
  {
    id: 'tiktok-video',
    name: 'TikTok Video',
    width: 1080,
    height: 1920,
    icon: <Tiktok className="h-5 w-5" />,
    category: 'Social Media',
    color: 'bg-gradient-to-br from-black to-gray-800'
  },
  
  // Standard Presets
  {
    id: 'square',
    name: 'Square',
    width: 1080,
    height: 1080,
    icon: <div className="h-5 w-5 border-2 border-current" />,
    category: 'Standard',
    color: 'bg-gradient-to-br from-gray-500 to-gray-600'
  },
  {
    id: 'landscape',
    name: 'Landscape',
    width: 1920,
    height: 1080,
    icon: <div className="h-5 w-5 border-2 border-current" />,
    category: 'Standard',
    color: 'bg-gradient-to-br from-green-500 to-green-600'
  },
  {
    id: 'portrait',
    name: 'Portrait',
    width: 1080,
    height: 1920,
    icon: <div className="h-5 w-5 border-2 border-current" />,
    category: 'Standard',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'a4-print',
    name: 'A4 Print',
    width: 2480,
    height: 3508,
    icon: <FileImage className="h-5 w-5" />,
    category: 'Print',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600'
  },
  {
    id: 'us-letter',
    name: 'US Letter',
    width: 2550,
    height: 3300,
    icon: <FileImage className="h-5 w-5" />,
    category: 'Print',
    color: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
  }
]

export default function UploadPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = ['all', 'Social Media', 'Standard', 'Print']

  const filteredPresets = selectedCategory === 'all' 
    ? canvasPresets 
    : canvasPresets.filter(preset => preset.category === selectedCategory)

  const handleFileUpload = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    // Read file and pass to editor
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      // Store image data in sessionStorage for the editor to use
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('uploadedImage', imageData)
      }
      
      toast({
        title: "Image uploaded successfully",
        description: `"${file.name}" is ready for editing`,
      })
      
      // Navigate to editor
      router.push('/')
    }
    reader.readAsDataURL(file)
  }, [toast, router])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleFileUpload(imageFile)
    } else {
      toast({
        title: "No image found",
        description: "Please drop an image file",
        variant: "destructive"
      })
    }
  }, [handleFileUpload, toast])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handlePresetSelect = useCallback((preset: CanvasPreset) => {
    // Store canvas preset in sessionStorage for the editor to use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('canvasPreset', JSON.stringify(preset))
    }
    
    toast({
      title: "Canvas preset selected",
      description: `${preset.name} (${preset.width} × ${preset.height})`,
    })
    
    // Navigate to editor
    router.push('/')
  }, [toast, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Upload Page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />
      
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Palette className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Mini Adobe</h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                Upload & Create
              </Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              Skip to Editor
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Creating Amazing Images
              </h2>
              <p className="text-lg text-gray-600">
                Upload an image to edit or create a new canvas from scratch
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload Image Card */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                      isDragging 
                        ? 'border-primary bg-primary/5 scale-[1.02]' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-primary" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {isDragging ? 'Drop to open file' : 'Drag & Drop your image here'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Supports JPG, PNG, GIF, WebP (Max 10MB)
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleBrowseClick}
                        className="w-full"
                        size="lg"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Create New Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Start from Scratch
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose a canvas size or create a custom one
                      </p>
                      
                      <Button 
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('canvasPreset', JSON.stringify({
                              id: 'custom',
                              name: 'Custom Canvas',
                              width: 1920,
                              height: 1080,
                              icon: <div className="h-5 w-5 border-2 border-current" />,
                              category: 'Custom',
                              color: 'bg-gradient-to-br from-gray-500 to-gray-600'
                            }))
                          }
                          router.push('/')
                        }}
                        className="w-full"
                        variant="outline"
                        size="lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Canvas
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Canvas Presets */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Popular Canvas Sizes
              </h3>
              
              {/* Category Filter */}
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPresets.map((preset) => (
                <Card 
                  key={preset.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Preview */}
                      <div className={`aspect-square rounded-lg ${preset.color} flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-200`}>
                        {preset.icon}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {preset.width} × {preset.height}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {preset.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}