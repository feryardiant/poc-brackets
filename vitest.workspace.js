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
  () => {
    // const env = loadEnv(mode, process.cwd(), ['BROWSERSTACK'])
    // let headless = process.env.CI
    // const inBrowserStack = !!env.BROWSERSTACK_USERNAME && !!env.BROWSERSTACK_ACCESS_KEY

    // if (inBrowserStack) {
    //   headless = false
    // }

    return {
      extends: 'vitest.config.js',
      test: {
        browser: {
          enabled: true,
          // headless,
          name: 'chrome',
          provider: 'webdriverio',
          // providerOptions: inBrowserStack
          //   ? {
          //       user: env.BROWSERSTACK_USERNAME,
          //       key: env.BROWSERSTACK_ACCESS_KEY,
          //       services: ['browserstack', {
          //         browserstackLocal: true,
          //       }],
          //     }
          //   : {},
          testerHtmlPath: './index.html',
          viewport: { width: 1000, height: 1200 },
        },
        include: [
          'test/browser.test.js',
        ],
        name: 'browser',
      },
    }
  },
])
