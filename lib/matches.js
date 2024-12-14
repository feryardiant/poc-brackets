import { Party } from './parties.js'

export class Match {
  /** @type {number} Match ID */
  id = undefined

  /** @type {boolean} Is it a bye match? */
  bye = false

  /** @type {number} Round Index */
  round = undefined

  /** @type {number} */
  size = 1

  /** @type {number} */
  span = 0

  /** @type {import('./parties').Party[]} List of competing parties */
  parties = []

  /** @type {MatchNext} Match entry for next round */
  next = {}

  /** @type {boolean} Whether this match only contains one participant */
  get singular() {
    return this.parties.length === 1
  }

  get hidden() {
    return this.singular || !this.id
  }

  get label() {
    const [blue, red] = this.parties

    return red
      ? [blue.name, red?.name].join(' versus ')
      : blue.name
  }

  /**
   * @param {number} round
   * @param {import('./parties').Party} blue
   * @param {import('./parties').Party|undefined} red
   * @param {boolean} bye
   */
  constructor(round, blue, red = undefined, bye = false) {
    this.round = round
    this.parties = [blue]

    if (red) {
      this.parties.push(red)
    }

    if (round === 0) {
      this.bye = bye
    }

    if (this.singular) {
      blue.match.size = 1
      this.bye = true
      return
    }

    // Calculate current match `size` and `span`
    // based on it's participant' match in prev round
    [this.size, this.span] = this.parties.reduce(([size, span], party) => {
      size += (party.match.size || 0)
      span += (party.match.span || 0)

      return [size, span]
    }, [0, 0])

    // Ensure `match.size` is not less than 1
    if (this.size === 0) {
      this.size++
    }
  }

  /**
   * Determine target match based on existing entry.
   *
   * @param {Match[]} matches All registered matches in this round
   * @param {number} index Index of current matchup entry
   * @param {number} total Total number of current split
   * @param {(num: number, match: Match) => number} fnId
   */
  initialize(matches, index, total, fnId) {
    const lastMatch = total > 1 && (index + 1) === total

    this.next = new MatchNext(this.round + 1, index + 1)

    if (this.bye) {
      this.round++
    }

    this.id = fnId(matches.filter(match => match.id).length + 1, this)

    // Turn next side into `blue` if this entry is a singular and not the last one
    if (this.singular && !lastMatch) {
      this.next.side = 'blue'
    }

    // Force next side to be `red` when it was the last match in the split or
    // the previous registered match was a singularn
    if (lastMatch || matches.at(-1)?.singular) {
      this.next.side = 'red'
    }
  }

  /**
   * Find party by match info in previous round.
   *
   * @param {Match} related Target match
   */
  findParty(related) {
    return this.parties.find(({ match }) => match.id === related.id)
  }

  /**
   * Check whether the current match is not belongs to current `round` index.
   *
   * Prevent current iteration to targets previous round and
   * ensure it's not a `hidden` and `bye` match.
   *
   * @param {number} round Round index
   */
  notBelongsToRound(round) {
    return this.next.round < round || (this.bye && this.hidden)
  }

  /**
   * Convert match into participant in the current round.
   *
   * @param {number} index All registered matches in previous round
   * @param {Match[]} matches All registered matches in previous round
   */
  toParty(index, matches) {
    let name = `Winner match ${this.id}`
    let id, continent

    if (this.singular) {
      id = this.parties[0].id
      name = this.parties[0].name
      continent = this.parties[0].continent
    }

    return new Party(name, id, continent).fromMatch(this, index, matches.length)
  }
}

export class MatchNext {
  /** @type {import('./types').Side} */
  side

  round = 0

  span = 0

  /**
   * @param {number} round
   * @param {number} index
   */
  constructor(round, index) {
    this.round = round
    this.side = index % 2 > 0 ? 'blue' : 'red'
  }
}

/**
 * Refers to the pairing of two contestants to compete against each other.
 */
export class Matchup {
  /** @type {number} */
  index = 0

  /** @type {boolean} Determine whether this matchup only contains single participant */
  get singular() {
    return this.red === undefined
  }

  /**
   * @param {number} index
   * @param {Party} blue
   * @param {Party|undefined} red
   */
  constructor(index, blue, red = undefined) {
    this.index = index
    this.blue = blue
    this.red = red
  }

  /**
   * Convert this matchup to a match.
   *
   * @param {number} round Round index
   * @param {boolean} hasByes Whether this iterations has some bye matches
   * @param {number|undefined} latestBye Latest bye match index
   */
  toMatch(round, hasByes, latestBye) {
    return new Match(round, this.blue, this.red, hasByes && this.index < latestBye)
  }
}

/**
 * Process of arranging two contestants to face each other in a match.
 *
 * @param {Party[]} parties List of available participants
 * @returns {Matchup[]}
 */
export function matchmakingParties(parties) {
  // Ensure current parties has correct ordering based on their
  // prior total match compared to their index on that match
  parties.sort((a, b) => a.order - b.order)

  // Track index of `parties` that has been added to `returns`
  const ns = []

  return parties.reduce((returns, party, p, parties) => {
    const r = p + 1

    // Skip if current `p` is already added to `ns` or current `party` was a red one
    if (ns.includes(p) || party.side === 'red' || !parties[r]) {
      return returns
    }

    ns.push(p)

    // Continue iteration when current' side is equals to next one
    if (parties[r].side === party.side) {
      returns.push(new Matchup(returns.length, party))

      return returns
    }

    ns.push(r)

    returns.push(new Matchup(returns.length, party, parties[r]))

    return returns
  }, [])
}

/**
 * Create and register matches.
 *
 * @param {Matchup[]} matchups All registered matchups for each round
 * @param {number} round Index of current round
 * @param {(num: number, match: Match) => number} fnId Callback function to create match id for the entry
 * @param {Match[]} matches
 * @param {number[]} byes List of singular match' index
 * @returns {Match[]} List of all registered matches
 */
export function createMatches(matchups, round, fnId = num => num, matches = [], byes = []) {
  const half = Math.floor(matchups.length / 2)

  // Split matchup entries in half when it meets certain criteria
  const chunks = half >= 2
    ? [
        matchups.slice(0, half),
        matchups.slice(half),
      ]
    : [
        matchups,
        [],
      ]

  if (byes.length === 0) {
    byes = matchups.reduce((byes, matchup) => {
      if (matchup.singular) {
        byes.push(matchup.index)
      }

      return byes
    }, byes)
  }

  let hasByes = byes.length > 0

  return chunks.reduce((matches, matchups) => {
    if (matchups.length === 0) {
      return matches
    }

    // Recusively calculate when the number of `matchups` on `round` 0 is 5 or more
    if (round === 0 && matchups.length >= 5) {
      createMatches(matchups, round, fnId, matches, byes)

      return matches
    }

    // The `hasByes` might've been negated by prior iteration so let reassure the value
    if (!hasByes && matches.at(-1)?.bye === false) {
      hasByes = matchups.some(matchup => matchup.singular)
    }

    matchups.forEach((matchup, index, matchups) => {
      const match = matchup.toMatch(round, hasByes, byes.at(-1))

      match.initialize(matches, index, matchups.length, fnId)

      if (match.singular || matches.at(-1)?.singular) {
        hasByes = match.bye = false
      }

      matches.push(match)
    })

    return matches
  }, matches)
}
