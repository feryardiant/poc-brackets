// import process from 'node:process'
// import { loadEnv } from 'vite'
import { defineWorkspace } from 'vitest/config'

const workspaces = [
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
]

const browsers = {
  playwright: 'chromium',
  webdriverio: 'chrome',
}

for (const provider of ['playwright', 'webdriverio']) {
  workspaces.push({
    extends: 'vitest.config.js',
    test: {
      name: `browser:${provider}`,
      browser: {
        enabled: true,
        provider,
        instances: [
          { browser: browsers[provider] },
        ],
        testerHtmlPath: './index.html',
        viewport: { width: 1000, height: 1200 },
        locators: {
          testIdAttribute: 'id',
        },
      },
      include: [
        'test/browser.test.js',
      ],
    },
  })
}

export default defineWorkspace(workspaces)
