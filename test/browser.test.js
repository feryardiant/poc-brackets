'use strict'
// @vitest-environment jsdom

import { } from '@vitest/browser/context'
import { describe, expect, it } from 'vitest'

describe('interactivity', () => {
  it('dummy', () => {
    expect(typeof window).not.toBe('undefined')
  })
})
