import { NextRequest, NextResponse } from 'next/server'
import { authenticatePlayer, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, passphrase } = await request.json()

    // Validate input
    if (!name || !passphrase) {
      return NextResponse.json(
        { error: 'Name and passphrase are required' },
        { status: 400 }
      )
    }

    // Authenticate player
    const user = await authenticatePlayer(name, passphrase)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Set authentication cookie
    console.log(`Setting auth cookie for user: ${user.name} (${user.id})`)
    await setAuthCookie(user.id, user.name)
    console.log('Auth cookie set successfully')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
