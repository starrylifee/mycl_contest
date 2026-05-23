'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { AppPreview } from '@/components/AppPreview'
import type { Submission, Assignment } from '@/lib/types'

export default function Gallery({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selected, setSelected] = useState<Submission | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/assignments/${assignmentId}`).then((r) => r.json()),
      fetch(`/api/submissions?assignmentId=${assignmentId}`).then((r) => r.json()),
    ]).then(([a, s]) => {
      setAssignment(a)
      const generated = (Array.isArray(s) ? s : []).filter(
        (sub: Submission) => sub.status === 'generated' && sub.generatedCode
      )
      setSubmissions(generated)
    })
  }, [assignmentId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="bg-white border-b px-6 py-4 text-center">
        <div className="text-3xl mb-1">🎨</div>
        <h1 className="text-2xl font-bold text-gray-800">{assignment?.title ?? '앱 갤러리'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">우리 반 친구들의 앱을 체험해보세요</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🔧</div>
            <p>아직 완성된 앱이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected(s)}
              >
                {/* 미니 미리보기 */}
                <div className="h-40 overflow-hidden pointer-events-none">
                  <AppPreview code={s.generatedCode!} height="160px" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{s.studentName}</p>
                    <p className="text-xs text-gray-400">앱 체험하기</p>
                  </div>
                  <Link
                    href={`/app/${s.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
                  >
                    열기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 미리보기 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-semibold text-gray-800">{selected.studentName}의 앱</p>
              <div className="flex gap-2">
                <Link
                  href={`/app/${selected.id}`}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                >
                  크게 보기
                </Link>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <AppPreview code={selected.generatedCode!} height="480px" />
          </div>
        </div>
      )}
    </div>
  )
}
