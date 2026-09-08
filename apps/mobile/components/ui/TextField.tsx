import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/theme/colors'
import { FONT_FAMILY } from '@/theme/fonts'
import { Text } from './Text'

/**
 * 텍스트 입력 — 닉네임 등.
 *
 * **테두리를 쓰지 않는다**(디자인 가이드 5장). 입력칸은 `surface` 배경으로 구분하므로
 * ⚠️ **흰 카드 안**에 넣어야 한다 — 회색 화면 위에 그냥 두면 배경과 같은 색이 되어
 * 입력칸으로 보이지 않는다(`Button` 의 `secondary` 와 같은 함정이다).
 *
 * 오류 문구는 **입력칸 아래에 항상 자리를 잡아 둔다**(`minHeight`). 나타날 때 아래
 * 내용이 밀리면 버튼 위치가 흔들려서 잘못 누르게 된다.
 *
 * 커스텀 폰트에 `fontWeight` 를 주면 시스템 폰트로 폴백되므로(2장) 여기서도 굵기는
 * **패밀리 이름으로만** 지정한다.
 */
export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  /** 오류 문구. null 이면 자리만 비워 둔다 */
  readonly error?: string | null
  /** 입력칸 아래 안내(글자 수 등) */
  readonly hint?: string
}

/** 오류·안내 문구 한 줄이 들어갈 높이 */
const MESSAGE_HEIGHT = 18

export const TextField = ({ error = null, hint, ...rest }: TextFieldProps) => (
  <View>
    <TextInput
      {...rest}
      style={styles.input}
      placeholderTextColor={COLORS.textDisabled}
      // 자동 대문자·자동 수정은 닉네임 입력을 방해한다
      autoCapitalize="none"
      autoCorrect={false}
    />

    <View style={styles.message}>
      {error !== null ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint === undefined ? null : (
        <Text variant="caption" color="textAlt">
          {hint}
        </Text>
      )}
    </View>
  </View>
)

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT_FAMILY.regular,
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: COLORS.textStrong,
  },
  // 오류가 나타나도 아래가 밀리지 않게 자리를 미리 잡는다
  message: { minHeight: MESSAGE_HEIGHT, justifyContent: 'center', paddingTop: SPACING.xs + 2 },
})
