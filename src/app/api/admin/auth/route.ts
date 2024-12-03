import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; timestamp: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  // Clean up old entries
  if (attempts && now - attempts.timestamp > LOCKOUT_DURATION) {
    loginAttempts.delete(ip)
    return false
  }

  return attempts ? attempts.count >= MAX_ATTEMPTS : false
}

function recordLoginAttempt(ip: string, success: boolean) {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  if (!attempts) {
    loginAttempts.set(ip, { count: success ? 0 : 1, timestamp: now })
    return
  }

  if (success) {
    loginAttempts.delete(ip)
  } else {
    attempts.count++
    attempts.timestamp = now
  }
}

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { username, password } = await request.json()

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      recordLoginAttempt(ip, false)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    recordLoginAttempt(ip, true)
    const response = NextResponse.json({ success: true })
    
    // Set secure cookie with HttpOnly and other security flags
    response.cookies.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

// GET - Check auth status
export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('admin_session')
    return NextResponse.json({ authenticated: !!session })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  return response
}
