import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  let email: string

  try {
    const body = await request.json()
    email = (body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('waitlist').insert({ email })

  if (dbError) {
    if (dbError.code === '23505') {
      // Already registered — treat as success so we don't leak info
      return NextResponse.json({ status: 'duplicate' }, { status: 200 })
    }
    console.error('[waitlist] db error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Send notification email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'info@cristianosticca.com',
      subject: `[AstroTransit] Nuova iscrizione waitlist: ${email}`,
      text: `Nuova email in waitlist: ${email}\n\nData: ${new Date().toISOString()}`,
    })
  } catch (mailError) {
    // Log but don't fail the request — DB insert succeeded
    console.error('[waitlist] mail error:', mailError)
  }

  return NextResponse.json({ status: 'ok' }, { status: 201 })
}
