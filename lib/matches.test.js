'use strict'

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { createMatches, Match, matchmakingParties } from './matches.js'
import { generateParties } from './parties.js'

describe('matches', () => {
  test('dummy matches test', () => {
    const matchups = matchmakingParties(generateParties(3))
    const matches = createMatches(matchups, 0)

    assert.equal(matches.every(m => m instanceof Match), true)
  })
})
