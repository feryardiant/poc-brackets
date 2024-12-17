'use strict'
// @vitest-environment jsdom

import { } from '@vitest/browser/context'
import { beforeEach, describe, expect, it } from 'vitest'

describe('browser', () => {
  beforeEach(async () => {
    // await import('../lib/style.css')
    // await import('../main.js')
  })

  it('dummy', () => {
    expect(typeof window).not.toBe('undefined')
  })
})
