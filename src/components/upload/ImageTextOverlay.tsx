'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Type } from 'lucide-react'

interface ImageTextOverlayProps {
  imageUrl: string
  onSave: (imageWithText: string) => void
  onCancel: () => void
}

export function ImageTextOverlay({ imageUrl, onSave, onCancel }: ImageTextOverlayProps) {
  const [text, setText] = useState('')
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [fontSize, setFontSize] = useState(24)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const drawCanvas = () => {
    if (imageRef.current && canvasRef.current && imageRef.current.complete) {
      const img = imageRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      // Set canvas size to match image
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Draw text if exists
      if (text) {
        ctx.font = `bold ${fontSize}px Arial`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        // Calculate position in pixels
        const x = (position.x / 100) * canvas.width
        const y = (position.y / 100) * canvas.height

        // Draw text (single line for simplicity)
        ctx.fillText(text, x, y)
        
        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }
    }
  }

  useEffect(() => {
    drawCanvas()
  }, [text, position, fontSize, textColor, imageUrl])

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9)
      onSave(dataUrl)
    }
  }

  const handlePositionChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setPosition({
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-birthday-purple" />
          <h3 className="font-medium">Aggiungi testo alla foto</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Preview */}
      <div
        className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 touch-none select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={handlePositionChange}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={(e) => {
          if (!isDragging) return
          e.preventDefault()
          const touch = e.touches[0]
          if (touch) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = ((touch.clientX - rect.left) / rect.width) * 100
            const y = ((touch.clientY - rect.top) / rect.height) * 100
            setPosition({
              x: Math.max(10, Math.min(90, x)),
              y: Math.max(10, Math.min(90, y)),
            })
          }
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Preview"
          className="w-full h-auto max-h-[300px] md:max-h-[400px] object-contain"
          style={{ display: 'none' }}
          onLoad={drawCanvas}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-h-[300px] md:max-h-[400px] object-contain cursor-crosshair touch-none"
        />
        {text && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${fontSize}px`,
              color: textColor,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              fontWeight: 'bold',
            }}
          >
            {text}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-3 md:p-4">
        <div>
          <label className="block text-sm md:text-base font-medium mb-2">Testo</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-2.5 text-base md:text-sm touch-manipulation"
            maxLength={50}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-3">
          <div>
            <label className="block text-sm md:text-base font-medium mb-2">Dimensione</label>
            <input
              type="range"
              min="16"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-3 md:h-2 touch-manipulation"
            />
            <p className="text-xs md:text-xs text-muted-foreground text-center mt-1">{fontSize}px</p>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium mb-2">Colore</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full min-h-[44px] h-11 md:h-10 rounded border touch-manipulation"
              />
            </div>
          </div>
        </div>

        <p className="text-xs md:text-xs text-muted-foreground text-center">
          💡 Tocca e trascina sulla foto per spostare il testo
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[44px] rounded-md border border-gray-300 px-4 py-2.5 md:py-2 text-base md:text-sm font-medium hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!text}
          className="flex-1 min-h-[44px] rounded-md bg-gradient-to-r from-birthday-pink to-birthday-purple px-4 py-2.5 md:py-2 text-base md:text-sm font-medium text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          Salva con testo
        </button>
      </div>
    </div>
  )
}
