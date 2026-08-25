/** 구단 — 통합기획서 5장 `teams` 대응 */
export interface Team {
  readonly id: number
  readonly name: string
  /** 짧은 표기(테이블·배지용). 스키마 추가 검토 항목 */
  readonly shortName: string
  readonly logoUrl: string | null
  /** 팀 컬러 hex */
  readonly color: string
}
