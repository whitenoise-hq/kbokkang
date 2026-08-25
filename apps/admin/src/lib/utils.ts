import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui 표준 클래스 병합 유틸 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
