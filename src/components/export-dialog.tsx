'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Download, Image as ImageIcon, Settings, Info } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ExportOptions {
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

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  imageData: string
  originalWidth: number
  originalHeight: number
}

const formatInfo = {
  png: {
    name: 'PNG',
    description: 'Lossless compression, supports transparency',
    extension: '.png',
    supportsTransparency: true,
    supportsQuality: false,
    maxSize: 'Unlimited'
  },
  jpeg: {
    name: 'JPEG',
    description: 'Lossy compression, smaller file sizes',
    extension: '.jpg',
    supportsTransparency: false,
    supportsQuality: true,
    maxSize: '65,535 × 65,535'
  },
  webp: {
    name: 'WebP',
    description: 'Modern format with excellent compression',
    extension: '.webp',
    supportsTransparency: true,
    supportsQuality: true,
    maxSize: '16,383 × 16,383'
  },
  avif: {
    name: 'AVIF',
    description: 'Next-gen format with best compression',
    extension: '.avif',
    supportsTransparency: true,
    supportsQuality: true,
    maxSize: '65,536 × 65,536'
  },
  bmp: {
    name: 'BMP',
    description: 'Uncompressed bitmap format',
    extension: '.bmp',
    supportsTransparency: false,
    supportsQuality: false,
    maxSize: '32,767 × 32,767'
  },
  tiff: {
    name: 'TIFF',
    description: 'High-quality format for printing',
    extension: '.tiff',
    supportsTransparency: true,
    supportsQuality: false,
    maxSize: 'Unlimited'
  }
}

const presets = {
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

export default function ExportDialog({ isOpen, onClose, imageData, originalWidth, originalHeight }: ExportDialogProps) {
  const [sourceImageSize, setSourceImageSize] = useState({ width: originalWidth, height: originalHeight })
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 90,
    width: originalWidth,
    height: originalHeight,
    maintainAspectRatio: true,
    fileName: 'edited-image',
    preset: 'original',
    metadata: true,
    progressive: false
  })

  const [isExporting, setIsExporting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load image to get actual dimensions
  useEffect(() => {
    if (imageData) {
      const img = new Image()
      img.onload = () => {
        setSourceImageSize({ width: img.width, height: img.height })
        setOptions(prev => ({
          ...prev,
          width: img.width,
          height: img.height
        }))
      }
      img.src = imageData
    }
  }, [imageData])

  const updateOptions = useCallback((updates: Partial<ExportOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }))
  }, [])

  const handlePresetChange = useCallback((preset: ExportOptions['preset']) => {
    const presetConfig = presets[preset]
    updateOptions({
      preset,
      width: presetConfig.width || sourceImageSize.width,
      height: presetConfig.height || sourceImageSize.height,
      quality: presetConfig.quality
    })
  }, [sourceImageSize.width, sourceImageSize.height, updateOptions])

  const handleWidthChange = useCallback((width: number) => {
    if (!options.maintainAspectRatio) {
      updateOptions({ width })
    } else {
      const aspectRatio = sourceImageSize.width / sourceImageSize.height
      const newHeight = Math.round(width / aspectRatio)
      updateOptions({ width, height: newHeight })
    }
  }, [options.maintainAspectRatio, sourceImageSize.width, sourceImageSize.height, updateOptions])

  const handleHeightChange = useCallback((height: number) => {
    if (!options.maintainAspectRatio) {
      updateOptions({ height })
    } else {
      const aspectRatio = sourceImageSize.width / sourceImageSize.height
      const newWidth = Math.round(height * aspectRatio)
      updateOptions({ width: newWidth, height })
    }
  }, [options.maintainAspectRatio, sourceImageSize.width, sourceImageSize.height, updateOptions])

  const exportImage = useCallback(async () => {
    if (!canvasRef.current) return

    setIsExporting(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      // Create image element from the current canvas data
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageData
      })

      // Set canvas dimensions to match the source image
      canvas.width = img.width
      canvas.height = img.height

      // Clear canvas and draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // If resizing is needed, create a temporary canvas
      let finalCanvas = canvas
      if (options.width !== img.width || options.height !== img.height) {
        finalCanvas = document.createElement('canvas')
        finalCanvas.width = options.width
        finalCanvas.height = options.height
        const finalCtx = finalCanvas.getContext('2d')
        if (finalCtx) {
          finalCtx.drawImage(canvas, 0, 0, options.width, options.height)
        }
      }

      // Convert to blob based on format
      const mimeType = `image/${options.format === 'jpeg' ? 'jpeg' : options.format}`
      const quality = options.format === 'png' ? undefined : options.quality / 100

      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, mimeType, quality)
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${options.fileName}${formatInfo[options.format].extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export successful',
        description: `Image exported as ${formatInfo[options.format].name} format`,
      })

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }, [imageData, options, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Image
          </CardTitle>
          <CardDescription>
            Choose export format and settings for your edited image
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="text-base font-medium">Preview</Label>
            <div className="mt-2 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-center">
                <img 
                  src={imageData} 
                  alt="Preview" 
                  className="max-w-full max-h-64 object-contain rounded"
                  style={{ maxHeight: '256px' }}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground mt-2">
                {sourceImageSize.width} × {sourceImageSize.height} px • {formatInfo[options.format].name}
                {options.width !== sourceImageSize.width || options.height !== sourceImageSize.height 
                  ? ` → ${options.width} × ${options.height} px` 
                  : ''}
              </div>
            </div>
          </div>

          <Tabs defaultValue="format" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="size">Size & Quality</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="space-y-6">
              <div>
                <Label className="text-base font-medium">Export Format</Label>
                <RadioGroup
                  value={options.format}
                  onValueChange={(value) => updateOptions({ format: value as ExportOptions['format'] })}
                  className="grid grid-cols-2 gap-4 mt-3"
                >
                  {Object.entries(formatInfo).map(([key, info]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="flex-1 cursor-pointer">
                        <div className="font-medium">{info.name}</div>
                        <div className="text-sm text-muted-foreground">{info.description}</div>
                        <div className="flex gap-2 mt-1">
                          {info.supportsTransparency && (
                            <Badge variant="secondary" className="text-xs">Transparency</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{info.maxSize}</Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="filename" className="text-base font-medium">File Name</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="filename"
                    value={options.fileName}
                    onChange={(e) => updateOptions({ fileName: e.target.value })}
                    placeholder="Enter file name"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formatInfo[options.format].extension}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="size" className="space-y-6">
              <div>
                <Label className="text-base font-medium">Quick Presets</Label>
                <Select value={options.preset} onValueChange={(value) => handlePresetChange(value as ExportOptions['preset'])}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(presets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-sm text-muted-foreground">{preset.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Dimensions</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={options.width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      min="1"
                      max="10000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={options.height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Switch
                    id="aspect-ratio"
                    checked={options.maintainAspectRatio}
                    onCheckedChange={(checked) => updateOptions({ maintainAspectRatio: checked })}
                  />
                  <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Original: {sourceImageSize.width} × {sourceImageSize.height} px
                </div>
              </div>

              {formatInfo[options.format].supportsQuality && (
                <div>
                  <Label className="text-base font-medium">Quality: {options.quality}%</Label>
                  <Slider
                    value={[options.quality]}
                    onValueChange={(value) => updateOptions({ quality: value[0] })}
                    max={100}
                    min={1}
                    step={1}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="metadata"
                    checked={options.metadata}
                    onCheckedChange={(checked) => updateOptions({ metadata: checked })}
                  />
                  <Label htmlFor="metadata">Include metadata</Label>
                </div>
                
                {(options.format === 'jpeg' || options.format === 'png') && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="progressive"
                      checked={options.progressive}
                      onCheckedChange={(checked) => updateOptions({ progressive: checked })}
                    />
                    <Label htmlFor="progressive">Progressive loading</Label>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="w-4 h-4" />
                    Format Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Format:</span> {formatInfo[options.format].name}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {formatInfo[options.format].description}
                    </div>
                    <div>
                      <span className="font-medium">Transparency:</span> {formatInfo[options.format].supportsTransparency ? 'Supported' : 'Not supported'}
                    </div>
                    <div>
                      <span className="font-medium">Max size:</span> {formatInfo[options.format].maxSize}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={exportImage} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Image
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}