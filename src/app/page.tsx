'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageProcessor, FILTERS, MORPHOLOGICAL_FILTERS, ENHANCEMENT_FILTERS, SEGMENTATION_FILTERS, FREQUENCY_DOMAIN_FILTERS } from '@/lib/image-processor'
import { ClientImageProcessor } from '@/lib/client-image-processor'
import DragDropUpload from '@/components/drag-drop-upload'
import CropControls from '@/components/crop-controls'
import ExportDialog from '@/components/export-dialog'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

import { 
  Upload, 
  Download, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical,
  Crop,
  Move,
  Palette,
  Wand2,
  Layers,
  Undo,
  Redo,
  FileImage,
  Zap,
  Brush,
  Type,
  Square,
  Circle,
  Triangle,
  Eraser,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Settings,
  Sparkles,
  Image as ImageIcon,
  Sliders,
  Contrast,
  Sun,
  Droplet,
  Filter,
  Scissors,
  Copy,
  Trash2,
  Aperture,
  Activity,
  Radio,
  MousePointer,
  Lock,
  Unlock,
  History,
  Clock,
  Trash2 as Delete,
  Sun as SunIcon,
  Moon,
  CircleDot,
  Brain,
  Target,
  Maximize,
  BarChart3,
  TrendingUp,
  Calendar,
  Timer
} from 'lucide-react'

interface Layer {
  id: string
  name: string
  type: 'background' | 'text' | 'shape' | 'image' | 'frame' | 'empty'
  visible: boolean
  locked: boolean
  opacity: number
  imageData?: ImageData
  position: { x: number; y: number }
  size: { width: number; height: number }
  blendMode: GlobalCompositeOperation
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textOrientation?: 'horizontal' | 'vertical'
  textAlignment?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textUnderline?: boolean
  letterSpacing?: number
  lineHeight?: number
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'line'
  strokeWidth?: number
  fillColor?: string
}

interface EditHistory {
  id: string
  action: string
  layerId?: string
  layerName?: string
  previousState?: Layer
  newState?: Layer
  timestamp: Date
  imageData?: ImageData
}

export default function MiniAdobe() {
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  // AI states
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectionArea, setSelectionArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState('basic')
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [history, setHistory] = useState<EditHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(100)
  
  // Image adjustment states
  const [brightness, setBrightness] = useState([100])
  const [contrast, setContrast] = useState([100])
  const [saturation, setSaturation] = useState([100])
  const [hue, setHue] = useState([0])
  const [blur, setBlur] = useState([0])
  const [highlights, setHighlights] = useState([0])
  const [shadows, setShadows] = useState([0])
  const [vignette, setVignette] = useState([0])
  const [vignetteSize, setVignetteSize] = useState([50])
  const [vignetteFeather, setVignetteFeather] = useState([50])
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'triangle' | 'line'>('rectangle')
  const [shapeFillColor, setShapeFillColor] = useState('#3b82f6')
  const [shapeStrokeColor, setShapeStrokeColor] = useState('#000000')
  const [shapeFillEnabled, setShapeFillEnabled] = useState(true)
  const [isDrawingShape, setIsDrawingShape] = useState(false)
  const [shapeStartPos, setShapeStartPos] = useState({ x: 0, y: 0 })
  const [currentShape, setCurrentShape] = useState<Layer | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [brushSize, setBrushSize] = useState([5])
  const [brushColor, setBrushColor] = useState('#000000')
  const [selectedFilter, setSelectedFilter] = useState<string>('')
  const [cropMode, setCropMode] = useState(false)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('custom')
  const [aspectRatios] = useState([
    { id: 'custom', name: 'Custom', ratio: null },
    { id: '3:4', name: '3:4', ratio: 3/4 },
    { id: '4:5', name: '4:5', ratio: 4/5 },
    { id: '16:9', name: '16:9', ratio: 16/9 },
    { id: '9:16', name: '9:16', ratio: 9/16 },
    { id: '1:1', name: '1:1', ratio: 1 },
    { id: '4:3', name: '4:3', ratio: 4/3 },
    { id: '5:4', name: '5:4', ratio: 5/4 }
  ])
  const [rotation, setRotation] = useState([0])
  
  // Histogram state
  const [histogramData, setHistogramData] = useState<number[]>(new Array(256).fill(0))
  const [showHistogram, setShowHistogram] = useState(true)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [showTransparencyGrid, setShowTransparencyGrid] = useState(true)
  const [kernelSize, setKernelSize] = useState([3])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [initialLayerState, setInitialLayerState] = useState<Layer | null>(null)
  const redrawCanvasRef = useRef<((layerList?: Layer[]) => void) | null>(null)
  
  // Text tool states
  const [isAddingText, setIsAddingText] = useState(false)
  const [isEditingText, setIsEditingText] = useState(false)
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [textColor, setTextColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [textOrientation, setTextOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('left')
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal')
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal')
  const [textUnderline, setTextUnderline] = useState(false)
  const [textOpacity, setTextOpacity] = useState(100)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [lineHeight, setLineHeight] = useState(1.2)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 })
  const [textSelectionMode, setTextSelectionMode] = useState<'type' | 'select'>('type')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [currentCanvasData, setCurrentCanvasData] = useState<string | null>(null)
  const [showTextToImageDialog, setShowTextToImageDialog] = useState(false)
  const [textToImagePrompt, setTextToImagePrompt] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  // Historical analysis states
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    id: string
    timestamp: Date
    filterName: string
    originalImage: string
    processedImage: string
    analysisData: {
      meanFrequency: number
      maxFrequency: number
      minFrequency: number
      dominantFrequency: number
      entropy: number
      energy: number
    }
    processingTime: number
  }>>([])
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<typeof analysisHistory[0] | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])





  // Initialize canvas with default size when mounted
  useEffect(() => {
    if (mounted && canvasRef.current && !selectedImage && !isUploading) {
      const canvas = canvasRef.current
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = 512
        canvas.height = 512
        setCanvasSize({ width: 512, height: 512 })
      }
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Create elegant gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, '#f8fafc')
        gradient.addColorStop(0.5, '#f1f5f9')
        gradient.addColorStop(1, '#e2e8f0')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw decorative grid pattern
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.5
        ctx.setLineDash([5, 5])
        
        // Vertical grid lines
        for (let x = 32; x < canvas.width; x += 32) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvas.height)
          ctx.stroke()
        }
        
        // Horizontal grid lines
        for (let y = 32; y < canvas.height; y += 32) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(canvas.width, y)
          ctx.stroke()
        }
        
        ctx.setLineDash([])
        
        // Draw center icon
        ctx.fillStyle = '#64748b'
        ctx.font = '36px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🎨', canvas.width / 2, canvas.height / 2 - 50)
        
        // Draw main title
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 20px system-ui'
        ctx.fillText('专业图像编辑器', canvas.width / 2, canvas.height / 2)
        
        // Draw subtitle
        ctx.fillStyle = '#64748b'
        ctx.font = '14px system-ui'
        ctx.fillText('拖放图片到这里开始创作', canvas.width / 2, canvas.height / 2 + 30)
        
        // Draw feature hints
        ctx.fillStyle = '#94a3b8'
        ctx.font = '12px system-ui'
        const features = [
          '• 支持 JPG、PNG、WebP 格式',
          '• 智能AI图像处理',
          '• 丰富的滤镜效果'
        ]
        
        features.forEach((feature, index) => {
          ctx.fillText(feature, canvas.width / 2, canvas.height / 2 + 60 + (index * 18))
        })
        
        // Draw elegant border
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)
        ctx.setLineDash([])
        
        // Draw corner decorations
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        
        // Top-left corner
        ctx.beginPath()
        ctx.moveTo(24, 40)
        ctx.lineTo(24, 24)
        ctx.lineTo(40, 24)
        ctx.stroke()
        
        // Top-right corner
        ctx.beginPath()
        ctx.moveTo(canvas.width - 40, 24)
        ctx.lineTo(canvas.width - 24, 24)
        ctx.lineTo(canvas.width - 24, 40)
        ctx.stroke()
        
        // Bottom-left corner
        ctx.beginPath()
        ctx.moveTo(24, canvas.height - 40)
        ctx.lineTo(24, canvas.height - 24)
        ctx.lineTo(40, canvas.height - 24)
        ctx.stroke()
        
        // Bottom-right corner
        ctx.beginPath()
        ctx.moveTo(canvas.width - 40, canvas.height - 24)
        ctx.lineTo(canvas.width - 24, canvas.height - 24)
        ctx.lineTo(canvas.width - 24, canvas.height - 40)
        ctx.stroke()
      }
    }
  }, [mounted, selectedImage, isUploading])

  // Auto-focus text input when in text editing mode
  useEffect(() => {
    if ((isAddingText || isEditingText) && typeof window !== 'undefined') {
      // Focus the hidden input after a short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement
        if (input) {
          input.focus()
          // Only select all text for new text, not when editing existing text
          if (isAddingText && !textInput) {
            input.select()
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isAddingText, isEditingText, textPosition, isAddingText, textInput])

  const [isCanvasDragging, setIsCanvasDragging] = useState(false)
  const [canvasDragOver, setCanvasDragOver] = useState(false)

  const handleExport = useCallback(() => {
    if (!canvasRef.current || !selectedImage) return;
    
    // Capture the current canvas content
    const canvas = canvasRef.current
    const currentData = canvas.toDataURL('image/png')
    setCurrentCanvasData(currentData)
    setShowExportDialog(true)
  }, [selectedImage, toast])

  const cancelCrop = useCallback(() => {
    setCropMode(false)
    setCropArea({ x: 0, y: 0, width: 0, height: 0 })
    setSelectedAspectRatio('custom')
    setSelectedTool('move')
  }, [])

  const setAspectRatioCrop = useCallback((ratioId: string) => {
    if (!canvasRef.current || typeof window === 'undefined') return
    
    const canvas = canvasRef.current
    const aspectRatio = aspectRatios.find(ar => ar.id === ratioId)?.ratio
    
    if (!aspectRatio) {
      setSelectedAspectRatio('custom')
      return
    }
    
    setSelectedAspectRatio(ratioId)
    
    // Calculate crop area based on aspect ratio
    let cropWidth, cropHeight
    
    if (aspectRatio > 1) {
      // Landscape orientation
      cropWidth = Math.min(canvas.width * 0.8, canvas.width)
      cropHeight = cropWidth / aspectRatio
      
      if (cropHeight > canvas.height * 0.8) {
        cropHeight = canvas.height * 0.8
        cropWidth = cropHeight * aspectRatio
      }
    } else {
      // Portrait orientation or square
      cropHeight = Math.min(canvas.height * 0.8, canvas.height)
      cropWidth = cropHeight * aspectRatio
      
      if (cropWidth > canvas.width * 0.8) {
        cropWidth = canvas.width * 0.8
        cropHeight = cropWidth / aspectRatio
      }
    }
    
    // Center the crop area
    const cropX = (canvas.width - cropWidth) / 2
    const cropY = (canvas.height - cropHeight) / 2
    
    setCropArea({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight
    })
    
    setCropMode(true)
    setSelectedTool('crop')
  }, [aspectRatios])

  const applyCrop = useCallback(() => {
    if (!canvasRef.current || !cropMode || typeof window === 'undefined') return
    
    const canvas = canvasRef.current
    console.log('Applying crop with area:', cropArea)
    
    // Normalize crop area (handle negative dimensions)
    const normalizedCropArea = {
      x: Math.min(cropArea.x, cropArea.x + cropArea.width),
      y: Math.min(cropArea.y, cropArea.y + cropArea.height),
      width: Math.abs(cropArea.width),
      height: Math.abs(cropArea.height)
    }
    
    console.log('Normalized crop area:', normalizedCropArea)
    
    // Validate crop area
    if (normalizedCropArea.width <= 0 || normalizedCropArea.height <= 0) {
      console.log('Invalid crop dimensions')
      return
    }
    
    // Ensure crop area is within canvas bounds
    const validCropArea = {
      x: Math.max(0, Math.min(normalizedCropArea.x, canvas.width - 1)),
      y: Math.max(0, Math.min(normalizedCropArea.y, canvas.height - 1)),
      width: Math.min(normalizedCropArea.width, canvas.width - Math.max(0, normalizedCropArea.x)),
      height: Math.min(normalizedCropArea.height, canvas.height - Math.max(0, normalizedCropArea.y))
    }
    
    // Additional validation to prevent invalid crops
    if (validCropArea.x >= canvas.width || validCropArea.y >= canvas.height) {
      console.log('Crop area outside canvas bounds')
      return
    }
    
    console.log('Valid crop area:', validCropArea)
    
    if (validCropArea.width <= 0 || validCropArea.height <= 0) {
      console.log('Crop area is out of bounds')
      return
    }
    
    ImageProcessor.cropCanvas(canvas, validCropArea)
    
    // Update canvas size state
    setCanvasSize({ width: canvas.width, height: canvas.height })
    
    // Exit crop mode
    setCropMode(false)
    setCropArea({ x: 0, y: 0, width: 0, height: 0 })
    
    // Save to history
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const newHistory: EditHistory = {
        id: Date.now().toString(),
        action: 'Crop Image',
        timestamp: new Date(),
        imageData
      }
      
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
      setHistoryIndex(prev => prev + 1)
      
      // Show success toast
      toast({
        title: "Crop applied successfully",
        description: `Image cropped to ${validCropArea.width} × ${validCropArea.height}px`,
      })
    }
  }, [cropMode, cropArea, historyIndex, toast])

  const handleCropMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || selectedTool !== 'crop' || typeof window === 'undefined') return
    
    e.preventDefault()
    e.stopPropagation()
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scale = zoom / 100
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale
    
    setIsDrawing(true)
    
    // If custom aspect ratio, start drawing from scratch
    if (selectedAspectRatio === 'custom') {
      setCropArea({ x, y, width: 0, height: 0 })
    } else {
      // For preset ratios, move the existing crop area
      const aspectRatio = aspectRatios.find(ar => ar.id === selectedAspectRatio)?.ratio
      if (aspectRatio) {
        setCropArea(prev => ({
          x: x - prev.width / 2,
          y: y - prev.height / 2,
          width: prev.width,
          height: prev.height
        }))
      }
    }
  }, [cropMode, selectedTool, selectedAspectRatio, aspectRatios, zoom])

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoom(prev => {
      if (direction === 'in') {
        return Math.min(500, prev + 25)
      } else {
        return Math.max(25, prev - 25)
      }
    })
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(100)
  }, [])

  const renderTextLayer = useCallback((ctx: CanvasRenderingContext2D, layer: Layer) => {
    if (!layer.text) return
    
    // Set font properties
    const fontWeight = layer.fontWeight || 'normal'
    const fontStyle = layer.fontStyle || 'normal'
    const fontSize = layer.fontSize || 24
    const fontFamily = layer.fontFamily || 'Arial'
    
    ctx.font = `${fontStyle === 'italic' ? 'italic ' : ''}${fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${fontFamily}`
    ctx.fillStyle = layer.color || '#000000'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    // Apply letter spacing if supported
    if (layer.letterSpacing && layer.letterSpacing !== 0) {
      ctx.letterSpacing = `${layer.letterSpacing}px`
    }
    
    // Handle text orientation
    if (layer.textOrientation === 'vertical') {
      // Vertical text rendering
      const chars = layer.text.split('')
      const charSpacing = fontSize + (layer.letterSpacing || 0)
      
      chars.forEach((char, index) => {
        const x = layer.position.x + (index * charSpacing)
        ctx.fillText(char, x, layer.position.y)
        
        // Render underline if needed
        if (layer.textUnderline && char !== ' ' && char !== '\n') {
          const charWidth = fontSize * 0.6
          ctx.beginPath()
          ctx.moveTo(x, layer.position.y + fontSize + 2)
          ctx.lineTo(x + charWidth, layer.position.y + fontSize + 2)
          ctx.strokeStyle = layer.color || '#000000'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
    } else {
      // Horizontal text rendering
      const lines = layer.text.split('\n')
      const lineHeight = fontSize * (layer.lineHeight || 1.2)
      
      lines.forEach((line, index) => {
        const y = layer.position.y + (index * lineHeight)
        
        // Handle text alignment
        let x = layer.position.x
        if (layer.textAlignment === 'center') {
          const metrics = ctx.measureText(line)
          x = layer.position.x - metrics.width / 2
        } else if (layer.textAlignment === 'right') {
          const metrics = ctx.measureText(line)
          x = layer.position.x - metrics.width
        }
        
        ctx.fillText(line, x, y)
        
        // Render underline if needed
        if (layer.textUnderline) {
          const metrics = ctx.measureText(line)
          let underlineX = x
          const underlineY = y + fontSize + 2
          
          ctx.beginPath()
          ctx.moveTo(underlineX, underlineY)
          ctx.lineTo(underlineX + metrics.width, underlineY)
          ctx.strokeStyle = layer.color || '#000000'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
    }
    
    // Reset letter spacing
    ctx.letterSpacing = '0px'
  }, [])

  const redrawCanvas = useCallback((layerList?: Layer[]) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const layersToRender = layerList || layers
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw transparency grid if enabled
    if (showTransparencyGrid) {
      ImageProcessor.drawTransparencyGrid(ctx, canvas.width, canvas.height)
    }
    
    // Draw all visible layers
    layersToRender.forEach(layer => {
      if (!layer.visible) return
      
      ctx.save()
      ctx.globalAlpha = layer.opacity / 100
      ctx.globalCompositeOperation = layer.blendMode
      
      switch (layer.type) {
        case 'background':
        case 'image':
        case 'empty':
          if (layer.imageData) {
            ctx.putImageData(layer.imageData, layer.position.x, layer.position.y)
          }
          break
          
        case 'text':
          if (layer.text) {
            renderTextLayer(ctx, layer)
          }
          break
          
        case 'shape':
          ctx.strokeStyle = layer.color || '#000000'
          ctx.fillStyle = layer.fillColor || 'transparent'
          ctx.lineWidth = layer.strokeWidth || 2
          
          const { x, y } = layer.position
          const { width, height } = layer.size
          
          switch (layer.shapeType) {
            case 'rectangle':
              if (layer.fillColor && layer.fillColor !== 'transparent') {
                ctx.fillRect(x, y, width, height)
              }
              ctx.strokeRect(x, y, width, height)
              break
              
            case 'circle':
              ctx.beginPath()
              ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, 2 * Math.PI)
              if (layer.fillColor && layer.fillColor !== 'transparent') {
                ctx.fill()
              }
              ctx.stroke()
              break
              
            case 'triangle':
              ctx.beginPath()
              ctx.moveTo(x + width/2, y)
              ctx.lineTo(x, y + height)
              ctx.lineTo(x + width, y + height)
              ctx.closePath()
              if (layer.fillColor && layer.fillColor !== 'transparent') {
                ctx.fill()
              }
              ctx.stroke()
              break
              
            case 'line':
              ctx.beginPath()
              ctx.moveTo(x, y)
              ctx.lineTo(x + width, y + height)
              ctx.stroke()
              break
          }
          break
          
        case 'frame':
          ctx.strokeStyle = layer.color || '#000000'
          ctx.lineWidth = layer.strokeWidth || 5
          ctx.strokeRect(layer.position.x, layer.position.y, layer.size.width, layer.size.height)
          break
      }
      
      ctx.restore()
    })
  }, [layers, showTransparencyGrid])

  // Update the ref whenever redrawCanvas changes
  useEffect(() => {
    redrawCanvasRef.current = redrawCanvas
  }, [redrawCanvas])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1]
      
      // Handle layer-based operations (like move, add shape, etc.)
      if (previousState.previousState && previousState.newState) {
        // Restore the previous layer state
        setLayers(prevLayers => 
          prevLayers.map(layer => 
            layer.id === previousState.layerId 
              ? { ...previousState.previousState }
              : layer
          )
        )
        
        // Update selected layer if needed
        if (previousState.layerId) {
          setSelectedLayer(previousState.layerId)
        }
        
        // Redraw canvas with restored layer
        setTimeout(() => {
          const updatedLayers = layers.map(layer => 
            layer.id === previousState.layerId 
              ? { ...previousState.previousState }
              : layer
          )
          redrawCanvasRef.current?.(updatedLayers)
        }, 0)
        
        setHistoryIndex(prev => prev - 1)
        console.log(`Undid layer operation: ${previousState.action}`)
      }
      // Handle image-based operations (filters, adjustments, etc.)
      else if (previousState.imageData && canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = previousState.imageData.width
          canvas.height = previousState.imageData.height
          ctx.putImageData(previousState.imageData, 0, 0)
          setHistoryIndex(prev => prev - 1)
          console.log(`Undid image operation: ${previousState.action}`)
        }
      }
    }
  }, [history, historyIndex, layers])

  // Text editing functions
  const renderTextEditor = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx || !canvasRef.current) return

    const mainCanvas = canvasRef.current
    const rect = mainCanvas.getBoundingClientRect()
    const scale = zoom / 100
    
    // Set canvas size to match main canvas
    canvas.width = mainCanvas.width
    canvas.height = mainCanvas.height
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Apply canvas transformations
    ctx.save()
    ctx.scale(scale, scale)
    ctx.translate(canvasOffset.x, canvasOffset.y)
    
    // Get current text layer if editing
    const currentLayer = isEditingText ? layers.find(l => l.id === editingTextLayerId) : null
    const text = isEditingText && currentLayer?.text ? currentLayer.text : textInput
    const position = isEditingText && currentLayer ? currentLayer.position : textPosition
    
    // Always render text editor when active, even if text is empty
    // This shows the cursor so users know they can type
    
    // Set font properties
    const fontStyleStr = `${fontStyle === 'italic' ? 'italic ' : ''}${fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${fontFamily}`
    ctx.font = fontStyleStr
    ctx.fillStyle = textColor
    ctx.globalAlpha = textOpacity / 100
    ctx.textAlign = textAlignment as CanvasTextAlign
    ctx.textBaseline = 'top'
    
    // Apply letter spacing
    ctx.letterSpacing = `${letterSpacing}px`
    
    // Render text based on orientation
    if (textOrientation === 'horizontal') {
      if (text) {
        renderHorizontalText(ctx, text, position)
      }
    } else {
      if (text) {
        renderVerticalText(ctx, text, position)
      }
    }
    
    // Render cursor if in type mode
    if (textSelectionMode === 'type') {
      renderTextCursor(ctx, text, position)
    }
    
    // Render text selection
    if (textSelection.start !== textSelection.end) {
      renderTextSelection(ctx, text, position)
    }
    
    ctx.restore()
  }, [isAddingText, isEditingText, editingTextLayerId, textInput, textPosition, textColor, fontSize, fontFamily, textOrientation, textAlignment, fontWeight, fontStyle, textOpacity, letterSpacing, cursorPosition, textSelection, textSelectionMode, zoom, canvasOffset, layers])

  const renderHorizontalText = useCallback((ctx: CanvasRenderingContext2D, text: string, position: { x: number; y: number }) => {
    const lines = text.split('\n')
    const lineHeightPx = fontSize * lineHeight
    
    lines.forEach((line, index) => {
      const y = position.y + (index * lineHeightPx)
      
      if (textAlignment === 'left') {
        ctx.fillText(line, position.x, y)
      } else if (textAlignment === 'center') {
        const metrics = ctx.measureText(line)
        ctx.fillText(line, position.x - metrics.width / 2, y)
      } else if (textAlignment === 'right') {
        const metrics = ctx.measureText(line)
        ctx.fillText(line, position.x - metrics.width, y)
      }
      
      // Render underline if needed
      if (textUnderline) {
        const metrics = ctx.measureText(line)
        let underlineX = position.x
        let underlineY = y + fontSize + 2
        
        if (textAlignment === 'center') {
          underlineX = position.x - metrics.width / 2
        } else if (textAlignment === 'right') {
          underlineX = position.x - metrics.width
        }
        
        ctx.beginPath()
        ctx.moveTo(underlineX, underlineY)
        ctx.lineTo(underlineX + metrics.width, underlineY)
        ctx.strokeStyle = textColor
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })
  }, [fontSize, lineHeight, textAlignment, textUnderline, textColor])

  const renderVerticalText = useCallback((ctx: CanvasRenderingContext2D, text: string, position: { x: number; y: number }) => {
    const chars = text.split('')
    const charWidth = fontSize * 0.6 // Approximate character width
    const charSpacing = fontSize + letterSpacing
    
    chars.forEach((char, index) => {
      const x = position.x + (index * charSpacing)
      ctx.fillText(char, x, position.y)
      
      // Render underline if needed
      if (textUnderline && char !== ' ' && char !== '\n') {
        ctx.beginPath()
        ctx.moveTo(x, position.y + fontSize + 2)
        ctx.lineTo(x + charWidth, position.y + fontSize + 2)
        ctx.strokeStyle = textColor
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })
  }, [fontSize, letterSpacing, textUnderline, textColor])

  const renderTextCursor = useCallback((ctx: CanvasRenderingContext2D, text: string, position: { x: number; y: number }) => {
    const beforeCursor = text.substring(0, cursorPosition)
    const metrics = ctx.measureText(beforeCursor)
    let cursorX = position.x
    let cursorY = position.y
    
    if (textOrientation === 'horizontal') {
      if (textAlignment === 'left') {
        cursorX = position.x + metrics.width
      } else if (textAlignment === 'center') {
        cursorX = position.x + metrics.width - ctx.measureText(text).width / 2
      } else if (textAlignment === 'right') {
        cursorX = position.x + metrics.width - ctx.measureText(text).width
      }
      
      // Handle multi-line text
      const lines = beforeCursor.split('\n')
      if (lines.length > 1) {
        cursorY = position.y + ((lines.length - 1) * fontSize * lineHeight)
        const lastLine = lines[lines.length - 1]
        cursorX = position.x + ctx.measureText(lastLine).width
        if (textAlignment === 'center') {
          cursorX = position.x + ctx.measureText(lastLine).width - ctx.measureText(text.split('\n')[lines.length - 1]).width / 2
        } else if (textAlignment === 'right') {
          cursorX = position.x + ctx.measureText(lastLine).width - ctx.measureText(text.split('\n')[lines.length - 1]).width
        }
      }
    } else {
      // Vertical text cursor
      cursorX = position.x + (cursorPosition * (fontSize + letterSpacing))
    }
    
    // Draw cursor
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.beginPath()
    if (textOrientation === 'horizontal') {
      ctx.moveTo(cursorX, cursorY)
      ctx.lineTo(cursorX, cursorY + fontSize)
    } else {
      ctx.moveTo(cursorX, cursorY)
      ctx.lineTo(cursorX + fontSize * 0.6, cursorY)
    }
    ctx.stroke()
  }, [cursorPosition, textOrientation, textAlignment, fontSize, lineHeight, letterSpacing])

  const renderTextSelection = useCallback((ctx: CanvasRenderingContext2D, text: string, position: { x: number; y: number }) => {
    const start = Math.min(textSelection.start, textSelection.end)
    const end = Math.max(textSelection.start, textSelection.end)
    const selectedText = text.substring(start, end)
    const beforeSelection = text.substring(0, start)
    
    const beforeMetrics = ctx.measureText(beforeSelection)
    const selectionMetrics = ctx.measureText(selectedText)
    
    let selectionX = position.x
    let selectionY = position.y
    
    if (textOrientation === 'horizontal') {
      if (textAlignment === 'left') {
        selectionX = position.x + beforeMetrics.width
      } else if (textAlignment === 'center') {
        selectionX = position.x + beforeMetrics.width - ctx.measureText(text).width / 2
      } else if (textAlignment === 'right') {
        selectionX = position.x + beforeMetrics.width - ctx.measureText(text).width
      }
      
      // Handle multi-line selection
      const beforeLines = beforeSelection.split('\n')
      if (beforeLines.length > 1) {
        selectionY = position.y + ((beforeLines.length - 1) * fontSize * lineHeight)
        const lastBeforeLine = beforeLines[beforeLines.length - 1]
        selectionX = position.x + ctx.measureText(lastBeforeLine).width
        if (textAlignment === 'center') {
          selectionX = position.x + ctx.measureText(lastBeforeLine).width - ctx.measureText(text.split('\n')[beforeLines.length - 1]).width / 2
        } else if (textAlignment === 'right') {
          selectionX = position.x + ctx.measureText(lastBeforeLine).width - ctx.measureText(text.split('\n')[beforeLines.length - 1]).width
        }
      }
      
      // Draw selection background
      ctx.fillStyle = 'rgba(0, 120, 255, 0.3)'
      if (textOrientation === 'horizontal') {
        ctx.fillRect(selectionX, selectionY, selectionMetrics.width, fontSize)
      }
    }
  }, [textSelection, textOrientation, textAlignment, fontSize, lineHeight])

  const handleTextInput = useCallback((value: string) => {
    // Only update cursor position if text actually changed and we're not in the middle of editing
    if (value !== textInput) {
      setTextInput(value)
      // Don't reset cursor position - let it remain where user is typing
      // setCursorPosition(value.length) // This was causing the issue
    }
  }, [textInput])

  const handleTextMouseDown = useCallback((e: React.MouseEvent) => {
    if (textSelectionMode === 'select') {
      // Calculate cursor position from mouse position
      // This is complex and would need text measurement calculations
      setTextSelectionMode('type')
    }
  }, [textSelectionMode])

  const handleTextMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle text selection dragging
  }, [])

  const handleTextMouseUp = useCallback((e: React.MouseEvent) => {
    // Handle text selection end
  }, [])

  const updateTextLayer = useCallback(() => {
    if (!editingTextLayerId || !canvasRef.current) return
    
    const updatedLayers = layers.map(layer => 
      layer.id === editingTextLayerId 
        ? { 
            ...layer, 
            text: textInput,
            fontSize,
            fontFamily,
            color: textColor,
            opacity: textOpacity,
            textOrientation,
            textAlignment,
            fontWeight,
            fontStyle,
            textUnderline,
            letterSpacing,
            lineHeight
          }
        : layer
    )
    
    setLayers(updatedLayers)
    redrawCanvasRef.current?.(updatedLayers)
    
    // Save to history
    const historyEntry: EditHistory = {
      id: Date.now().toString(),
      action: 'Edit Text',
      layerId: editingTextLayerId,
      layerName: `Text: ${textInput.substring(0, 20)}${textInput.length > 20 ? '...' : ''}`,
      previousState: layers.find(l => l.id === editingTextLayerId),
      newState: updatedLayers.find(l => l.id === editingTextLayerId),
      timestamp: new Date()
    }
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry])
    setHistoryIndex(prev => prev + 1)
    
    // Reset editing state
    setIsEditingText(false)
    setEditingTextLayerId(null)
    setTextInput('')
    
    toast({
      title: "Text Updated",
      description: "Text layer has been updated",
    })
  }, [editingTextLayerId, textInput, fontSize, fontFamily, textColor, textOpacity, layers, historyIndex, toast])

  const applyText = useCallback(() => {
    if (!canvasRef.current) return
    
    // Allow empty text layers for immediate editing, but use "Lorem ipsum" as default
    const displayText = textInput.trim() || 'Lorem ipsum'
    
    // Create a new text layer
    const newTextLayer: Layer = {
      id: Date.now().toString(),
      name: `Text: ${displayText.substring(0, 20)}${displayText.length > 20 ? '...' : ''}`,
      type: 'text',
      visible: true,
      locked: false,
      opacity: textOpacity,
      position: { x: textPosition.x, y: textPosition.y },
      size: { 
        width: Math.max(100, displayText.length * fontSize * 0.6), 
        height: fontSize * 1.2 
      },
      blendMode: 'source-over',
      text: displayText,
      fontSize: fontSize,
      fontFamily: fontFamily,
      color: textColor,
      textOrientation: textOrientation,
      textAlignment: textAlignment,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      textUnderline: textUnderline,
      letterSpacing: letterSpacing,
      lineHeight: lineHeight
    }
    
    // Add the text layer to the layers array
    const updatedLayers = [...layers, newTextLayer]
    setLayers(updatedLayers)
    setSelectedLayer(newTextLayer.id)
    
    // Redraw canvas with the new text layer
    redrawCanvasRef.current?.(updatedLayers)
    
    // Save to history
    const historyEntry: EditHistory = {
      id: Date.now().toString(),
      action: 'Add Text',
      layerId: newTextLayer.id,
      layerName: newTextLayer.name,
      previousState: null,
      newState: newTextLayer,
      timestamp: new Date()
    }
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry])
    setHistoryIndex(prev => prev + 1)
    
    // Reset text tool state
    setIsAddingText(false)
    setTextInput('')
    setCursorPosition(0)
    
    toast({
      title: "Text Added",
      description: `"${displayText}" has been added to the canvas`,
    })
  }, [textInput, textPosition, fontSize, fontFamily, textColor, textOpacity, layers, historyIndex, toast])

  const cancelText = useCallback(() => {
    setIsAddingText(false)
    setIsEditingText(false)
    setEditingTextLayerId(null)
    setTextInput('')
    setCursorPosition(0)
    setTextSelection({ start: 0, end: 0 })
  }, [])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      
      // Handle layer-based operations (like move, add shape, etc.)
      if (nextState.previousState && nextState.newState) {
        // Restore the next layer state
        setLayers(prevLayers => 
          prevLayers.map(layer => 
            layer.id === nextState.layerId 
              ? { ...nextState.newState }
              : layer
          )
        )
        
        // Update selected layer if needed
        if (nextState.layerId) {
          setSelectedLayer(nextState.layerId)
        }
        
        // Redraw canvas with restored layer
        setTimeout(() => {
          const updatedLayers = layers.map(layer => 
            layer.id === nextState.layerId 
              ? { ...nextState.newState }
              : layer
          )
          redrawCanvasRef.current?.(updatedLayers)
        }, 0)
        
        setHistoryIndex(prev => prev + 1)
        console.log(`Redid layer operation: ${nextState.action}`)
      }
      // Handle image-based operations (filters, adjustments, etc.)
      else if (nextState.imageData && canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = nextState.imageData.width
          canvas.height = nextState.imageData.height
          ctx.putImageData(nextState.imageData, 0, 0)
          setHistoryIndex(prev => prev + 1)
          console.log(`Redid image operation: ${nextState.action}`)
        }
      }
    }
  }, [history, historyIndex, layers])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 's':
            e.preventDefault()
            if (selectedImage) {
              handleExport()
            }
            break
          case 'e':
            e.preventDefault()
            if (selectedImage) {
              handleExport()
            }
            break
          case 'o':
            e.preventDefault()
            fileInputRef.current?.click()
            break
        }
      }
      
      // Handle Escape key to cancel crop or close dialogs
      if (e.key === 'Escape') {
        if (cropMode) {
          cancelCrop()
        } else if (showExportDialog) {
          setShowExportDialog(false)
        } else if (showTextToImageDialog) {
          setShowTextToImageDialog(false)
        }
        return
      }
      
      // Handle H key to toggle histogram
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only toggle histogram if not in text input mode
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          setShowHistogram(prev => !prev)
        }
      }
      
      // Handle Enter key to apply crop
      if (e.key === 'Enter' && cropMode) {
        applyCrop()
        return
      }
      
      // Tool shortcuts
      switch (e.key) {
        case 'v':
          if (!isAddingText) {
            setSelectedTool('move')
          }
          break
        case 'b':
          if (!isAddingText) {
            setSelectedTool('brush')
          }
          break
        case 'e':
          if (!isAddingText) {
            setSelectedTool('eraser')
          }
          break
        case 'c':
          if (!isAddingText) {
            setSelectedTool('crop')
          }
          break
        case 't':
          if (!isAddingText) {
            setSelectedTool('text')
          }
          break
        case 's':
          if (!e.ctrlKey && !e.metaKey && !isAddingText) {
            setSelectedTool('shape')
          }
          break
      }
      
      // Text tool shortcuts
      if (isAddingText) {
        if (e.key === 'Enter') {
          e.preventDefault()
          applyText()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancelText()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, cropMode, cancelCrop, applyCrop, isAddingText, applyText, cancelText, selectedImage, showExportDialog, showTextToImageDialog, handleExport, showHistogram])

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

    setIsUploading(true)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setSelectedImage(result)
      
      toast({
        title: "Image uploaded successfully",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      })
      
      // Load image to canvas
      const img = new Image()
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Clear canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            canvas.width = img.width
            canvas.height = img.height
            
            // Fill with white background first
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            ctx.drawImage(img, 0, 0)
            
            // Update canvas size state
            setCanvasSize({ width: img.width, height: img.height })
            
            // Get image data for layer
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            // Create initial layer
            const newLayer: Layer = {
              id: Date.now().toString(),
              name: 'Background',
              type: 'background',
              visible: true,
              locked: true,
              opacity: 100,
              position: { x: 0, y: 0 },
              size: { width: img.width, height: img.height },
              blendMode: 'source-over',
              imageData: imageData
            }
            setLayers([newLayer])
            setSelectedLayer(newLayer.id)
            
            // Reset adjustment values to default
            setBrightness([100])
            setContrast([100])
            setSaturation([100])
            setHue([0])
            setBlur([0])
            setHighlights([0])
            setShadows([0])
            setVignette([0])
            setVignetteSize([50])
            setVignetteFeather([50])
            
            // Redraw canvas with the new layer immediately
            redrawCanvas([newLayer])
            
            // Small delay to ensure canvas is ready before enabling adjustments
            setTimeout(() => {
              setIsUploading(false)
            }, 50)
            
            // Save initial state to history
            const newHistory: EditHistory = {
              id: Date.now().toString(),
              action: 'Image Upload',
              timestamp: new Date(),
              imageData
            }
            setHistory([newHistory])
            setHistoryIndex(0)
          }
        }
      }
      img.src = result
    }
    
    reader.onerror = () => {
      setIsUploading(false)
      toast({
        title: "Upload failed",
        description: "Failed to read the image file",
        variant: "destructive"
      })
    }
    
    reader.readAsDataURL(file)
  }, [toast, redrawCanvas, setBrightness, setContrast, setSaturation, setHue, setBlur, setHighlights, setShadows, setVignette, setVignetteSize, setVignetteFeather])

  // Canvas Drag & Drop Handlers
  const handleCanvasDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedImage) {
      setIsCanvasDragging(true)
      setCanvasDragOver(true)
    }
  }, [selectedImage])

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsCanvasDragging(false)
    setCanvasDragOver(false)
  }, [])

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedImage) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [selectedImage])

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsCanvasDragging(false)
    setCanvasDragOver(false)

    if (selectedImage) return // Don't allow drop when image is already loaded

    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) return

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please drop an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      })
      return
    }

    // Handle the first image file
    const imageFile = imageFiles[0]
    
    // Validate file size (10MB limit)
    if (imageFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive"
      })
      return
    }

    // Process the dropped image
    handleFileUpload(imageFile)
    
    toast({
      title: "Image uploaded",
      description: `${imageFile.name} has been loaded to the canvas`,
    })
  }, [selectedImage, handleFileUpload, toast])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const applyImageAdjustments = useCallback(() => {
    if (!canvasRef.current || !selectedImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Apply CSS filters
      ctx.filter = `
        brightness(${brightness[0]}%) 
        contrast(${contrast[0]}%) 
        saturate(${saturation[0]}%) 
        hue-rotate(${hue[0]}deg) 
        blur(${blur[0]}px)
      `
      
      ctx.drawImage(img, 0, 0)
      
      // Reset filter
      ctx.filter = 'none'
      
      // Get the adjusted image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Update the current layer if it exists
      if (layers.length > 0 && selectedLayer) {
        const updatedLayers = layers.map(layer => 
          layer.id === selectedLayer 
            ? { ...layer, imageData }
            : layer
        )
        setLayers(updatedLayers)
        
        // Redraw canvas with updated layers
        setTimeout(() => {
          redrawCanvas(updatedLayers)
        }, 0)
      }
      
      // Save to history
      const newHistory: EditHistory = {
        id: Date.now().toString(),
        action: 'Image Adjustments',
        timestamp: new Date(),
        imageData
      }
      
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
      setHistoryIndex(prev => prev + 1)
    }
    img.src = selectedImage
  }, [selectedImage, brightness, contrast, saturation, hue, blur, highlights, shadows, vignette, vignetteSize, vignetteFeather, historyIndex, layers, selectedLayer, redrawCanvas])

  // Calculate histogram from image data
  const calculateHistogram = useCallback((imageData: ImageData) => {
    const histogram = new Array(256).fill(0)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      // Calculate luminance (brightness) value
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      histogram[luminance]++
    }
    
    // Normalize histogram values for display
    const maxValue = Math.max(...histogram)
    if (maxValue > 0) {
      return histogram.map(value => (value / maxValue) * 100)
    }
    return histogram
  }, [])

  // Update histogram when image or adjustments change
  const updateHistogram = useCallback(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const histogram = calculateHistogram(imageData)
      setHistogramData(histogram)
    } catch (error) {
      console.error('Error calculating histogram:', error)
    }
  }, [calculateHistogram])

  // Real-time adjustments function
  const applyRealTimeAdjustments = useCallback(() => {
    if (!canvasRef.current || !selectedImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Get image data for pixel-level adjustments
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Apply highlights and shadows (pixel-level adjustments)
      if (highlights[0] !== 0 || shadows[0] !== 0) {
        imageData = ImageProcessor.applyHighlights(imageData, highlights[0])
        imageData = ImageProcessor.applyShadows(imageData, shadows[0])
        ctx.putImageData(imageData, 0, 0)
      }
      
      // Apply vignette if enabled
      if (vignette[0] !== 0) {
        imageData = ImageProcessor.applyVignette(imageData, vignette[0], vignetteSize[0], vignetteFeather[0])
        ctx.putImageData(imageData, 0, 0)
      }
      
      // Apply CSS filters for remaining adjustments
      ctx.filter = `
        brightness(${brightness[0]}%) 
        contrast(${contrast[0]}%) 
        saturate(${saturation[0]}%) 
        hue-rotate(${hue[0]}deg) 
        blur(${blur[0]}px)
      `
      
      // Redraw with CSS filters
      ctx.drawImage(canvas, 0, 0)
      
      // Reset filter
      ctx.filter = 'none'
      
      // Update histogram after all adjustments
      updateHistogram()
    }
    img.src = selectedImage
  }, [selectedImage, brightness, contrast, saturation, hue, blur, highlights, shadows, vignette, vignetteSize, vignetteFeather, updateHistogram])

  // Reset adjustments function
  const resetAdjustments = useCallback(() => {
    setBrightness([100])
    setContrast([100])
    setSaturation([100])
    setHue([0])
    setBlur([0])
    setHighlights([0])
    setShadows([0])
    setVignette([0])
    setVignetteSize([50])
    setVignetteFeather([50])
    
    toast({
      title: "Adjustments Reset",
      description: "All adjustments have been reset to default values",
    })
  }, [toast])

  // AI Functions
  const removeBackground = useCallback(async () => {
    if (!canvasRef.current || !selectedImage) return
    
    setIsProcessingAI(true)
    
    try {
      // Show real-time feedback
      toast({
        title: "🤖 AI Processing",
        description: "Removing background with Clipdrop AI...",
      })
      
      // Convert canvas to blob
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return
        
        const formData = new FormData()
        formData.append('image', blob, 'image.png')
        
        const response = await fetch('/api/remove-background', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
          // Load the processed image back to canvas
          const img = new Image()
          img.onload = () => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d')
              if (ctx) {
                canvasRef.current.width = img.width
                canvasRef.current.height = img.height
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
                
                // Save to history
                const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
                const newHistory: EditHistory = {
                  id: Date.now().toString(),
                  action: 'Remove Background (AI)',
                  timestamp: new Date(),
                  imageData
                }
                
                setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
                setHistoryIndex(prev => prev + 1)
                
                toast({
                  title: "✅ Background Removed",
                  description: "AI successfully removed the background",
                })
              }
            }
          }
          img.src = result.processedImage
        } else {
          toast({
            title: "❌ Error",
            description: result.error || "Failed to remove background",
            variant: "destructive"
          })
        }
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to process background removal",
        variant: "destructive"
      })
    } finally {
      setIsProcessingAI(false)
    }
  }, [selectedImage, historyIndex, toast, canvasRef])

  const removeText = useCallback(async () => {
    if (!canvasRef.current || !selectedImage) return
    
    setIsProcessingAI(true)
    
    try {
      // Show real-time feedback
      toast({
        title: "🤖 AI Processing",
        description: "Removing text with Clipdrop AI...",
      })
      
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return
        
        const formData = new FormData()
        formData.append('image', blob, 'image.png')
        
        const response = await fetch('/api/remove-object', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
          const img = new Image()
          img.onload = () => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d')
              if (ctx) {
                canvasRef.current.width = img.width
                canvasRef.current.height = img.height
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
                
                const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
                const newHistory: EditHistory = {
                  id: Date.now().toString(),
                  action: 'Remove Text (AI)',
                  timestamp: new Date(),
                  imageData
                }
                
                setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
                setHistoryIndex(prev => prev + 1)
                
                toast({
                  title: "✅ Text Removed",
                  description: "AI successfully removed all text",
                })
              }
            }
          }
          img.src = result.processedImage
        } else {
          toast({
            title: "❌ Error",
            description: result.error || "Failed to remove text",
            variant: "destructive"
          })
        }
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to process text removal",
        variant: "destructive"
      })
    } finally {
      setIsProcessingAI(false)
    }
  }, [selectedImage, historyIndex, toast, canvasRef])

  const enhanceResolution = useCallback(async () => {
    if (!canvasRef.current || !selectedImage) return
    
    setIsProcessingAI(true)
    
    try {
      // Show real-time feedback
      toast({
        title: "🤖 AI Processing",
        description: "Enhancing resolution 2x with Clipdrop AI...",
      })
      
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return
        
        const formData = new FormData()
        formData.append('image', blob, 'image.png')
        
        const response = await fetch('/api/enhance-resolution', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
          const img = new Image()
          img.onload = () => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d')
              if (ctx) {
                canvasRef.current.width = img.width
                canvasRef.current.height = img.height
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
                
                const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
                const newHistory: EditHistory = {
                  id: Date.now().toString(),
                  action: 'Enhance Resolution 2x (AI)',
                  timestamp: new Date(),
                  imageData
                }
                
                setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
                setHistoryIndex(prev => prev + 1)
                
                toast({
                  title: "✅ Resolution Enhanced",
                  description: "AI enhanced resolution by 2x",
                })
              }
            }
          }
          img.src = result.processedImage
        } else {
          toast({
            title: "❌ Error",
            description: result.error || "Failed to enhance resolution",
            variant: "destructive"
          })
        }
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to process resolution enhancement",
        variant: "destructive"
      })
    } finally {
      setIsProcessingAI(false)
    }
  }, [selectedImage, historyIndex, toast, canvasRef])

  const generateTextToImage = useCallback(async () => {
    if (!textToImagePrompt.trim()) return
    
    setIsProcessingAI(true)
    setIsUploading(true) // Prevent adjustment interference
    
    try {
      // Show real-time feedback
      toast({
        title: "🤖 AI Creating Image",
        description: "Generating image from your text...",
      })
      
      const response = await fetch('/api/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToImagePrompt.trim()
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const img = new Image()
        img.onload = () => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
              // Set canvas size to match generated image
              canvasRef.current.width = img.width
              canvasRef.current.height = img.height
              
              // Clear canvas and draw the generated image
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
              ctx.drawImage(img, 0, 0)
              
              // Update canvas size state
              setCanvasSize({ width: img.width, height: img.height })
              
              // Set the generated image as selected image
              setSelectedImage(result.image)
              
              // Save to history
              const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
              const newHistory: EditHistory = {
                id: Date.now().toString(),
                action: 'Text to Image (AI)',
                timestamp: new Date(),
                imageData
              }
              
              setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
              setHistoryIndex(prev => prev + 1)
              
              toast({
                title: "✅ Image Generated",
                description: "AI created an image from your text",
              })
            }
          }
        }
        img.src = result.image
        
        // Close the dialog
        setShowTextToImageDialog(false)
        setTextToImagePrompt('')
      } else {
        toast({
          title: "❌ Error",
          description: result.error || "Failed to generate image",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Text-to-image error:', error)
      toast({
        title: "❌ Error",
        description: "Failed to generate image",
        variant: "destructive"
      })
    } finally {
      setIsProcessingAI(false)
      setIsUploading(false)
    }
  }, [textToImagePrompt, historyIndex, toast, canvasRef])

  // Apply real-time adjustments when values change (but not during upload)
  useEffect(() => {
    if (selectedImage && !isUploading) {
      applyRealTimeAdjustments()
    }
  }, [brightness, contrast, saturation, hue, blur, selectedImage, applyRealTimeAdjustments, isUploading])

  // Update histogram when image loads
  useEffect(() => {
    if (selectedImage) {
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        updateHistogram()
      }, 100)
    }
  }, [selectedImage, updateHistogram])

  // Debounced save to history when adjustments stop changing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedImage && (brightness[0] !== 100 || contrast[0] !== 100 || saturation[0] !== 100 || hue[0] !== 0 || blur[0] !== 0 || highlights[0] !== 0 || shadows[0] !== 0 || vignette[0] !== 0)) {
        // Save current state to history
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const newHistory: EditHistory = {
              id: Date.now().toString(),
              action: 'Image Adjustments',
              timestamp: new Date(),
              imageData
            }
            setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
            setHistoryIndex(prev => prev + 1)
          }
        }
      }
    }, 1000) // Wait 1 second after adjustments stop

    return () => clearTimeout(timeoutId)
  }, [brightness, contrast, saturation, hue, blur, highlights, shadows, vignette, selectedImage, historyIndex])

  const applyFilter = useCallback((filterName: string) => {
    if (!canvasRef.current || !selectedImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const filter = FILTERS.find(f => f.name === filterName)
      
      if (filter) {
        const processedData = filter.apply(imageData)
        ctx.putImageData(processedData, 0, 0)
        
        // Get the filtered image data
        const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        // Update the current layer if it exists
        if (layers.length > 0 && selectedLayer) {
          const updatedLayers = layers.map(layer => 
            layer.id === selectedLayer 
              ? { ...layer, imageData: newImageData }
              : layer
          )
          setLayers(updatedLayers)
          
          // Redraw canvas with updated layers
          setTimeout(() => {
            redrawCanvas(updatedLayers)
          }, 0)
        }
        
        // Save to history
        const newHistory: EditHistory = {
          id: Date.now().toString(),
          action: `Apply ${filterName} Filter`,
          timestamp: new Date(),
          imageData: newImageData
        }
        
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
        setHistoryIndex(prev => prev + 1)
      }
    }
    img.src = selectedImage
  }, [selectedImage, historyIndex, layers, selectedLayer, redrawCanvas])

  const applyFrequencyDomainFilter = useCallback((filterName: string) => {
    if (!canvasRef.current || !selectedImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const filter = FREQUENCY_DOMAIN_FILTERS.find(f => f.name === filterName)
      
      if (filter) {
        setIsProcessing(true)
        const startTime = performance.now()
        
        // Capture original image before processing
        const originalImageString = canvas.toDataURL('image/png')
        
        // Use setTimeout to prevent UI blocking during heavy computations
        setTimeout(() => {
          try {
            const processedData = filter.apply(imageData)
            ctx.putImageData(processedData, 0, 0)
            const endTime = performance.now()
            const processingTime = Math.round(endTime - startTime)
            
            // Capture processed image
            const processedImageString = canvas.toDataURL('image/png')
            
            // Calculate frequency analysis data
            const analysisData = calculateFrequencyAnalysis(processedData)
            
            // Save to analysis history
            const historyEntry = {
              id: Date.now().toString(),
              timestamp: new Date(),
              filterName,
              originalImage: originalImageString,
              processedImage: processedImageString,
              analysisData,
              processingTime
            }
            
            setAnalysisHistory(prev => [historyEntry, ...prev].slice(0, 20)) // Keep last 20 analyses
            
            setIsProcessing(false)
            
            // Save to regular history
            const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const newHistory: EditHistory = {
              id: Date.now().toString(),
              action: `Apply ${filterName} Frequency Filter`,
              timestamp: new Date(),
              imageData: newImageData
            }
            
            setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
            setHistoryIndex(prev => prev + 1)
            
            // Show success toast with analysis info
            toast({
              title: "Frequency filter applied",
              description: `${filterName} completed in ${processingTime}ms | Mean freq: ${analysisData.meanFrequency.toFixed(2)}`,
            })
          } catch (error) {
            console.error('Frequency domain filter error:', error)
            setIsProcessing(false)
            
            // Show error toast
            toast({
              title: "Processing Error",
              description: `Failed to apply ${filterName}. Please try with a smaller image.`,
              variant: "destructive"
            })
          }
        }, 100)
      }
    }
    img.src = selectedImage
  }, [selectedImage, historyIndex, toast])

  // Calculate frequency analysis data from image data
  const calculateFrequencyAnalysis = useCallback((imageData: ImageData) => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Convert to grayscale for frequency analysis
    const grayscale = new Float32Array(width * height)
    for (let i = 0; i < data.length; i += 4) {
      grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    }
    
    // Calculate basic statistics
    let sum = 0
    let min = Infinity
    let max = -Infinity
    let sumSquares = 0
    
    for (let i = 0; i < grayscale.length; i++) {
      const value = grayscale[i]
      sum += value
      sumSquares += value * value
      min = Math.min(min, value)
      max = Math.max(max, value)
    }
    
    const mean = sum / grayscale.length
    const variance = (sumSquares / grayscale.length) - (mean * mean)
    const stdDev = Math.sqrt(Math.max(0, variance))
    
    // Calculate entropy (simplified)
    const histogram = new Array(256).fill(0)
    for (let i = 0; i < grayscale.length; i++) {
      histogram[Math.round(grayscale[i])]++
    }
    
    let entropy = 0
    for (let i = 0; i < 256; i++) {
      if (histogram[i] > 0) {
        const probability = histogram[i] / grayscale.length
        entropy -= probability * Math.log2(probability)
      }
    }
    
    // Estimate dominant frequency (simplified - based on edge detection)
    let dominantFrequency = 0
    let edgeCount = 0
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        const gx = grayscale[idx + 1] - grayscale[idx - 1]
        const gy = grayscale[idx + width] - grayscale[idx - width]
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        
        if (magnitude > 30) { // Edge threshold
          edgeCount++
          dominantFrequency += magnitude
        }
      }
    }
    
    dominantFrequency = edgeCount > 0 ? dominantFrequency / edgeCount : 0
    
    return {
      meanFrequency: mean,
      maxFrequency: max,
      minFrequency: min,
      dominantFrequency,
      entropy,
      energy: sumSquares / grayscale.length
    }
  }, [])

  const applyTransformation = useCallback((type: string) => {
    if (!canvasRef.current) {
      console.log('No canvas ref')
      return
    }
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('No canvas context')
      return
    }
    
    console.log(`Applying ${type} transformation`)
    
    switch (type) {
      case 'rotate':
        console.log(`Rotation angle: ${rotation[0]}`)
        if (rotation[0] === 0) {
          console.log('Rotation angle is 0, skipping')
          return
        }
        // Apply rotation using ImageProcessor
        ImageProcessor.rotateCanvas(canvas, rotation[0])
        // Reset rotation after applying
        setRotation([0])
        console.log('Rotation applied and reset')
        break
      case 'rotate90cw':
        ImageProcessor.rotate90Clockwise(canvas)
        console.log('90° clockwise rotation applied')
        break
      case 'rotate90ccw':
        ImageProcessor.rotate90CounterClockwise(canvas)
        console.log('90° counter-clockwise rotation applied')
        break
      case 'flipHorizontal':
        ImageProcessor.flipHorizontal(canvas)
        console.log('Horizontal flip applied')
        break
      case 'flipVertical':
        ImageProcessor.flipVertical(canvas)
        console.log('Vertical flip applied')
        break
    }
    
    // Update canvas size state
    setCanvasSize({ width: canvas.width, height: canvas.height })
    
    // Save to history
    const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory: EditHistory = {
      id: Date.now().toString(),
      action: `Apply ${type} Transformation`,
      timestamp: new Date(),
      imageData: newImageData
    }
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
    setHistoryIndex(prev => prev + 1)
    console.log('Transformation saved to history')
  }, [rotation, historyIndex])

  const applyMorphologicalFilter = useCallback((filterName: string) => {
    if (!canvasRef.current || !selectedImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const filter = MORPHOLOGICAL_FILTERS.find(f => f.name === filterName) || 
                   SEGMENTATION_FILTERS.find(f => f.name === filterName)
      
      if (filter) {
        const processedData = filter.apply(imageData, kernelSize[0])
        ctx.putImageData(processedData, 0, 0)
        
        // Save to history
        const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const newHistory: EditHistory = {
          id: Date.now().toString(),
          action: `Apply ${filterName} (${kernelSize[0]}x${kernelSize[0]})`,
          timestamp: new Date(),
          imageData: newImageData
        }
        
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
        setHistoryIndex(prev => prev + 1)
      }
    }
    img.src = selectedImage
  }, [selectedImage, kernelSize, historyIndex, MORPHOLOGICAL_FILTERS, SEGMENTATION_FILTERS])

  const applyEnhancementFilter = useCallback((filterName: string) => {
    if (!canvasRef.current || !selectedImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const filter = ENHANCEMENT_FILTERS.find(f => f.name === filterName)
      
      if (filter) {
        setIsProcessing(true)
        const processedData = filter.apply(imageData)
        ctx.putImageData(processedData, 0, 0)
        setIsProcessing(false)
        
        // Save to history
        const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const newHistory: EditHistory = {
          id: Date.now().toString(),
          action: `Apply ${filterName} Enhancement`,
          timestamp: new Date(),
          imageData: newImageData
        }
        
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
        setHistoryIndex(prev => prev + 1)
      }
    }
    img.src = selectedImage
  }, [selectedImage, historyIndex])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || typeof window === 'undefined') return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scale = zoom / 100
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale
    
    console.log(`Mouse down at canvas coords: ${x}, ${y}`)
    
    // Handle AI selection mode
    if (selectionMode) {
      setIsSelecting(true)
      setSelectionStart({ x, y })
      setSelectionArea({ x, y, width: 0, height: 0 })
      return
    }
    
    if (selectedTool === 'move') {
      // Check if we have a selected layer that can be moved
      const currentLayer = layers.find(l => l.id === selectedLayer)
      if (currentLayer && !currentLayer.locked) {
        setIsDragging(true)
        // Store the starting mouse position relative to the layer position
        setDragStart({ 
          x: e.clientX - currentLayer.position.x, 
          y: e.clientY - currentLayer.position.y 
        })
        // Store the initial layer state for undo/redo
        setInitialLayerState({ ...currentLayer })
        console.log(`Starting layer drag at: ${e.clientX}, ${e.clientY}, layer: ${currentLayer.name}`)
      } else {
        // If no movable layer selected, fall back to canvas panning
        setIsDragging(true)
        setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y })
        console.log(`Starting canvas pan at: ${e.clientX}, ${e.clientY}`)
      }
    } else if (selectedTool === 'select') {
      setIsSelecting(true)
      setSelectionArea({ x, y, width: 0, height: 0 })
      console.log(`Starting selection at: ${x}, ${y}`)
    } else if (selectedTool === 'brush' || selectedTool === 'eraser') {
      setIsDrawing(true)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else if (selectedTool === 'crop') {
      handleCropMouseDown(e)
      console.log(`Starting crop at: ${x}, ${y}`)
    } else if (selectedTool === 'text') {
      // Show confirmation dialog for text creation
      if (typeof window !== 'undefined') {
        const confirmCreate = window.confirm('Do you want to create text?')
        if (!confirmCreate) {
          return // User cancelled, don't create text
        }
      } else {
        return // Skip on server-side
      }
      
      // Check if clicking on existing text layer to edit it
      const clickedLayer = layers.find(layer => {
        if (layer.type !== 'text' || !layer.visible) return false
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return false
        
        // Set font to measure text
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
        const metrics = ctx.measureText(layer.text || '')
        
        // Check if click is within text bounds (simplified)
        const textWidth = metrics.width
        const textHeight = layer.fontSize
        
        return x >= layer.position.x && 
               x <= layer.position.x + textWidth &&
               y >= layer.position.y && 
               y <= layer.position.y + textHeight
      })
      
      if (clickedLayer) {
        // Edit existing text layer
        setIsEditingText(true)
        setEditingTextLayerId(clickedLayer.id)
        setTextInput(clickedLayer.text || '')
        setCursorPosition(clickedLayer.text?.length || 0)
        setTextPosition(clickedLayer.position)
        setTextColor(clickedLayer.color || '#000000')
        setFontSize(clickedLayer.fontSize || 24)
        setFontFamily(clickedLayer.fontFamily || 'Arial')
        console.log(`Editing text layer: ${clickedLayer.name}`)
      } else {
        // Create new text with default "Lorem ipsum" text
        const defaultText = 'Lorem ipsum'
        setTextPosition({ x, y })
        setIsAddingText(true)
        setTextInput(defaultText)
        setCursorPosition(defaultText.length)
        console.log(`Creating text at: ${x}, ${y} with default text: ${defaultText}`)
      }
    } else if (selectedTool === 'shape') {
      // Start drawing a shape
      setIsDrawingShape(true)
      setShapeStartPos({ x, y })
      
      // Create a temporary shape layer for preview
      const tempShape: Layer = {
        id: 'temp-shape',
        name: `Shape: ${selectedShapeType}`,
        type: 'shape',
        visible: true,
        locked: false,
        opacity: 100,
        position: { x, y },
        size: { width: 0, height: 0 },
        blendMode: 'source-over',
        shapeType: selectedShapeType,
        strokeWidth: brushSize[0],
        color: shapeStrokeColor,
        fillColor: shapeFillEnabled ? shapeFillColor : 'transparent'
      }
      
      setCurrentShape(tempShape)
    }
  }, [selectedTool, brushColor, brushSize, historyIndex, handleCropMouseDown, zoom, canvasOffset, layers, selectedLayer, selectedShapeType, shapeFillColor, shapeStrokeColor, shapeFillEnabled])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || typeof window === 'undefined') return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scale = zoom / 100
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale
    
    // Handle AI selection mode
    if (selectionMode && isSelecting) {
      const width = x - selectionStart.x
      const height = y - selectionStart.y
      
      setSelectionArea({
        x: width < 0 ? x : selectionStart.x,
        y: height < 0 ? y : selectionStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      })
      return
    }
    
    if (isDragging && selectedTool === 'move') {
      const currentLayer = layers.find(l => l.id === selectedLayer)
      if (currentLayer && !currentLayer.locked) {
        // Move the selected layer
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        
        setLayers(prevLayers => 
          prevLayers.map(layer => 
            layer.id === selectedLayer 
              ? { ...layer, position: { x: newX, y: newY } }
              : layer
          )
        )
        
        // Redraw canvas with updated layer position
        const updatedLayers = layers.map(layer => 
          layer.id === selectedLayer 
            ? { ...layer, position: { x: newX, y: newY } }
            : layer
        )
        redrawCanvas(updatedLayers)
        
        console.log(`Moving layer '${currentLayer.name}' to: ${newX}, ${newY}`)
      } else {
        // Canvas panning (fallback when no layer selected)
        const newOffsetX = e.clientX - dragStart.x
        const newOffsetY = e.clientY - dragStart.y
        setCanvasOffset({ x: newOffsetX, y: newOffsetY })
        console.log(`Panning canvas to: ${newOffsetX}, ${newOffsetY}`)
      }
    } else if (isDrawingShape && selectedTool === 'shape') {
      // Update the current shape being drawn
      const width = x - shapeStartPos.x
      const height = y - shapeStartPos.y
      
      if (currentShape) {
        const updatedShape = {
          ...currentShape,
          position: { 
            x: width < 0 ? x : shapeStartPos.x, 
            y: height < 0 ? y : shapeStartPos.y 
          },
          size: { 
            width: Math.abs(width), 
            height: Math.abs(height) 
          }
        }
        setCurrentShape(updatedShape)
        
        // Redraw canvas with the shape preview
        const layersWithPreview = [...layers, updatedShape]
        redrawCanvas(layersWithPreview)
      }
    } else if (isSelecting && selectedTool === 'select') {
      const width = x - selectionArea.x
      const height = y - selectionArea.y
      setSelectionArea(prev => ({ ...prev, width, height }))
      console.log(`Selecting: ${width}x${height}`)
    } else if (isDrawing && (selectedTool === 'brush' || selectedTool === 'eraser')) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Get current layer data if working with layers
      const currentLayer = layers.find(l => l.id === selectedLayer)
      if (currentLayer && !currentLayer.locked) {
        // Save current canvas state to layer
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const updatedLayer = { ...currentLayer, imageData }
        setLayers(prev => prev.map(l => l.id === selectedLayer ? updatedLayer : l))
      }
      
      if (selectedTool === 'brush') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = brushColor
        ctx.lineWidth = brushSize[0]
        ctx.lineCap = 'round'
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (selectedTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = brushSize[0]
        ctx.lineCap = 'round'
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    } else if (cropMode && selectedTool === 'crop' && isDrawing) {
      let newCropArea = {
        ...cropArea,
        width: x - cropArea.x,
        height: y - cropArea.y
      }
      
      // Apply aspect ratio constraint if not custom
      if (selectedAspectRatio !== 'custom') {
        const aspectRatio = aspectRatios.find(ar => ar.id === selectedAspectRatio)?.ratio
        if (aspectRatio) {
          // Maintain aspect ratio
          const currentWidth = Math.abs(newCropArea.width)
          const currentHeight = Math.abs(newCropArea.height)
          const currentRatio = currentWidth / currentHeight
          
          if (currentRatio > aspectRatio) {
            // Width is too large, adjust based on height
            newCropArea.width = Math.sign(newCropArea.width) * (currentHeight * aspectRatio)
          } else {
            // Height is too large, adjust based on width
            newCropArea.height = Math.sign(newCropArea.height) * (currentWidth / aspectRatio)
          }
        }
      }
      
      setCropArea(newCropArea)
      console.log(`Updating crop area:`, newCropArea)
    }
  }, [isDragging, isSelecting, isDrawing, isDrawingShape, selectedTool, brushColor, brushSize, cropMode, cropArea, selectedAspectRatio, aspectRatios, dragStart, canvasOffset, selectionArea, zoom, layers, selectedLayer, shapeStartPos, currentShape, redrawCanvas, selectionMode, selectionStart])

  const handleCanvasMouseUp = useCallback(() => {
    // Handle AI selection mode
    if (selectionMode && isSelecting) {
      setIsSelecting(false)
      return
    }
    
    if (isDragging) {
      setIsDragging(false)
      
      // Check if we moved a layer and record it in history
      const currentLayer = layers.find(l => l.id === selectedLayer)
      if (currentLayer && !currentLayer.locked && initialLayerState) {
        // Only record in history if the position actually changed
        const positionChanged = 
          initialLayerState.position.x !== currentLayer.position.x ||
          initialLayerState.position.y !== currentLayer.position.y
        
        if (positionChanged) {
          // Record layer move in history
          const historyEntry: EditHistory = {
            id: Date.now().toString(),
            action: 'move',
            layerId: selectedLayer,
            layerName: currentLayer.name,
            previousState: initialLayerState,
            newState: { ...currentLayer },
            timestamp: new Date()
          }
          
          setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry])
          setHistoryIndex(prev => prev + 1)
          
          console.log(`Layer move recorded in history: ${currentLayer.name}`)
        }
      }
      
      // Clear the initial layer state
      setInitialLayerState(null)
    } else if (isDrawingShape) {
      setIsDrawingShape(false)
      
      // Finalize the shape if it has a valid size
      if (currentShape && currentShape.size.width > 5 && currentShape.size.height > 5) {
        const finalShape = {
          ...currentShape,
          id: Date.now().toString() // Give it a proper ID
        }
        
        // Add the shape to layers
        const updatedLayers = [...layers, finalShape]
        setLayers(updatedLayers)
        setSelectedLayer(finalShape.id)
        
        // Save to history
        const historyEntry: EditHistory = {
          id: Date.now().toString(),
          action: 'Add Shape',
          layerId: finalShape.id,
          layerName: finalShape.name,
          previousState: null,
          newState: finalShape,
          timestamp: new Date()
        }
        
        setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry])
        setHistoryIndex(prev => prev + 1)
        
        toast({
          title: "Shape Added",
          description: `${selectedShapeType} shape created`,
        })
      }
      
      // Clear the temporary shape
      setCurrentShape(null)
      redrawCanvas(layers) // Redraw without the preview
    } else if (isSelecting) {
      setIsSelecting(false)
      console.log(`Selection ended: ${selectionArea.width}x${selectionArea.height}`)
      if (selectionArea.width > 5 && selectionArea.height > 5) {
        toast({
          title: "Area Selected",
          description: `Selected area: ${Math.abs(selectionArea.width)} × ${Math.abs(selectionArea.height)}px`,
        })
      }
      setSelectionArea({ x: 0, y: 0, width: 0, height: 0 })
    } else if (isDrawing) {
      setIsDrawing(false)
      
      // Save to history and current layer
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Update current layer if working with layers
          const currentLayer = layers.find(l => l.id === selectedLayer)
          if (currentLayer && !currentLayer.locked) {
            const updatedLayer = { ...currentLayer, imageData }
            setLayers(prev => prev.map(l => l.id === selectedLayer ? updatedLayer : l))
          }
          
          const newHistory: EditHistory = {
            id: Date.now().toString(),
            action: `Drawing with ${selectedTool}`,
            timestamp: new Date(),
            imageData
          }
          
          setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
          setHistoryIndex(prev => prev + 1)
        }
      }
    }
  }, [isDragging, isSelecting, isDrawing, isDrawingShape, selectedTool, historyIndex, zoom, canvasOffset, selectionArea, toast, layers, selectedLayer, currentShape, selectedShapeType, redrawCanvas, selectionMode])

  const handleAIProcess = useCallback(async (processType: string) => {
    if (!selectedImage || !canvasRef.current) return
    
    setIsProcessing(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Store original state for rollback
      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const originalImageString = selectedImage
      
      // Use client-side processing for main AI features
      if (['background-removal', 'object-removal', 'super-resolution'].includes(processType)) {
        try {
          switch (processType) {
            case 'background-removal':
              await ClientImageProcessor.removeBackground(canvas, {
                threshold: 0.4, // More sensitive
                smoothing: 2,
                feathering: 3
              })
              
              // Check if background was actually removed
              const processedData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const hasTransparency = Array.from(processedData.data).some((val, idx) => idx % 4 === 3 && val < 255)
              
              if (!hasTransparency) {
                throw new Error('Background removal did not detect any background to remove')
              }
              
              toast({
                title: "Background Removed",
                description: "Background has been successfully removed using AI",
              })
              break
              
            case 'object-removal':
              await ClientImageProcessor.removeObjects(canvas, {
                inpaintingRadius: 20,
                blendMode: 'normal',
                texturePreservation: 0.8
              })
              toast({
                title: "Objects Removed",
                description: "Unwanted objects have been removed using AI",
              })
              break
              
            case 'super-resolution':
              await ClientImageProcessor.enhanceResolution(canvas, {
                scaleFactor: 2,
                sharpening: 1.5,
                noiseReduction: 0.4,
                edgePreservation: 0.9
              })
              toast({
                title: "Resolution Enhanced",
                description: "Image resolution has been enhanced using AI",
              })
              break
          }
          
          // Update canvas size and selected image
          const processedImageData = canvas.toDataURL('image/png')
          setSelectedImage(processedImageData)
          setCanvasSize({ width: canvas.width, height: canvas.height })
          
          // Save to history
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const newHistory: EditHistory = {
            id: Date.now().toString(),
            action: `AI ${processType}`,
            timestamp: new Date(),
            imageData
          }
          setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
          setHistoryIndex(prev => prev + 1)
          
        } catch (clientError) {
          console.error('Client-side processing failed, trying server-side:', clientError)
          
          // Restore original state
          ctx.putImageData(originalImageData, 0, 0)
          
          // Try server-side processing as fallback
          const response = await fetch('/api/ai-process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: originalImageString, 
              processType 
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            
            if (result.processedImage && result.processedImage !== originalImageString) {
              const img = new Image()
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)
                setCanvasSize({ width: img.width, height: img.height })
                setSelectedImage(result.processedImage)
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const newHistory: EditHistory = {
                  id: Date.now().toString(),
                  action: `AI ${processType} (Server)`,
                  timestamp: new Date(),
                  imageData
                }
                setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
                setHistoryIndex(prev => prev + 1)
              }
              img.src = result.processedImage
              
              toast({
                title: "AI Processing Complete",
                description: "Processed using advanced AI servers",
              })
            } else {
              throw new Error('Server processing did not return processed image')
            }
          } else {
            throw new Error('Both client and server processing failed')
          }
        }
        
      } else {
        // Use server-side processing for other features
        const response = await fetch('/api/ai-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: selectedImage, 
            processType 
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          
          if (result.processedImage && result.processedImage !== selectedImage) {
            const img = new Image()
            img.onload = () => {
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)
              setCanvasSize({ width: img.width, height: img.height })
              setSelectedImage(result.processedImage)
              
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const newHistory: EditHistory = {
                id: Date.now().toString(),
                action: `AI ${processType}`,
                timestamp: new Date(),
                imageData
              }
              setHistory(prev => [...prev.slice(0, historyIndex + 1), newHistory])
              setHistoryIndex(prev => prev + 1)
            }
            img.src = result.processedImage
          } else if (result.corrections) {
            const { brightness, contrast, saturation } = result.corrections
            setBrightness([100 + brightness])
            setContrast([100 + contrast])
            setSaturation([100 + saturation])
            
            toast({
              title: "Color Correction Applied",
              description: "AI has analyzed and applied color corrections",
            })
          } else if (result.styleFilters) {
            console.log('Style filters:', result.styleFilters)
            toast({
              title: "Style Transfer Applied",
              description: "Artistic style has been applied to your image",
            })
          } else if (result.enhancements) {
            console.log('Face enhancements:', result.enhancements)
            toast({
              title: "Face Beautification Applied",
              description: "AI has enhanced facial features naturally",
            })
          }
        } else {
          throw new Error('Processing failed')
        }
      }
    } catch (error) {
      console.error('AI processing error:', error)
      
      // Provide helpful error messages
      let errorMessage = "AI processing encountered an error. Please try again."
      
      if (error.message.includes('background')) {
        errorMessage = "Background removal failed. Try using an image with a clear subject and simple background."
      } else if (error.message.includes('object')) {
        errorMessage = "Object removal failed. Try selecting smaller areas or use a different image."
      } else if (error.message.includes('resolution')) {
        errorMessage = "Resolution enhancement failed. The image might be too large or already at maximum resolution."
      }
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => {
            toast({
              title: "Tips for Better Results",
              description: "• Use high-quality images\n• Ensure good lighting and contrast\n• For background removal: use images with clear subjects\n• For object removal: select smaller areas first",
              duration: 8000,
            })
          }}>
            Tips
          </Button>
        )
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedImage, canvasRef, toast, historyIndex])

  const addNewLayer = useCallback((type: Layer['type'] = 'empty') => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let newLayer: Layer
    const layerId = Date.now().toString()
    
    switch (type) {
      case 'text':
        // Show confirmation dialog for text creation
        if (typeof window !== 'undefined') {
          const confirmCreate = window.confirm('Do you want to create text?')
          if (!confirmCreate) {
            break // User cancelled, don't create text
          }
        } else {
          break // Skip on server-side
        }
        
        // Create text layer with "Lorem ipsum" and immediately start editing it
        const defaultText = 'Lorem ipsum'
        newLayer = {
          id: layerId,
          name: `Text: ${defaultText}`,
          type: 'text',
          visible: true,
          locked: false,
          opacity: 100,
          position: { x: canvas.width / 2 - 50, y: canvas.height / 2 },
          size: { width: 100, height: 30 },
          blendMode: 'source-over',
          text: defaultText,
          fontSize: 24,
          fontFamily: 'Arial',
          color: brushColor
        }
        
        // Immediately start editing this new text layer
        setTimeout(() => {
          setIsEditingText(true)
          setEditingTextLayerId(layerId)
          setTextInput(defaultText)
          setCursorPosition(defaultText.length)
          setTextPosition(newLayer.position)
          setTextColor(newLayer.color || '#000000')
          setFontSize(newLayer.fontSize || 24)
          setFontFamily(newLayer.fontFamily || 'Arial')
          setSelectedTool('text')
        }, 100)
        break
        
      case 'shape':
        const shapeType = prompt('Enter shape type (rectangle, circle, triangle):') as 'rectangle' | 'circle' | 'triangle' || 'rectangle'
        newLayer = {
          id: layerId,
          name: `Shape: ${shapeType}`,
          type: 'shape',
          visible: true,
          locked: false,
          opacity: 100,
          position: { x: canvas.width / 2 - 50, y: canvas.height / 2 - 50 },
          size: { width: 100, height: 100 },
          blendMode: 'source-over',
          shapeType: shapeType,
          strokeWidth: 2,
          fillColor: brushColor,
          color: brushColor
        }
        break
        
      case 'image':
        const imageUrl = prompt('Enter image URL:')
        if (imageUrl) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
              tempCanvas.width = img.width
              tempCanvas.height = img.height
              tempCtx.drawImage(img, 0, 0)
              const imageData = tempCtx.getImageData(0, 0, img.width, img.height)
              
              const imageLayer: Layer = {
                id: layerId,
                name: `Image Layer`,
                type: 'image',
                visible: true,
                locked: false,
                opacity: 100,
                position: { x: canvas.width / 2 - img.width / 2, y: canvas.height / 2 - img.height / 2 },
                size: { width: img.width, height: img.height },
                blendMode: 'source-over',
                imageData: imageData
              }
              setLayers(prev => [...prev, imageLayer])
              setSelectedLayer(layerId)
              redrawCanvas([...layers, imageLayer])
            }
          }
          img.src = imageUrl
          return
        } else {
          return
        }
        
      case 'frame':
        newLayer = {
          id: layerId,
          name: `Frame Layer`,
          type: 'frame',
          visible: true,
          locked: false,
          opacity: 100,
          position: { x: 10, y: 10 },
          size: { width: canvas.width - 20, height: canvas.height - 20 },
          blendMode: 'source-over',
          strokeWidth: 5,
          color: '#000000'
        }
        break
        
      case 'empty':
      default:
        newLayer = {
          id: layerId,
          name: `Layer ${layers.length + 1}`,
          type: 'empty',
          visible: true,
          locked: false,
          opacity: 100,
          position: { x: 0, y: 0 },
          size: { width: canvas.width, height: canvas.height },
          blendMode: 'source-over'
        }
        break
    }
    
    setLayers(prev => [...prev, newLayer])
    setSelectedLayer(layerId)
    redrawCanvas([...layers, newLayer])
  }, [layers.length, brushColor, redrawCanvas])

  const duplicateLayer = useCallback((layerId: string) => {
    const layerToDuplicate = layers.find(l => l.id === layerId)
    if (!layerToDuplicate) return
    
    const duplicatedLayer: Layer = {
      ...layerToDuplicate,
      id: Date.now().toString(),
      name: `${layerToDuplicate.name} Copy`,
      locked: false, // Duplicated layers are always unlocked
      position: { 
        x: layerToDuplicate.position.x + 20, 
        y: layerToDuplicate.position.y + 20 
      },
      imageData: layerToDuplicate.imageData ? new ImageData(
        new Uint8ClampedArray(layerToDuplicate.imageData.data),
        layerToDuplicate.imageData.width,
        layerToDuplicate.imageData.height
      ) : undefined
    }
    
    setLayers(prev => [...prev, duplicatedLayer])
    setSelectedLayer(duplicatedLayer.id)
    redrawCanvas([...layers, duplicatedLayer])
  }, [layers, redrawCanvas])

  const mergeLayerDown = useCallback((layerId: string) => {
    const layerIndex = layers.findIndex(l => l.id === layerId)
    if (layerIndex <= 0) return // Can't merge down the bottom layer
    
    const currentLayer = layers[layerIndex]
    const layerBelow = layers[layerIndex - 1]
    
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas and redraw layer below
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (layerBelow.imageData) {
      ctx.putImageData(layerBelow.imageData, layerBelow.position.x, layerBelow.position.y)
    }
    
    // Draw current layer on top with opacity
    ctx.globalAlpha = currentLayer.opacity / 100
    if (currentLayer.imageData) {
      ctx.putImageData(currentLayer.imageData, currentLayer.position.x, currentLayer.position.y)
    }
    ctx.globalAlpha = 1
    
    // Update layer below with merged content
    const mergedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const updatedLayers = [...layers]
    updatedLayers[layerIndex - 1] = {
      ...layerBelow,
      imageData: mergedImageData
    }
    
    // Remove current layer
    updatedLayers.splice(layerIndex, 1)
    setLayers(updatedLayers)
    setSelectedLayer(layerBelow.id)
  }, [layers])

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ))
    redrawCanvas(layers.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ))
  }, [layers, redrawCanvas])

  const updateLayerPosition = useCallback((layerId: string, position: { x: number; y: number }) => {
    const updatedLayers = layers.map(layer => 
      layer.id === layerId ? { ...layer, position } : layer
    )
    setLayers(updatedLayers)
    redrawCanvas(updatedLayers)
  }, [layers, redrawCanvas])

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const updatedLayers = layers.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    )
    setLayers(updatedLayers)
    redrawCanvas(updatedLayers)
  }, [layers, redrawCanvas])

  const toggleLayerLock = useCallback((layerId: string) => {
    const updatedLayers = layers.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    )
    setLayers(updatedLayers)
    redrawCanvas(updatedLayers)
  }, [layers, redrawCanvas])

  const deleteLayer = useCallback((layerId: string) => {
    const layerToDelete = layers.find(l => l.id === layerId)
    if (layerToDelete?.locked) {
      toast({
        title: "Cannot Delete Layer",
        description: "This layer is locked. Unlock it first.",
        variant: "destructive"
      })
      return
    }
    
    if (layers.length <= 1) return // Can't delete the last layer
    
    const updatedLayers = layers.filter(layer => layer.id !== layerId)
    setLayers(updatedLayers)
    
    if (selectedLayer === layerId) {
      setSelectedLayer(updatedLayers[0]?.id || null)
    }
    
    redrawCanvas(updatedLayers)
  }, [layers, selectedLayer, redrawCanvas, toast])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Mini Adobe...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold font-meow-script">Mini Adobe</h1>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Brain className="h-3 w-3" />
              Clipdrop AI
            </Badge>
            <Badge variant="outline" className="text-xs">
              Ctrl+Z: Undo | Ctrl+S: Export | B: Brush | E: Eraser | C: Crop | S: Shape
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTextToImageDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Text to Image
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Tools */}
        <div className="w-20 border-r bg-card p-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              <Button 
                variant={selectedTool === 'select' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setSelectedTool('select')}
              >
                <MousePointer className="h-5 w-5" />
                <span className="text-xs">Select</span>
              </Button>
              <Button 
                variant={selectedTool === 'move' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setSelectedTool('move')}
              >
                <Move className="h-5 w-5" />
                <span className="text-xs">Move</span>
              </Button>
              <Button 
                variant={selectedTool === 'crop' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => {
                  if (cropMode) {
                    applyCrop()
                  } else {
                    setSelectedTool('crop')
                    setCropMode(true)
                    // Initialize a default crop area if none exists
                    if (cropArea.width === 0 && cropArea.height === 0 && canvasRef.current) {
                      const canvas = canvasRef.current
                      const defaultCropSize = Math.min(canvas.width, canvas.height) * 0.8
                      setCropArea({
                        x: (canvas.width - defaultCropSize) / 2,
                        y: (canvas.height - defaultCropSize) / 2,
                        width: defaultCropSize,
                        height: defaultCropSize
                      })
                    }
                  }
                }}
              >
                <Crop className="h-5 w-5" />
                <span className="text-xs">{cropMode ? 'Apply' : 'Crop'}</span>
              </Button>
              {cropMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-8 flex-col text-xs"
                  onClick={cancelCrop}
                >
                  Cancel Crop
                </Button>
              )}
              <Separator />
              <Button 
                variant={selectedTool === 'brush' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setSelectedTool('brush')}
              >
                <Brush className="h-5 w-5" />
                <span className="text-xs">Brush</span>
              </Button>
              <Button 
                variant={selectedTool === 'text' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setSelectedTool('text')}
              >
                <Type className="h-5 w-5" />
                <span className="text-xs">Text</span>
              </Button>
              <Button 
                variant={selectedTool === 'shape' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setSelectedTool('shape')}
              >
                <Square className="h-5 w-5" />
                <span className="text-xs">Shape</span>
              </Button>
              
              {/* Shape Type Selector */}
              {selectedTool === 'shape' && (
                <div className="space-y-2 pb-2 border-b">
                  <select 
                    className="w-full p-1 text-xs border rounded bg-background"
                    value={selectedShapeType}
                    onChange={(e) => setSelectedShapeType(e.target.value as 'rectangle' | 'circle' | 'triangle' | 'line')}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="triangle">Triangle</option>
                    <option value="line">Line</option>
                  </select>
                  
                  {/* Shape Colors */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="shape-fill-toggle"
                        checked={shapeFillEnabled}
                        onChange={(e) => setShapeFillEnabled(e.target.checked)}
                        className="w-3 h-3 rounded cursor-pointer"
                      />
                      <label htmlFor="shape-fill-toggle" className="text-xs text-muted-foreground cursor-pointer">
                        Fill Shape
                      </label>
                    </div>
                    
                    {shapeFillEnabled && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={shapeFillColor}
                            onChange={(e) => setShapeFillColor(e.target.value)}
                            className="w-4 h-4 border rounded cursor-pointer"
                            title="Fill Color"
                          />
                          <span className="text-xs text-muted-foreground">Fill Color</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={shapeStrokeColor}
                        onChange={(e) => setShapeStrokeColor(e.target.value)}
                        className="w-4 h-4 border rounded cursor-pointer"
                        title="Stroke Color"
                      />
                      <span className="text-xs text-muted-foreground">Stroke Color</span>
                    </div>
                  </div>
                </div>
              )}
              <Button 
                variant={selectedTool === 'eraser' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setSelectedTool('eraser')}
              >
                <Eraser className="h-5 w-5" />
                <span className="text-xs">Eraser</span>
              </Button>
              <Separator />
  
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b bg-card p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomReset}>
                  {zoom}%
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Badge variant="outline">
                  {canvasSize.width} × {canvasSize.height}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={showTransparencyGrid ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setShowTransparencyGrid(!showTransparencyGrid)}
                  title="Toggle Transparency Grid"
                >
                  <Square className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div 
            className="flex-1 bg-muted/30 p-8 overflow-auto" 
            onClick={() => {
              if (isAddingText) {
                cancelText()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              
              const files = Array.from(e.dataTransfer.files)
              const imageFile = files.find(file => file.type.startsWith('image/'))
              
              if (imageFile) {
                handleFileUpload(imageFile)
              }
            }}
          >
            <div className="flex items-center justify-center h-full">
              {mounted ? (
                <div 
                  className="relative bg-white shadow-lg rounded-lg overflow-hidden sizeupload"
                  onDragEnter={handleCanvasDragEnter}
                  onDragLeave={handleCanvasDragLeave}
                  onDragOver={handleCanvasDragOver}
                  onDrop={handleCanvasDrop}
                >
                  <canvas
                    ref={canvasRef}
                    className={`max-w-full max-h-full ${
                      selectionMode ? 'cursor-crosshair' :
                      selectedTool === 'move' ? 
                        (layers.find(l => l.id === selectedLayer) && !layers.find(l => l.id === selectedLayer)?.locked 
                          ? 'cursor-move' 
                          : 'cursor-grab'
                        ) : 
                      selectedTool === 'select' ? 'cursor-crosshair' :
                      selectedTool === 'brush' || selectedTool === 'eraser' ? 'cursor-crosshair' :
                      selectedTool === 'text' ? 'cursor-text' :
                      selectedTool === 'shape' ? 'cursor-crosshair' :
                      isCanvasDragging ? 'cursor-copy' :
                      'cursor-default'
                    }`}
                    style={{ 
                      transform: `scale(${zoom / 100}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onDragEnter={handleCanvasDragEnter}
                    onDragLeave={handleCanvasDragLeave}
                    onDragOver={handleCanvasDragOver}
                    onDrop={handleCanvasDrop}
                  />
                  
                  {/* Canvas Drag & Drop Overlay */}
                  {!selectedImage && isCanvasDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                        <div className="flex flex-col items-center space-y-3">
                          <Upload className="h-12 w-12 text-blue-500 animate-bounce" />
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                              Drop your image here
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Release to upload to canvas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Processing Overlay */}
                  {isProcessingAI && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm mx-4">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin">
                            <Brain className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">AI Processing</h3>
                            <p className="text-xs text-muted-foreground">Clipdrop AI is working...</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Selection Overlay */}
                  {selectionMode && (selectionArea.width > 0 || selectionArea.height > 0) && (
                    <div
                      className="absolute pointer-events-none border-2 border-primary bg-primary/20"
                      style={{
                        left: `${selectionArea.x * (zoom / 100)}px`,
                        top: `${selectionArea.y * (zoom / 100)}px`,
                        width: `${selectionArea.width * (zoom / 100)}px`,
                        height: `${selectionArea.height * (zoom / 100)}px`,
                      }}
                    >
                      {/* Selection handles */}
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary border border-white rounded-full"></div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary border border-white rounded-full"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary border border-white rounded-full"></div>
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary border border-white rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Canvas Text Editor - Inline text rendering */}
                  {(isAddingText || isEditingText) && (
                    <canvas
                      ref={(canvas) => {
                        if (canvas) {
                          renderTextEditor(canvas)
                        }
                      }}
                      className="absolute pointer-events-none"
                      style={{
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  )}
                  
                  {/* Text Input Overlay (for capturing keyboard input) */}
                  {(isAddingText || isEditingText) && (
                    <input
                      ref={(input) => {
                        if (input) {
                          input.focus()
                          input.select()
                        }
                      }}
                      type="text"
                      value={textInput}
                      onChange={(e) => handleTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.shiftKey) {
                            // Shift+Enter for new line - let browser handle this naturally
                            return
                          } else {
                            // Enter to apply text
                            e.preventDefault()
                            if (isEditingText) {
                              // Find and call updateTextLayer
                              const updateFunc = () => {
                                if (!editingTextLayerId || !canvasRef.current) return
                                
                                const updatedLayers = layers.map(layer => 
                                  layer.id === editingTextLayerId 
                                    ? { 
                                        ...layer, 
                                        text: textInput,
                                        fontSize,
                                        fontFamily,
                                        color: textColor,
                                        opacity: textOpacity,
                                        textOrientation,
                                        textAlignment,
                                        fontWeight,
                                        fontStyle,
                                        textUnderline,
                                        letterSpacing,
                                        lineHeight
                                      }
                                    : layer
                                )
                                
                                setLayers(updatedLayers)
                                redrawCanvasRef.current?.(updatedLayers)
                                
                                // Save to history
                                const historyEntry: EditHistory = {
                                  id: Date.now().toString(),
                                  action: 'Edit Text',
                                  layerId: editingTextLayerId,
                                  layerName: `Text: ${textInput.substring(0, 20)}${textInput.length > 20 ? '...' : ''}`,
                                  previousState: layers.find(l => l.id === editingTextLayerId),
                                  newState: updatedLayers.find(l => l.id === editingTextLayerId),
                                  timestamp: new Date()
                                }
                                
                                setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry])
                                setHistoryIndex(prev => prev + 1)
                                
                                // Reset editing state
                                setIsEditingText(false)
                                setEditingTextLayerId(null)
                                setTextInput('')
                                
                                toast({
                                  title: "Text Updated",
                                  description: "Text layer has been updated",
                                })
                              }
                              updateFunc()
                            } else {
                              // Find and call applyText
                              const applyFunc = () => {
                                if (!canvasRef.current) return
                                
                                // Allow empty text layers for immediate editing, but use "Lorem ipsum" as default
                                const displayText = textInput.trim() || 'Lorem ipsum'
                                
                                // Create a new text layer
                                const newTextLayer: Layer = {
                                  id: Date.now().toString(),
                                  name: `Text: ${displayText.substring(0, 20)}${displayText.length > 20 ? '...' : ''}`,
                                  type: 'text',
                                  visible: true,
                                  locked: false,
                                  opacity: textOpacity,
                                  position: { x: textPosition.x, y: textPosition.y },
                                  size: { 
                                    width: Math.max(100, displayText.length * fontSize * 0.6), 
                                    height: fontSize * 1.2 
                                  },
                                  blendMode: 'source-over',
                                  text: displayText,
                                  fontSize: fontSize,
                                  fontFamily: fontFamily,
                                  color: textColor,
                                  textOrientation: textOrientation,
                                  textAlignment: textAlignment,
                                  fontWeight: fontWeight,
                                  fontStyle: fontStyle,
                                  textUnderline: textUnderline,
                                  letterSpacing: letterSpacing,
                                  lineHeight: lineHeight
                                }
                                
                                setLayers(prev => [...prev, newTextLayer])
                                setSelectedLayer(newTextLayer.id)
                                redrawCanvasRef.current?.([...layers, newTextLayer])
                                
                                // Save to history
                                const historyEntry: EditHistory = {
                                  id: Date.now().toString(),
                                  action: 'Add Text',
                                  layerId: newTextLayer.id,
                                  layerName: newTextLayer.name,
                                  previousState: null,
                                  newState: newTextLayer,
                                  timestamp: new Date()
                                }
                                
                                setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry])
                                setHistoryIndex(prev => prev + 1)
                                
                                // Reset text tool state
                                setIsAddingText(false)
                                setTextInput('')
                                setCursorPosition(0)
                                
                                toast({
                                  title: "Text Added",
                                  description: `"${displayText}" has been added to the canvas`,
                                })
                              }
                              applyFunc()
                            }
                            return
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          setIsAddingText(false)
                          setIsEditingText(false)
                          setEditingTextLayerId(null)
                          setTextInput('')
                          setCursorPosition(0)
                          setTextSelection({ start: 0, end: 0 })
                          return
                        }
                        
                        // For all other keys, let browser handle naturally
                      }}
                      onMouseDown={handleTextMouseDown}
                      onMouseMove={handleTextMouseMove}
                      onMouseUp={handleTextMouseUp}
                      style={{
                        position: 'absolute',
                        left: `${textPosition.x * (zoom / 100) + canvasOffset.x * (zoom / 100)}px`,
                        top: `${textPosition.y * (zoom / 100) + canvasOffset.y * (zoom / 100)}px`,
                        fontSize: `${fontSize * (zoom / 100)}px`,
                        fontFamily: fontFamily,
                        color: textColor,
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #3b82f6',
                        borderRadius: '4px',
                        outline: 'none',
                        padding: '2px 4px',
                        width: 'auto',
                        minWidth: '100px',
                        maxWidth: '400px',
                        transform: textOrientation === 'vertical' ? 'rotate(-90deg)' : 'none',
                        transformOrigin: 'top left',
                        pointerEvents: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        resize: 'none'
                      }}
                      autoFocus
                    />
                  )}
                  
                  {/* Selection Area Overlay */}
                  {selectedTool === 'select' && isSelecting && selectionArea.width !== 0 && selectionArea.height !== 0 && (
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
                      style={{
                        left: `${Math.min(selectionArea.x, selectionArea.x + selectionArea.width) * (zoom / 100) + canvasOffset.x * (zoom / 100)}px`,
                        top: `${Math.min(selectionArea.y, selectionArea.y + selectionArea.height) * (zoom / 100) + canvasOffset.y * (zoom / 100)}px`,
                        width: `${Math.abs(selectionArea.width) * (zoom / 100)}px`,
                        height: `${Math.abs(selectionArea.height) * (zoom / 100)}px`,
                      }}
                    />
                  )}
                  
                  {cropMode && mounted && (
                    <>
                      {/* Dark overlay */}
                      {mounted && canvasRef.current && (
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-40 pointer-events-none"
                          style={{
                            clipPath: `polygon(
                              0% 0%,
                              0% 100%,
                              ${Math.min(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% 100%,
                              ${Math.min(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% ${Math.min(cropArea.y, cropArea.y + cropArea.height) / canvasRef.current.height * 100}%,
                              ${Math.max(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% ${Math.min(cropArea.y, cropArea.y + cropArea.height) / canvasRef.current.height * 100}%,
                              ${Math.max(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% ${Math.max(cropArea.y, cropArea.y + cropArea.height) / canvasRef.current.height * 100}%,
                              ${Math.min(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% ${Math.max(cropArea.y, cropArea.y + cropArea.height) / canvasRef.current.height * 100}%,
                              ${Math.min(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% ${Math.min(cropArea.y, cropArea.y + cropArea.height) / canvasRef.current.height * 100}%,
                              ${Math.min(cropArea.x, cropArea.x + cropArea.width) / canvasRef.current.width * 100}% 100%,
                              100% 100%,
                              100% 0%,
                              0% 0%
                            )`
                          }}
                        />
                      )}
                      
                      {/* Crop area border */}
                      <div
                        className="absolute border-2 border-white shadow-lg pointer-events-none"
                        style={{
                          left: `${Math.min(cropArea.x, cropArea.x + cropArea.width) * (zoom / 100)}px`,
                          top: `${Math.min(cropArea.y, cropArea.y + cropArea.height) * (zoom / 100)}px`,
                          width: `${Math.abs(cropArea.width) * (zoom / 100)}px`,
                          height: `${Math.abs(cropArea.height) * (zoom / 100)}px`,
                        }}
                      >
                        {/* Corner handles */}
                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 -top-1 -left-1" />
                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 -top-1 -right-1" />
                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 -bottom-1 -left-1" />
                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 -bottom-1 -right-1" />
                        
                        {/* Edge handles */}
                        <div className="absolute w-4 h-2 bg-white border-2 border-blue-500 -top-1 left-1/2 -translate-x-1/2" />
                        <div className="absolute w-4 h-2 bg-white border-2 border-blue-500 -bottom-1 left-1/2 -translate-x-1/2" />
                        <div className="absolute w-2 h-4 bg-white border-2 border-blue-500 -left-1 top-1/2 -translate-y-1/2" />
                        <div className="absolute w-2 h-4 bg-white border-2 border-blue-500 -right-1 top-1/2 -translate-y-1/2" />
                        
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          <div className="border-r border-b border-white border-opacity-30"></div>
                          <div className="border-r border-b border-white border-opacity-30"></div>
                          <div className="border-b border-white border-opacity-30"></div>
                          <div className="border-r border-b border-white border-opacity-30"></div>
                          <div className="border-r border-b border-white border-opacity-30"></div>
                          <div className="border-b border-white border-opacity-30"></div>
                          <div className="border-r border-white border-opacity-30"></div>
                          <div className="border-r border-white border-opacity-30"></div>
                          <div></div>
                        </div>
                      </div>
                      
                      {/* Aspect ratio label */}
                      {selectedAspectRatio !== 'custom' && (
                        <div 
                          className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded pointer-events-none"
                          style={{
                            left: `${Math.min(cropArea.x, cropArea.x + cropArea.width) * (zoom / 100)}px`,
                            top: `${Math.min(cropArea.y, cropArea.y + cropArea.height) * (zoom / 100) - 24}px`,
                          }}
                        >
                          {aspectRatios.find(ar => ar.id === selectedAspectRatio)?.name}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Show upload prompt when no image is loaded and not using text tool */}
                  {!selectedImage && selectedTool !== 'text' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
                      <div className="text-center max-w-md mx-4">
                        <div className={`mb-6 p-8 border-2 border-dashed rounded-lg transition-colors ${
                          isCanvasDragging 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          <Upload className={`h-12 w-12 mx-auto mb-4 ${
                            isCanvasDragging ? 'text-blue-500 animate-bounce' : 'text-gray-400'
                          }`} />
                          <h3 className={`text-lg font-semibold mb-2 ${
                            isCanvasDragging ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {isCanvasDragging ? 'Drop your image here' : 'Upload your image'}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Drag and drop an image here, or click the button below
                          </p>
                          <div className="flex justify-center gap-2">
                            <Button onClick={() => fileInputRef.current?.click()}>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Image
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-4">
                            Supports: JPG, PNG, GIF, BMP, WebP (Max 10MB)
                          </p>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Tip: You can also use the Text tool to create text directly on the canvas
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <DragDropUpload 
                  onFileUpload={handleFileUpload}
                  className="w-96"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties & Layers */}
        <div className="w-80 border-l bg-card flex">
          {/* Vertical Tab Navigation */}
          <div className="w-16 border-r bg-muted/50 p-2">
            <div className="space-y-2">
              <Button 
                variant={activeTab === 'basic' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col relative"
                onClick={() => setActiveTab('basic')}
                title="Basic"
              >
                <Sliders className="h-5 w-5" />
                <span className="text-xs">Basic</span>
                {showHistogram && (
                  <div className="w-1 h-1 bg-primary rounded-full absolute top-2 right-2"></div>
                )}
              </Button>
              <Button 
                variant={activeTab === 'enhancement' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setActiveTab('enhancement')}
                title="Enhancement"
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Enhance</span>
              </Button>
              <Button 
                variant={activeTab === 'morphological' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setActiveTab('morphological')}
                title="Morphological"
              >
                <Filter className="h-5 w-5" />
                <span className="text-xs">Morph</span>
              </Button>
              <Button 
                variant={activeTab === 'frequency' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setActiveTab('frequency')}
                title="Frequency"
              >
                <Radio className="h-5 w-5" />
                <span className="text-xs">Freq</span>
              </Button>
              <Button 
                variant={activeTab === 'ai' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setActiveTab('ai')}
                title="AI"
              >
                <Wand2 className="h-5 w-5" />
                <span className="text-xs">AI</span>
              </Button>
              <Button 
                variant={activeTab === 'layers' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setActiveTab('layers')}
                title="Layers"
              >
                <Layers className="h-5 w-5" />
                <span className="text-xs">Layers</span>
              </Button>
              <Button 
                variant={activeTab === 'history' ? 'default' : 'ghost'} 
                size="sm" 
                className="w-full h-12 flex-col"
                onClick={() => setActiveTab('history')}
                title="History"
              >
                <History className="h-5 w-5" />
                <span className="text-xs">History</span>
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
  
              
              <TabsContent value="basic" className="p-4 space-y-6 h-full overflow-y-auto">
              {(selectedTool === 'brush' || selectedTool === 'eraser') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brush className="h-4 w-4" />
                      Brush Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Slider
                        value={brushSize}
                        onValueChange={setBrushSize}
                        max={50}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <span className="text-xs text-muted-foreground">{brushSize[0]}px</span>
                    </div>
                    {selectedTool === 'brush' && (
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          className="mt-2 h-8"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedTool === 'text' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Text Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Color</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-12 h-8 p-1 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Size</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[fontSize]}
                          onValueChange={(value) => setFontSize(value[0])}
                          max={200}
                          min={8}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-12">{fontSize}px</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Font</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Orientation</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={textOrientation === 'horizontal' ? 'default' : 'outline'}
                          onClick={() => setTextOrientation('horizontal')}
                          className="flex-1"
                        >
                          Horizontal
                        </Button>
                        <Button
                          size="sm"
                          variant={textOrientation === 'vertical' ? 'default' : 'outline'}
                          onClick={() => setTextOrientation('vertical')}
                          className="flex-1"
                        >
                          Vertical
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Alignment</Label>
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant={textAlignment === 'left' ? 'default' : 'outline'}
                          onClick={() => setTextAlignment('left')}
                          className="flex-1 text-xs"
                        >
                          Left
                        </Button>
                        <Button
                          size="sm"
                          variant={textAlignment === 'center' ? 'default' : 'outline'}
                          onClick={() => setTextAlignment('center')}
                          className="flex-1 text-xs"
                        >
                          Center
                        </Button>
                        <Button
                          size="sm"
                          variant={textAlignment === 'right' ? 'default' : 'outline'}
                          onClick={() => setTextAlignment('right')}
                          className="flex-1 text-xs"
                        >
                          Right
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Style</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={fontWeight === 'bold' ? 'default' : 'outline'}
                          onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                          className="flex-1 text-xs font-bold"
                        >
                          B
                        </Button>
                        <Button
                          size="sm"
                          variant={fontStyle === 'italic' ? 'default' : 'outline'}
                          onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                          className="flex-1 text-xs italic"
                        >
                          I
                        </Button>
                        <Button
                          size="sm"
                          variant={textUnderline ? 'default' : 'outline'}
                          onClick={() => setTextUnderline(!textUnderline)}
                          className="flex-1 text-xs underline"
                        >
                          U
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Opacity</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[textOpacity]}
                          onValueChange={(value) => setTextOpacity(value[0])}
                          max={100}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-12">{textOpacity}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Letter Spacing</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[letterSpacing]}
                          onValueChange={(value) => setLetterSpacing(value[0])}
                          max={20}
                          min={-5}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-12">{letterSpacing}px</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Line Height</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[lineHeight]}
                          onValueChange={(value) => setLineHeight(value[0])}
                          max={3}
                          min={0.5}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-12">{lineHeight.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
                      Click on text to edit, or click on empty space to create new text.
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedTool === 'crop' && (
                <CropControls
                  selectedAspectRatio={selectedAspectRatio}
                  aspectRatios={aspectRatios}
                  cropMode={cropMode}
                  cropArea={cropArea}
                  onAspectRatioChange={setAspectRatioCrop}
                  onApplyCrop={applyCrop}
                  onCancelCrop={cancelCrop}
                />
              )}

              {/* Histogram */}
              {showHistogram && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Histogram
                        <span className="text-xs text-muted-foreground">(H)</span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistogram(!showHistogram)}
                        className="h-6 w-6 p-0"
                        title="Toggle Histogram"
                      >
                        {showHistogram ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Shadows</span>
                        <span>Midtones</span>
                        <span>Highlights</span>
                      </div>
                      <div className="relative h-32 w-full bg-muted rounded-md overflow-hidden">
                        <svg
                          width="100%"
                          height="100%"
                          className="absolute inset-0"
                          preserveAspectRatio="none"
                        >
                          {/* Grid lines */}
                          <defs>
                            <pattern
                              id="grid"
                              width="25.6"
                              height="32"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M 25.6 0 L 0 0 0 32"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-muted-foreground/20"
                              />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                          
                          {/* Histogram bars */}
                          {histogramData.map((value, index) => (
                            <rect
                              key={index}
                              x={`${(index / 256) * 100}%`}
                              y={`${100 - value}%`}
                              width={`${100 / 256}%`}
                              height={`${value}%`}
                              className="fill-primary"
                              opacity={0.8}
                            />
                          ))}
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>64</span>
                        <span>128</span>
                        <span>192</span>
                        <span>255</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Brightness</Label>
                    <Slider
                      value={brightness}
                      onValueChange={setBrightness}
                      max={200}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Contrast</Label>
                    <Slider
                      value={contrast}
                      onValueChange={setContrast}
                      max={200}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Saturation</Label>
                    <Slider
                      value={saturation}
                      onValueChange={setSaturation}
                      max={200}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-2">
                      <SunIcon className="w-3 h-3" />
                      Highlights
                    </Label>
                    <Slider
                      value={highlights}
                      onValueChange={setHighlights}
                      max={100}
                      min={-100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-2">
                      <Moon className="w-3 h-3" />
                      Shadows
                    </Label>
                    <Slider
                      value={shadows}
                      onValueChange={setShadows}
                      max={100}
                      min={-100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-2">
                      <CircleDot className="w-3 h-3" />
                      Vignette
                    </Label>
                    <Slider
                      value={vignette}
                      onValueChange={setVignette}
                      max={100}
                      min={-100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  {vignette[0] !== 0 && (
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-xs">Vignette Size</Label>
                        <Slider
                          value={vignetteSize}
                          onValueChange={setVignetteSize}
                          max={100}
                          min={10}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Vignette Feather</Label>
                        <Slider
                          value={vignetteFeather}
                          onValueChange={setVignetteFeather}
                          max={100}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Hue</Label>
                    <Slider
                      value={hue}
                      onValueChange={setHue}
                      max={360}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Blur</Label>
                    <Slider
                      value={blur}
                      onValueChange={setBlur}
                      max={20}
                      min={0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={resetAdjustments} variant="outline" className="w-full">
                    Reset Adjustments
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RotateCw className="h-4 w-4" />
                    Transform
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Quick Rotation</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyTransformation('rotate90ccw')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <RotateCw className="h-3 w-3 rotate-90" />
                        90°
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyTransformation('rotate90cw')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <RotateCw className="h-3 w-3" />
                        90°
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-xs">Custom Rotation</Label>
                    <Slider
                      value={rotation}
                      onValueChange={setRotation}
                      max={360}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">{rotation[0]}°</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyTransformation('rotate')}
                        disabled={rotation[0] === 0}
                      >
                        Apply Rotation
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Flip</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyTransformation('flipHorizontal')}
                        className="flex items-center gap-2"
                      >
                        <FlipHorizontal className="h-4 w-4" />
                        Flip H
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyTransformation('flipVertical')}
                        className="flex items-center gap-2"
                      >
                        <FlipVertical className="h-4 w-4" />
                        Flip V
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setRotation([0])
                      const canvas = canvasRef.current
                      if (canvas) {
                        const ctx = canvas.getContext('2d')
                        if (ctx && selectedImage) {
                          const img = new Image()
                          img.onload = () => {
                            canvas.width = img.width
                            canvas.height = img.height
                            ctx.drawImage(img, 0, 0)
                          }
                          img.src = selectedImage
                        }
                      }
                    }}
                    className="w-full"
                  >
                    Reset Transform
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTERS.map((filter) => (
                        <SelectItem key={filter.name} value={filter.name}>
                          {filter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => selectedFilter && applyFilter(selectedFilter)} 
                    className="w-full"
                    disabled={!selectedFilter}
                  >
                    Apply Filter
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => applyFilter('Grayscale')}>Grayscale</Button>
                    <Button variant="outline" size="sm" onClick={() => applyFilter('Sepia')}>Sepia</Button>
                    <Button variant="outline" size="sm" onClick={() => applyFilter('Invert')}>Invert</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (canvasRef.current) {
                        const canvas = canvasRef.current
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                          const edgeData = ImageProcessor.applyEdgeDetection(imageData)
                          ctx.putImageData(edgeData, 0, 0)
                        }
                      }
                    }}>Edge Detect</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enhancement" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Image Enhancement Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyEnhancementFilter('Gamma Correction')}
                      disabled={isProcessing}
                      className="h-8 text-xs"
                    >
                      <Sun className="h-3 w-3 mr-1" />
                      Gamma
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyEnhancementFilter('Global Threshold')}
                      disabled={isProcessing}
                      className="h-8 text-xs"
                    >
                      <Contrast className="h-3 w-3 mr-1" />
                      Threshold
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyEnhancementFilter('Mean Smoothing')}
                      disabled={isProcessing}
                      className="h-8 text-xs"
                    >
                      <Droplet className="h-3 w-3 mr-1" />
                      Mean
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyEnhancementFilter('Gaussian Smoothing')}
                      disabled={isProcessing}
                      className="h-8 text-xs"
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      Gaussian
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyEnhancementFilter('Median Smoothing')}
                      disabled={isProcessing}
                      className="h-8 text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Median
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Enhancement Info</Label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• <strong>Gamma:</strong> Adjusts image brightness non-linearly</p>
                      <p>• <strong>Threshold:</strong> Converts to binary using global threshold</p>
                      <p>• <strong>Adaptive:</strong> Local thresholding for varying lighting</p>
                      <p>• <strong>Smoothing:</strong> Reduces noise using different filters</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quick Actions</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          applyEnhancementFilter('Gamma Correction')
                          applyEnhancementFilter('Gaussian Smoothing')
                        }}
                        disabled={isProcessing}
                        className="h-8 text-xs"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Quick Enhance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="morphological" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Basic Morphological Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Erosion')}
                      className="text-xs"
                    >
                      Erosion
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Dilation')}
                      className="text-xs"
                    >
                      Dilation
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Opening')}
                      className="text-xs"
                    >
                      Opening
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Closing')}
                      className="text-xs"
                    >
                      Closing
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    Advanced Morphological
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Morphological Gradient')}
                      className="text-xs"
                    >
                      Gradient
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Top Hat')}
                      className="text-xs"
                    >
                      Top Hat
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Black Hat')}
                      className="text-xs"
                    >
                      Black Hat
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyMorphologicalFilter('Adaptive Threshold')}
                      className="text-xs"
                    >
                      Adaptive Thresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Segmentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFilter('Connected Components')}
                      className="text-xs justify-start"
                    >
                      Connected Components
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFilter('Watershed')}
                      className="text-xs justify-start"
                    >
                      Watershed Segmentation
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    Kernel Size
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Structuring Element</Label>
                    <Slider
                      value={kernelSize}
                      onValueChange={setKernelSize}
                      max={15}
                      min={3}
                      step={2}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{kernelSize[0]}x{kernelSize[0]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>• Larger kernels = more aggressive processing</p>
                    <p>• Odd sizes only (3x3, 5x5, 7x7...)</p>
                    <p>• Affects processing time significantly</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="frequency" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Frequency Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Frequency Spectrum')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show Frequency Spectrum
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>• Visualize frequency domain representation</p>
                    <p>• Low frequencies at center, high at edges</p>
                    <p>• Bright spots indicate strong frequency components</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    Low-Pass Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Ideal Low-Pass')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Ideal Low-Pass
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Gaussian Low-Pass')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Gaussian Low-Pass
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Butterworth Low-Pass')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Butterworth Low-Pass
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>• Remove high-frequency details</p>
                    <p>• Smooth and blur images</p>
                    <p>• Reduce noise and artifacts</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    High-Pass Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Ideal High-Pass')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Ideal High-Pass
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Gaussian High-Pass')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Gaussian High-Pass
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Butterworth High-Pass')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Butterworth High-Pass
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>• Remove low-frequency components</p>
                    <p>• Enhance edges and fine details</p>
                    <p>• Sharpen and accentuate textures</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Advanced Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyFrequencyDomainFilter('Homomorphic Filter')}
                      disabled={isProcessing}
                      className="text-xs justify-start"
                    >
                      Homomorphic Filter
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>• Correct illumination variations</p>
                    <p>• Enhance contrast in dynamic range</p>
                    <p>• Useful for uneven lighting</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Frequency Domain Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p><strong>Processing Time:</strong> May be slower for large images</p>
                    <p><strong>Memory Usage:</strong> Higher due to complex calculations</p>
                    <p><strong>Quality:</strong> Professional-grade filtering</p>
                    <p><strong>Applications:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• Medical imaging analysis</li>
                      <li>• Satellite image processing</li>
                      <li>• Texture analysis</li>
                      <li>• Noise reduction</li>
                      <li>• Feature enhancement</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowHistoryDialog(true)}
                      disabled={analysisHistory.length === 0}
                      className="text-xs justify-start"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      View Analysis History ({analysisHistory.length})
                    </Button>
                    {analysisHistory.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (analysisHistory.length > 0) {
                            setAnalysisHistory([])
                            toast({
                              title: "History Cleared",
                              description: "Analysis history has been cleared",
                            })
                          }
                        }}
                        className="text-xs justify-start text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear History
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {analysisHistory.length === 0 ? (
                      <p>• No analysis history yet</p>
                    ) : (
                      <div className="space-y-1">
                        <p>• {analysisHistory.length} analyses recorded</p>
                        <p>• Latest: {analysisHistory[0]?.filterName || 'N/A'}</p>
                        <p>• Total processing time: {analysisHistory.reduce((sum, item) => sum + item.processingTime, 0)}ms</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Clipdrop AI-Powered Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={removeBackground}
                    disabled={isProcessingAI || !selectedImage}
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    Remove Background
                    {isProcessingAI && <span className="ml-auto animate-spin">⚡</span>}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={removeText}
                    disabled={isProcessingAI || !selectedImage}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Remove Text
                    {isProcessingAI && <span className="ml-auto animate-spin">⚡</span>}
                  </Button>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Enhance Resolution (Clipdrop AI)</Label>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={enhanceResolution}
                      disabled={isProcessingAI || !selectedImage}
                    >
                      <Maximize className="h-4 w-4 mr-2" />
                      Enhance Resolution 2x
                      {isProcessingAI && <span className="ml-auto animate-spin">⚡</span>}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Professional AI upscaling with enhanced quality
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Processing Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-xs">Powered by Clipdrop AI</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    • Background removal uses advanced AI segmentation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • Text removal automatically detects and erases all text
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • Image upscaling enhances resolution while preserving quality
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • Processing time: 2-10 seconds depending on image size
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layers" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Layers</h3>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addNewLayer('text')}
                    title="Add Text Layer"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addNewLayer('shape')}
                    title="Add Shape Layer"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addNewLayer('image')}
                    title="Add Image Layer"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addNewLayer('frame')}
                    title="Add Frame Layer"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addNewLayer('empty')}
                    title="Add Empty Layer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <Card 
                      key={layer.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedLayer === layer.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedLayer(layer.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLayerVisibility(layer.id)
                              }}
                            >
                              {layer.visible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (layer.type !== 'background') {
                                  toggleLayerLock(layer.id)
                                }
                              }}
                              disabled={layer.type === 'background'}
                              title={layer.type === 'background' ? 'Background layer cannot be unlocked' : (layer.locked ? 'Unlock Layer' : 'Lock Layer')}
                            >
                              {layer.locked ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                            </Button>
                            <div className="flex flex-col">
                              <span className={`text-sm flex items-center gap-1 ${layer.locked ? 'opacity-60' : ''}`}>
                                {layer.type === 'text' && <Type className="h-3 w-3" />}
                                {layer.type === 'shape' && <Square className="h-3 w-3" />}
                                {layer.type === 'image' && <ImageIcon className="h-3 w-3" />}
                                {layer.type === 'frame' && <Square className="h-3 w-3" />}
                                {layer.type === 'background' && <ImageIcon className="h-3 w-3" />}
                                {layer.type === 'empty' && <Plus className="h-3 w-3" />}
                                {layer.name}
                                {layer.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {layer.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateLayer(layer.id)
                              }}
                              title="Duplicate Layer"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                const layerIndex = layers.findIndex(l => l.id === layer.id)
                                if (layerIndex > 0) {
                                  mergeLayerDown(layer.id)
                                }
                              }}
                              disabled={layers.findIndex(l => l.id === layer.id) === 0 || layer.locked}
                              title="Merge Down"
                            >
                              <Layers className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteLayer(layer.id)
                              }}
                              title="Delete Layer"
                              disabled={layers.length <= 1 || layer.locked}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-xs">Opacity</Label>
                          <Slider
                            value={[layer.opacity]}
                            onValueChange={(value) => {
                              if (!layer.locked) {
                                updateLayerOpacity(layer.id, value[0])
                              }
                            }}
                            max={100}
                            min={0}
                            step={1}
                            className="mt-1"
                            disabled={layer.locked}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {selectedLayer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      Layer Properties
                      {layers.find(l => l.id === selectedLayer)?.locked && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Blend Mode</Label>
                      <select 
                        className="w-full mt-1 p-1 text-xs border rounded"
                        value={layers.find(l => l.id === selectedLayer)?.blendMode || 'source-over'}
                        onChange={(e) => {
                          const blendMode = e.target.value as GlobalCompositeOperation
                          setLayers(prev => prev.map(layer => 
                            layer.id === selectedLayer ? { ...layer, blendMode } : layer
                          ))
                          redrawCanvas(layers.map(layer => 
                            layer.id === selectedLayer ? { ...layer, blendMode } : layer
                          ))
                        }}
                        disabled={layers.find(l => l.id === selectedLayer)?.locked}
                      >
                        <option value="source-over">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                        <option value="color-dodge">Color Dodge</option>
                        <option value="color-burn">Color Burn</option>
                        <option value="hard-light">Hard Light</option>
                        <option value="soft-light">Soft Light</option>
                        <option value="difference">Difference</option>
                        <option value="exclusion">Exclusion</option>
                      </select>
                    </div>
                    
                    {layers.find(l => l.id === selectedLayer)?.type === 'text' && (
                      <>
                        <div>
                          <Label className="text-xs">Text</Label>
                          <Input 
                            type="text" 
                            className="h-8 text-xs mt-1"
                            value={layers.find(l => l.id === selectedLayer)?.text || ''}
                            onChange={(e) => {
                              const text = e.target.value
                              setLayers(prev => prev.map(layer => 
                                layer.id === selectedLayer ? { ...layer, text } : layer
                              ))
                              redrawCanvas(layers.map(layer => 
                                layer.id === selectedLayer ? { ...layer, text } : layer
                              ))
                            }}
                            disabled={layers.find(l => l.id === selectedLayer)?.locked}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Input 
                            type="number" 
                            className="h-8 text-xs mt-1"
                            value={layers.find(l => l.id === selectedLayer)?.fontSize || 24}
                            onChange={(e) => {
                              const fontSize = parseInt(e.target.value) || 24
                              setLayers(prev => prev.map(layer => 
                                layer.id === selectedLayer ? { ...layer, fontSize } : layer
                              ))
                              redrawCanvas(layers.map(layer => 
                                layer.id === selectedLayer ? { ...layer, fontSize } : layer
                              ))
                            }}
                            disabled={layers.find(l => l.id === selectedLayer)?.locked}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input 
                            type="color" 
                            className="h-8 text-xs mt-1"
                            value={layers.find(l => l.id === selectedLayer)?.color || '#000000'}
                            onChange={(e) => {
                              const color = e.target.value
                              setLayers(prev => prev.map(layer => 
                                layer.id === selectedLayer ? { ...layer, color } : layer
                              ))
                              redrawCanvas(layers.map(layer => 
                                layer.id === selectedLayer ? { ...layer, color } : layer
                              ))
                            }}
                            disabled={layers.find(l => l.id === selectedLayer)?.locked}
                          />
                        </div>
                      </>
                    )}
                    
                    {layers.find(l => l.id === selectedLayer)?.type === 'shape' && (
                      <>
                        <div>
                          <Label className="text-xs">Shape Type</Label>
                          <select 
                            className="w-full mt-1 p-1 text-xs border rounded"
                            value={layers.find(l => l.id === selectedLayer)?.shapeType || 'rectangle'}
                            onChange={(e) => {
                              const shapeType = e.target.value as 'rectangle' | 'circle' | 'triangle' | 'line'
                              setLayers(prev => prev.map(layer => 
                                layer.id === selectedLayer ? { ...layer, shapeType } : layer
                              ))
                              redrawCanvas(layers.map(layer => 
                                layer.id === selectedLayer ? { ...layer, shapeType } : layer
                              ))
                            }}
                            disabled={layers.find(l => l.id === selectedLayer)?.locked}
                          >
                            <option value="rectangle">Rectangle</option>
                            <option value="circle">Circle</option>
                            <option value="triangle">Triangle</option>
                            <option value="line">Line</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Stroke Width</Label>
                          <Input 
                            type="number" 
                            className="h-8 text-xs mt-1"
                            value={layers.find(l => l.id === selectedLayer)?.strokeWidth || 2}
                            onChange={(e) => {
                              const strokeWidth = parseInt(e.target.value) || 2
                              setLayers(prev => prev.map(layer => 
                                layer.id === selectedLayer ? { ...layer, strokeWidth } : layer
                              ))
                              redrawCanvas(layers.map(layer => 
                                layer.id === selectedLayer ? { ...layer, strokeWidth } : layer
                              ))
                            }}
                            disabled={layers.find(l => l.id === selectedLayer)?.locked}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fill Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              id="layer-fill-toggle"
                              checked={layers.find(l => l.id === selectedLayer)?.fillColor !== 'transparent'}
                              onChange={(e) => {
                                const currentLayer = layers.find(l => l.id === selectedLayer)
                                if (currentLayer && !currentLayer.locked) {
                                  const fillColor = e.target.checked ? (shapeFillColor || '#3b82f6') : 'transparent'
                                  setLayers(prev => prev.map(layer => 
                                    layer.id === selectedLayer ? { ...layer, fillColor } : layer
                                  ))
                                  redrawCanvas(layers.map(layer => 
                                    layer.id === selectedLayer ? { ...layer, fillColor } : layer
                                  ))
                                }
                              }}
                              disabled={layers.find(l => l.id === selectedLayer)?.locked}
                              className="w-3 h-3 rounded cursor-pointer"
                            />
                            <label htmlFor="layer-fill-toggle" className="text-xs text-muted-foreground cursor-pointer">
                              Enable Fill
                            </label>
                          </div>
                          {layers.find(l => l.id === selectedLayer)?.fillColor !== 'transparent' && (
                            <Input 
                              type="color" 
                              className="h-8 text-xs mt-1"
                              value={layers.find(l => l.id === selectedLayer)?.fillColor || '#000000'}
                              onChange={(e) => {
                                const fillColor = e.target.value
                                setLayers(prev => prev.map(layer => 
                                  layer.id === selectedLayer ? { ...layer, fillColor } : layer
                                ))
                                redrawCanvas(layers.map(layer => 
                                  layer.id === selectedLayer ? { ...layer, fillColor } : layer
                                ))
                              }}
                              disabled={layers.find(l => l.id === selectedLayer)?.locked}
                            />
                          )}
                        </div>
                      </>
                    )}
                    
                    {layers.find(l => l.id === selectedLayer)?.type === 'frame' && (
                      <div>
                        <Label className="text-xs">Stroke Width</Label>
                        <Input 
                          type="number" 
                          className="h-8 text-xs mt-1"
                          value={layers.find(l => l.id === selectedLayer)?.strokeWidth || 5}
                          onChange={(e) => {
                            const strokeWidth = parseInt(e.target.value) || 5
                            setLayers(prev => prev.map(layer => 
                              layer.id === selectedLayer ? { ...layer, strokeWidth } : layer
                            ))
                            redrawCanvas(layers.map(layer => 
                              layer.id === selectedLayer ? { ...layer, strokeWidth } : layer
                            ))
                          }}
                          disabled={layers.find(l => l.id === selectedLayer)?.locked}
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-xs">Position X</Label>
                      <Input 
                        type="number" 
                        className="h-8 text-xs mt-1"
                        value={layers.find(l => l.id === selectedLayer)?.position.x || 0}
                        onChange={(e) => {
                          const x = parseInt(e.target.value) || 0
                          const layer = layers.find(l => l.id === selectedLayer)
                          if (layer && !layer.locked) {
                            updateLayerPosition(selectedLayer, { ...layer.position, x })
                          }
                        }}
                        disabled={layers.find(l => l.id === selectedLayer)?.locked}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Position Y</Label>
                      <Input 
                        type="number" 
                        className="h-8 text-xs mt-1"
                        value={layers.find(l => l.id === selectedLayer)?.position.y || 0}
                        onChange={(e) => {
                          const y = parseInt(e.target.value) || 0
                          const layer = layers.find(l => l.id === selectedLayer)
                          if (layer && !layer.locked) {
                            updateLayerPosition(selectedLayer, { ...layer.position, y })
                          }
                        }}
                        disabled={layers.find(l => l.id === selectedLayer)?.locked}
                      />
                    </div>
                    
                    {layers.find(l => l.id === selectedLayer)?.locked && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        This layer is locked. Unlock it to make changes.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-4 space-y-4 h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* History Controls */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={undo} 
                      disabled={historyIndex <= 0}
                      className="flex items-center gap-1"
                    >
                      <Undo className="h-3 w-3" />
                      Undo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={redo} 
                      disabled={historyIndex >= history.length - 1}
                      className="flex items-center gap-1"
                    >
                      <Redo className="h-3 w-3" />
                      Redo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setHistory([])
                        setHistoryIndex(-1)
                        toast({
                          title: "History cleared",
                          description: "All history has been cleared",
                        })
                      }}
                      disabled={history.length === 0}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Delete className="h-3 w-3" />
                      Clear
                    </Button>
                  </div>

                  {/* History Status */}
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <div className="flex justify-between items-center">
                      <span>History Items: {history.length}</span>
                      <span>Current: {historyIndex + 1} / {history.length}</span>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">History Timeline</Label>
                    <ScrollArea className="h-64 w-full border rounded-md p-2">
                      {history.length === 0 ? (
                        <div className="text-center text-muted-foreground text-xs py-8">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No history yet</p>
                          <p className="text-xs">Start editing to see history</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {history.map((item, index) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                index === historyIndex 
                                  ? 'bg-primary text-primary-foreground' 
                                  : index < historyIndex 
                                    ? 'bg-muted hover:bg-muted/80' 
                                    : 'bg-background hover:bg-muted/50 opacity-60'
                              }`}
                              onClick={() => {
                                if (item.imageData && canvasRef.current) {
                                  const canvas = canvasRef.current
                                  const ctx = canvas.getContext('2d')
                                  if (ctx) {
                                    canvas.width = item.imageData.width
                                    canvas.height = item.imageData.height
                                    ctx.putImageData(item.imageData, 0, 0)
                                    setHistoryIndex(index)
                                    
                                    toast({
                                      title: "History state restored",
                                      description: `Restored to: ${item.action}`,
                                    })
                                  }
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  index === historyIndex 
                                    ? 'bg-primary-foreground' 
                                    : index < historyIndex 
                                      ? 'bg-green-500' 
                                      : 'bg-gray-400'
                                }`} />
                                <span className="text-xs font-medium truncate max-w-32">
                                  {item.action === 'move' && item.layerName 
                                    ? `Move ${item.layerName}` 
                                    : item.action
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs opacity-70">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                                {index === historyIndex && (
                                  <div className="w-1 h-1 bg-primary-foreground rounded-full" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* History Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Click on any history item to jump to that state</p>
                    <p>• Green dots indicate applied actions</p>
                    <p>• Gray dots indicate future (redo) actions</p>
                    <p>• Use Ctrl+Z to undo, Ctrl+Shift+Z to redo</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </div>
    </div>

    {/* Export Dialog */}
    {selectedImage && (
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        imageData={currentCanvasData || selectedImage}
        originalWidth={canvasSize.width}
        originalHeight={canvasSize.height}
      />
    )}

    {/* Text to Image Dialog */}
    {showTextToImageDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Generate Image with AI</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTextToImageDialog(false)}
              disabled={isProcessingAI}
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Describe your image</Label>
              <textarea
                value={textToImagePrompt}
                onChange={(e) => setTextToImagePrompt(e.target.value)}
                placeholder="A beautiful sunset over mountains, digital art style..."
                className="w-full mt-2 p-3 border rounded-lg resize-none h-24 text-sm"
                maxLength={1000}
                disabled={isProcessingAI}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  Be descriptive for better results
                </span>
                <span className="text-xs text-muted-foreground">
                  {textToImagePrompt.length}/1000
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTextToImageDialog(false)}
                disabled={isProcessingAI}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={generateTextToImage}
                disabled={!textToImagePrompt.trim() || isProcessingAI}
                className="flex-1"
              >
                {isProcessingAI ? (
                  <>
                    <span className="animate-spin mr-2">⚡</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Historical Analysis Dialog */}
    {showHistoryDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Historical Frequency Analysis
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryDialog(false)}
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {analysisHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No analysis history available</p>
                <p className="text-sm">Apply frequency filters to see analysis data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Summary Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Analyses</p>
                        <p className="font-semibold">{analysisHistory.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Processing Time</p>
                        <p className="font-semibold">
                          {Math.round(analysisHistory.reduce((sum, item) => sum + item.processingTime, 0) / analysisHistory.length)}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Most Used Filter</p>
                        <p className="font-semibold">
                          {Object.entries(
                            analysisHistory.reduce((acc, item) => {
                              acc[item.filterName] = (acc[item.filterName] || 0) + 1
                              return acc
                            }, {} as Record<string, number>)
                          ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Entropy</p>
                        <p className="font-semibold">
                          {(analysisHistory.reduce((sum, item) => sum + item.analysisData.entropy, 0) / analysisHistory.length).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis History List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Analysis Timeline
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysisHistory.map((item, index) => (
                      <Card key={item.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.filterName}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {item.timestamp.toLocaleTimeString()}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {item.processingTime}ms
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Mean Freq:</span>
                                  <span className="ml-1 font-mono">{item.analysisData.meanFrequency.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Entropy:</span>
                                  <span className="ml-1 font-mono">{item.analysisData.entropy.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Energy:</span>
                                  <span className="ml-1 font-mono">{item.analysisData.energy.toFixed(0)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Min/Max:</span>
                                  <span className="ml-1 font-mono">
                                    {item.analysisData.minFrequency.toFixed(0)}/{item.analysisData.maxFrequency.toFixed(0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Dominant:</span>
                                  <span className="ml-1 font-mono">{item.analysisData.dominantFrequency.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedHistoryItem(item)
                                    setShowHistoryDialog(false)
                                    // Load the processed image to canvas
                                    if (canvasRef.current) {
                                      const canvas = canvasRef.current
                                      const ctx = canvas.getContext('2d')
                                      if (ctx) {
                                        const img = new Image()
                                        img.onload = () => {
                                          canvas.width = img.width
                                          canvas.height = img.height
                                          ctx.drawImage(img, 0, 0)
                                          setCanvasSize({ width: img.width, height: img.height })
                                          setSelectedImage(item.processedImage)
                                        }
                                        img.src = item.processedImage
                                      }
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Load Result
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Download processed image
                                    const link = document.createElement('a')
                                    link.download = `frequency-analysis-${item.filterName}-${Date.now()}.png`
                                    link.href = item.processedImage
                                    link.click()
                                  }}
                                  className="text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    <Toaster />
    </>
  )
}