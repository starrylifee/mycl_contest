import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { buildOCRPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const imageFile = formData.get('image') as File | null
  const gradeLevel = (formData.get('gradeLevel') as string) ?? '3-4'
  const fieldsConfigRaw = (formData.get('fieldsConfig') as string) ?? '[]'

  if (!imageFile) {
    return NextResponse.json({ error: 'image required' }, { status: 400 })
  }

  const fieldsConfig: string[] = JSON.parse(fieldsConfigRaw)

  // 이미지를 base64로 변환
  const buffer = await imageFile.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = imageFile.type || 'image/jpeg'

  const prompt = buildOCRPrompt(gradeLevel, fieldsConfig)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 2000,
  })

  const text = response.choices[0]?.message?.content ?? '{}'

  // JSON 파싱 시도
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
    return NextResponse.json({ data: parsed })
  } catch {
    return NextResponse.json({ data: {}, raw: text })
  }
}
