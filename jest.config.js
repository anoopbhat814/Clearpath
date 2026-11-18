/** Root Jest configuration shared by the API, worker and shared packages. */
module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      rootDir: 'apps/api',
      transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
      testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.e2e-spec.ts'],
      moduleNameMapper: { '^@clearpath/shared-types$': '<rootDir>/../../packages/shared-types/src' },
    },
    {
      displayName: 'worker',
      testEnvironment: 'node',
      rootDir: 'apps/worker',
      testMatch: ['<rootDir>/src/**/*.test.js'],
    },
    {
      displayName: 'web',
      testEnvironment: 'node',
      rootDir: 'apps/web',
      transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true, strict: true } }] },
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '^@clearpath/shared-types$': '<rootDir>/../../packages/shared-types/src' },
    },
    {
      displayName: 'shared-utils',
      testEnvironment: 'node',
      rootDir: 'packages/shared-utils',
      transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
  ],
  collectCoverageFrom: ['**/src/**/*.{ts,js}', '!**/*.spec.ts', '!**/*.test.*', '!**/main.ts'],
  coverageThreshold: { global: { statements: 70, branches: 60, functions: 70, lines: 70 } },
};
