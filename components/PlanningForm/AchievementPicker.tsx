'use client'

import { useState } from 'react'
import { getGradeGroups, getSubjects, getStandards } from '@/lib/achievement-standards'

interface AchievementPickerProps {
  initialGradeGroup?: string
  value: string[]
  onChange: (selected: string[]) => void
}

export function AchievementPicker({ initialGradeGroup, value, onChange }: AchievementPickerProps) {
  const gradeGroups = getGradeGroups()
  const [selectedGrade, setSelectedGrade] = useState(initialGradeGroup ?? gradeGroups[0])
  const [selectedSubject, setSelectedSubject] = useState('')

  const subjects = getSubjects(selectedGrade)
  const standards = selectedSubject ? getStandards(selectedGrade, selectedSubject) : []

  const toggle = (s: string) => {
    if (value.includes(s)) onChange(value.filter((v) => v !== s))
    else onChange([...value, s])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {gradeGroups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => { setSelectedGrade(g); setSelectedSubject('') }}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              selectedGrade === g
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {g}학년
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelectedSubject(s)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selectedSubject === s
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {standards.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2 bg-gray-50">
          {standards.map((s) => {
            const checked = value.includes(s)
            return (
              <label key={s} className="flex items-start gap-2 cursor-pointer hover:bg-white rounded p-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s)}
                  className="mt-0.5 accent-indigo-600"
                />
                <span className={`text-xs ${checked ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>
                  {s}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-indigo-700">선택된 성취기준 ({value.length}개)</p>
          {value.map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs bg-indigo-50 rounded p-1.5">
              <span className="flex-1 text-indigo-800">{s}</span>
              <button type="button" onClick={() => toggle(s)} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
