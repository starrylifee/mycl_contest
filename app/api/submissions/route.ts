import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import type { Submission } from '@/lib/types'

// 학생 제출 (인증 불필요)
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.assignmentId || !body.studentName || !body.planningData) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = adminDb()

  // 과제 존재 확인
  const assignmentDoc = await db.collection('assignments').doc(body.assignmentId).get()
  if (!assignmentDoc.exists) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  const submission: Omit<Submission, 'id'> = {
    assignmentId: body.assignmentId,
    assignmentTitle: assignmentDoc.data()?.title ?? '',
    studentName: body.studentName,
    planningData: body.planningData,
    status: 'submitted',
    editHistory: [],
    createdAt: new Date() as unknown as import('firebase/firestore').Timestamp,
  }

  const ref = await db.collection('submissions').add({
    ...submission,
    createdAt: new Date(),
  })

  return NextResponse.json({ id: ref.id, ...submission })
}

// 교사용: assignmentId로 제출물 목록 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const assignmentId = searchParams.get('assignmentId')

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
  }

  const db = adminDb()
  const snap = await db
    .collection('submissions')
    .where('assignmentId', '==', assignmentId)
    .orderBy('createdAt', 'desc')
    .get()

  const submissions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json(submissions)
}
