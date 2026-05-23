'use client'

import { useState } from 'react'
import type { RubricItem } from '@/lib/types'

interface RubricFormProps {
  submissionId: string
  rubricItems: RubricItem[]
  onSubmitted: () => void
}

export function RubricForm({ submissionId, rubricItems, onSubmitted }: RubricFormProps) {
  const [reviewerName, setReviewerName] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewerName.trim()) return

    setLoading(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId,
        reviewerName,
        rubricScores: scores,
        comment,
      }),
    })
    setSubmitted(true)
    setLoading(false)
    onSubmitted()
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🎉</div>
        <p className="font-semibold text-gray-700">평가를 제출했어요!</p>
        <p className="text-sm text-gray-500 mt-1">소중한 의견 감사해요</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">내 이름</label>
        <input
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="이름을 입력하세요"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
        />
      </div>

      {rubricItems.map(({ label, maxScore }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <span className="text-sm text-indigo-600 font-bold">{scores[label] ?? 0} / {maxScore}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: maxScore }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScores({ ...scores, [label]: n })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  (scores[label] ?? 0) >= n
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-400 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 의견</label>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="앱을 체험한 소감을 짧게 써주세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? '제출 중...' : '평가 제출하기'}
      </button>
    </form>
  )
}
