"use client"

import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => boolean | Promise<boolean>
  onClose: () => void
  title: string
  description: string
  validationError?: string | null
  onClearValidationError?: () => void
}

export default function QRScanner({
  onScan,
  onClose,
  title,
  description,
  validationError,
  onClearValidationError,
}: QRScannerProps) {
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  useEffect(() => {
    if (scannedData) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const scanFrame = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) {
        animationFrameRef.current = requestAnimationFrame(scanFrame)
        return
      }

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scanFrame)
        return
      }

      const context = canvas.getContext("2d")
      if (!context) {
        animationFrameRef.current = requestAnimationFrame(scanFrame)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })

      if (result?.data) {
        setScannedData(result.data)
        setError(null)
        onClearValidationError?.()
        return
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame)
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [scannedData, onClearValidationError])

  const handleConfirmScan = async () => {
    if (!scannedData) return
    const result = await Promise.resolve(onScan(scannedData))
    if (!result) {
      setScannedData(null)
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

        {!error && validationError && !scannedData && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        <div className="space-y-4">
          {!scannedData ? (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* QR Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50"></div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Align the QR code within the frame to scan automatically
              </p>
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
                <Button
                  onClick={() => {
                    setScannedData(null)
                    onClearValidationError?.()
                  }}
                  variant="outline"
                  className="w-full bg-transparent"
                >
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
