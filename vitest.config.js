import { playwright } from '@vitest/browser-playwright'
import { webdriverio } from '@vitest/browser-webdriverio'
import { defineConfig } from 'vitest/config'

/** @type {import('vitest/config').TestProjectConfiguration[]} */
const projects = [
  {
    test: {
      name: 'unit',
      include: ['test/unit.test.js'],
      environment: 'node',
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
      include: [
        'test/browser.test.js',
      ],
      browser: {
        provider: provider.factory(),
        enabled: true,
        headless: true,
        instances: [
          { browser: provider.browser },
        ],
        testerHtmlPath: './index.html',
        viewport: { width: 1000, height: 1200 },
        locators: {
          testIdAttribute: 'id',
        },
      },
    },
  })
}

export default defineConfig({
  test: {
    projects,
    coverage: {
      provider: 'istanbul',
      reportsDirectory: 'test/reports',
    },
    reporters: [
      'default',
      ['junit', { outputFile: 'test/reports/junit.xml' }],
    ],
  },
})
