'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import type { Assignment } from '@/lib/types'

export default function TeacherDashboard() {
  const { user, loading, signInWithGoogle, logout } = useAuth()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      registerTeacher().then(loadAssignments)
    }
  }, [user, loading])

  const registerTeacher = async () => {
    const token = await user!.getIdToken()
    await fetch('/api/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const loadAssignments = async () => {
    setFetching(true)
    const token = await user!.getIdToken()
    const res = await fetch('/api/assignments', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setAssignments(Array.isArray(data) ? data : [])
    setFetching(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">로딩 중...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">👩‍🏫</div>
        <h1 className="text-2xl font-bold text-gray-800">교사 로그인</h1>
        <p className="text-gray-500">Google 계정으로 로그인하세요</p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-xl shadow hover:shadow-md transition-shadow font-medium"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Google로 로그인
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <h1 className="text-xl font-bold text-gray-800">에듀앱 빌더</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">내 과제 목록</h2>
          <Link
            href="/teacher/assignments/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            + 새 과제 만들기
          </Link>
        </div>

        {fetching ? (
          <p className="text-gray-400 text-center py-12">불러오는 중...</p>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p>아직 과제가 없어요. 새 과제를 만들어보세요!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {a.gradeLevel}학년 · {a.subjectFilter || '전체 과목'}
                    </p>
                    {a.description && (
                      <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {a.fieldsConfig?.length ?? 0}개 항목
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/teacher/assignments/${a.id}`}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100"
                  >
                    제출물 보기
                  </Link>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/plan/${a.shareToken}`)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100"
                  >
                    학생 링크 복사
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/gallery/${a.id}`)}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100"
                  >
                    갤러리 링크 복사
                  </button>
                  <a
                    href={`/public/sample-template/planning-form-${a.gradeLevel ?? '3-4'}.html`}
                    target="_blank"
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    기획서 양식 출력
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
