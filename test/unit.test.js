'use strict'

import { describe, expect, it } from 'vitest'
import { matchmakingParties } from '../lib/matches.js'
import { generateParties } from '../lib/parties.js'
import { generateRounds } from '../lib/rounds.js'

/**
 * @typedef {object} Fixture
 * @property {number} length
 * @property {number} matchLen
 * @property {number} roundLen
 * @property {number[]} structures
 * @property {import('../lib/parties.js').Party[]} parties
 * @property {import('../lib/matches.js').Matchup[]} matchups
 * @property {import('../lib/matches.js').Match[]} matches
 * @property {import('../lib/rounds.js').Round[]} rounds
 */

/** @type {Fixture[]} */
const fixtures = [
  { length: 3, roundLen: 2, structures: [1, 2] },
  { length: 4, roundLen: 2, structures: [2, 2] },
  { length: 5, roundLen: 3, structures: [2, 1, 2] },
  { length: 6, roundLen: 3, structures: [] },
  { length: 7, roundLen: 3, structures: [] },
  { length: 8, roundLen: 3, structures: [] },
  { length: 9, roundLen: 4, structures: [] },
  { length: 10, roundLen: 4, structures: [] },
  { length: 11, roundLen: 4, structures: [] },
  { length: 12, roundLen: 4, structures: [] },
  { length: 13, roundLen: 4, structures: [] },
  { length: 14, roundLen: 4, structures: [] },
  { length: 15, roundLen: 4, structures: [] },
  { length: 16, roundLen: 4, structures: [] },
  { length: 17, roundLen: 5, structures: [] },
  { length: 18, roundLen: 5, structures: [] },
  { length: 19, roundLen: 5, structures: [] },
  { length: 20, roundLen: 5, structures: [] },
  { length: 21, roundLen: 5, structures: [] },
  { length: 22, roundLen: 5, structures: [] },
  { length: 23, roundLen: 5, structures: [] },
  { length: 24, roundLen: 5, structures: [] },
  { length: 25, roundLen: 5, structures: [] },
  { length: 26, roundLen: 5, structures: [] },
  { length: 27, roundLen: 5, structures: [] },
  { length: 28, roundLen: 5, structures: [] },
  { length: 29, roundLen: 5, structures: [] },
  { length: 30, roundLen: 5, structures: [] },
  { length: 31, roundLen: 5, structures: [] },
  { length: 32, roundLen: 5, structures: [] },
  { length: 33, roundLen: 6, structures: [] },
  { length: 34, roundLen: 6, structures: [] },
  { length: 35, roundLen: 6, structures: [] },
  { length: 36, roundLen: 6, structures: [] },
  { length: 37, roundLen: 6, structures: [] },
  { length: 38, roundLen: 6, structures: [] },
  { length: 39, roundLen: 6, structures: [] },
  { length: 40, roundLen: 6, structures: [] },
  { length: 41, roundLen: 6, structures: [] },
  { length: 42, roundLen: 6, structures: [] },
  { length: 43, roundLen: 6, structures: [] },
  { length: 44, roundLen: 6, structures: [] },
  { length: 45, roundLen: 6, structures: [] },
  { length: 46, roundLen: 6, structures: [] },
  { length: 47, roundLen: 6, structures: [] },
  { length: 48, roundLen: 6, structures: [] },
  { length: 49, roundLen: 6, structures: [] },
  { length: 50, roundLen: 6, structures: [] },
]

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
  fixture.parties = generateParties(fixture.length)
  fixture.rounds = generateRounds(fixture.parties)
  fixture.matchups = matchmakingParties(fixture.parties)
  fixture.matches = fixture.rounds.reduce((matches, round) => {
    matches.push(...round.matches.filter(match => !!match.id))

    return matches
  }, [])
}

describe.each(fixtures)(
  'using $length participants',
  ({ length, matchLen, roundLen, structures, ...sample }) => {
    it(`should creates ${structures.length} matchups with format: ${structures.join(', ')}`, () => {
      expect(sample.matchups.length).toBe(structures.length)

      sample.matchups.forEach((matchup, index) => {
        const parties = [matchup.blue]

        if (!matchup.singular) {
          parties.push(matchup.red)
        }

        expect(parties.length).toBe(structures[index])
      })
    })

    it(`should creates ${(matchLen)} matches within ${roundLen} rounds`, () => {
      expect(sample.matches.length).toBe(matchLen)
      expect(sample.rounds.length).toBe(roundLen)
    })

    it('every parties should have match side', () => {
      expect(sample.parties.every(p => p.side !== undefined)).toBeTruthy()
    })

    if (!structures.includes(1)) {
      it('should not have bye match defined in initial round', () => {
        expect(sample.rounds[0].matches.every(m => m.bye === false)).toBeTruthy()
      })
    }
    else {
      it('should have some bye match defined in initial round', () => {
        expect(sample.rounds[0].matches.some((m) => {
          return m.bye === true || m.singular === true
        })).toBeTruthy()
      })
    }
  },
)
