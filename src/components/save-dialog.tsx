'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Download, FileImage, Image as ImageIcon } from 'lucide-react'

interface SaveDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (format: 'png' | 'jpeg' | 'bmp', quality: number, filename: string) => void
}

export default function SaveDialog({ isOpen, onClose, onSave }: SaveDialogProps) {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'bmp'>('png')
  const [quality, setQuality] = useState([90])
  const [filename, setFilename] = useState('edited-image')

  const handleSave = () => {
    const finalFilename = filename.includes('.') 
      ? filename 
      : `${filename}.${format === 'jpeg' ? 'jpg' : format}`
    
    onSave(format, quality[0] / 100, finalFilename)
    onClose()
  }

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'png':
        return <ImageIcon className="h-4 w-4" />
      case 'jpeg':
        return <FileImage className="h-4 w-4" />
      case 'bmp':
        return <Download className="h-4 w-4" />
      default:
        return <FileImage className="h-4 w-4" />
    }
  }

  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case 'png':
        return 'Lossless compression, supports transparency'
      case 'jpeg':
        return 'Lossy compression, smaller file size'
      case 'bmp':
        return 'Uncompressed, high quality, large file size'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Save Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Filename Input */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename..."
              className="w-full"
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(value: 'png' | 'jpeg' | 'bmp') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getFormatIcon(format)}
                    <span className="uppercase">{format}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">PNG</div>
                      <div className="text-xs text-muted-foreground">
                        {getFormatDescription('png')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="jpeg">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    <div>
                      <div className="font-medium">JPEG</div>
                      <div className="text-xs text-muted-foreground">
                        {getFormatDescription('jpeg')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="bmp">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <div>
                      <div className="font-medium">BMP</div>
                      <div className="text-xs text-muted-foreground">
                        {getFormatDescription('bmp')}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality Slider (only for JPEG) */}
          {format === 'jpeg' && (
            <div className="space-y-2">
              <Label>Quality: {quality[0]}%</Label>
              <Slider
                value={quality}
                onValueChange={setQuality}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {/* Format Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                {getFormatIcon(format)}
                <div className="text-sm">
                  <div className="font-medium mb-1">About {format.toUpperCase()} Format</div>
                  <div className="text-xs text-muted-foreground">
                    {getFormatDescription(format)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Save {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}