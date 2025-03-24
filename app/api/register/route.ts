import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { registrationNumber, code } = await request.json()

    // Validate input
    if (!registrationNumber || !code) {
      return NextResponse.json({ error: "Registration number and code are required" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if registration number already exists
    const existingUser = await db.collection("users").findOne({ registrationNumber })

    if (existingUser) {
      // If user exists, set cookie and return success
      cookies().set("user_id", existingUser._id.toString(), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      return NextResponse.json({
        status: "success",
        message: "User already registered",
        userId: existingUser._id.toString(),
      })
    }

    // Create new user
    const newUser = {
      registrationNumber,
      createdAt: new Date(),
      scannedCodes: [code], // Add the first code they scanned
      progress: 1,
      lastScanTime: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)

    // Set cookie with user ID
    cookies().set("user_id", result.insertedId.toString(), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Record scan in scans collection
    await db.collection("scans").insertOne({
      userId: result.insertedId,
      code,
      scannedAt: new Date(),
      qrCodeNumber: 1, // This is QR code 1
    })

    return NextResponse.json({
      status: "success",
      message: "Registration successful",
      userId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}

