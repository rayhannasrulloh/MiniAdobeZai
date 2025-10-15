'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Scissors } from 'lucide-react'

interface AspectRatio {
  id: string
  name: string
  ratio: number | null
}

interface CropControlsProps {
  selectedAspectRatio: string
  aspectRatios: AspectRatio[]
  cropMode: boolean
  cropArea: { x: number; y: number; width: number; height: number }
  onAspectRatioChange: (ratioId: string) => void
  onApplyCrop: () => void
  onCancelCrop: () => void
}

export default function CropControls({
  selectedAspectRatio,
  aspectRatios,
  cropMode,
  cropArea,
  onAspectRatioChange,
  onApplyCrop,
  onCancelCrop
}: CropControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Scissors className="h-4 w-4" />
          Crop Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs mb-2 block">Aspect Ratio</Label>
          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio.id}
                variant={selectedAspectRatio === ratio.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onAspectRatioChange(ratio.id)}
                className="text-xs h-8"
              >
                {ratio.name}
              </Button>
            ))}
          </div>
        </div>
        
        {cropMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Crop Area:</span>
              <span className="font-mono text-xs">
                {Math.abs(Math.round(cropArea.width))} × {Math.abs(Math.round(cropArea.height))}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onApplyCrop}
                className="flex-1 text-xs"
              >
                Apply Crop
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelCrop}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Select aspect ratio to constrain crop</p>
          <p>• Click and drag on canvas to set crop area</p>
          <p>• Use Custom for freeform cropping</p>
          <p>• Press Enter to apply, Escape to cancel</p>
        </div>
      </CardContent>
    </Card>
  )
}