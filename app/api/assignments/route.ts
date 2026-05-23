import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { isTeacherEmail } from '@/lib/auth'
import { nanoid } from 'nanoid'
import type { Assignment } from '@/lib/types'

// 교사 UID 검증 헬퍼 (Firebase Admin으로 토큰 검증)
async function verifyTeacher(req: NextRequest): Promise<{ uid: string; email: string } | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    }
    const decoded = await getAuth().verifyIdToken(token)
    if (!isTeacherEmail(decoded.email)) return null
    return { uid: decoded.uid, email: decoded.email! }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = adminDb()
  const snap = await db
    .collection('assignments')
    .where('teacherUid', '==', teacher.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const assignments = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const assignment: Omit<Assignment, 'id'> = {
    title: body.title,
    description: body.description ?? '',
    teacherEmail: teacher.email,
    teacherUid: teacher.uid,
    shareToken: nanoid(10),
    fieldsConfig: body.fieldsConfig,
    rubricItems: body.rubricItems ?? [],
    gradeLevel: body.gradeLevel,
    subjectFilter: body.subjectFilter ?? '',
    ...(body.presetAchievementStandards?.length > 0 && { presetAchievementStandards: body.presetAchievementStandards }),
    createdAt: new Date() as unknown as import('firebase/firestore').Timestamp,
  }

  const db = adminDb()
  const ref = await db.collection('assignments').add({
    ...assignment,
    createdAt: new Date(),
  })

  return NextResponse.json({ id: ref.id, ...assignment })
}
