module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', 
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'ES2015',
    tsconfigRootDir: './'
  },
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'no-case-declarations': 1,
    'no-console': 1,
    'no-dupe-else-if': 1,
    'no-prototype-builtins': 1,
    'no-undef': 1,
    'no-useless-escape': 1,
    'prefer-const': 1,
    '@typescript-eslint/ban-types': 1,
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-extra-semi': 1,
    '@typescript-eslint/no-this-alias': 1
  }
};
