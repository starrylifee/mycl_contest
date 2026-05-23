import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { openai } from '@/lib/openai'
import { buildGenerationPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { submissionId } = await req.json()
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  const db = adminDb()
  const submissionRef = db.collection('submissions').doc(submissionId)
  const submissionDoc = await submissionRef.get()

  if (!submissionDoc.exists) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const submission = submissionDoc.data()!
  const assignmentDoc = await db.collection('assignments').doc(submission.assignmentId).get()
  const gradeLevel = assignmentDoc.data()?.gradeLevel ?? '3-4'

  await submissionRef.update({ status: 'generating' })

  const prompt = buildGenerationPrompt(submission.planningData, gradeLevel)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: '당신은 한국 초등학교 교육용 인터랙티브 웹앱을 만드는 전문 개발자입니다.',
      },
      { role: 'user', content: prompt },
    ],
    stream: true,
    max_tokens: 8000,
  })

  let fullCode = ''

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          fullCode += delta
          controller.enqueue(encoder.encode(delta))
        }
        // 완료 시 Firestore 업데이트
        await submissionRef.update({
          generatedCode: fullCode,
          status: 'generated',
          generatedAt: new Date(),
        })
        controller.close()
      } catch (err) {
        await submissionRef.update({ status: 'submitted' })
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
