/**
 * Generate participants base on desired number of participant
 *
 * @param {number} count Number of participant
 * @returns {import('./types').Party[]}
 */
export function generateParties(count) {
  /** @type {Party[]} */
  const participants = []

  for (let i = 1; i <= count; i++) {
    participants.push({
      name: `Participant ${i}`,
      continent: `Continent ${i}`,
      order: i,
      match: {},
      round: 0,
    })
  }

  return determinePartiesSide(participants)
}

/**
 * Rearrange participant based on their match side
 *
 * @typedef {object} MatchSided
 * @property {import('./types').Party} blue
 * @property {import('./types').Party} red
 *
 * @param {import('./types').Party[]} parties List of available participants
 * @param {number} roundId ID of current round
 * @returns {MatchSided[]}
 */
export function rearrangePartiesBySide(parties, roundId) {
  /** @type {MatchSided[]} */
  const returns = []

  if (roundId > 1) {
    // Track index of `parties` that has been added to `returns`
    const ns = []

    // Ensure current parties has correct ordering based on their
    // prior total match compared to their index on that match
    parties.sort((a, b) => a.order - b.order)

    return parties.reduce((returns, party, p, parties) => {
      // Skip arrangement if current `p` is already added to `ns`
      // or current `party` was a red one
      if (ns.includes(p) || party.side === 'red')
        return returns

      // Find index of next first `red` party that hasn't been added to `ns`
      const r = parties.findIndex((pt, n) => pt.side === 'red' && !ns.includes(n))

      ns.push(p, r)
      returns.push({
        blue: party,
        red: parties[r],
      })

      return returns
    }, returns)
  }

  return parties.reduce((returns, chunk) => {
    // It is possible to have 2 blues in a single `chunk`, if so create
    // a dedicated match for it and then call it `singular` match
    if (chunk.blue.length > 1) {
      returns.push({
        blue: chunk.blue.splice(0, 1)[0],
        red: undefined,
      })
    }

    // If current chunk and the previous one equaly have no `red` side,
    // Move current `blue` as `red` to previous match
    if (chunk.red.length === 0 && (returns.length > 0 && returns.at(-1).red === undefined)) {
      returns.at(-1).red = chunk.blue[0]
      return returns
    }

    returns.push({
      blue: chunk.blue[0],
      red: chunk.red[0],
    })

    return returns
  }, returns)
}

/**
 * Ensure party is not registered
 *
 * @param {import('./types').Party[]} parties
 * @param {number} match
 * @returns {boolean}
 */
export function ensurePartyIsNotRegistered(parties, match) {
  return parties.find(pt => pt.match.id === match) === undefined
}

/**
 * Determine match side for each participant
 *
 * @typedef {object} Chunk
 * @property {import('./types').Party[]} blue Blue side participant
 * @property {import('./types').Party[]} red Red side participant
 *
 * @param {import('./types').Party[]} parties List of available participants
 * @returns {Chunk[]}
 */
function determinePartiesSide(parties) {
  let chunks = []
  let half = parties.length

  // Split each participants into chunked blue and red with criteria of
  // each chunk can only consist of max 2 blues and 1 red
  while (half >= 1) {
    half = Math.floor(half / 2)

    if (chunks.length === 0) {
      chunks.push(assignPartySide(parties, half))

      continue
    }

    // Recursively splits each halfs
    const parts = []

    for (const chunk of chunks) {
      // On last chunk iteration that has 2 blues and 1 red
      // Swap their participant to the correct allocation
      if (chunk.blue.length === 2 && chunk.red.length === 1) {
        chunk.red.unshift(chunk.blue.splice(1, 1)[0])
      }

      for (const side of Object.values(chunk)) {
        parts.push(assignPartySide(side, half))
      }
    }

    chunks = []
    chunks.push(...parts)
  }

  return chunks
}

/**
 * Predetermine party side
 *
 * @typedef {object} Half
 * @property {import('./types').Party[]} blue
 * @property {import('./types').Party[]} red
 *
 * @param {import('./types').Party[]} parties List of available participants
 * @param {number} slice Number of slices
 * @returns {Half}
 */
function assignPartySide(parties, slice) {
  if ((parties.length / 2) > slice) {
    slice++
  }

  return {
    blue: parties.slice(0, slice),
    red: parties.slice(slice),
  }
}
