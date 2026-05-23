'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { STTButton } from '@/components/PlanningForm/STTButton'
import { OCRUpload } from '@/components/PlanningForm/OCRUpload'
import { AchievementPicker } from '@/components/PlanningForm/AchievementPicker'
import { FIELD_LABELS, type FieldKey, type Assignment } from '@/lib/types'

export default function PlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [formData, setFormData] = useState<Partial<Record<FieldKey, string | string[]>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [ocrMode, setOcrMode] = useState(false)

  useEffect(() => {
    fetch(`/api/assignments/by-token?token=${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => {
        if (data) {
          setAssignment(data)
          if (data.presetAchievementStandards?.length > 0) {
            setFormData((prev) => ({ ...prev, achievementStandards: data.presetAchievementStandards }))
          }
        }
      })
  }, [token])

  const updateField = (key: FieldKey, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleOCRResult = (data: Record<string, string>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment || !studentName.trim()) return
    setSubmitting(true)

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId: assignment.id,
        studentName,
        planningData: formData,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setSubmittedId(data.id)
    }
    setSubmitting(false)
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-3">😢</div>
        <h1 className="text-xl font-bold text-gray-700">링크를 찾을 수 없어요</h1>
        <p className="text-gray-500 mt-2">선생님이 주신 링크를 다시 확인해주세요</p>
      </div>
    )
  }

  if (!assignment) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>
  }

  if (submittedId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">기획서를 제출했어요!</h1>
        <p className="text-gray-600 mb-6">선생님이 앱을 만들면 아래 링크에서 볼 수 있어요</p>
        <div className="bg-white rounded-2xl border p-4 mb-4 max-w-sm w-full">
          <p className="text-xs text-gray-500 mb-2">내 앱 체험 링크</p>
          <p className="text-sm font-mono text-indigo-600 break-all">
            {window.location.origin}/app/{submittedId}
          </p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/app/${submittedId}`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          링크 복사하기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📝</div>
          <h1 className="text-2xl font-bold text-gray-800">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-gray-600 mt-1 text-sm">{assignment.description}</p>
          )}
        </div>

        {/* OCR 토글 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setOcrMode(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!ocrMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            ✍️ 직접 입력
          </button>
          <button
            type="button"
            onClick={() => setOcrMode(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${ocrMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            📸 사진으로 입력
          </button>
        </div>

        {ocrMode && (
          <div className="mb-4">
            <OCRUpload
              gradeLevel={assignment.gradeLevel}
              fieldsConfig={assignment.fieldsConfig}
              onResult={handleOCRResult}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div className="bg-white rounded-2xl border p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">내 이름 *</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* 동적 필드 */}
          {assignment.fieldsConfig.map((field) => (
            <div key={field} className="bg-white rounded-2xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">{FIELD_LABELS[field]}</label>
                {field !== 'achievementStandards' && (
                  <STTButton onResult={(text) => {
                    const prev = (formData[field] as string) ?? ''
                    updateField(field, prev ? `${prev} ${text}` : text)
                  }} />
                )}
              </div>

              {field === 'achievementStandards' ? (
                assignment.presetAchievementStandards && assignment.presetAchievementStandards.length > 0 ? (
                  <div className="space-y-1.5">
                    {assignment.presetAchievementStandards.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                        <span className="text-indigo-500 flex-shrink-0 text-sm">✓</span>
                        <span className="text-xs text-gray-700 leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AchievementPicker
                    initialGradeGroup={assignment.gradeLevel}
                    value={(formData.achievementStandards as string[]) ?? []}
                    onChange={(v) => updateField('achievementStandards', v)}
                  />
                )
              ) : (
                <textarea
                  value={(formData[field] as string) ?? ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={getPlaceholder(field)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400 resize-none text-sm"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting || !studentName.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 shadow-lg"
          >
            {submitting ? '제출 중...' : '기획서 제출하기 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}

function getPlaceholder(field: FieldKey): string {
  const map: Partial<Record<FieldKey, string>> = {
    appName: '예: 구구단 퀴즈 게임',
    appDescription: '예: 구구단을 재미있게 연습할 수 있는 퀴즈 게임이에요',
    mainFeatures: '예: 문제 내기, 점수 보여주기, 다시 하기',
    screenLayout: '예: 처음 화면 → 문제 화면 → 결과 화면',
    gameRules: '예: 10초 안에 답을 맞히면 점수가 올라가요',
    learningConnection: '예: 2~9단 곱셈을 연습할 수 있어요',
    winCondition: '예: 10문제 중 8개 이상 맞히면 이겨요',
  }
  return map[field] ?? ''
}
