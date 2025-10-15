'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import ShareModal from './share-modal'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  imageData?: string
  className?: string
}

export default function ShareButton({ imageData, className }: ShareButtonProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleShareComplete = (shareData: any) => {
    console.log('Share created:', shareData)
    // You could add additional logic here, like updating UI or analytics
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsShareModalOpen(true)}
        disabled={!imageData}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageData={imageData}
        onShareComplete={handleShareComplete}
      />
    </>
  )
}