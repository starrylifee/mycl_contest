'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { use } from 'react'
import type { Submission, Assignment } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  submitted: '⏳ 제출됨',
  generating: '⚙️ 생성 중',
  generated: '✅ 완료',
  editing: '✏️ 편집 중',
}

export default function AssignmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, id])

  const loadData = async () => {
    const token = await user!.getIdToken()
    const [aRes, sRes] = await Promise.all([
      fetch(`/api/assignments?id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/submissions?assignmentId=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
    const assignmentsData = await aRes.json()
    const submissionsData = await sRes.json()
    setAssignment(Array.isArray(assignmentsData) ? assignmentsData.find((a: Assignment) => a.id === id) : null)
    setSubmissions(Array.isArray(submissionsData) ? submissionsData : [])
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{assignment?.title}</h1>
          <p className="text-sm text-gray-500">{assignment?.gradeLevel} · {assignment?.subjectFilter || '전체'}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 링크 공유 영역 */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/plan/${assignment?.shareToken}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            학생 기획서 링크 복사
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/gallery/${id}`)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
          >
            갤러리 링크 복사
          </button>
        </div>

        <h2 className="font-semibold text-gray-700 mb-4">제출물 ({submissions.length}명)</h2>

        {submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>아직 제출된 기획서가 없어요</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {submissions.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/submissions/${s.id}`}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">{s.studentName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.createdAt ? new Date((s.createdAt as unknown as { seconds: number }).seconds * 1000).toLocaleString('ko-KR') : ''}
                  </p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  s.status === 'generated' ? 'bg-green-100 text-green-700' :
                  s.status === 'generating' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
