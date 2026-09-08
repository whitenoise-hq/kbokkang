import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import { supabase } from './supabase'

/**
 * 로그인 — **카카오 · 애플만.**
 *
 * 이메일/비밀번호는 쓰지 않는다. 비밀번호를 받으면 재설정 메일·변경 화면·유출 대응까지
 * 우리가 떠안는데, 개인 앱에 그만한 이유가 없다. 소셜 로그인은 그 전부를 사업자에게 맡긴다.
 *
 * - **카카오** — 한국 유저에게 계정이 이미 있다.
 * - **애플** — App Store 심사 지침 **4.8**: 다른 소셜 로그인을 제공하면 애플 로그인도
 *   함께 제공해야 한다. 카카오를 넣는 순간 애플은 **선택이 아니라 필수**다.
 *
 * ## ⚠️⚠️ 애플 로그인은 **네이티브 빌드 + 개발 인증서**가 필요하다
 *
 * `com.apple.developer.applesignin` entitlement 가 붙으면 **시뮬레이터 빌드에도** 개발
 * 코드사이닝이 필요하다 — Expo CLI 가 이 entitlement 를 그런 목록에 넣어 뒀다
 * (`@expo/cli` 의 `run/ios/codeSigning/simulatorCodeSigning.ts`).
 * 인증서가 없으면 `No code signing certificates are available to use` 로 빌드가 막힌다.
 *
 * 해결: Xcode → Settings → Accounts 에 Apple ID 를 추가하고 **Apple Development**
 * 인증서를 만든다(무료 계정도 발급된다). `security find-identity -v -p codesigning` 이
 * 한 줄이라도 내면 통과한다.
 *
 * ⚠️ **Expo Go 에서는 애플 버튼이 보이지 않는다** — 네이티브 모듈이 Expo Go 에 없다.
 *    `pnpm ios:build`(= `expo run:ios`)로 만든 개발 빌드에서만 나타난다.
 *    카카오는 Expo Go 에서도 동작하지만, 복귀 주소가 `exp://...` 형태가 되므로 그 주소를
 *    Supabase Redirect URLs 에 추가해야 한다(콘솔에 찍히는 값을 그대로 넣는다).
 *
 * ## 두 방식의 구현이 다르다
 *
 * | | 흐름 | 이유 |
 * |---|---|---|
 * | 애플 | **네이티브 시트** → id token | iOS 가 직접 띄운다. 브라우저를 열지 않는다 |
 * | 카카오 | **브라우저** → 앱 스킴 복귀 | Supabase 가 카카오와 주고받는다 |
 *
 * 애플은 `expo-apple-authentication` 이 받은 id token 을 `signInWithIdToken` 으로 넘긴다 —
 * 브라우저를 거치지 않아 가장 빠르고, 애플이 요구하는 네이티브 시트 요건도 만족한다.
 *
 * ⚠️ **대시보드·개발자 콘솔 설정이 있어야 동작한다**(코드만으로는 안 된다):
 * - Supabase → Authentication → Providers → **Apple**: `com.devwoodie.kbokkang`(번들 id)을
 *   Client IDs 에 넣는다. 네이티브 id token 검증에는 이것만 있으면 된다.
 * - Supabase → Authentication → Providers → **Kakao**: 카카오 REST API 키/시크릿.
 * - 카카오 개발자 콘솔 → Redirect URI 에 Supabase 콜백
 *   (`https://<project>.supabase.co/auth/v1/callback`)을 등록한다.
 * - Supabase → Authentication → URL Configuration → Redirect URLs 에 `kbokkang://**` 추가.
 */

/**
 * OAuth 복귀 주소. `app.json` 의 `scheme` 을 쓴다 — 값을 손으로 적지 않는다.
 *
 * ⚠️ **경로에 앞 슬래시를 붙이지 않는다.** `'/auth/callback'` 을 주면
 *    `kbokkang:///auth/callback`(슬래시 3개)이 나와서 Supabase 의 Redirect URLs
 *    패턴과 어긋나기 쉽다. `'auth/callback'` 이면 `kbokkang://auth/callback` 이다.
 *
 * ⚠️⚠️ **이 주소가 Supabase 의 Redirect URLs 허용 목록에 없으면**, Supabase 는 오류를
 *    내지 않고 **Site URL 로 조용히 보낸다.** 그래서 로그인은 되는데 브라우저가
 *    `localhost:3000` 에 머물고 앱으로 돌아오지 않는다(겪었다).
 *    개발 중에는 실제 값을 로그로 찍어 두어야 무엇을 등록할지 알 수 있다.
 */
const redirectTo = Linking.createURL('auth/callback')

if (__DEV__) {
  console.warn(
    `[auth] OAuth 복귀 주소 — Supabase Redirect URLs 에 이 값이 있어야 한다: ${redirectTo}`,
  )
}

/**
 * `expo-apple-authentication` 을 **필요할 때만 불러온다.**
 *
 * ⚠️⚠️ 최상단에서 `import` 하면 **네이티브 모듈이 없는 빌드에서 앱 전체가 죽는다.**
 *    이 패키지는 모듈이 로드될 때 `requireNativeModule` 을 부르는데, 네이티브를 다시
 *    빌드하지 않은 앱에는 그 모듈이 없다. 그리고 이 파일은 `useSession` → 루트 레이아웃
 *    으로 이어지므로 **로그인 화면뿐 아니라 앱이 아예 안 뜬다**(실제로 그렇게 됐다).
 *
 * 지연 로딩 + try/catch 로 두면 재빌드 전에는 애플 버튼만 감춰지고 카카오는 동작한다.
 */
type AppleModule = Awaited<ReturnType<typeof importApple>>

/** 정적 분석에 잡히도록 별도 함수로 둔다 — lint 가 `import()` 타입 표기를 금지한다 */
const importApple = () => import('expo-apple-authentication')

const loadApple = async (): Promise<AppleModule | null> => {
  if (Platform.OS !== 'ios') {
    warnAppleUnavailable(`iOS 가 아닙니다(${Platform.OS})`)
    return null
  }

  try {
    return await importApple()
  } catch (cause) {
    // 네이티브 모듈이 없는 빌드 — 애플 로그인은 아직 쓸 수 없다
    warnAppleUnavailable(`모듈을 불러올 수 없습니다: ${describe(cause)}`)
    return null
  }
}

/** 애플 로그인이 가능한 기기·빌드인가 — iOS 13+ 이고 네이티브 모듈이 있어야 한다 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
  const apple = await loadApple()
  if (apple === null) return false

  try {
    const available = await apple.isAvailableAsync()
    if (!available) warnAppleUnavailable('기기가 지원하지 않습니다(iOS 13 미만 등)')

    return available
  } catch (cause) {
    warnAppleUnavailable(`확인에 실패했습니다: ${describe(cause)}`)
    return false
  }
}

const describe = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause)

/**
 * 애플 버튼을 감추는 **이유를 개발 중에는 알려준다.**
 *
 * ⚠️ 조용히 감췄더니 "애플 로그인이 왜 안 보이지" 를 알 방법이 없었다(겪었다).
 *    빌드에 모듈이 없는 것인지, 기기가 지원하지 않는 것인지, 플랫폼이 다른 것인지
 *    원인이 셋이라 로그가 없으면 짚을 수 없다.
 */
const warnAppleUnavailable = (reason: string): void => {
  if (!__DEV__) return

  console.warn(`[auth] 애플 로그인 버튼을 감춥니다 — ${reason}`)
}

export const signInWithApple = async (): Promise<void> => {
  const apple = await loadApple()
  if (apple === null) {
    throw new Error('이 빌드에서는 애플 로그인을 쓸 수 없습니다')
  }

  try {
    const credential = await apple.signInAsync({
      requestedScopes: [
        apple.AppleAuthenticationScope.FULL_NAME,
        apple.AppleAuthenticationScope.EMAIL,
      ],
    })

    // 이름·이메일은 받아도 쓰지 않는다 — 닉네임은 온보딩에서 유저가 직접 정한다.
    // 애플은 **최초 1회만** 이 값을 주므로, 나중에 필요해지면 그때 저장 경로를 만든다.
    if (credential.identityToken === null) {
      throw new Error('애플에서 인증 정보를 받지 못했습니다')
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    })

    if (error !== null) throw new Error(`로그인에 실패했습니다: ${error.message}`)
  } catch (cause) {
    // 유저가 시트를 닫은 것은 실패가 아니다 — 오류 문구를 띄우면 잘못한 것처럼 보인다
    if (isCancelled(cause)) return
    throw cause
  }
}

export const signInWithKakao = async (): Promise<void> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      // Supabase 가 바로 리다이렉트하지 않게 하고, 우리가 브라우저를 띄운다
      skipBrowserRedirect: true,
    },
  })

  if (error !== null) throw new Error(`로그인에 실패했습니다: ${error.message}`)

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  // 유저가 브라우저를 닫은 경우 — 실패가 아니다
  if (result.type !== 'success') return

  await completeOAuth(result.url)
}

/**
 * 브라우저가 돌려준 주소에서 세션을 세운다.
 *
 * ⚠️ **두 형태를 모두 받는다.** supabase-js 는 PKCE(`?code=`)를 쓰지만 설정에 따라
 *    암시적 흐름(`#access_token=`)으로 올 수도 있다. 한쪽만 처리하면 어느 날 조용히
 *    로그인이 안 된다.
 */
const completeOAuth = async (url: string): Promise<void> => {
  const parsed = new URL(url)

  const code = parsed.searchParams.get('code')
  if (code !== null) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error !== null) throw new Error(`로그인을 마치지 못했습니다: ${error.message}`)
    return
  }

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''))
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')

  if (accessToken === null || refreshToken === null) {
    throw new Error('로그인 정보를 받지 못했습니다')
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error !== null) throw new Error(`로그인을 마치지 못했습니다: ${error.message}`)
}

/** 애플 시트를 닫으면 `ERR_REQUEST_CANCELED` 가 온다 */
const isCancelled = (cause: unknown): boolean =>
  typeof cause === 'object' &&
  cause !== null &&
  'code' in cause &&
  cause.code === 'ERR_REQUEST_CANCELED'

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut()
  if (error !== null) throw new Error(`로그아웃에 실패했습니다: ${error.message}`)
}
