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
      id: i,
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
 * @param {import('./types').Party[]} parties List of available participants
 * @returns {import('./types').MatchSided[]}
 */
export function rearrangePartiesBySide(parties) {
  /** @type {import('./types').MatchSided[]} */
  const returns = []

  // Track index of `parties` that has been added to `returns`
  const ns = []

  // Ensure current parties has correct ordering based on their
  // prior total match compared to their index on that match
  parties.sort((a, b) => a.order - b.order)

  return parties.reduce((returns, party, p, parties) => {
    const r = p + 1

    // Skip if current `p` is already added to `ns`
    // or current `party` was a red one
    if (ns.includes(p) || party.side === 'red' || !parties[r]) {
      return returns
    }

    ns.push(p)

    if (parties[r].side === party.side) {
      returns.push({
        index: returns.length,
        blue: party,
      })

      return returns
    }

    ns.push(r)

    returns.push({
      index: returns.length,
      blue: party,
      red: parties[r],
    })

    return returns
  }, returns)
}

/**
 * Ensure party is not registered
 *
 * @param {import('./types').Party[]} parties
 * @param {import('./types').Match} match
 * @returns {boolean}
 */
export function ensurePartyIsNotRegistered(parties, match) {
  if (parties.length === 0) {
    return true
  }

  if (match.singular || !match.id) {
    return match.parties.every((party) => {
      return parties.find(pt => pt.name === party.name) === undefined
    })
  }

  return parties.find(pt => pt.match.id === match.id) === undefined
}

/**
 * Determine match side for each participant
 *
 * @param {import('./types').Party[]} parties List of available participants
 * @returns {import('./types').Party[]}
 */
export function determinePartiesSide(parties) {
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
      if (chunk.upper.length === 1 && chunk.lower.length === 1) {
        parts.push(chunk)
        continue
      }

      // On last chunk iteration that has 2 upper and 1 lower
      // Swap their participant to the correct allocation
      if (chunk.upper.length === 2 && chunk.lower.length === 1) {
        chunk.lower.unshift(chunk.upper.splice(1, 1)[0])
      }

      for (const side of Object.values(chunk)) {
        if (side.length > 1) {
          parts.push(assignPartySide(side, half))
          continue
        }

        parts.push({ upper: side, lower: [] })
      }
    }

    chunks = []
    chunks.push(...parts)
  }

  return chunks.reduce((returns, chunk) => {
    returns.push(ensurePartyOrder(parties.length, chunk.upper[0], 'blue'))

    if (chunk.lower[0]) {
      returns.push(ensurePartyOrder(parties.length, chunk.lower[0], 'red'))
    }

    return returns
  }, [])
}

/**
 * @param {number} total
 * @param {import('./types').Party|undefined} party
 * @param {import('./types').Side|undefined} side
 * @returns {import('./types').Party|undefined}
 */
function ensurePartyOrder(total, party, side) {
  if (party) {
    party.order = +(party.order / total).toPrecision(3)

    if (side && !party.side) {
      party.side = side
    }
  }

  return party
}

/**
 * Predetermine party side
 *
 * @typedef {object} Chunk
 * @property {import('./types').Party[]} upper Upper side participant
 * @property {import('./types').Party[]} lower Lower side participant
 *
 * @param {import('./types').Party[]} parties List of available participants
 * @param {number} slice Number of slices
 * @returns {Chunk}
 */
function assignPartySide(parties, slice) {
  if (Math.floor(parties.length / 2) > slice) {
    slice++
  }

  return {
    upper: parties.slice(0, slice),
    lower: parties.slice(slice),
  }
}
