"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Camera, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  title: string
  description: string
}

export default function QRScanner({ onScan, onClose, title, description }: QRScannerProps) {
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
  }

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)

        // Simulate QR code detection - in production, use a QR code library
        const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        const data = imageData.data

        // Simple check for QR code pattern (dark areas)
        let darkPixels = 0
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
          if (brightness < 128) darkPixels++
        }

        // If we detect a pattern, simulate successful scan
        if (darkPixels > imageData.data.length / 8) {
          // In production, use jsQR or similar library to decode actual QR data
          const simulatedQRData = `borrower-qr-${Date.now()}`
          setScannedData(simulatedQRData)
          setError(null)
        }
      }
    }
  }

  const handleConfirmScan = () => {
    if (scannedData) {
      onScan(scannedData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {!scannedData ? (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    // Start scanning after video is ready
                    const interval = setInterval(captureFrame, 500)
                    return () => clearInterval(interval)
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* QR Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50"></div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">Point your camera at the borrower's QR code</p>

              <Button
                onClick={captureFrame}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                Capture & Scan
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-100 border border-green-300 rounded-md">
                <p className="text-sm font-medium text-green-800 mb-2">✓ QR Code Detected!</p>
                <p className="text-xs text-green-700 break-all">{scannedData}</p>
              </div>

              <div className="space-y-2">
                <Button onClick={handleConfirmScan} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Confirm Scan
                </Button>
                <Button onClick={() => setScannedData(null)} variant="outline" className="w-full bg-transparent">
                  Scan Again
                </Button>
              </div>
            </>
          )}

          <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}
