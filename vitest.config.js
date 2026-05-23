import { playwright } from '@vitest/browser-playwright'
import { webdriverio } from '@vitest/browser-webdriverio'
import { defineConfig } from 'vitest/config'

/** @type {import('vitest').ProjectConfig[]} */
const projects = [
  {
    test: {
      name: 'unit',
      include: ['test/unit.test.js'],
      environment: 'node',
      coverage: {
        provider: 'istanbul',
      },
      reporters: [
        'default',
        ['junit', { outputFile: 'reports.junit.xml' }],
      ],
    },
  },
]

const providers = [
  {
    name: 'playwright',
    factory: () => playwright(),
    browser: 'chromium',
  },
  {
    name: 'webdriverio',
    factory: () => webdriverio({
      capabilities: { browserVersion: '148' },
    }),
    browser: 'chrome',
  },
]

for (const provider of providers) {
  projects.push({
    test: {
      name: `browser:${provider.name}`,
      browser: {
        provider: provider.factory(),
        enabled: true,
        headless: false,
        instances: [
          { browser: provider.browser },
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

export default defineConfig({
  test: { projects },
})
