import type { Config } from '@jest/types';
import * as jc from 'jest-config';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  // moduleFileExtensions: [...jc.defaults.moduleFileExtensions, 'ts', 'tsx'],
  transform: {
    'node_modules/variables/.+\\.(j|t)sx?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!variables/.*)'],
  globalSetup: './setup-tests.ts',
  globalTeardown: './teardown-tests.ts',
};
export default config;
