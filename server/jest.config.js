// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
const tsPreset = require('ts-jest/jest-preset')
const mongoPreset = require('@shelf/jest-mongodb/jest-preset')

module.exports = {
  ...tsPreset,
  ...mongoPreset,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['js', 'ts', 'json'],
  // testEnvironment: 'node',

  testMatch: [
    // '**/?(*.)+(spec|test).js?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
}
