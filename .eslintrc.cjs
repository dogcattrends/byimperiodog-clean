/* Auditoria Fase A: ESLint config reforçada */
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: undefined },
  plugins: ['@typescript-eslint','jsx-a11y','import','react-refresh'],
  rules: {
    // Re-enable stricter rules to restore CI validation gates.
    // For immediate remediation, keep `no-explicit-any` as warn so we can fix in small PRs.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', disallowTypeAnnotations: false }],
    'import/order': ['error', { 'newlines-between':'always', alphabetize:{order:'asc', caseInsensitive:true}, groups:['builtin','external','internal','parent','sibling','index'] }],
    'no-console': ['warn', { allow: ['error','warn'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Restore a11y and other critical rules as errors to ensure CI gates enforce fixes.
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/media-has-caption': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'react/no-unescaped-entities': 'error',
    'no-empty': 'error',
    'no-useless-escape': 'error',
    'no-inner-declarations': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/ban-ts-comment': 'error'
  },

  settings: {
    'import/resolver': {
      typescript: {},
      node: { extensions: ['.js','.ts','.tsx'] }
    }
  }
};
