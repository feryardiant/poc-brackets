import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['main.js', ...coverageConfigDefaults.exclude],
    },
  },
})
