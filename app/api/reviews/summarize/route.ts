import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { openai } from '@/lib/openai'
import { buildRubricSummaryPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { submissionId } = await req.json()
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  const db = adminDb()

  const submissionDoc = await db.collection('submissions').doc(submissionId).get()
  if (!submissionDoc.exists) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }
  const submission = submissionDoc.data()!

  const reviewsSnap = await db
    .collection('reviews')
    .where('submissionId', '==', submissionId)
    .get()

  if (reviewsSnap.empty) {
    return NextResponse.json({ summary: '아직 제출된 리뷰가 없습니다.' })
  }

  const reviews = reviewsSnap.docs.map((d) => d.data() as {
    reviewerName: string
    rubricScores: Record<string, number>
    comment: string
  })

  const prompt = buildRubricSummaryPrompt(
    submission.studentName,
    submission.planningData,
    reviews
  )

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
  })

  const summary = response.choices[0]?.message?.content ?? ''
  return NextResponse.json({ summary })
}
