module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, browser: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
  },
  overrides: [
    {
      files: ['scripts/**/*.js', 'apps/worker/**/*.js', '*.config.js'],
      rules: { 'no-console': 'off', '@typescript-eslint/no-var-requires': 'off' },
    },
  ],
  ignorePatterns: ['dist', '.next', 'node_modules', 'services', 'coverage'],
};
