import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { openai } from '@/lib/openai'
import { buildEditPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { submissionId, editRequest, directCode } = await req.json()
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  const db = adminDb()
  const submissionRef = db.collection('submissions').doc(submissionId)
  const submissionDoc = await submissionRef.get()

  if (!submissionDoc.exists) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const submission = submissionDoc.data()!
  const currentCode = submission.generatedCode ?? ''

  // 직접 코드 저장 (Monaco Editor에서 붙여넣기/직접 수정)
  if (directCode !== undefined) {
    const history = submission.editHistory ?? []
    await submissionRef.update({
      generatedCode: directCode,
      status: 'generated',
      editHistory: [
        ...history,
        { code: currentCode, editRequest: '직접 편집', editedAt: new Date().toISOString() },
      ],
    })
    return NextResponse.json({ success: true })
  }

  if (!editRequest) return NextResponse.json({ error: 'editRequest required' }, { status: 400 })

  await submissionRef.update({ status: 'editing' })

  const prompt = buildEditPrompt(currentCode, editRequest)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
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
        const history = submission.editHistory ?? []
        await submissionRef.update({
          generatedCode: fullCode,
          status: 'generated',
          editHistory: [
            ...history,
            { code: currentCode, editRequest, editedAt: new Date().toISOString() },
          ],
        })
        controller.close()
      } catch (err) {
        await submissionRef.update({ status: 'generated' })
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
