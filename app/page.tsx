import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="text-center max-w-2xl">
        <div className="text-6xl mb-4">🎓</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">에듀앱 빌더</h1>
        <p className="text-lg text-gray-600 mb-10">
          학생이 기획서를 쓰면, AI가 웹앱을 만들어 드려요
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <Link
            href="/teacher/dashboard"
            className="flex flex-col items-center gap-2 p-6 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="text-3xl">👩‍🏫</span>
            <span className="font-semibold text-lg">교사 대시보드</span>
            <span className="text-sm text-indigo-200">Google 로그인 필요</span>
          </Link>

          <div className="flex flex-col items-center gap-2 p-6 bg-emerald-500 text-white rounded-2xl shadow-lg">
            <span className="text-3xl">🧒</span>
            <span className="font-semibold text-lg">학생 기획서 제출</span>
            <span className="text-sm text-emerald-100">선생님이 준 링크로 접속</span>
          </div>
        </div>
      </div>
    </div>
  )
}
