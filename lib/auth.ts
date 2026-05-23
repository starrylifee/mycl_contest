// 교사 허용 이메일 목록 체크 (서버사이드)
export function isTeacherEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = (process.env.TEACHER_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return allowed.includes(email.toLowerCase())
}
