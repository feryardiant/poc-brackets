'use strict'
// @vitest-environment jsdom

import { page, userEvent } from '@vitest/browser/context'
import { beforeEach, describe, expect, it } from 'vitest'

describe('interactivity', () => {
  beforeEach(() => {
    userEvent.setup()
  })

  it('use right arrow to increate number of participant', async () => {
    const $range = page.getByPlaceholder('Generate participant')

    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))

    await expect.element($range).toHaveValue('6')
  })

  it('use left arrow to increate number of participant', async () => {
    const $range = page.getByPlaceholder('Generate participant')

    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))

    await expect.element($range).toHaveValue('5')
  })
})
