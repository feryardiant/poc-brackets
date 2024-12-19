'use strict'
// @vitest-environment jsdom

import { page, userEvent } from '@vitest/browser/context'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fixtures } from './fixtures'

for (const fixture of fixtures) {
  if (fixture.structures.length === 0) {
    const upper = Math.floor(fixture.length / 2)
    const lower = fixture.length - upper

    ;[upper, lower].reduce((structures, size) => {
      const prev = fixtures.find(sample => sample.length === size)

      if (prev) {
        structures.push(...prev.structures)
      }

      return structures
    }, fixture.structures)
  }

  fixture.matchLen = fixture.length - 1
}

describe('interactivity', () => {
  beforeEach(() => {
    userEvent.setup()
  })

  it('use right arrow to increate number of participant', async () => {
    const $range = page.getByPlaceholder('Generate participant')

    userEvent.keyboard('{ArrowRight}')

    await expect.element($range).toHaveValue('4')
  })

  it('use left arrow to increate number of participant', async () => {
    const $range = page.getByPlaceholder('Generate participant')

    userEvent.keyboard('{ArrowLeft}')

    await expect.element($range).toHaveValue('3')
  })

  it('selected winner will proceed to next round', async () => {
    const $party = page.getByTestId('round-0-match-1-blue-check')
    const $target = page.getByTestId('round-1-match-2-red-name')

    await expect.element($target).toHaveTextContent('Winner match 1')

    await $party.click()

    const $partyName = page.getByTestId('round-0-match-1-blue-name')

    await expect.element($target).toHaveTextContent($partyName.element().textContent)
  })
})

describe.each(fixtures)(
  'using $length participants',
  ({ length, matchLen, roundLen }) => {
    beforeAll(() => {
      const $range = page.getByPlaceholder('Generate participant').element()

      $range.value = length
      $range.dispatchEvent(new Event('change'))
    })

    it(`should creates ${(matchLen)} matches within ${roundLen} rounds`, async () => {
      const $rounds = document.querySelectorAll('.rounds')
      const $matches = document.querySelectorAll('.match-inner')

      expect($rounds.length).toBe(roundLen)
      expect($matches.length).toBe(matchLen)
    })

    it('should be able to selecting winners', async () => {
      for (let m = 1; m <= matchLen; m++) {
        await userEvent.tab()

        if (m % 2 === 0) {
          await userEvent.keyboard('{ArrowDown}')
        }
        else {
          await userEvent.keyboard('{Space}')
        }
      }
    })
  },
)
