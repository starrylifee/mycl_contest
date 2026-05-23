import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { isTeacherEmail } from '@/lib/auth'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function getAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getAuth()
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    const { uid, email } = decoded

    if (!isTeacherEmail(email)) {
      return NextResponse.json({ error: 'Not a teacher account' }, { status: 403 })
    }

    const db = adminDb()
    const ref = db.collection('teachers').doc(uid)
    const doc = await ref.get()

    if (!doc.exists) {
      await ref.set({ email, registeredAt: new Date() })
    }

    return NextResponse.json({ ok: true, uid, email })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
