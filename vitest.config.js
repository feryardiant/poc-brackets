import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
    },
    reporters: [
      'default',
      ['junit', { outputFile: 'reports.junit.xml' }],
    ],
  },
})
