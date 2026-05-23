'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { CodeEditor } from '@/components/Teacher/CodeEditor'
import { RubricSummary } from '@/components/Teacher/RubricSummary'
import { FIELD_LABELS } from '@/lib/types'
import type { Submission, Assignment } from '@/lib/types'

export default function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [generating, setGenerating] = useState(false)
  const [streamedCode, setStreamedCode] = useState('')
  const [activeSection, setActiveSection] = useState<'plan' | 'app' | 'rubric'>('plan')

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, id])

  const loadData = async () => {
    const token = await user!.getIdToken()
    // Firestore에서 직접 제출물 조회
    const res = await fetch(`/api/submissions/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setSubmission(data)
      if (data.assignmentId) {
        const aRes = await fetch(`/api/assignments/${data.assignmentId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (aRes.ok) setAssignment(await aRes.json())
      }
    }
  }

  const handleGenerate = async () => {
    if (!user) return
    setGenerating(true)
    setStreamedCode('')
    setActiveSection('app')

    const token = await user.getIdToken()
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId: id }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let code = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      code += decoder.decode(value)
      setStreamedCode(code)
    }
    setGenerating(false)
    setSubmission((prev) => prev ? { ...prev, generatedCode: code, status: 'generated' } : prev)
  }

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>
  }

  const displayCode = streamedCode || submission.generatedCode || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/assignments/${submission.assignmentId}`} className="text-gray-400 hover:text-gray-600">←</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{submission.studentName}의 기획서</h1>
            <p className="text-sm text-gray-500">{submission.assignmentTitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {submission.generatedCode && (
            <a
              href={`/app/${id}`}
              target="_blank"
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
            >
              학생 체험 링크
            </a>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? '⚙️ 생성 중...' : submission.generatedCode ? '🔄 재생성' : '🤖 AI 생성'}
          </button>
        </div>
      </header>

      {/* 섹션 탭 */}
      <div className="bg-white border-b px-6 flex gap-0">
        {(['plan', 'app', 'rubric'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === s ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'plan' ? '📋 기획서' : s === 'app' ? '💻 앱' : '⭐ 루브릭'}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeSection === 'plan' && (
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">학생 기획서 내용</h2>
            {Object.entries(submission.planningData ?? {}).map(([key, value]) => (
              <div key={key} className="border-b pb-3 last:border-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {FIELD_LABELS[key as keyof typeof FIELD_LABELS] ?? key}
                </p>
                <p className="text-gray-800 text-sm whitespace-pre-line">
                  {Array.isArray(value) ? value.join('\n') : value}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'app' && (
          <div className="space-y-4">
            {!displayCode && !generating ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🤖</div>
                <p>AI 생성 버튼을 눌러 앱을 만들어보세요!</p>
              </div>
            ) : (
              <CodeEditor
                submissionId={id}
                initialCode={displayCode}
                onCodeUpdate={(code) =>
                  setSubmission((prev) => prev ? { ...prev, generatedCode: code } : prev)
                }
              />
            )}
          </div>
        )}

        {activeSection === 'rubric' && (
          <div className="bg-white rounded-2xl border p-6">
            <RubricSummary
              submissionId={id}
              rubricItems={assignment?.rubricItems ?? []}
            />
          </div>
        )}
      </main>
    </div>
  )
}
