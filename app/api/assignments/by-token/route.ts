import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const db = adminDb()
  const snap = await db
    .collection('assignments')
    .where('shareToken', '==', token)
    .limit(1)
    .get()

  if (snap.empty) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc = snap.docs[0]
  return NextResponse.json({ id: doc.id, ...doc.data() })
}
