import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Set a simple session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

// GET - Check auth status
export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  return NextResponse.json({ authenticated: true })
}

// DELETE - Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  return response
}
