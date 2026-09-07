import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/.expo/**',
      // supabase gen types 생성물
      '**/database.types.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // _ 접두어는 의도적 미사용(구조분해로 필드를 제외할 때 등)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // 전역 규칙: 불변성 유지 · console.log 금지 (CLAUDE.md 공통 규칙)
      'no-param-reassign': ['error', { props: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    /**
     * ⚠️ Hermes(RN 엔진)에 없는 최신 배열/객체 API 를 앱에서 막는다.
     *
     * 타입은 `lib: ESNext` 라 통과하고, lint·번들 export 도 통과한다. **앱을 켜야**
     * `undefined is not a function` 으로 죽는다 — 실제로 예측 탭이 `toSorted` 로 죽었다.
     * Node 에서 도는 어드민·크롤러는 써도 되므로 앱에만 적용한다.
     */
    files: ['apps/mobile/**/*.ts', 'apps/mobile/**/*.tsx', 'packages/shared/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        ...['toSorted', 'toReversed', 'toSpliced'].map((property) => ({
          property,
          message: `Hermes 에 ${property} 가 없다. [...arr] 복사 후 기존 메서드를 쓸 것.`,
        })),
        {
          object: 'Object',
          property: 'groupBy',
          message: 'Hermes 에 Object.groupBy 가 없다. reduce 로 묶을 것.',
        },
      ],
    },
  },
  {
    // 크롤러는 GitHub Actions 잡이다. 로그가 유일한 관측 수단이라 info 를 허용한다.
    files: ['apps/crawler/src/**/*.ts'],
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    },
  },
  {
    // 빌드 도구 설정 파일은 CommonJS(Node)다. metro/babel 이 이 형식만 받는다.
    files: ['**/metro.config.js', '**/babel.config.js', '**/*.config.cjs'],
    languageOptions: {
      globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettier,
)
