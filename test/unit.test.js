'use strict'

import { describe, expect, it } from 'vitest'
import { matchmakingParties } from '../lib/matches.js'
import { generateParties } from '../lib/parties.js'
import { generateRounds } from '../lib/rounds.js'
import { fixtures } from './fixtures.js'

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
