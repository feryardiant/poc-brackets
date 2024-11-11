/**
 * @typedef {Object} Party
 * @property {String} name
 * @property {String} continent
 * @property {Number} round
 * @property {Number} matchId
 * @property {'blue'|'red'} side
 * 
 * @param {Number} count
 * @param {Boolean} unamed
 * @returns {Party[]}
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
                : rounds.slice(0, r).reduce((parties, round, rnd) => {
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
    if (rounds.length > 0 && rounds.at(-1).matches.length === 0) {
        rounds.splice(r - 1, 1)
    }

    console.log('rounds', rounds)
    return rounds
}

/**
 * @typedef {Object} Match
 * @property {Number} id
 * @property {Number} next
 * @property {Number} round
 * @property {'blue'|'red'} side
 * @property {Party[]} parties
 * @property {Number[]} prevs
 * 
 * @param {Party[]} participants
 * @param {Number} roundId
 * @param {(num: Number) => Number} fnId
 * @returns {Match[]}
 */
function createMatches(participants, roundId, fnId = (num) => num) {
    /** @type {Party[]} */
    let parties = []
    let matchId = 1

    /** @type {Match[]} */
    const matches = chunkPartiesBySide(participants, roundId).reduce((matches, party, p, participants) => {
        if (party === undefined) {
            console.log(participants)
            return matches
        }

        const sameNextSide = party && participants[p + 1]?.side === party.side
        const diffPrevSide = party && participants[p - 1]?.side !== party.side
        let shouldMatched = party.side === 'blue' ? sameNextSide : diffPrevSide

        parties.push(party)

        if (!shouldMatched) {
            return matches
        }

        const match = {
            id: fnId(matchId),
            gap: parties.reduce((gap, party) => {
                return gap + (party.prev?.gap || 0)
            }, 0),
            next: party.round + 1,
            round: party.round,
            side: matches.length % 2 === 0 ? 'blue' : 'red',
            parties
        }

        matches.push(match)

        parties = []
        matchId++

        return matches
    }, [])

    if (matches.length > 1 && matches.length % 2 > 0 && matches.at(-1).side === 'blue') {
        matches[matches.length - 1].side = 'red'
        matches[matches.length - 1].next += 1
    }

    return matches
}

/**
 * @typedef {Object} Chunk
 * @property {Party[]} blue
 * @property {Party[]} red
 * 
 * @param {Party[]} parties 
 * @param {Number} roundId
 */
function chunkPartiesBySide(parties, roundId) {
    /** @type {Chunk[]} */
    let chunks = []
    let side = parties.length

    // Split each participants into chunked blue and red
    // with criteria of each chunk can only consist of max 2 blues and 1 red
    while (side >= 2) {
        side = Math.floor(side / 2)

        const mod = parties.length % side

        if (mod !== 0 && side % 2 > 0) {
            side += mod % 2 > 0 ? mod : 1
        }
        
        if (chunks.length === 0) {
            chunks.push(assignPartySide(parties, side))
            
            continue
        }

        // Recursively splits each sides
        const tmpChunks = []

        for (const chunk of chunks) {
            for (const parts of Object.values(chunk)) {
                let tmpChunk = assignPartySide(parts, side)

                if (tmpChunk.blue.length > 0) {
                    tmpChunks.push(tmpChunk)
                }
            }
        }

        chunks = []
        chunks.push(...tmpChunks)
    }

    const returns = []
    const lastChunk = chunks.at(-1)

    // When last chunk's red has 0 parties,
    // move its blue to red then move previous red as its blue
    if (lastChunk.red.length === 0) {
        lastChunk.red = lastChunk.blue.splice(0)
        lastChunk.blue = chunks.at(-2).red.splice(0)
    }

    for (const chunk of chunks) {
        for (const [side, parts] of Object.entries(chunk)) {
            for (const part of parts) {
                if (part.side === undefined) {
                    part.side = side
                }

                part.round = roundId - 1

                returns.push(part)
            }
        }
    }

    if (roundId > 1) {
        returns.forEach((ret, r) => {
            if ((r + 1) % 2 === 1 && ret.side === 'red' && returns[r + 1] !== undefined) {
                returns[r] = returns.splice(r + 1, 1, returns[r])[0]
            }
        })
    }

    // console.log('ret', ...returns)
    return returns
}

/**
 * @typedef {Object} Side
 * @property {Party[]} blue
 * @property {Party[]} red
 * 
 * @param {Party[]} parties 
 * @param {Number} slice 
 * @returns {Side}
 */
function assignPartySide(parties, slice) {
    const chunk = {
        blue: parties.slice(0, slice),
        red: parties.slice(slice),
    }

    if (chunk.blue.length === 1 && (chunk.red.length - chunk.blue.length) === 1) {
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