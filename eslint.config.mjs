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
    // 크롤러는 GitHub Actions 잡이다. 로그가 유일한 관측 수단이라 info 를 허용한다.
    files: ['apps/crawler/src/**/*.ts'],
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    },
  },
  prettier,
)
