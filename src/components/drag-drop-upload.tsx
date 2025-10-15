'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Image as ImageIcon, FileImage } from 'lucide-react'

interface DragDropUploadProps {
  onFileUpload: (file: File) => void
  accept?: string
  multiple?: boolean
  className?: string
  children?: React.ReactNode
}

export default function DragDropUpload({
  onFileUpload,
  accept = 'image/*',
  multiple = false,
  className = '',
  children
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedFiles, setDraggedFiles] = useState<File[]>([])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setIsDragOver(true)
    
    // Get files from drag event
    const files = Array.from(e.dataTransfer.files)
    setDraggedFiles(files)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsDragOver(false)
    setDraggedFiles([])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) return

    // Filter files based on accept prop
    const acceptedFiles = files.filter(file => {
      if (accept === 'image/*') {
        return file.type.startsWith('image/')
      }
      return file.type.match(accept.replace('*', '.*'))
    })

    if (acceptedFiles.length === 0) {
      console.warn('No valid files dropped')
      return
    }

    // Handle file upload
    if (multiple) {
      acceptedFiles.forEach(file => onFileUpload(file))
    } else {
      onFileUpload(acceptedFiles[0])
    }
    
    setDraggedFiles([])
  }, [accept, multiple, onFileUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (multiple) {
      Array.from(files).forEach(file => onFileUpload(file))
    } else {
      onFileUpload(files[0])
    }
  }, [multiple, onFileUpload])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <FileImage className="w-4 h-4" />
  }

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-200 ease-in-out
        ${isDragging ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''}
        ${isDragOver ? 'scale-[1.02] bg-primary/10' : ''}
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        {children || (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className={`
              flex items-center justify-center w-16 h-16 rounded-full
              ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              transition-colors duration-200
            `}>
              {isDragging ? (
                <Upload className="w-8 h-8 animate-bounce" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragging ? 'Drop your image here' : 'Drag & Drop your image here'}
              </h3>
              <p className="text-sm text-muted-foreground">
                or click to browse from your computer
              </p>
            </div>
            
            {/* Show dragged files info */}
            {draggedFiles.length > 0 && (
              <div className="w-full max-w-xs space-y-2">
                <p className="text-xs font-medium text-primary">
                  {draggedFiles.length} file{draggedFiles.length > 1 ? 's' : ''} detected:
                </p>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {draggedFiles.slice(0, 3).map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-muted/50 rounded p-1">
                      <div className="flex items-center gap-1 truncate">
                        {getFileIcon(file)}
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-muted-foreground ml-1">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                  {draggedFiles.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ...and {draggedFiles.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <Button variant="outline" className="relative">
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
              <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, GIF, BMP, WebP (Max 10MB)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}