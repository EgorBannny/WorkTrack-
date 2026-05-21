import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from './button'

interface Area {
  x: number
  y: number
  width: number
  height: number
}

interface AvatarCropperProps {
  imageSrc: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

async function cropImageToBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = new Image()
  img.src = imageSrc
  await new Promise((resolve) => { img.onload = resolve })

  const canvas = document.createElement('canvas')
  const size = 256
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0, size, size,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.9,
    )
  })
}

export function AvatarCropper({ imageSrc, onConfirm, onCancel }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    const blob = await cropImageToBlob(imageSrc, croppedArea)
    onConfirm(blob)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Область кропа */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Ползунок зума */}
      <div className="flex items-center gap-4 px-6 py-4 bg-black/80">
        <span className="text-white/60 text-xs">−</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-white/60 text-xs">+</span>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 justify-end px-6 py-4 bg-black/80 border-t border-white/10">
        <Button variant="ghost" onClick={onCancel} className="text-white hover:bg-white/10">
          Отмена
        </Button>
        <Button onClick={handleConfirm}>
          Применить
        </Button>
      </div>
    </div>
  )
}