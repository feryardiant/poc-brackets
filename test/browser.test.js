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

    userEvent.keyboard('{ArrowRight}')

    await expect.element($range).toHaveValue('6')
  })

  it('use left arrow to increate number of participant', async () => {
    const $range = page.getByPlaceholder('Generate participant')

    userEvent.keyboard('{ArrowLeft}')

    await expect.element($range).toHaveValue('5')
  })

  it('selected winner will proceed to next round', async () => {
    const $party = page.getByTestId('round-0-match-1-blue-check')
    const $target = page.getByTestId('round-1-match-3-red-name')

    await expect.element($target).toHaveTextContent('Winner match 1')

    await $party.click()

    const $partyName = page.getByTestId('round-0-match-1-blue-name')

    await expect.element($target).toHaveTextContent($partyName.element().textContent)
  })
})
