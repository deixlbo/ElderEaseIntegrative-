"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRScannerProps {
  onScan: (data: { email: string; password: string }) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [mode, setMode] = useState<"camera" | "upload" | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (mode === "camera") {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [mode])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create image element to read QR code
      const img = new Image()
      const reader = new FileReader()

      reader.onload = (event) => {
        img.src = event.target?.result as string
        img.onload = () => {
          // Draw image to canvas
          const canvas = canvasRef.current
          if (!canvas) return

          const ctx = canvas.getContext("2d")
          if (!ctx) return

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          // In a real implementation, you would use a QR code library here
          // For now, we'll simulate QR code reading
          toast({
            title: "QR Code Detected",
            description: "Processing QR code...",
          })

          // Simulate QR code data extraction
          setTimeout(() => {
            // This would be replaced with actual QR code parsing
            const mockData = {
              email: "elder@example.com",
              password: "password123",
            }
            onScan(mockData)
          }, 1000)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Could not read QR code from image",
        variant: "destructive",
      })
    }
  }

  const captureFromCamera = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // In a real implementation, you would use a QR code library here
    toast({
      title: "Scanning QR Code",
      description: "Processing...",
    })

    // Simulate QR code scanning
    setTimeout(() => {
      const mockData = {
        email: "elder@example.com",
        password: "password123",
      }
      onScan(mockData)
      stopCamera()
    }, 1000)
  }

  if (!mode) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold mb-2">Scan QR Code</h3>
            <p className="text-muted-foreground text-lg">Choose how to scan your QR code</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={() => setMode("camera")} className="h-32 flex-col gap-3 text-lg" size="lg">
              <Camera className="w-12 h-12" />
              <span>Use Camera</span>
            </Button>

            <label className="cursor-pointer">
              <Button asChild className="h-32 w-full flex-col gap-3 text-lg bg-transparent" size="lg" variant="outline">
                <div>
                  <Upload className="w-12 h-12" />
                  <span>Upload Image</span>
                </div>
              </Button>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full h-12 text-lg bg-transparent">
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (mode === "camera") {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Camera Scanner</h3>
            <Button
              onClick={() => {
                stopCamera()
                setMode(null)
              }}
              variant="ghost"
              size="icon"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-primary/50 m-8 rounded-lg pointer-events-none" />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="space-y-3">
            <Button onClick={captureFromCamera} className="w-full h-14 text-lg">
              <Camera className="w-6 h-6 mr-2" />
              Capture & Scan
            </Button>
            <Button
              onClick={() => {
                stopCamera()
                setMode(null)
              }}
              variant="outline"
              className="w-full h-12 text-lg"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <canvas ref={canvasRef} className="hidden" />
}
