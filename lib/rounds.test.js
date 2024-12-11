'use strict'

import { assert, describe, it } from 'vitest'
import { generateParties } from './parties.js'
import { generateRounds, Round } from './rounds.js'

describe('rounds', () => {
  it('dummy rounds test', () => {
    const parties = generateParties(3)
    const rounds = generateRounds(parties)

    assert.equal(rounds.every(r => r instanceof Round), true)
  })
})
