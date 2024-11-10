/**
 * @typedef {Object} Participant
 * @property {String} name
 * @property {String} continent
 * 
 * @param {Number} count
 * @param {Boolean} unamed
 * @returns {Participant[]}
 */
function generateParties(count, unamed) {
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
 * @typedef {Object} Round
 * @property {Number} id
 * @property {Match[]} matches
 * @property {Party[]} parties
 * 
 * @param {Number} index 
 * @returns {Round}
 */
function createEmptyRound(index) {
    return {
        id: index + 1,
        matches: [],
        parties: []
    }
}

/**
 * @typedef {Participant} Party
 * @property {Number} round
 * @property {Number} matchId
 * @property {'blue'|'red'} side
 * 
 * @param {Match[]} prevs 
 * @returns {(match: Match) => Party}
 */
function matchWinnerAsNextParty(prevs) {
    return (match) => {
        /** @type {Party} */
        const party = {
            round: match.next,
            matchId: match.id,
            side: match.side,
            name: `Winner match ${match.id}`,
            prev: {
                round: match.round,
                gap: match.gap,
            }
        }

        if (prevs.length > 0) {
            for (const pt of match.parties) {
                const prevMatch = prevs.find((m) => m.id === pt.matchId)

                if (prevMatch === undefined || prevMatch.gap === 0 || prevMatch.gap > party.prev.gap) continue
                
                party.prev.gap -= prevMatch.gap
            }
        }

        return party
    }
}

/**
 * @param {number} totalParties
 * @returns {Round[]}
 */
function generateRounds(totalParties) {
    /** @type {Round[]} */
    let rounds = []
    let shouldNext = true
    let r = 0
    
    while (shouldNext) {
        const prevRound = r >= 1 ? rounds[r - 1] : null
        const prevMatches = prevRound?.matches || []

        /** @type {Round} round */
        const round = {
            id: r + 1,
            parties: r === 0
                ? generateParties(totalParties)
                : rounds.slice(0, r).reduce((parties, round) => {
                    round.matches.forEach((match) => {
                        if (rounds[match.next] === undefined) {
                            rounds[match.next] = createEmptyRound(match.next)
                        }
                    })

                    parties.forEach((party, p) => {
                        if (!party.round) return

                        if (rounds[party.round] === undefined) {
                            rounds[party.round] = createEmptyRound(party.round)
                        }

                        if (rounds[party.round].parties.find(pt => pt.matchId === party.matchId) === undefined) {
                            rounds[party.round].parties.push(party)
                        }
                    })

                    return parties.filter((party) => party.round === r)
                }, [
                    ...(rounds[r]?.parties || []),
                    ...prevMatches.map(matchWinnerAsNextParty(rounds[r - 2]?.matches || []))
                ])
        }

        round.matches = round.parties.length > 1
            ? createMatches(round.parties, round.id, (num) => {
                return num + (prevMatches[prevMatches.length - 1]?.id || 0)
            })
            : []
            
        shouldNext = round.matches.length > 0

        if (shouldNext) {
            rounds[r] = round
        }

        r++
    }

    // Delete last round if its contains only single party
    if (rounds.at(-1).matches.length === 0) {
        rounds.splice(r - 1, 1)
    }

    return rounds
}

/**
 * @typedef {Object} Match
 * @property {Number} id
 * @property {Number} next
 * @property {Number} round
 * @property {'blue'|'red'} side
 * @property {Participant[]} parties
 * @property {Number[]} prevs
 * 
 * @param {Participant[]} participants
 * @param {Number} roundId
 * @param {(num: Number) => Number} fnId
 * @returns {Match[]}
 */
function createMatches(participants, roundId, fnId = (num) => num) {
    /** @type {Party[]} */
    let parties = []
    let matchId = 1

    for (let pt in participants) {
        pt = Number(pt)

        if (roundId <= 2 || (pt < 1 || pt >= participants.length - 1)) continue

        if (participants[pt].side === participants[pt - 1].side) {
            participants[pt] = participants.splice(pt + 1, 1, participants[pt])[0]
        }
    }

    /** @type {Match[]} */
    const matches = participants.reduce((matches, party, i) => {
        const id = Number(i) + 1
        const isEven = id % 2 == 0

        parties.push({
            side: isEven ? 'red' : 'blue',
            ...party
        })

        if (isEven) {
            matches.push({
                id: fnId(matchId),
                gap: parties.reduce((gap, party) => {
                    return gap + (party.prev?.gap || 0)
                }, 0),
                next: roundId,
                parties
            })
            
            parties = []
            matchId++
        }

        return matches
    }, [])

    // On first round, if there's a party that haven't assigned to match
    // Create a special game for them to match with winner from prev match
    if (roundId === 1 && (participants.length - (matches.length * 2) === 1)) {
        matches.push({
            id: fnId(matchId),
            gap: 0,
            next: roundId,
            parties: [
                { side: 'blue', ...participants.at(-1) }
            ]
        })
    }

    createChunks(matches).forEach((chunk) => {
        for (const [side, chunks] of Object.entries(chunk)) {
            chunks.forEach((match, c) => {
                const m = matches.findIndex((m) => m.id === match.id)
    
                matches[m].round = roundId - 1
                matches[m].side = matches[m].gap > 0
                    ? (matches[m].gap % 2 === 0 ? 'blue' : 'red')
                    : side
                
                if (chunks.length > 1 && c > 0) {
                    matches[m - 1].next += 1
                }

                if (m > 0) {
                    const gap = matches[m].parties[0].matchId - matches[m - 1].parties[1].matchId - 1 || 0

                    if (gap > 0) {
                        matches[m].gap = gap
                    }

                    if (matches[m].gap > 0) {
                        matches[m - 1].next += (1 - matches[m - 1].gap)
                    }
                }
            })
        }
    })

    return matches
}

/**
 * @param {Match[]} matches 
 */
function createChunks(matches) {
    let side = matches.length
    let chunks = []

    while (side >= 2) {
        side = side / 2

        if (chunks.length === 0) {
            chunks.push(createMatchSides(matches, side))
            
            continue
        }
        
        const tmpChunks = []
        for (const i in chunks) {
            const chunk = chunks[i]

            tmpChunks.push(
                createMatchSides(chunk.blue, side),
                createMatchSides(chunk.red, side),
            )
        }

        chunks = []
        chunks.push(...tmpChunks)
    }

    return chunks
}

/**
 * @typedef {Object} Side
 * @property {Match[]} blue
 * @property {Match[]} red
 * 
 * @param {Match[]} matches 
 * @param {Number} slice 
 * @returns {Side}
 */
function createMatchSides(matches, slice) {
    const chunk = {
        blue: matches.slice(0, slice),
        red: matches.slice(slice),
    }

    if (chunk.blue.length === 1 && chunk.red.length === 2) {
        chunk.blue.push(chunk.red[0])
        chunk.red = chunk.red.slice(1)
    }

    return chunk
}

/**
 * @param {HTMLDivElement} $chart
 * @param {Number} totalParties
 */
export function init($chart, totalParties) {
    const rounds = generateRounds(totalParties)
    const matchGap = 30
    const matchHeight = 62
    
    $chart.innerHTML = ''
    $chart.style.setProperty('--participants', `${totalParties}`)
    $chart.style.setProperty('--height', `${matchHeight}px`)
    $chart.style.setProperty('--gap', `${matchGap}px`)

    for (const roundId in rounds) {
        const round = rounds[roundId]

        const $section = document.createElement('section')
        const $title = document.createElement('h3')
        const $matches = document.createElement('div')

        $section.id = `round-${roundId}`
        $title.innerText = `Round ${roundId}`
        
        $section.classList.add('rounds')
        $section.style.setProperty('--curr-round', roundId)
        
        $matches.classList.add('matches')
        $matches.style.setProperty('--grid', round.matches.length)

        $section.append($title)

        for (const match of round.matches) {
            if (!match) continue

            const $match = document.createElement('div')

            $match.setAttribute('data-match', match.id)
            match.side && $match.setAttribute('data-side', match.side)

            $match.style.setProperty('--next-round', match.next)
            $match.style.setProperty('--span', match.gap)
            $match.classList.add('match')

            if (roundId > 0) {
                $match.classList.add('has-prev')
                
                if (roundId == (rounds.length - 1)) {
                    $match.classList.add('final-round')
                }
            }
            
            const $matchInner = document.createElement('div')
            const isVersus = match.parties.length === 2

            $matchInner.id = `round-${roundId}-match-${match.id}`
            $matchInner.classList.add('match-inner')

            const $matchTitle = document.createElement('h4')
            $matchTitle.innerText = match.id

            $match.append($matchTitle)

            for (const party of match.parties) {
                const $participant = document.createElement('div')

                $participant.setAttribute('data-side', party.side)

                const $name = document.createElement('label')

                $name.innerText = party.name
                $participant.append($name)

                if (isVersus) {
                    const $check = document.createElement('input')
    
                    $check.type = 'radio'
                    $check.name = $matchInner.id
                    $check.id = `${$matchInner.id}-${party.side}`
                    $check.value = party.side
    
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