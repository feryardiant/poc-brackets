'use strict'

import { assert, describe, it } from 'vitest'
import { generateParties, Party } from '../lib/parties.js'

describe('parties', () => {
  it('dummy parties test', () => {
    const parties = generateParties(3)

    assert.equal(parties.every(p => p instanceof Party), true)
  })
})
