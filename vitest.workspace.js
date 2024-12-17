// import process from 'node:process'
// import { loadEnv } from 'vite'
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    extends: 'vitest.config.js',
    test: {
      environment: 'node',
      include: [
        'test/unit.test.js',
      ],
      name: 'unit',
    },
  },
  {
    extends: 'vitest.config.js',
    test: {
      browser: {
        enabled: true,
        name: 'chrome',
        provider: 'webdriverio',
        testerHtmlPath: './index.html',
        viewport: { width: 1000, height: 1200 },
      },
      include: [
        'test/browser.test.js',
      ],
      name: 'browser',
    },
  },
])
