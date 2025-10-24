"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface QRCodeGeneratorProps {
  data: string
  title?: string
  onClose?: () => void
}

export default function QRCodeGenerator({ data, title, onClose }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && data) {
      generateQRCode(data)
    }
  }, [data])

  const generateQRCode = async (text: string) => {
    try {
      const response = await fetch(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`,
      )
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            canvas.width = 300
            canvas.height = 300
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, 300, 300)
            ctx.drawImage(img, 0, 0)
          }
        }
      }
      img.src = url
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const downloadQRCode = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `qr-code-${Date.now()}.png`
      link.click()
    }
  }

  return (
    <Card className="p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title || "QR Code"}</h3>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <canvas ref={canvasRef} className="border-2 border-border rounded-lg bg-white" width={300} height={300} />
        <p className="text-xs text-muted-foreground text-center max-w-xs break-all">{data}</p>
        <Button onClick={downloadQRCode} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Download size={18} className="mr-2" />
          Download QR Code
        </Button>
      </div>
    </Card>
  )
}
