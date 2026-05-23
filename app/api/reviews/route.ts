import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import type { Review } from '@/lib/types'

// 리뷰 제출 (학생, 인증 불필요)
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.submissionId || !body.reviewerName || !body.rubricScores) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const review: Omit<Review, 'id'> = {
    submissionId: body.submissionId,
    reviewerName: body.reviewerName,
    rubricScores: body.rubricScores,
    comment: body.comment ?? '',
    createdAt: new Date() as unknown as import('firebase/firestore').Timestamp,
  }

  const db = adminDb()
  const ref = await db.collection('reviews').add({ ...review, createdAt: new Date() })

  return NextResponse.json({ id: ref.id, ...review })
}

// 리뷰 조회 (submissionId로)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const submissionId = searchParams.get('submissionId')

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
  }

  const db = adminDb()
  const snap = await db
    .collection('reviews')
    .where('submissionId', '==', submissionId)
    .orderBy('createdAt', 'desc')
    .get()

  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json(reviews)
}
