import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 모노레포 공통 패키지는 소스로 export하므로 트랜스파일 대상에 포함
  transpilePackages: ['@kbokkang/shared'],
  // typedRoutes 는 nav 설정 배열(href: string)과 충돌하므로 사용하지 않는다.
  images: {
    // 카드 이미지는 Supabase Storage에서 서빙. 프로젝트 도메인 확정 후 추가.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' }],
  },
}

export default nextConfig
