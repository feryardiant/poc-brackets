'use strict'

import { assert, describe, it } from 'vitest'
import { generateParties } from '../lib/parties.js'
import { generateRounds, Round } from '../lib/rounds.js'

describe('rounds', () => {
  it('dummy rounds test', () => {
    const parties = generateParties(9)
    const rounds = generateRounds(parties)

    assert.equal(rounds.every(r => r instanceof Round), true)
  })
})
