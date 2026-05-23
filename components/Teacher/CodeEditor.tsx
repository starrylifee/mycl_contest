'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { AppPreview } from '@/components/AppPreview'
import { useAuth } from '@/contexts/AuthContext'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface CodeEditorProps {
  submissionId: string
  initialCode: string
  onCodeUpdate: (code: string) => void
}

export function CodeEditor({ submissionId, initialCode, onCodeUpdate }: CodeEditorProps) {
  const { user } = useAuth()
  const [code, setCode] = useState(initialCode)
  const [editRequest, setEditRequest] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const streamingCodeRef = useRef('')

  const getToken = async () => {
    if (!user) return null
    return user.getIdToken()
  }

  const handleAIEdit = async () => {
    if (!editRequest.trim()) return
    setStreaming(true)
    streamingCodeRef.current = ''
    setActiveTab('preview')

    const token = await getToken()
    const res = await fetch('/api/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId, editRequest }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let newCode = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      newCode += chunk
      streamingCodeRef.current = newCode
      setCode(newCode)
    }

    setStreaming(false)
    setEditRequest('')
    onCodeUpdate(newCode)
  }

  const handleDirectSave = async () => {
    const token = await getToken()
    await fetch('/api/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId, directCode: code }),
    })
    onCodeUpdate(code)
    alert('저장되었습니다.')
  }

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex gap-2 border-b">
        {(['preview', 'code'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'preview' ? '👁️ 미리보기' : '💻 코드 편집'}
          </button>
        ))}
      </div>

      {activeTab === 'preview' ? (
        <AppPreview code={streaming ? streamingCodeRef.current : code} height="480px" />
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <MonacoEditor
            height="480px"
            defaultLanguage="html"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: 'on',
            }}
          />
          <div className="flex justify-end p-2 bg-gray-50 border-t">
            <button
              onClick={handleDirectSave}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* AI 수정 요청 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-amber-800">🤖 AI에게 수정 요청</p>
        <div className="flex gap-2">
          <input
            value={editRequest}
            onChange={(e) => setEditRequest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !streaming && handleAIEdit()}
            placeholder="예: 배경색을 하늘색으로 바꿔줘, 점수가 10점이면 축하 메시지 보여줘"
            className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            disabled={streaming}
          />
          <button
            onClick={handleAIEdit}
            disabled={streaming || !editRequest.trim()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {streaming ? '수정 중...' : '수정'}
          </button>
        </div>
      </div>
    </div>
  )
}
