'use strict'

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { generateParties, Party } from './parties.js'

describe('parties', () => {
  test('dummy parties test', () => {
    const parties = generateParties(3)

    assert.equal(parties.every(p => p instanceof Party), true)
  })
})
