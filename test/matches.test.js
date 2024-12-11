'use strict'

import { assert, describe, it } from 'vitest'
import { createMatches, Match, matchmakingParties } from '../lib/matches.js'
import { generateParties } from '../lib/parties.js'

describe('matches', () => {
  it('dummy matches test', () => {
    const matchups = matchmakingParties(generateParties(3))
    const matches = createMatches(matchups, 0)

    assert.equal(matches.every(m => m instanceof Match), true)
  })
})
