'use client'

import { useState, useRef } from 'react'
import type { FieldKey } from '@/lib/types'

interface OCRUploadProps {
  gradeLevel: string
  fieldsConfig: FieldKey[]
  onResult: (data: Record<string, string>) => void
}

export function OCRUpload({ gradeLevel, fieldsConfig, onResult }: OCRUploadProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('gradeLevel', gradeLevel)
    formData.append('fieldsConfig', JSON.stringify(fieldsConfig))

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.data) onResult(json.data)
    } catch {
      alert('OCR 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center bg-blue-50">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {preview && (
        <img src={preview} alt="기획서 미리보기" className="max-h-40 mx-auto mb-3 rounded-lg" />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '📖 읽는 중...' : '📸 기획서 사진 찍기 / 올리기'}
      </button>
      <p className="text-xs text-gray-500 mt-2">사진을 올리면 AI가 글씨를 읽어서 자동으로 채워줘요</p>
    </div>
  )
}
