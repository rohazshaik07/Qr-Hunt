import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Get the user cookie
  const userCookie = request.cookies.get("user_id")
  const isLoggedIn = !!userCookie

  // Paths that require authentication
  const protectedPaths = ["/hunt", "/clue", "/components", "/completion"]

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((pp) => path.startsWith(pp))

  // If the path is protected and the user is not logged in, redirect to home
  if (isProtectedPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}

