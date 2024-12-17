import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['main.js', ...coverageConfigDefaults.exclude],
      provider: 'istanbul',
    },
    reporters: [
      'default',
      ['junit', { outputFile: 'reports.junit.xml' }],
    ],
  },
})
