'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FIELD_LABELS, type FieldKey, type RubricItem } from '@/lib/types'
import { getGradeGroups, getSubjects, getStandards } from '@/lib/achievement-standards'
import Link from 'next/link'

const ALL_FIELDS: FieldKey[] = [
  'appName', 'appDescription', 'achievementStandards',
  'mainFeatures', 'screenLayout', 'gameRules', 'learningConnection', 'winCondition',
]

const GRADE_RECOMMENDATIONS: Record<string, FieldKey[]> = {
  '1~2학년': ['appName', 'appDescription'],
  '3~4학년': ['appName', 'appDescription', 'mainFeatures', 'gameRules', 'winCondition'],
  '5~6학년': ['appName', 'appDescription', 'achievementStandards', 'mainFeatures', 'screenLayout', 'gameRules', 'learningConnection', 'winCondition'],
}

export default function NewAssignment() {
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gradeLevel, setGradeLevel] = useState('3~4학년')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [selectedFields, setSelectedFields] = useState<FieldKey[]>(GRADE_RECOMMENDATIONS['3~4학년'])
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([
    { label: '교육 내용 반영', maxScore: 5 },
    { label: '재미있어요', maxScore: 5 },
    { label: '사용하기 쉬워요', maxScore: 5 },
  ])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const gradeGroups = getGradeGroups()
  const subjects = getSubjects(gradeLevel)
  const availableStandards = subjectFilter ? getStandards(gradeLevel, subjectFilter) : []

  const toggleField = (f: FieldKey) => {
    setSelectedFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const applyRecommendation = (grade: string) => {
    setGradeLevel(grade)
    setSelectedFields(GRADE_RECOMMENDATIONS[grade] ?? GRADE_RECOMMENDATIONS['3~4학년'])
    setSubjectFilter('')
    setSelectedStandards([])
  }

  const toggleStandard = (s: string) => {
    setSelectedStandards((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const addRubricItem = () => {
    setRubricItems([...rubricItems, { label: '', maxScore: 5 }])
  }

  const updateRubric = (i: number, field: keyof RubricItem, value: string | number) => {
    setRubricItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const removeRubric = (i: number) => {
    setRubricItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return
    setSaving(true)

    const token = await user.getIdToken()
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title, description, gradeLevel, subjectFilter, fieldsConfig: selectedFields, rubricItems,
        presetAchievementStandards: selectedStandards.length > 0 ? selectedStandards : undefined,
      }),
    })

    if (res.ok) {
      router.push('/teacher/dashboard')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-800">새 과제 만들기</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* 기본 정보 */}
        <section className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">기본 정보</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">과제 제목 *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="예: 수학 게임 앱 기획하기"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">과제 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="학생에게 안내할 내용"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
              <select
                value={gradeLevel}
                onChange={(e) => applyRecommendation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
              >
                {gradeGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
              <select
                value={subjectFilter}
                onChange={(e) => { setSubjectFilter(e.target.value); setSelectedStandards([]) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
              >
                <option value="">전체</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {subjectFilter && availableStandards.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성취기준 선택{' '}
                <span className="text-gray-400 font-normal text-xs">(선택 - 학생에게 미리 제공됩니다)</span>
              </label>
              <div className="space-y-1 max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                {availableStandards.map((s, i) => (
                  <label key={i} className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={selectedStandards.includes(s)}
                      onChange={() => toggleStandard(s)}
                      className="mt-0.5 accent-indigo-600 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-700 leading-snug">{s}</span>
                  </label>
                ))}
              </div>
              {selectedStandards.length > 0 && (
                <p className="text-xs text-indigo-600 mt-1">{selectedStandards.length}개 선택됨</p>
              )}
            </div>
          )}
        </section>

        {/* 기획서 항목 선택 */}
        <section className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">기획서 입력 항목 선택</h2>
          <p className="text-xs text-gray-500">학생 기획서에 포함할 항목을 선택하세요. 학년에 맞게 자동 추천됩니다.</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_FIELDS.map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(f)}
                  onChange={() => toggleField(f)}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{FIELD_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 루브릭 구성 */}
        <section className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">루브릭 항목</h2>
            <button
              type="button"
              onClick={addRubricItem}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + 항목 추가
            </button>
          </div>
          <p className="text-xs text-gray-500">학생들이 앱을 체험하고 평가할 기준을 설정하세요.</p>
          <div className="space-y-2">
            {rubricItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={item.label}
                  onChange={(e) => updateRubric(i, 'label', e.target.value)}
                  placeholder="평가 항목명"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
                <select
                  value={item.maxScore}
                  onChange={(e) => updateRubric(i, 'maxScore', Number(e.target.value))}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                >
                  {[3, 4, 5].map((n) => <option key={n} value={n}>{n}점</option>)}
                </select>
                <button type="button" onClick={() => removeRubric(i)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '과제 만들기'}
        </button>
      </form>
    </div>
  )
}
