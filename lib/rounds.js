import { createMatches, matchmakingParties } from './matches.js'

export class Round {
  /** @type {number} Round Index */
  #index = undefined

  /**
   * @returns {number} Round ID
   */
  get id() {
    return this.#index + 1
  }

  /** @type {import('./matches').Match[]} List of registered matches */
  matches = []

  /** @type {import('./parties').Party[]} List of registered parties */
  parties = []

  /**
   * @param {?number} index
   * @param {import('./parties').Party[]} parties
   */
  constructor(index = undefined, parties = []) {
    this.#index = index
    this.parties = parties
    this.matches = []
  }

  /**
   * @param {Round[]} rounds
   */
  initialize(rounds = []) {
    const prevRound = rounds[this.#index - 1]
    const parties = this.#prepareParties(rounds)

    if (parties.length > 0) {
      const matchups = matchmakingParties(parties)

      this.matches = createMatches(matchups, this.#index, (num, match) => {
        if (match.round === this.#index) {
          return num + (prevRound?.lastestMatchId() || 0)
        }

        if (!rounds[match.round]) {
          rounds[match.round] = new Round()
        }

        // Register the parties that actually belongs to another rounds
        if (partyIsNotExists(rounds[match.round].parties, match)) {
          rounds[match.round].parties.push(...match.parties)
        }

        // In this case we shouldn't returns any ID for the current match
        return undefined
      })
    }

    return this.matches.length > 0
  }

  /**
   * Retrieve lastest match `id` in the current round.
   */
  lastestMatchId() {
    return this.matches.filter(match => match.id).at(-1)?.id
  }

  /**
   * @param {Round[]} rounds
   */
  #prepareParties(rounds) {
    if (this.#index === 0) {
      return this.parties
    }

    return rounds.slice(0, this.#index).reduce((parties, round) => {
      // Track all matches on previous round(s) that should be added to the current round
      round.matches.forEach((match, index, matches) => {
        if (match.notBelongsToRound(this.#index)) {
          return
        }

        const party = match.toParty(index, matches)

        // Create new empty round when the party is desire a non-existing round
        if (!rounds[party.round]) {
          rounds[party.round] = new Round()
        }

        // Register the `party` to the desired `round` when its not already registered
        if (partyIsNotExists(rounds[party.round].parties, match)) {
          rounds[party.round].parties.push(party)
        }

        if (party.round === this.#index && partyIsNotExists(parties, match)) {
          parties.push(party)
        }
      })

      return parties
    }, this.parties)
  }
}

/**
 * Generate rounds based on total number of participant.
 *
 * @param {import('./parties').Party[]} parties List of registered parties for first round
 * @returns {Round[]} List of all registered rounds
 */
export function generateRounds(parties) {
  /** @type {Round[]} */
  const rounds = []
  let shouldNext = true
  let r = 0

  while (shouldNext) {
    if (r > 0) {
      parties = rounds[r]?.parties || []
    }

    const round = new Round(r, parties)

    // Shall we continue calculating next match?
    shouldNext = round.initialize(rounds)

    if (shouldNext) {
      rounds[r] = round
    }

    r++
  }

  // Delete last round if its contains only single party
  if (rounds.at(-1).matches.length === 0) {
    rounds.splice(r - 1, 1)
    rounds.at(-1).matches.map((match) => {
      match.next = {}
      return match
    })
  }

  return rounds
}

/**
 * Ensure party is not registered.
 *
 * @param {import('./parties').Party[]} parties
 * @param {import('./matches').Match} match
 * @returns {boolean}
 */
function partyIsNotExists(parties, match) {
  if (parties.length === 0) {
    return true
  }

  if (match.singular || !match.id) {
    return match.parties.every((party) => {
      return parties.find(pt => pt.name === party.name) === undefined
    })
  }

  return parties.find(pt => pt.match?.id === match.id) === undefined
}
