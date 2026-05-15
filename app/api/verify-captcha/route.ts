import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token } = await request.json()

  // On récupère la clé secrète depuis les variables d'environnement
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  const formData = new FormData()
  formData.append('secret', secretKey!)
  formData.append('response', token)

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  })

  const outcome = await result.json()

  if (outcome.success) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: outcome['error-codes'] })
  }
}