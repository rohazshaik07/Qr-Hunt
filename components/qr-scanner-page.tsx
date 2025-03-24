"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { QrCode, Sparkles, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import QRScanner from "@/components/qr-scanner"

export default function QRScannerPage() {
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanData, setScanData] = useState<{
    progress?: number
    scanCount?: number
    rank?: number
  } | null>(null)
  const router = useRouter()

  // Check if user is already registered via cookie
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        // Try to scan a dummy code to check if registration is required
        const response = await fetch("/api/scan?code=check-registration")
        const data = await response.json()

        if (response.status === 200) {
          if (data.status === "registration_required") {
            setIsRegistered(false)
          } else {
            setIsRegistered(true)
            if (data.progress) {
              setScanData({
                progress: data.progress,
                scanCount: data.scanCount,
                rank: data.rank,
              })
            }
          }
        }
      } catch (err) {
        console.error("Error checking registration:", err)
        setError("Failed to connect to server")
      } finally {
        setIsLoading(false)
      }
    }

    checkRegistration()
  }, [])

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationNumber) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationNumber,
          code: "qr-code-1", // This is the unique code for QR code 1
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        setIsLoading(false)
        return
      }

      // Registration successful
      setIsRegistered(true)
      setShowScanner(true)
    } catch (err) {
      console.error("Registration error:", err)
      setError("Failed to register. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleScan = async (code: string) => {
    if (code) {
      setShowScanner(false)
      setIsLoading(true)

      try {
        const response = await fetch(`/api/scan?code=${code}`)
        const data = await response.json()

        if (response.ok) {
          setScanData({
            progress: data.progress,
            scanCount: data.scanCount,
            rank: data.rank,
          })

          // If this is the first clue, navigate to it
          if (data.progress === 1) {
            router.push("/clue/1")
          }
        } else {
          setError(data.error || "Failed to process QR code")
        }
      } catch (err) {
        console.error("Scan error:", err)
        setError("Failed to process QR code")
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)] text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            {isRegistered ? (
              <QrCode className="w-16 h-16 text-purple-300" />
            ) : (
              <Sparkles className="w-16 h-16 text-purple-300" />
            )}
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1.02, 0.98],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl -z-10"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-3xl font-bold mb-2 text-white"
        >
          {isRegistered ? "QR Code Scanner" : "Register for the Hunt"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-purple-200 mb-8"
        >
          {isRegistered ? "Scan QR Code 1 to begin your adventure" : "Enter your registration number to begin"}
        </motion.p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {!isRegistered ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            onSubmit={handleRegistration}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="registration" className="text-sm text-purple-100 text-left block">
                Registration Number
              </label>
              <Input
                id="registration"
                type="text"
                placeholder="Enter your registration number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-purple-200/50"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Start Hunt"}
            </Button>
          </motion.form>
        ) : showScanner ? (
          <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="space-y-6"
          >
            {scanData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10"
              >
                {scanData.scanCount && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-purple-300 mr-2" />
                      <span className="text-white">Total Scans</span>
                    </div>
                    <span className="text-purple-300 font-semibold">{scanData.scanCount}</span>
                  </div>
                )}

                {scanData.rank && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-purple-300 mr-2" />
                      <span className="text-white">Your Position</span>
                    </div>
                    <span className="text-purple-300 font-semibold">#{scanData.rank}</span>
                  </div>
                )}
              </motion.div>
            )}

            <Button
              onClick={() => setShowScanner(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white flex items-center justify-center"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code 1
            </Button>

            {scanData && scanData.progress && scanData.progress > 0 && (
              <Button
                onClick={() => router.push(`/clue/${scanData.progress}`)}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 flex items-center justify-center"
              >
                <MapPin className="mr-2 h-4 w-4" />
                View Current Clue
              </Button>
            )}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="mt-6 text-xs text-purple-200/70"
        >
          <strong>Important:</strong> Please enable cookies to participate in the scavenger hunt.
        </motion.p>
      </motion.div>
    </main>
  )
}

