/**
 * @typedef {object} MatchPrev
 * @property {number} id
 * @property {number} round
 * @property {boolean} singular
 * @property {number} gap
 *
 * @param {number} count
 * @returns {Party[]}
 */
function generateParties(count) {
  /** @type {Party[]} */
  const participants = []

  for (let i = 1; i <= count; i++) {
    participants.push({
      name: `Participant ${i}`,
      continent: `Continent ${i}`,
    })
  }

  return participants
}

/**
 * @typedef {object} Round
 * @property {number} id
 * @property {Match[]} matches
 * @property {Party[]} parties
 *
 * @param {number} index
 * @returns {Round}
 */
function createEmptyRound(index) {
  return {
    id: index + 1,
    matches: [],
    parties: [],
  }
}

/**
 * @typedef {object} Party
 * @property {string} name
 * @property {number} round
 * @property {'blue'|'red'} side
 * @property {MatchPrev|undefined} match
 * @property {number|undefined} order
 * @property {string|undefined} continent
 *
 * @param {Match[]} prevs
 * @returns {(match: Match, m: number) => Party}
 */
function matchWinnerAsNextParty(prevs) {
  const isOddPrev = prevs.length > 1 && prevs.length % 2 > 0
  const singularMatches = prevs.filter(m => m.parties.length === 1)

  return (match, m) => {
    const singularMatch = singularMatches.filter(m => m.id === match.id).length > 0

    /** @type {Party} */
    const party = {
      round: match.next.round,
      side: match.next.side,
      name: `Winner match ${match.id}`,
      order: ((m + 1) / (prevs.length + match.round)).toPrecision(3),
      match: {
        id: match.id,
        round: match.round,
        gap: match.next.gap,
        singular: (singularMatch && isOddPrev) && match.singular,
      },
    }

    party.order = Number(party.order)

    return party
  }
}

/**
 * @param {number} totalParties
 * @returns {Round[]}
 */
function generateRounds(totalParties) {
  /** @type {Round[]} */
  const rounds = []
  let shouldNext = true
  let r = 0

  /**
   * @param {Party} party
   * @param {number} round
   * @param {number} matchId
   */
  const pushParty = (party, round, matchId) => {
    if (!round)
      return

    if (rounds[round] === undefined) {
      rounds[round] = createEmptyRound(round)
    }

    if (rounds[round].parties.find(pt => pt.match.id === matchId) === undefined) {
      rounds[round].parties.push(party)
    }
  }

  while (shouldNext) {
    const prevRound = r >= 1 ? rounds[r - 1] : null
    const prevMatches = prevRound?.matches || []

    /** @type {Round} round */
    const round = {
      id: r + 1,
      parties: r === 0
        ? generateParties(totalParties)
        : rounds.slice(0, r).reduce((parties, round) => {
          // Convert previous matches that has `next.round` to parties for current round
          round.matches.forEach((match, m) => pushParty(
            matchWinnerAsNextParty(prevMatches)(match, m),
            match.next.round,
            match.id,
          ))

          // Track previous parties that are should be added to the current round
          parties.forEach(party => pushParty(party, party.round, party.match.id))

          // Make sure only returns parties for current round
          return parties.filter(party => party.round === r)
        }, [
          ...(rounds[r]?.parties || []),
          ...prevMatches.map(matchWinnerAsNextParty(rounds[r - 1]?.matches || [])),
        ]),
    }

    // Create match list only when we have more than one parties
    round.matches = round.parties.length > 1
      ? createMatches(round.parties, round.id, (num) => {
        // Assign match id by tracking all previous match
        return num + (prevMatches[prevMatches.length - 1]?.id || 0)
      })
      : []

    // Shall we continou calculating next match?
    shouldNext = round.matches.length > 0

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
 * @typedef {object} MatchNext
 * @property {number} round
 * @property {number} gap
 * @property {'blue'|'red'} side
 *
 * @param {boolean} singular
 * @param {Match[]} matches
 * @param {number} index
 * @param {MatchSided[]} total
 * @returns {MatchNext}
 */
function determineNextRound(singular, matches, index, total) {
  const lastOne = matches.at(-1)

  /** @type {MatchNext} */
  const next = {
    side: (index + 1) % 2 > 0 ? 'blue' : 'red',
    party: undefined,
    gap: 0,
  }

  // Ensure last match should next be red side
  if ((index + 1) === total && next.side === 'blue') {
    next.side = 'red'
  }

  // Let's focus on the singular one
  if (!singular)
    return next

  const lastTwo = matches.at(-2)

  // Is there 2 prevous match and current match wasn't the 3rd one
  if (lastTwo && index - 3 !== 0) {
    next.side = 'red'

    // Overwrite 2 previous match if that wasn't a singular
    if (
      lastTwo.singular === false
      && ((total !== 8 && total > 3) || matches.at(-3)?.singular === true)
    ) {
      lastTwo.next.side = 'blue'
    }

    if (lastTwo.next.side === 'blue') {
      lastTwo.next.round++
      next.gap++
    }
  }

  if (lastOne.next.side === 'red') {
    lastOne.next.side = 'blue'
  }

  return next
}

/**
 * @typedef {object} Match
 * @property {number} id
 * @property {number} round
 * @property {boolean} singular
 * @property {Party[]} parties
 * @property {MatchNext} next
 * @property {number} gap
 *
 * @param {Party[]} parties
 * @param {number} roundId
 * @param {(num: number) => number} fnId
 * @returns {Match[]}
 */
function createMatches(parties, roundId, fnId = num => num) {
  const sidedMatches = chunkPartiesBySide(parties, roundId)
  let half = Math.floor(sidedMatches.length / 2)

  // There're some number of matches that problematic to manage
  if ([13, 23, 25].includes(sidedMatches.length)) {
    half++
  }

  /**
   * @type {Match[]}
   */
  const matches = []
  const splits = half >= 4
    ? [
        sidedMatches.slice(0, half),
        sidedMatches.slice(half),
      ]
    : [
        sidedMatches,
        [],
      ]

  return splits.reduce((matches, split) => {
    split.forEach((side, index, split) => {
      const singular = side.red === undefined
      const next = {
        ...determineNextRound(singular, matches, index, split.length),
        round: roundId,
      }

      const match = {
        id: fnId(matches.length + 1),
        round: roundId - 1,
        next,
        gap: 0,
        singular,
        parties: [
          { ...side.blue, side: 'blue' },
        ],
      }

      if (!side.red) {
        matches.push(match)
        return
      }

      match.parties.push({
        ...side.red,
        side: 'red',
      })

      // If there's `match` property on either `blue` and `red` side meaning that
      // must be round 1 or more, so we should calculate match `gap` based on previous one
      if (side.blue.match && side.red.match) {
        match.gap += side.blue.match.gap + side.red.match.gap
      }

      const prevMatch = matches.at(-1)
      const flips = { blue: 'red', red: 'blue' }

      if (match.next.side === prevMatch?.next.side) {
        match.next.side = flips[match.next.side]
      }

      // If there's a gap in the current match, turn next round match into `red` side
      if (match.gap > 0) {
        match.next.side = 'red'

        // If previous match was targeted `blue` side, increase its target `round` and `gap`
        if (prevMatch?.next.side === 'blue') {
          prevMatch.next.round++
          match.next.gap++
        }
      }

      matches.push(match)
    })

    return matches
  }, matches)
}

/**
 * @typedef {object} MatchSided
 * @property {Party} blue
 * @property {Party} red
 *
 * @param {Party[]} parties
 * @param {number} roundId
 */
function chunkPartiesBySide(parties, roundId) {
  /**
   * @type {MatchSided[]}
   */
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

  /**
   * @typedef {object} Chunk
   * @property {Party[]} blue
   * @property {Party[]} red
   *
   * @type {Chunk[]}
   */
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
      for (const side of Object.values(chunk)) {
        const part = assignPartySide(side, half)

        parts.push(part)
      }
    }

    chunks = []
    chunks.push(...parts)
  }

  return chunks.reduce((returns, chunk) => {
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
 * @typedef {object} Half
 * @property {Party[]} blue
 * @property {Party[]} red
 *
 * @param {Party[]} parties
 * @param {number} slice
 * @returns {Half}
 */
function assignPartySide(parties, slice) {
  if ((parties.length / 2) > slice) {
    slice++
  }

  const blue = parties.slice(0, slice)
  const red = parties.slice(slice)

  // We should not allow `red` has more parties than `blue one.
  if (red.length > blue.length) {
    blue.push(...red.splice(0, red.length - blue.length))
  }

  return { blue, red }
}

/**
 * @param {HTMLDivElement} $chart
 * @param {number} totalParties
 */
export function render($chart, totalParties) {
  const rounds = generateRounds(totalParties)

  $chart.innerHTML = ''
  $chart.style.setProperty('--participants', `${totalParties}`)

  for (const roundId in rounds) {
    const round = rounds[roundId]

    const $section = document.createElement('section')
    const $title = document.createElement('h3')
    const $matches = document.createElement('div')

    $section.id = `round-${roundId}`
    $title.textContent = `Round ${roundId}`

    $section.classList.add('rounds')
    $section.style.setProperty('--curr-round', roundId)

    $matches.classList.add('matches')
    $matches.style.setProperty('--grid', round.matches.length)

    $section.append($title)

    for (const match of round.matches) {
      if (!match)
        continue

      const $match = document.createElement('div')

      $match.setAttribute('data-match', match.id)
      match.next.side && $match.setAttribute('data-side', match.next.side)

      $match.style.setProperty('--next-round', match.next.round)
      $match.style.setProperty('--span', match.gap)
      $match.classList.add('match')

      if (roundId > 0) {
        $match.classList.add('has-prev')

        if (match.singular) {
          $match.classList.add('singular')
        }
      }

      if (round.id === rounds.length) {
        $match.classList.add('final-round')
      }

      const $matchInner = document.createElement('div')
      const isVersus = match.parties.length === 2

      $matchInner.id = `round-${roundId}-match-${match.id}`
      $matchInner.classList.add('match-inner')

      const $matchTitle = document.createElement('h4')
      $matchTitle.textContent = match.id

      $match.append($matchTitle)

      for (const party of match.parties) {
        const $participant = document.createElement('div')

        $participant.setAttribute('data-side', party.side)
        $participant.title = party.name

        const $name = document.createElement(isVersus ? 'label' : 'span')

        $name.textContent = party.name
        $name.classList.add('label')

        $participant.append($name)

        if (isVersus) {
          const $check = document.createElement('input')

          $check.type = 'radio'
          $check.name = $matchInner.id
          $check.id = `${$matchInner.id}-${party.side}`
          $check.value = party.side
          $check.placeholder = party.name

          $name.setAttribute('for', $check.id)
          $participant.append($check)
        }

        $matchInner.append($participant)
      }

      $match.append($matchInner)
      $matches.append($match)
    }

    $section.append($matches)
    $chart.append($section)
  }
}
