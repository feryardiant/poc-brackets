import { chunkPartiesBySide, generateParties } from './parties.js'

/**
 * @param {import('./types').Match[]} prevs
 * @returns {import('./types').MatchToPartyFn}
 */
function matchWinnerAsNextParty(prevs) {
  return (match, m) => {
    /** @type {import('./types').Party} */
    const party = {
      round: match.next.round,
      side: match.next.side,
      name: `Winner match ${match.id}`,
      order: ((m + 1) / (prevs.length + match.round)).toPrecision(3),
      match: {
        id: match.id,
        round: match.round,
        gap: match.next.gap,
        singular: match.singular,
        index: m,
      },
    }

    party.order = Number(party.order)

    return party
  }
}

/**
 * @param {number} totalParties
 * @returns {import('./types').Round[]}
 */
function generateRounds(totalParties) {
  /** @type {import('./types').Round[]} */
  const rounds = []
  let shouldNext = true
  let r = 0

  /**
   * @param {import('./types').Party} party
   * @param {number} round
   * @param {number} matchId
   */
  const pushParty = (party, round, matchId) => {
    if (!round)
      return

    if (rounds[round] === undefined) {
      rounds[round] = {
        id: round + 1,
        matches: [],
        parties: [],
      }
    }

    if (rounds[round].parties.find(pt => pt.match.id === matchId) === undefined) {
      rounds[round].parties.push(party)
    }
  }

  while (shouldNext) {
    const prevRound = r >= 1 ? rounds[r - 1] : null
    const prevMatches = prevRound?.matches || []

    /** @type {import('./types').Round} round */
    const round = {
      id: r + 1,
      parties: r === 0
        ? generateParties(totalParties, r)
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
      ? createMatches(round.parties, round.id, (num, match) => {
        // Whether current match has previous round
        if (prevMatches.length > 0) {
          determineNextRoundFromPrevMatches(prevMatches, match)
        }

        // Retrieve last match on the previous round
        const prevLastMatch = prevMatches.at(-1)

        // Assign match id by tracking all previous match including from previous round
        return num + (prevLastMatch?.id || 0)
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
 * @param {import('./types').Match[]} matches
 * @param {import('./types').Match} match
 */
function determineNextRoundFromPrevMatches(matches, match) {
  const hasSingularParty = match.parties.some(p => p.match.singular)

  for (const party of match.parties) {
    const prevAfterMatch = matches[party.match.index + 1]

    if (prevAfterMatch?.next.round !== match.next.round)
      continue

    if (
      (prevAfterMatch.next.gap > 0 && prevAfterMatch.next.side === 'red')
      || prevAfterMatch.round === party.match.round
    ) {
      match.next.side = 'blue'

      if (!hasSingularParty) {
        match.gap++
      }
    }
  }
}

/**
 * @param {number} round
 * @param {boolean} singular
 * @param {import('./types').Match[]} matches
 * @param {number} index
 * @param {number} total
 * @returns {import('./types').MatchNext}
 */
function determineNextRoundForCurrentMatch(round, singular, matches, index, total) {
  const prevOne = matches.at(-1)
  const lastMatch = total > 1 && (index + 1) === total

  /** @type {import('./types').MatchNext} */
  const next = {
    side: (index + 1) % 2 > 0 ? 'blue' : 'red',
    party: undefined,
    gap: 0,
    round,
  }

  // Every singular match should next be blue side
  if (singular && !lastMatch) {
    next.side = 'blue'
  }

  // Let's focus on the non-singular and has previous match(es)
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
  // current `next.round`, `next.gap` and `next.gap` of the previous 2 match
  if (
    (round === 1 && prevTwo && next.side === 'red' && next.round === round)
    && (prevTwo.next.side === 'blue' && prevOne.next.side !== prevTwo.next.side)
    && prevOne.next.round === prevTwo.next.round
  ) {
    prevTwo.next.gap++
    next.round++
    next.gap++
    }
  }

  return next
}

/**
 * @param {import('./types').Party[]} parties
 * @param {number} roundId
 * @param {(num: number, match: import('./types').Match) => number} fnId
 * @returns {import('./types').Match[]}
 */
function createMatches(parties, roundId, fnId = num => num) {
  const sidedMatches = chunkPartiesBySide(parties, roundId)
  let half = Math.floor(sidedMatches.length / 2)

  // There're some number of matches that problematic to manage
  if (sidedMatches.length > 6 && sidedMatches.length % 2 > 0) {
    half++
  }

  /** @type {import('./types').Match[]} */
  const matches = []
  const splits = (roundId === 1 && half >= 3) || (roundId > 1 && half >= 2)
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

      /** @type {import('./types').Match} */
      const match = {
        next: determineNextRoundForCurrentMatch(roundId, singular, matches, index, split.length),
        round: roundId - 1,
        gap: 0,
        singular,
        parties: [
          { ...side.blue, side: 'blue' },
        ],
      }

      if (side.red) {
        match.parties.push({ ...side.red, side: 'red' })
      }

      match.id = fnId(matches.length + 1, match)

      if (singular) {
        matches.push(match)
        return
      }

      const prevMatch = matches.at(-1)

      // If there's `match` property on either `blue` and `red` side meaning that
      // must be round 1 or more, so we should calculate match `gap` based on previous one
      if (side.blue.match?.singular === true) {
        match.gap += side.blue.match.gap + side.red.match.gap

        if (prevMatch?.gap > 0) {
          match.next.side = 'blue'
        }
      }

      if (prevMatch?.gap > 0) {
        if (match.next.side === 'red') {
          match.next.round++
        }
      }

      matches.push(match)
    })

    return matches
  }, matches)
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

      if (match.next.round) {
        $match.style.setProperty('--next-round', match.next.round)
      }

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
