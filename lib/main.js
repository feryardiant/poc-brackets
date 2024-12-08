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
    name: `Winner match ${match.id}`,
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

  if (match.round === 0 && match.singular) {
    party.id = match.parties[0].id
    party.name = match.parties[0].name
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
      const sidedMatches = rearrangePartiesBySide(round.parties, round.id)

      round.matches = createMatches(sidedMatches, round.id, (num, match) => {
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
    next.side = flipSide(next.side)
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
  if (lastMatch || prevOne.singular) {
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
 * @param {import('./types').MatchSided[]} sidedMatches All registered participants for each round
 * @param {number} round ID of current round
 * @param {(num: number, match: import('./types').Match) => number} fnId Callback function to create match id for the entry
 * @param {import('./types').Match[]} matches
 * @param {number[]} byes List of singular match' index
 * @returns {import('./types').Match[]} List of all registered matches
 */
function createMatches(sidedMatches, round, fnId = num => num, matches = [], byes = []) {
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

    // Prevent unnecessary calculation on another rounds but round 1
    if (round === 1 && sides.length >= 5 && half > 1) {
      createMatches(sides, round, fnId, matches, byes)

      return matches
    }

    // The `hasByes` might be negated by prior iteration so let reassure the value
    if (!hasByes && matches.at(-1)?.bye === false) {
      hasByes = sides.some(side => side.red === undefined)
    }

    sides.forEach((side, index, split) => {
      const singular = side.red === undefined
      const prevMatch = matches.at(-1)

      /** @type {import('./types').Match} */
      const match = {
        bye: round === 1 && (hasByes && side.index < byes.at(-1)),
        id: undefined,
        next: determineNextRoundForCurrentMatch(round, singular, matches, index, split.length),
        round: round - 1,
        hidden: singular,
        singular,
        size: 1,
        span: 0,
        parties: [side.blue],
      }

      if (singular || prevMatch?.singular) {
        hasByes = match.bye = false
      }

      if (!side.red) {
        matches.push(match)

        return matches
      }

      if (match.bye) {
        match.round++
      }

      match.parties.push(side.red)
      match.id = fnId(matches.filter(m => m.id).length + 1, match)
      match.hidden = match.id === undefined

      // Calculate current match `size` and `span`
      // based on it's participant' match in prev round
      ;[match.size, match.span] = match.parties.reduce(([size, span], party) => {
        size += (party.match.size || 0)
        span += (party.match.span || 0)

        return [size, span]
      }, [0, 0])

      // Ensure `match.size` is not less than 1
      if (match.size === 0) {
        match.size++
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
    $title.id = `${$section.id}-title`

    $section.setAttribute('aria-labelledby', $title.id)
    $section.classList.add('rounds')
    $section.style.setProperty('--curr-round', roundId)

    $matches.classList.add('matches')
    $matches.style.setProperty('--grid', round.matches.length)

    $section.append($title)

    for (const match of round.matches) {
      const $match = document.createElement('div')

      $match.classList.add('match')

      if (match.hidden) {
        $match.setAttribute('aria-hidden', 'true')
        $matches.append($match)

        continue
      }

      $match.style.setProperty('--size', match.size)
      $match.style.setProperty('--span', match.span || 0)
      $match.style.setProperty('--next-round', match.next.round)
      $match.setAttribute('data-next-side', match.next.side)

      if (match.size > 1 && match.size % 2 > 0) {
        $match.classList.add(...'odd')
      }

      if (round.id > 1) {
        $match.classList.add(...'has-prev')
      }

      if (round.id === rounds.length) {
        $match.classList.add(...'final-round')
      }

      $match.id = `round-${roundId}-match-${match.id}`
      $match.setAttribute('data-match', match.id)

      const $matchTitle = document.createElement('h4')
      const $matchInner = document.createElement('div')

      $matchTitle.id = `${$match.id}-title`
      $matchInner.id = `${$match.id}-inner`

      $matchTitle.textContent = match.id
      $matchTitle.setAttribute('aria-label', `Match ${match.id}`)
      $matchTitle.classList.add('match-title')
      $matchInner.classList.add('match-inner')

      $match.setAttribute('aria-labelledby', $matchTitle.id)
      $match.append($matchTitle)

      for (const party of match.parties) {
        const $participant = document.createElement('div')
        const $label = document.createElement('label')
        const $check = document.createElement('input')

        $participant.id = `${$match.id}-${party.side}`
        $participant.title = party.name

        $label.id = `${$participant.id}-label`
        $label.textContent = party.name

        $check.type = 'radio'
        $check.name = $matchInner.id
        $check.id = `${$participant.id}-check`
        $check.value = party.id

        if (round.id > 1) {
          $check.disabled = true
        }

        $label.classList.add('party-label')
        $label.setAttribute('for', $check.id)

        $check.classList.add('party-check')
        $check.addEventListener('change', (e) => {
          const partyId = Number(e.target.value)
          const winner = match.parties.find(party => party.id === partyId)

          winnerSelected(e.target, match, winner, rounds)
        })

        $participant.classList.add('party')
        $participant.setAttribute('data-side', party.side)
        $participant.setAttribute('aria-labelledby', $label.id)

        $participant.append($label, $check)
        $matchInner.append($participant)
      }

      $match.append($matchInner)
      $matches.append($match)
    }

    $section.append($matches)
    $chart.append($section)
  }
}

/**
 * @param {HTMLInputElement} $el
 * @param {import('./types').Match} match
 * @param {import('./types').Party} winner
 * @param {import('./types').Round[]} rounds
 */
function winnerSelected($el, match, winner, rounds) {
  const $matches = $el.offsetParent.parentElement
  const $parties = $matches.querySelectorAll('input[type="radio"]')
  const byMatch = party => party.match?.id === match.id
  const nextRound = rounds[match.next.round]

  // Disable all radio buttons in current match
  enableParties($el.offsetParent, false)

  // Check if all match in the round already finish
  if (Array.from($parties).every($radio => $radio.disabled)) {
    const $round = $matches.parentElement

    $round.classList.add('completed')
    enableParties($round.nextElementSibling)
  }

  // Mark the opponent as loser
  $el.offsetParent.querySelector(
    `div[data-side=${flipSide(winner.side)}]`,
  ).classList.add('loser')

  if (!nextRound) {
    return
  }

  // Find the target match on the next round
  const nextMatch = nextRound.matches.find(({ parties }) => !!parties.find(byMatch))
  // Find target party instance
  const party = nextMatch.parties.find(byMatch)
  // Find target party element
  const $party = document.getElementById(
    `round-${match.next.round}-match-${nextMatch.id}-inner`,
  ).children.item(match.next.side === 'blue' ? 0 : 1)

  // Update target party instance
  $party.children.item(0).textContent = party.name = winner.name
  $party.children.item(1).value = party.id = winner.id
}

/**
 * @param {import('./types').Side} side
 * @returns {import('./types').Side}
 */
function flipSide(side) {
  return { red: 'blue', blue: 'red' }[side]
}

/**
 * @param {HTMLDivElement|null} $el
 * @param {boolean} enable
 */
function enableParties($el, enable = true) {
  if (!$el) {
    return
  }

  const $parties = $el.querySelectorAll('input[type="radio"]')

  $parties.forEach($radio => ($radio.disabled = !enable))
}
