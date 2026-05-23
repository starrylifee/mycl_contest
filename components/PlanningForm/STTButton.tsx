'use client'

import { useState, useRef } from 'react'

interface STTButtonProps {
  onResult: (text: string) => void
  className?: string
}

export function STTButton({ onResult, className = '' }: STTButtonProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<unknown>(null)

  const toggle = () => {
    if (listening) {
      (recognitionRef.current as { stop: () => void } | null)?.stop()
      return
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요.')
      return
    }

    const recognition = new (SpeechRecognition as new () => {
      lang: string
      interimResults: boolean
      onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void
      onend: () => void
      start: () => void
      stop: () => void
    })()
    recognition.lang = 'ko-KR'
    recognition.interimResults = false

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        listening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
    >
      {listening ? '🔴 녹음 중지' : '🎤 음성 입력'}
    </button>
  )
}
