import Link from 'next/link'

/**
 * 사이드바 상단 로고.
 * 로고 이미지가 준비되면 아래 텍스트를 next/image 로 교체한다.
 * 파일은 packages/assets 또는 apps/admin/public 에 두고 여기서만 참조할 것.
 */
export const Logo = () => (
  <Link
    href="/"
    className="text-sidebar-foreground text-base font-bold tracking-tight"
    aria-label="크보깡 어드민 홈"
  >
    크보깡
  </Link>
)
