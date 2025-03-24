import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "QR code is required" }, { status: 400 })
    }

    // Get user ID from cookie
    const userIdCookie = cookies().get("user_id")

    // If no cookie, user needs to register
    if (!userIdCookie) {
      return NextResponse.json({
        status: "registration_required",
        code,
      })
    }

    const userId = userIdCookie.value

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Get user data
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      // Cookie exists but user not found - clear cookie and require registration
      cookies().delete("user_id")
      return NextResponse.json({
        status: "registration_required",
        code,
      })
    }

    // Check if this code has already been scanned by this user
    if (user.scannedCodes && user.scannedCodes.includes(code)) {
      return NextResponse.json({
        status: "already_scanned",
        message: "You've already scanned this QR code",
        progress: user.scannedCodes.length,
        components: user.scannedCodes,
      })
    }

    // Get total number of users who have scanned this code
    const scanCount = await db.collection("scans").countDocuments({ code })

    // Update user's scanned codes
    const updatedScannedCodes = [...(user.scannedCodes || []), code]

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          lastScanTime: new Date(),
          progress: updatedScannedCodes.length,
        },
        $push: { scannedCodes: code },
      },
    )

    // Record scan in scans collection
    await db.collection("scans").insertOne({
      userId: new ObjectId(userId),
      code,
      scannedAt: new Date(),
      qrCodeNumber: 1, // This is QR code 1
    })

    // Calculate user rank based on progress and scan time
    const usersAhead = await db.collection("users").countDocuments({
      $or: [
        { progress: { $gt: updatedScannedCodes.length } },
        {
          progress: updatedScannedCodes.length,
          lastScanTime: { $lt: new Date() },
        },
      ],
    })

    // Check if hunt is complete (all 5 components collected)
    const isComplete = updatedScannedCodes.length >= 5

    return NextResponse.json({
      status: "success",
      message: "QR code scanned successfully",
      progress: updatedScannedCodes.length,
      components: updatedScannedCodes,
      scanCount,
      rank: usersAhead + 1,
      complete: isComplete,
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json({ error: "Failed to process QR code" }, { status: 500 })
  }
}

