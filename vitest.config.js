import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['main.js', ...coverageConfigDefaults.exclude],
    },
    reporters: [
      'default',
      ['junit', { outputFile: 'reports.junit.xml' }],
    ],
  },
})
