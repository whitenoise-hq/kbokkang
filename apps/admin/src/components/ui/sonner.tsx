'use client'

import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * 토스트 — hatch-it 규격에 맞춘다.
 * 상단 중앙, 알약(pill) 형태, 연한 배경 + 진한 테두리·텍스트, 2.5초.
 * 색은 프로젝트 토큰에서 color-mix 로 파생한다(별도 색 정의 금지).
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    position="top-center"
    duration={2500}
    offset={32}
    gap={8}
    icons={{
      success: <CircleCheck className="size-4" strokeWidth={2.25} />,
      info: <Info className="size-4" strokeWidth={2.25} />,
      warning: <TriangleAlert className="size-4" strokeWidth={2.25} />,
      error: <CircleAlert className="size-4" strokeWidth={2.25} />,
      loading: <Loader2 className="size-4 animate-spin" />,
    }}
    toastOptions={{
      classNames: {
        toast:
          'group !w-auto !max-w-[calc(100vw-2rem)] mx-auto flex items-center gap-2 !rounded-full !border !px-4 !py-3 !text-sm !shadow-float',
        title: '!text-sm !font-medium',
        default:
          '!border-[color-mix(in_srgb,var(--muted-foreground)_45%,black)] !bg-[color-mix(in_srgb,var(--muted-foreground)_12%,white)] !text-[color-mix(in_srgb,var(--muted-foreground)_75%,black)]',
        success:
          '!border-[color-mix(in_srgb,var(--success)_60%,black)] !bg-[color-mix(in_srgb,var(--success)_14%,white)] !text-[color-mix(in_srgb,var(--success)_70%,black)]',
        error:
          '!border-[color-mix(in_srgb,var(--destructive)_60%,black)] !bg-[color-mix(in_srgb,var(--destructive)_14%,white)] !text-[color-mix(in_srgb,var(--destructive)_68%,black)]',
        warning:
          '!border-[color-mix(in_srgb,var(--warning)_65%,black)] !bg-[color-mix(in_srgb,var(--warning)_16%,white)] !text-[color-mix(in_srgb,var(--warning)_72%,black)]',
        icon: '!m-0 !size-4 shrink-0',
      },
    }}
    {...props}
  />
)

export { Toaster }
