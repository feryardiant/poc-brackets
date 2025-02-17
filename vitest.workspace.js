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

const browserProviders = {
  playwright: 'chromium',
  webdriverio: 'chrome',
}

for (const [provider, browser] of Object.entries(browserProviders)) {
  workspaces.push({
    extends: 'vitest.config.js',
    test: {
      name: `browser:${provider}`,
      browser: {
        enabled: true,
        provider,
        instances: [
          { browser },
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
