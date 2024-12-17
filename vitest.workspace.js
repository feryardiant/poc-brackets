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
        provider: 'preview',
      },
      include: [
        'test/browser.test.js',
      ],
      name: 'browser',
    },
  },
])
