import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      name: 'chrome',
      provider: 'preview',
      testerHtmlPath: './index.html',
      viewport: { width: 1000, height: 1200 },
    },
    coverage: {
      exclude: ['main.js', ...coverageConfigDefaults.exclude],
    },
    reporters: [
      'default',
      ['junit', { outputFile: 'reports.junit.xml' }],
    ],
  },
})
