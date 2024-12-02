import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    adminUserPresent: !!process.env.ADMIN_USERNAME,
    adminPassPresent: !!process.env.ADMIN_PASSWORD
  })
}
