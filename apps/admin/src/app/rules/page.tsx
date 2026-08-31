import { Info, TriangleAlert } from 'lucide-react'
import {
  CARD_GRADES,
  CARD_GRADE_META,
  CARD_SELL_PRICE,
  CARD_TYPES,
  CARD_TYPE_LABEL,
  DEX_NO_SEQ_DIGITS,
  DRAW_COST_SINGLE,
  DRAW_COST_TEN,
  DRAW_GRADE_RATES,
  DRAW_TYPES,
  DRAW_TYPE_LABEL,
  GAME_STATUSES,
  GAME_STATUS_LABEL,
  MIN_KEEP_COUNT,
  POINT_REWARD,
  PREDICTION_RESULTS,
  PREDICTION_RESULT_LABEL,
  PREDICT_CLOSE_OFFSET_MINUTES,
  PREMIUM_TEN_GUARANTEE_GRADE,
  TEN_DRAW_COUNT,
  formatDexNo,
  gradeRateTotal,
} from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { GradeBadge } from '@/components/grade-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber, formatPercent, formatPoints } from '@/lib/format'

/** 통합기획서 6장에서 아직 '초안'인 항목 */
const DraftBadge = () => (
  <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-semibold">
    초안
  </Badge>
)

/**
 * 규칙 확인 — 어드민 기획서 3.8. 읽기 전용.
 *
 * 모든 값은 packages/shared 의 상수를 그대로 읽는다(여기서 값을 다시 적지 않는다).
 * 값을 바꿔야 하면 통합기획서 6장 → packages/shared 순서로 고친다.
 */
const RulesPage = () => {
  const discountOf = (type: (typeof DRAW_TYPES)[number]): number =>
    (1 - DRAW_COST_TEN[type] / (DRAW_COST_SINGLE[type] * TEN_DRAW_COUNT)) * 100

  return (
    <>
      <PageHeader
        title="규칙 확인"
        description="뽑기 확률·포인트·등급 정의. 읽기 전용입니다"
      />

      <div className="bg-muted/60 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
        <Info className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <p className="text-xs leading-relaxed">
          이 값들은 <code>packages/shared</code>에 단일 정의돼 있어 어드민에서 수정할 수 없습니다.
          변경하려면 <code>docs/00_통합기획서.md</code> 6장을 먼저 고치고 코드에 반영하세요.
        </p>
      </div>

      {/* 뽑기 확률 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">뽑기 등급 확률</CardTitle>
          <p className="text-muted-foreground text-xs">
            등급이 정해진 뒤 그 등급 안에서 <code>draw_weight</code> 비례로 카드를 고릅니다
          </p>
        </CardHeader>

        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>등급</TableHead>
                {DRAW_TYPES.map((type) => (
                  <TableHead key={type} className="w-32 text-right">
                    {DRAW_TYPE_LABEL[type]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {CARD_GRADES.map((grade) => (
                <TableRow key={grade}>
                  <TableCell>
                    <GradeBadge grade={grade} />
                  </TableCell>
                  {DRAW_TYPES.map((type) => (
                    <TableCell key={type} className="tabular text-right text-sm font-medium">
                      {formatPercent(DRAW_GRADE_RATES[type][grade], 1)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* 합계 검증 — 100%가 아니면 상수 정의에 문제가 있다 */}
              <TableRow className="bg-muted/40">
                <TableCell className="text-muted-foreground text-xs font-semibold">합계</TableCell>
                {DRAW_TYPES.map((type) => {
                  const total = gradeRateTotal(type)
                  const valid = Math.abs(total - 100) < 0.001

                  return (
                    <TableCell
                      key={type}
                      className={`tabular text-right text-sm font-bold ${
                        valid ? 'text-muted-foreground' : 'text-destructive'
                      }`}
                    >
                      {formatPercent(total, 1)}
                      {!valid && (
                        <TriangleAlert className="ml-1.5 inline size-3.5" aria-label="합계 오류" />
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 뽑기 비용 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">뽑기 비용</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {DRAW_TYPES.map((type) => (
              <div key={type} className="space-y-2">
                <p className="text-sm font-semibold">{DRAW_TYPE_LABEL[type]}</p>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-16">1회</span>
                  <span className="tabular font-semibold">
                    {formatPoints(DRAW_COST_SINGLE[type])}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-16">
                    {TEN_DRAW_COUNT}연차
                  </span>
                  <span className="tabular font-semibold">{formatPoints(DRAW_COST_TEN[type])}</span>
                  <span className="text-success tabular">
                    {formatPercent(discountOf(type), 0)} 할인
                  </span>
                  <span className="text-muted-foreground tabular">
                    (개별 {formatPoints(DRAW_COST_SINGLE[type] * TEN_DRAW_COUNT)})
                  </span>
                  <DraftBadge />
                </div>
              </div>
            ))}

            <div className="space-y-1.5 border-t pt-4">
              <p className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  프리미엄 {TEN_DRAW_COUNT}연차 보장
                </span>
                <span className="font-semibold">
                  최소 1장 {CARD_GRADE_META[PREMIUM_TEN_GUARANTEE_GRADE].label} 이상
                </span>
                <DraftBadge />
              </p>
              <p className="text-muted-foreground text-[11px]">
                추첨은 반드시 서버에서 처리합니다(클라이언트 신뢰 금지)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 포인트 수급/소비 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">포인트 수급</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">회원가입 보너스</span>
              <span className="text-success tabular ml-auto font-semibold">
                +{formatNumber(POINT_REWARD.signup)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">승패 적중 (경기당)</span>
              <span className="text-success tabular ml-auto font-semibold">
                +{formatNumber(POINT_REWARD.predictWin)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">스코어 적중 (경기당)</span>
              <span className="text-success tabular ml-auto font-semibold">
                +{formatNumber(POINT_REWARD.predictScore)}
              </span>
            </div>
            <p className="text-muted-foreground border-t pt-3 text-[11px] leading-relaxed">
              스코어 적중은 승패 적중을 포함합니다(중복 지급 아님). 난이도를 반영해 상향된 값입니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 등급 정의 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">등급 정의</CardTitle>
          <p className="text-muted-foreground text-xs">
            도감번호는 등급 접두어 + {DEX_NO_SEQ_DIGITS}자리 (예: {formatDexNo({ grade: 'normal', seq: 1 })})
          </p>
        </CardHeader>

        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>등급</TableHead>
                <TableHead className="w-20">접두어</TableHead>
                <TableHead className="w-24">색</TableHead>
                <TableHead className="w-24">레이아웃</TableHead>
                <TableHead className="w-24">반짝임</TableHead>
                <TableHead className="w-32 text-right">판매·환급가</TableHead>
                <TableHead className="w-36 text-right">일반 뽑기 대비</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {CARD_GRADES.map((grade) => (
                <TableRow key={grade}>
                  <TableCell>
                    <GradeBadge grade={grade} />
                  </TableCell>
                  <TableCell className="tabular font-mono text-xs font-semibold">
                    {CARD_GRADE_META[grade].prefix}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-3 rounded border"
                        style={{ backgroundColor: CARD_GRADE_META[grade].color }}
                        aria-hidden
                      />
                      <span className="tabular font-mono text-[11px]">
                        {CARD_GRADE_META[grade].color}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {CARD_GRADE_META[grade].layout === 'full_art' ? '풀아트' : '박스형'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {CARD_GRADE_META[grade].hasShimmer ? '있음' : '없음'}
                  </TableCell>
                  <TableCell className="tabular text-right text-sm font-medium">
                    {formatPoints(CARD_SELL_PRICE[grade])}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground text-right text-xs">
                    1 / {formatNumber(Math.round(DRAW_COST_SINGLE.normal / CARD_SELL_PRICE[grade]))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <div className="text-muted-foreground space-y-1 px-6 text-[11px] leading-relaxed">
          <p>
            판매가는 카드에 저장하지 않고 등급 상수로 계산합니다. 자동 중복 환급과 수동 판매는 같은
            값입니다.
          </p>
          <p>
            &apos;일반 뽑기 대비&apos;는 뽑기 1회 비용({formatPoints(DRAW_COST_SINGLE.normal)})
            대비 회수율입니다. 판매를 소소한 중복 처리 용도로 두어 포인트가 계속 소모되게 하는
            설계입니다.
          </p>
          <p>도감의 마지막 {MIN_KEEP_COUNT}장은 판매할 수 없습니다(실수로 도감 비우기 방지).</p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 카드 종류 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">카드 종류</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CARD_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className="tabular text-muted-foreground w-16 font-mono text-xs">{type}</span>
                <span className="font-medium">{CARD_TYPE_LABEL[type]}</span>
              </div>
            ))}
            <p className="text-muted-foreground border-t pt-3 text-[11px] leading-relaxed">
              모두 오리지널 가상 캐릭터/사물입니다. 실존 선수·구단 로고·유니폼 디자인 사용 금지.
            </p>
          </CardContent>
        </Card>

        {/* 예측/정산 흐름 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">예측 · 정산 흐름</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {GAME_STATUSES.map((status, index) => (
                <span key={status} className="flex items-center gap-1.5">
                  {index > 0 && <span className="text-muted-foreground/50 text-xs">→</span>}
                  <span className="bg-muted rounded px-2 py-0.5 text-xs font-medium">
                    {GAME_STATUS_LABEL[status]}
                  </span>
                </span>
              ))}
            </div>

            <div className="space-y-1.5 border-t pt-3 text-xs">
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">예측 마감</span>
                <span className="font-semibold">
                  경기 시작 {PREDICT_CLOSE_OFFSET_MINUTES}분 전
                </span>
              </p>
              <p className="text-muted-foreground text-[11px]">
                마감·정산 판정은 <strong>서버 시각 기준</strong>입니다(폰 시각 조작 방지)
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 border-t pt-3">
              {PREDICTION_RESULTS.map((result) => (
                <span
                  key={result}
                  className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[11px] font-medium"
                >
                  {PREDICTION_RESULT_LABEL[result]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default RulesPage
