'use strict'

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { generateParties } from './parties.js'
import { generateRounds, Round } from './rounds.js'

describe('rounds', () => {
  test('dummy rounds test', () => {
    const parties = generateParties(3)
    const rounds = generateRounds(parties)

    assert.equal(rounds.every(r => r instanceof Round), true)
  })
})
