/// <reference types="vitest/config" />

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

/** @type {import('vitest/config').TestUserConfig['reporters']} */
const reporters = [
  'default',
  [
    'junit',
    {
      suiteName: 'poc-brackets test suites',
      outputFile: 'test/reports/junit.xml',
    },
  ],
]

if (process.env.GITHUB_ACTIONS === 'true') {
  reporters.push('github-actions')
}

const providers = [
  {
    name: 'playwright',
    enabled: true,
    factory: () => playwright(),
    browser: 'chromium',
  },
  {
    name: 'webdriverio',
    enabled: 'WDIO' in process.env,
    factory: () => webdriverio(),
    browser: 'edge',
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
        enabled: provider.enabled,
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
      include: ['lib/*.js', 'main.js'],
      reportsDirectory: 'test/reports/coverage',
    },
    reporters,
  },
})
