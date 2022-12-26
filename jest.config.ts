import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: './tsconfig.dev.json',
        diagnostics: false,
      },
    ],
  },
  collectCoverageFrom: ['packages/**/*.ts', 'apps/**/*.ts'],
  coveragePathIgnorePatterns: ['build', 'apps/examples', '__tests__'], // ignore coverage from examples
  testRegex: '(test|spec)\\.[jt]sx?$',
  verbose: true,
  clearMocks: true,
};

export default config;
