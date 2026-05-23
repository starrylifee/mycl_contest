export function buildGenerationPrompt(planningData: Record<string, unknown>, gradeLevel: string): string {
  return `당신은 한국 초등학교 교육용 인터랙티브 웹앱을 만드는 전문 개발자입니다.
아래 학생의 기획서를 바탕으로 자기완결형 HTML 파일 하나를 만들어 주세요.

## 규칙
- HTML, CSS, JavaScript가 모두 하나의 파일에 포함 (외부 파일 금지)
- Bootstrap CDN 또는 Tailwind CDN 사용 가능
- 모든 UI 텍스트는 한국어
- 학년(${gradeLevel})에 맞는 난이도와 UI 복잡도
- 반응형 디자인 (모바일/태블릿/PC 모두 동작)
- 화려하고 학생이 좋아할 만한 디자인 (색상, 이모지 적극 활용)
- 게임/퀴즈 형식인 경우 점수, 피드백, 승리/종료 화면 포함

## 학생 기획서
\`\`\`json
${JSON.stringify(planningData, null, 2)}
\`\`\`

## 출력 형식
HTML 코드만 출력하세요. \`\`\`html 마크다운 감싸기 없이 <!DOCTYPE html>로 시작하세요.`
}

export function buildEditPrompt(currentCode: string, editRequest: string): string {
  return `아래 HTML 코드를 수정 요청에 따라 수정해주세요.

## 수정 요청
${editRequest}

## 현재 코드
${currentCode}

## 출력 형식
수정된 HTML 코드만 출력하세요. \`\`\`html 마크다운 감싸기 없이 <!DOCTYPE html>로 시작하세요.`
}

export function buildRubricSummaryPrompt(
  submissionName: string,
  planningData: Record<string, unknown>,
  reviews: Array<{ reviewerName: string; rubricScores: Record<string, number>; comment: string }>
): string {
  return `교사를 위한 학생 앱 피드백 요약 보고서를 작성해주세요.

## 앱 정보
- 제작자: ${submissionName}
- 기획서: ${JSON.stringify(planningData, null, 2)}

## 학생 루브릭 응답 (${reviews.length}명)
${reviews.map((r, i) => `
[${i + 1}] ${r.reviewerName}
점수: ${JSON.stringify(r.rubricScores)}
의견: ${r.comment}
`).join('\n')}

## 요청
1. 전체 평균 점수 분석
2. 긍정적 피드백 요약
3. 개선점 요약
4. 교사를 위한 종합 의견 (2~3문장)

한국어로 작성하고, 친근하고 교육적인 톤을 사용하세요.`
}

export function buildOCRPrompt(gradeLevel: string, fieldsConfig: string[]): string {
  return `이 이미지는 ${gradeLevel}학년 학생이 손으로 쓴 웹앱 기획서입니다.
이미지에서 텍스트를 읽어 아래 JSON 형식으로 추출해주세요.

추출할 필드: ${fieldsConfig.join(', ')}

출력 형식 (JSON만 출력):
{
  "필드명": "추출된 내용",
  ...
}

글씨가 불분명한 경우 최선을 다해 읽어주세요. 비어있는 필드는 빈 문자열로 표시하세요.`
}
