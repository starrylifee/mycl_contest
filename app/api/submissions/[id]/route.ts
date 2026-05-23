import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = adminDb()
  const doc = await db.collection('submissions').doc(id).get()

  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: doc.id, ...doc.data() })
}
