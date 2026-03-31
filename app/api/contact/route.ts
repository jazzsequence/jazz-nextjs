import { NextRequest, NextResponse } from 'next/server'

const WORDPRESS_BASE_URL = (process.env.WORDPRESS_API_URL ?? 'https://jazzsequence.com/wp-json/wp/v2')
  .replace('/wp/v2', '')

const CONTACT_ENDPOINT = `${WORDPRESS_BASE_URL}/jazz-nextjs/v1/contact`

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; message?: string; website?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, message, website } = body

  // Honeypot: real users never fill this hidden field; bots do.
  if (website) {
    // Return 200 so bots think they succeeded, discouraging retries.
    return NextResponse.json({ success: true })
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!isValidEmail(email.trim())) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const username = process.env.WORDPRESS_USERNAME
  const password = process.env.WORDPRESS_APP_PASSWORD

  if (!username || !password) {
    console.error('[contact] WORDPRESS_USERNAME or WORDPRESS_APP_PASSWORD not set')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const wpRes = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      }),
    })

    if (!wpRes.ok) {
      console.error('[contact] WordPress returned error:', wpRes.status)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[contact] WordPress unreachable:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 502 })
  }
}
