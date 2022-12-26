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
  coveragePathIgnorePatterns: ['build', 'apps/examples'], // ignore coverage from examples
  testRegex: '(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['packages/**/*.ts', 'apps/**/*.ts'],
  verbose: true,
  clearMocks: true,
};

export default config;
