"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const router = useRouter()

  // In a real implementation, you would use a QR scanner library
  // For example: react-qr-reader or html5-qrcode

  useEffect(() => {
    // For demo purposes, we'll simulate a successful scan after a delay
    // In production, replace this with actual QR scanning code
    const timer = setTimeout(() => {
      if (scanning) {
        // Simulate finding a QR code - in production this would be from the scanner
        const qrCode = "qr-code-1" // This is the unique code for QR code 1

        // Process the scan
        processQrCode(qrCode)
        setScanning(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [scanning])

  const processQrCode = async (code: string) => {
    try {
      // Call the scan API endpoint
      const response = await fetch(`/api/scan?code=${code}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to process QR code")
        return
      }

      // Handle different response statuses
      if (data.status === "registration_required") {
        // Redirect to registration page with the code
        router.push(`/register?code=${code}`)
        return
      }

      if (data.status === "already_scanned") {
        setError("You've already collected this component!")
        return
      }

      if (data.status === "success") {
        // Pass the scan data to the parent component
        onScan(code)
      }
    } catch (err) {
      console.error("Error processing QR code:", err)
      setError("Failed to process QR code. Please try again.")
    }
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/30 text-white hover:bg-black/50 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden bg-black/20 aspect-square relative">
        {/* This would be a video feed in a real QR scanner */}
        <div className="absolute inset-0 flex items-center justify-center">
          {error ? (
            <div className="text-center p-4">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
              <p className="text-white text-sm">{error}</p>
              <Button
                onClick={() => {
                  setError(null)
                  setScanning(true)
                }}
                className="mt-4 bg-white/20 hover:bg-white/30 text-white"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="text-white text-sm text-center">
                {scanning ? "Scanning for QR code..." : "QR code detected!"}
              </div>

              {/* Scanner animation */}
              {scanning && (
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: ["0%", "80%", "0%"] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 right-0 h-0.5 bg-green-400"
                />
              )}

              {/* Scanner target frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{
                    boxShadow: scanning
                      ? ["0 0 0 0 rgba(74, 222, 128, 0)", "0 0 0 2px rgba(74, 222, 128, 0.5)"]
                      : "0 0 0 2px rgba(74, 222, 128, 0.8)",
                  }}
                  transition={{
                    duration: 1,
                    repeat: scanning ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut",
                  }}
                  className="w-48 h-48 border-2 border-green-400 rounded-lg"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-purple-200">Position the QR code within the frame to scan</div>
    </div>
  )
}

