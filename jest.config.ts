import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  rootDir: './',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/client/',
    '<rootDir>/test/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '/src/api/common/exceptions',
    '/src/api/common/interceptors',
  ],
  testEnvironment: 'node',

  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/client/',
    '<rootDir>/src/client/',
    '<rootDir>/test/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
  ],
};

export default config;
