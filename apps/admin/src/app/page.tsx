import {
  CARD_GRADES,
  CARD_GRADE_META,
  CARD_SELL_PRICE,
  DRAW_GRADE_RATES,
  nextDexNo,
} from '@kbokkang/shared'

/**
 * 환경 세팅 확인용 임시 페이지.
 * @kbokkang/shared 의 등급·확률·판매가 상수가 어드민에서 정상 참조되는지 확인한다.
 * 실제 대시보드는 어드민 기획서 3.2 기준으로 교체 예정.
 */
const HomePage = () => (
  <main className="mx-auto w-full max-w-3xl p-8">
    <h1 className="text-2xl font-bold">크보깡 어드민</h1>
    <p className="mt-2 text-sm text-neutral-500">
      모노레포 환경 세팅 확인 페이지 · <code>@kbokkang/shared</code> 연결 상태
    </p>

    <table className="mt-8 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-300 text-left">
          <th className="py-2">등급</th>
          <th className="py-2">다음 도감번호</th>
          <th className="py-2">레이아웃</th>
          <th className="py-2">일반 확률</th>
          <th className="py-2">프리미엄 확률</th>
          <th className="py-2">판매가</th>
        </tr>
      </thead>
      <tbody>
        {CARD_GRADES.map((grade) => (
          <tr key={grade} className="border-b border-neutral-200">
            <td className="py-2">
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: CARD_GRADE_META[grade].color }}
                />
                {CARD_GRADE_META[grade].label}
              </span>
            </td>
            <td className="py-2 font-mono">{nextDexNo(grade, 0)}</td>
            <td className="py-2">
              {CARD_GRADE_META[grade].layout === 'full_art' ? '풀아트' : '박스형'}
            </td>
            <td className="py-2">{DRAW_GRADE_RATES.normal[grade]}%</td>
            <td className="py-2">{DRAW_GRADE_RATES.premium[grade]}%</td>
            <td className="py-2">{CARD_SELL_PRICE[grade]}p</td>
          </tr>
        ))}
      </tbody>
    </table>
  </main>
)

export default HomePage
