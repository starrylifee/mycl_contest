'use client'

interface AppPreviewProps {
  code: string
  height?: string
}

export function AppPreview({ code, height = '500px' }: AppPreviewProps) {
  if (!code) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 text-gray-400"
        style={{ height }}
      >
        아직 생성된 앱이 없어요
      </div>
    )
  }

  return (
    <iframe
      srcDoc={code}
      sandbox="allow-scripts allow-forms allow-same-origin"
      className="w-full rounded-xl border border-gray-200 shadow-sm"
      style={{ height }}
      title="생성된 앱 미리보기"
    />
  )
}
