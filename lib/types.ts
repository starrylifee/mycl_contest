import { Timestamp } from 'firebase/firestore'

export type FieldKey =
  | 'appName'
  | 'appDescription'
  | 'achievementStandards'
  | 'mainFeatures'
  | 'screenLayout'
  | 'gameRules'
  | 'learningConnection'
  | 'winCondition'

export const FIELD_LABELS: Record<FieldKey, string> = {
  appName: '앱 이름',
  appDescription: '앱 설명',
  achievementStandards: '성취기준',
  mainFeatures: '주요 기능',
  screenLayout: '화면 구성',
  gameRules: '게임 규칙',
  learningConnection: '배운 내용 연결',
  winCondition: '승리 조건',
}

export interface RubricItem {
  label: string   // 예: "교육 내용 반영"
  maxScore: number // 예: 5
}

export interface Assignment {
  id?: string
  title: string
  description: string
  teacherEmail: string
  teacherUid: string
  shareToken: string
  fieldsConfig: FieldKey[]
  rubricItems: RubricItem[]
  gradeLevel: string   // "1-2" | "3-4" | "5-6"
  subjectFilter: string
  createdAt?: Timestamp
}

export interface Submission {
  id?: string
  assignmentId: string
  assignmentTitle?: string
  studentName: string
  planningData: Partial<Record<FieldKey, string | string[]>>
  generatedCode?: string
  editHistory?: Array<{
    code: string
    editRequest: string
    editedAt: string
  }>
  status: 'submitted' | 'generating' | 'generated' | 'editing'
  generatedAt?: Timestamp
  createdAt?: Timestamp
}

export interface Review {
  id?: string
  submissionId: string
  reviewerName: string
  rubricScores: Record<string, number>  // { 항목명: 점수 }
  comment: string
  createdAt?: Timestamp
}
