'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { AppPreview } from '@/components/AppPreview'
import { RubricForm } from '@/components/Student/RubricForm'
import type { Submission, Assignment } from '@/lib/types'

export default function AppExperience({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [showRubric, setShowRubric] = useState(false)
  const [rubricDone, setRubricDone] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSubmission(data)
        if (data.assignmentId) {
          fetch(`/api/assignments/${data.assignmentId}`)
            .then((r) => r.json())
            .then(setAssignment)
        }
      })
  }, [id])

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>
  }

  if (submission.status !== 'generated' || !submission.generatedCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-3">⏳</div>
        <h1 className="text-xl font-bold text-gray-700">앱을 만드는 중이에요!</h1>
        <p className="text-gray-500 mt-2">선생님이 앱을 완성하면 여기서 볼 수 있어요</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          새로고침
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 헤더 */}
      {!fullscreen && (
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{submission.studentName}의 앱</p>
            {assignment && <p className="text-xs text-gray-400">{assignment.title}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFullscreen(true)}
              className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs hover:bg-gray-600"
            >
              전체화면
            </button>
            {!showRubric && !rubricDone && (assignment?.rubricItems?.length ?? 0) > 0 && (
              <button
                onClick={() => setShowRubric(true)}
                className="px-3 py-1.5 bg-amber-500 rounded-lg text-xs font-medium hover:bg-amber-600"
              >
                ⭐ 평가하기
              </button>
            )}
          </div>
        </div>
      )}

      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs"
        >
          전체화면 종료
        </button>
      )}

      {/* 앱 미리보기 */}
      <div className={`flex-1 ${fullscreen ? 'fixed inset-0 z-40' : ''}`}>
        <AppPreview code={submission.generatedCode} height={fullscreen ? '100vh' : '70vh'} />
      </div>

      {/* 루브릭 */}
      {!fullscreen && showRubric && !rubricDone && (
        <div className="bg-white border-t px-4 py-6 max-w-lg mx-auto w-full">
          <h2 className="font-bold text-gray-800 mb-4">⭐ 이 앱을 평가해주세요</h2>
          <RubricForm
            submissionId={id}
            rubricItems={assignment?.rubricItems ?? []}
            onSubmitted={() => { setRubricDone(true); setShowRubric(false) }}
          />
        </div>
      )}

      {!fullscreen && rubricDone && (
        <div className="bg-emerald-50 border-t border-emerald-200 text-center py-4 text-emerald-700 font-medium">
          🎉 평가 완료! 고마워요
        </div>
      )}
    </div>
  )
}
