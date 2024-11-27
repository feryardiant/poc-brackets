import { ensurePartyIsNotRegistered, rearrangePartiesBySide } from './parties.js'

/**
 * Simple CSV parser
 *
 * @param {string} csv
 */
export function parseCsv(csv) {
  const returns = []
  const heading = []

  return csv.split('\n').reduce((returns, line, i) => {
    if (line === '') {
      return returns
    }

    const columns = line.split(',').map(col => col.trim())

    if (i === 0) {
      heading.push(...columns)
      return returns
    }

    const obj = {
      order: i,
    }

    columns.forEach((col, i) => {
      obj[heading[i]] = /\d/.test(col) ? Number(col) : col
    })

    returns.push(obj)

    return returns
  }, returns)
}

/**
 * Convert match from previous round into participant in the current round
 *
 * @param {import('./types').Match} match Match from previous round
 * @param {number} index All registered matches in previous round
 * @param {import('./types').Match[]} matches All registered matches in previous round
 * @returns {import('./types').Party} Party obj based on match
 */
function convertMatchToParty(match, index, matches) {
  /** @type {import('./types').Party} */
  const party = {
    round: match.next.round,
    side: match.next.side,
    name: match.round === 0 && match.singular
      ? match.parties[0].name
      : `Winner match ${match.id}`,
    order: ((index + 1) / (matches.length + match.round)).toPrecision(3),
    match: {
      id: match.id,
      round: match.round,
      size: match.size,
      span: match.next.span,
      singular: match.singular,
      index,
    },
  }

  party.order = Number(party.order)

  return party
}

/**
 * Generate rounds based on total number of participant
 *
 * @param {import('./types').Party[]} parties List of registered parties for first round
 * @returns {import('./types').Round[]} List of all registered rounds
 */
function generateRounds(parties) {
  /** @type {import('./types').Round[]} */
  const rounds = []
  let shouldNext = true
  let r = 0

  while (shouldNext) {
    const prevRound = r >= 1 ? rounds[r - 1] : null
    const prevMatches = prevRound?.matches || []

    /** @type {import('./types').Round} round */
    const round = {
      id: r + 1,
      matches: rounds[r]?.matches || [],
      parties: r === 0
        ? parties
        : rounds.slice(0, r).reduce((parties, round) => {
          // Track all matches on previous round(s) that should be added to the current round
          round.matches.forEach((match, m, matches) => {
            // Prevent current iteration to targets previous round and
            // ensure it's not a `hidden` and `bye` match
            if (match.next.round < r || (match.bye && match.hidden)) {
              return
            }

            // Convert previous matches that has `next.round` to parties for current round
            const party = convertMatchToParty(match, m, matches)

            // Create new empty round when the party is desire a non-existing round
            if (rounds[party.round] === undefined) {
              rounds[party.round] = {
                matches: [],
                parties: [],
              }
            }

            // Register the `party` to the desired `round` when its not already registered
            if (ensurePartyIsNotRegistered(rounds[party.round].parties, match)) {
              rounds[party.round].parties.push(party)
            }

            // Make sure only returns parties for current round
            if (party.round === r && ensurePartyIsNotRegistered(parties, match)) {
              parties.push(party)
            }
          })

          return parties
        }, rounds[r]?.parties || []),
    }

    // Create match list only when we have more than one parties
    if (round.parties.length > 1) {
      round.matches = createMatches(round.parties, round.id, (num, match) => {
        // Whether current match has previous round
        if (prevMatches.length > 0) {
          determineNextRoundFromPrevMatches(prevMatches, match)
        }

        if (match.round === r) {
          // Assign match id by tracking all previous registered match that has ID
          return num + (prevMatches.filter(m => m.id).at(-1)?.id || 0)
        }

        if (!rounds[match.round]) {
          rounds[match.round] = {
            matches: [],
            parties: [],
          }
        }

        // Register the parties that actually belongs to another rounds
        if (ensurePartyIsNotRegistered(rounds[match.round].parties, match)) {
          rounds[match.round].parties.push(...match.parties)
        }

        // In this case we shouldn't returns any ID for the current match
        return undefined
      })
    }

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
 * Determine target match based on related match(es) from previous round
 *
 * @param {import('./types').Match[]} matches All registered matches in previous round
 * @param {import('./types').Match} match Current match registration
 */
function determineNextRoundFromPrevMatches(matches, match) {
  for (const party of match.parties) {
    // Retrieve related match on the previous round based on participant of this match
    const prevAfterMatch = matches[party.match.index + 1]

    // Skip when the related match doesn't have same target round as current match
    if (prevAfterMatch?.next.round !== match.next.round)
      continue

    if (
      (prevAfterMatch.next.span > 0 && prevAfterMatch.next.side === 'red')
      || prevAfterMatch.round === party.match.round
    ) {
      match.next.side = 'blue'
    }
  }
}

/**
 * Determine target match based on existing entry
 *
 * @param {number} round ID of current round
 * @param {boolean} singular Whether this entry is a singular one
 * @param {import('./types').Match[]} matches All registered matches in this round
 * @param {number} index Index of current entry
 * @param {number} total Total number of current split
 * @returns {import('./types').MatchNext} Match entry for next round
 */
function determineNextRoundForCurrentMatch(round, singular, matches, index, total) {
  const prevOne = matches.at(-1)
  const lastMatch = total > 1 && (index + 1) === total

  /** @type {import('./types').MatchNext} */
  const next = {
    side: (index + 1) % 2 > 0 ? 'blue' : 'red',
    span: 0,
    round,
  }

  // Turn next side into `blue` if this entry is a singular and not the last one
  if (singular && !lastMatch) {
    next.side = 'blue'
  }

  // Continue to next iteration if this entry is a singular or the first one
  if (singular || !prevOne)
    return next

  // Swap next side of current match when it's not the first entry in current split and
  // the previous registered match was targeting the same round but has same target side
  if (index > 0 && (prevOne.next.round === next.round && prevOne.next.side === next.side)) {
    next.side = {
      blue: 'red',
      red: 'blue',
    }[next.side]
  }

  // Force next side to `blue` when previous registered match was
  // targeting `red` side and has greater target round than current one
  if (prevOne.next.round > next.round && prevOne.next.side === 'red') {
    next.side = 'blue'
  }

  // The second last of registered match
  const prevTwo = matches.at(-2)

  // Force next side to be `red` when it was the last match in the split or
  // the previous registered match was a singularn
  if (lastMatch || prevOne.singular || ((index > 0 && index !== 4) && prevTwo?.singular)) {
    next.side = 'red'
  }

  // When current entry has 2 prior matches that will face each other on
  // the next round and either of them has the same target round, increase
  // current `next.round`, `next.span` and `next.span` of the previous match
  if (
    (round === 1 && prevTwo && next.side === 'red' && next.round === round)
    && (prevTwo.next.side === 'blue' && prevOne.next.side !== prevTwo.next.side)
    && prevOne.next.round === prevTwo.next.round
  ) {
    prevOne.next.span++
    next.round++
  }

  return next
}

/**
 * Create and register matches
 *
 * @param {import('./types').MatchSided[]} parties All registered participants for each round
 * @param {number} round ID of current round
 * @param {(num: number, match: import('./types').Match) => number} fnId Callback function to create match id for the entry
 * @returns {import('./types').Match[]} List of all registered matches
 */
function createMatches(parties, round, fnId = num => num) {
  const sidedMatches = round === 1 ? parties : rearrangePartiesBySide(parties, round)
  let half = Math.floor(sidedMatches.length / 2)

  // Increase number of the first-half entries by one when
  // the total number of entries is more than 6 and it's an odd number
  if (sidedMatches.length > 6 && sidedMatches.length % 2 > 0) {
    half++
  }

  /** @type {import('./types').Match[]} */
  const matches = []
  // Split match entries in half on each round with certain criteria
  const splits = (round === 1 && half >= 3) || (round > 1 && half >= 2)
    ? [
        sidedMatches.slice(0, half),
        sidedMatches.slice(half),
      ]
    : [
        sidedMatches,
        [],
      ]

  return splits.reduce((matches, split) => {
    let byeMatch = matches.some(match => match.bye)

    split.forEach((side, index, split) => {
      const singular = side.red === undefined
      const prevMatch = matches.at(-1)

      if (singular) {
        byeMatch = false
      }

      /** @type {import('./types').Match} */
      const match = {
        bye: byeMatch,
        id: undefined,
        next: determineNextRoundForCurrentMatch(round, singular, matches, index, split.length),
        round: round - 1,
        hidden: singular,
        singular,
        size: 1,
        span: 0,
        parties: [
          { ...side.blue, side: 'blue' },
        ],
      }

      if (side.red) {
        match.parties.push({ ...side.red, side: 'red' })
      }

      if (prevMatch?.next.span > 0) {
        byeMatch = match.bye = true
        prevMatch.next.span = 0
      }

      if (!singular) {
        if (match.bye) {
          match.round++
        }

        match.id = fnId(matches.filter(m => m.id).length + 1, match)
      }

      match.hidden = match.id === undefined

      if (round > 1) {
        // Calculate curernt match size and span
        // based on it's participant' match in prev round
        [match.size, match.span] = match.parties.reduce((sums, party) => {
          sums[0] += (party.match?.size || 0)
          sums[1] += (party.match?.span || 0)
          return sums
        }, [0, 0])

        // Ensure `match.size` is not less than 1
        if (match.size === 0) {
          match.size++
        }
      }

      if (singular) {
        matches.push(match)
        return
      }

      // If the `blue` participant was a singular one
      // increase the span of current match based on either parties
      if (match.parties.some(p => p.match?.singular)) {
        match.span = side.blue.match.span + side.red.match.span

        if (prevMatch?.span > 0) {
          match.next.side = 'blue'
        }
      }

      // Increase target `next.round` of current match when
      // previous match has greater span and `next.side` target was `red`
      if (prevMatch?.span > 0 && match.next.side === 'red') {
        prevMatch.next.span = match.size
        match.next.round++
      }

      matches.push(match)
    })

    return matches
  }, matches)
}

/**
 * @param {HTMLDivElement} $chart
 * @param {import('./types.js').Party[]} parties
 */
export function render($chart, parties) {
  const rounds = generateRounds(parties)

  $chart.innerHTML = ''
  $chart.style.setProperty('--participants', `${parties.length}`)

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
      const $match = document.createElement('div')

      match.id && $match.setAttribute('data-match', match.id)
      match.next.side && $match.setAttribute('data-side', match.next.side)
      match.next.round && $match.style.setProperty('--next-round', match.next.round)

      $match.style.setProperty('--size', match.size)
      $match.style.setProperty('--span', match.span || 0)
      $match.classList.add('match')

      if (roundId > 0) {
        $match.classList.add('has-prev')
      }

      if (match.size > 1 && match.size % 2 > 0) {
        $match.classList.add('odd')
      }

      if (round.id === rounds.length) {
        $match.classList.add('final-round')
      }

      if (match.hidden) {
        $match.setAttribute('aria-hidden', 'true')
        $matches.append($match)

        continue
      }

      const $matchInner = document.createElement('div')

      $matchInner.classList.add('match-inner')

      if (match.id) {
        const $matchTitle = document.createElement('h4')
        $matchInner.id = `round-${roundId}-match-${match.id}`
        $matchTitle.textContent = match.id

        $match.append($matchTitle)
      }

      for (const party of match.parties) {
        const $participant = document.createElement('div')

        $participant.setAttribute('data-side', party.side)
        $participant.title = party.name

        const $name = document.createElement(!match.singular ? 'label' : 'span')

        $name.textContent = party.name
        $name.classList.add('label')

        $participant.append($name)

        if (!match.singular) {
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
