import data from './achievement_standards_all.json'

type StandardsData = Record<string, Record<string, unknown>>

export const achievementStandards: StandardsData = data as StandardsData

export function getGradeGroups(): string[] {
  return Object.keys(achievementStandards)
}

export function getSubjects(gradeGroup: string): string[] {
  return Object.keys(achievementStandards[gradeGroup] ?? {})
}

// 학년군 + 과목에 해당하는 모든 성취기준 코드+내용을 flat 배열로 반환
export function getStandards(gradeGroup: string, subject: string): string[] {
  const subjectData = (achievementStandards[gradeGroup] ?? {})[subject]
  if (!subjectData) return []

  const results: string[] = []

  function extract(node: unknown) {
    if (Array.isArray(node)) {
      node.forEach((item) => {
        if (typeof item === 'string') results.push(item)
        else extract(item)
      })
    } else if (typeof node === 'object' && node !== null) {
      Object.values(node).forEach(extract)
    }
  }

  extract(subjectData)
  return results
}
