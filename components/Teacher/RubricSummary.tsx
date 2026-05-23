'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Review, RubricItem } from '@/lib/types'

interface RubricSummaryProps {
  submissionId: string
  rubricItems: RubricItem[]
}

export function RubricSummary({ submissionId, rubricItems }: RubricSummaryProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    fetch(`/api/reviews?submissionId=${submissionId}`)
      .then((r) => r.json())
      .then(setReviews)
  }, [submissionId])

  const handleSummarize = async () => {
    setLoadingSummary(true)
    const token = await user?.getIdToken()
    const res = await fetch('/api/reviews/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId }),
    })
    const json = await res.json()
    setSummary(json.summary)
    setLoadingSummary(false)
  }

  // 항목별 평균 점수 계산
  const averages: Record<string, number> = {}
  rubricItems.forEach(({ label }) => {
    const scores = reviews.map((r) => r.rubricScores?.[label] ?? 0).filter((s) => s > 0)
    averages[label] = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">학생 루브릭 ({reviews.length}명 응답)</h3>
        <button
          onClick={handleSummarize}
          disabled={loadingSummary || reviews.length === 0}
          className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {loadingSummary ? '요약 중...' : '🤖 AI 요약'}
        </button>
      </div>

      {/* 평균 점수 */}
      {rubricItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {rubricItems.map(({ label, maxScore }) => (
            <div key={label} className="bg-violet-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="text-lg font-bold text-violet-700">
                {averages[label] ?? 0} <span className="text-sm font-normal text-gray-400">/ {maxScore}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* AI 요약 */}
      {summary && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-violet-700 mb-2">🤖 AI 피드백 요약</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* 개별 리뷰 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-700">{r.reviewerName}</span>
              <div className="flex gap-2 text-xs text-gray-500">
                {Object.entries(r.rubricScores ?? {}).map(([k, v]) => (
                  <span key={k}>{k}: {v}점</span>
                ))}
              </div>
            </div>
            {r.comment && <p className="text-gray-600 text-xs">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
