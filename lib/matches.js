import { Party } from './parties.js'

export class Match {
  /** @type {number} Match ID */
  id = undefined

  /** @type {boolean} Is it a singular match? */
  singular = false

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

  get hidden() {
    return this.singular || !this.id
  }

  get label() {
    const [blue, red] = this.parties

    return `${blue.name} VS ${red.name}`
  }

  /**
   * @param {number} round
   * @param {import('./parties').Party} blue
   * @param {import('./parties').Party|undefined} red
   * @param {() => boolean} fnBye
   */
  constructor(round, blue, red = undefined, fnBye = () => false) {
    this.round = round
    this.parties = [blue]
    this.singular = red === undefined

    if (red) {
      this.parties.push(red)
    }

    if (round === 0) {
      this.bye = fnBye()
    }

    if (this.singular) {
      blue.match.size = 1
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
   * @param {number} index Index of current entry
   * @param {number} total Total number of current split
   * @param {(num: number, match: Match) => number} fnId
   */
  initialize(matches, index, total, fnId) {
    const prevOne = matches.at(-1)
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
    if (lastMatch || prevOne?.singular) {
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

    if (this.round === 0 && this.singular) {
      id = this.parties[0].id
      name = this.parties[0].name
      continent = this.parties[0].continent
    }

    return new Party(name, id, continent)
      .fromMatch(this, index, matches.length)
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
 * Create and register matches.
 *
 * @param {import('./parties').MatchSided[]} sidedMatches All registered participants for each round
 * @param {number} round Index of current round
 * @param {(num: number, match: Match) => number} fnId Callback function to create match id for the entry
 * @param {Match[]} matches
 * @param {number[]} byes List of singular match' index
 * @returns {Match[]} List of all registered matches
 */
export function createMatches(sidedMatches, round, fnId = num => num, matches = [], byes = []) {
  const half = Math.floor(sidedMatches.length / 2)

  // Split match entries in half on each round with certain criteria
  const chunks = half >= 2
    ? [
        sidedMatches.slice(0, half),
        sidedMatches.slice(half),
      ]
    : [
        sidedMatches,
        [],
      ]

  if (byes.length === 0) {
    byes = sidedMatches.reduce((byes, side) => {
      if (side.red === undefined) {
        byes.push(side.index)
      }

      return byes
    }, byes)
  }

  let hasByes = byes.length > 0

  return chunks.reduce((matches, sides) => {
    if (sides.length === 0) {
      return matches
    }

    // Recusively calculate when the number of `sides` on `round` 0 is 5 or more
    if (round === 0 && sides.length >= 5) {
      createMatches(sides, round, fnId, matches, byes)

      return matches
    }

    // The `hasByes` might be negated by prior iteration so let reassure the value
    if (!hasByes && matches.at(-1)?.bye === false) {
      hasByes = sides.some(side => side.red === undefined)
    }

    sides.forEach((side, index, split) => {
      const prevMatch = matches.at(-1)
      const match = new Match(round, side.blue, side.red, () => {
        return hasByes && side.index < byes.at(-1)
      })

      match.initialize(matches, index, split.length, fnId)

      if (match.singular || prevMatch?.singular) {
        hasByes = match.bye = false
      }

      matches.push(match)
    })

    return matches
  }, matches)
}
