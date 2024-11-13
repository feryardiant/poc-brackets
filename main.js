/**
 * @typedef {Object} MatchPrev
 * @property {Number} id
 * @property {Number} round
 * @property {Boolean} singular
 * @property {Number} gap
 * 
 * @typedef {Object} Party
 * @property {String} name
 * @property {String} continent
 * @property {Number} round
 * @property {'blue'|'red'} side
 * @property {?MatchPrev} match
 * @property {?Number} order
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
 * @returns {(match: Match, m: Number) => Party}
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
            }
        }

        party.order = Number(party.order)

        return party
    }
}

/**
 * @param {Number} totalParties
 * @returns {Round[]}
 */
function generateRounds(totalParties) {
    /** @type {Round[]} */
    let rounds = []
    let shouldNext = true
    let r = 0

    /**
     * @param {Party} party
     * @param {Number} round 
     * @param {Number} matchId
     */
    const pushParty = (party, round, matchId) => {
        if (!round) return 

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
                : rounds.slice(0, r).reduce((parties, round, rnd) => {
                    round.matches.forEach((match, m) => pushParty(
                        matchWinnerAsNextParty(prevMatches)(match, m),
                        match.next.round,
                        match.id
                    ))

                    parties.forEach((party, p) => pushParty(party, party.round, party.match.id))

                    return parties.filter((party) => party.round === r)
                }, [
                    ...(rounds[r]?.parties || []),
                    ...prevMatches.map(matchWinnerAsNextParty(rounds[r - 1]?.matches || []))
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

    // console.log('rounds', rounds)
    return rounds
}

/**
 * @typedef {Object} MatchNext
 * @property {Number} round
 * @property {Number} gap
 * @property {'blue'|'red'} side
 * 
 * @param {Boolean} singular
 * @param {Match[]} matches 
 * @param {Number} n
 * @param {MatchSided[]} splits
 * @param {Number} t
 * @returns {MatchNext}
 */
function determineNextRound(singular, matches, n, splits, t) {
    const lastOne = matches.at(-1)
    
    /** @type {MatchNext} */
    const next = {
        side: (n + 1) % 2 > 0 ? 'blue' : 'red',
        party: undefined,
        gap: 0,
    }

    // Ensure last match should next be red side
    if (n > 0 && (n + 1) === splits.length && next.side === 'blue') {
        next.side = 'red'
    }

    if (!singular) return next

    const lastTwo = matches.at(-2)

    if (lastTwo && n - 3 !== 0) {
        next.side = 'red'
        
        // Overwrite 2 previous match if that wasn't a singular
        if (
            lastTwo.singular === false && 
            ((splits.length !== 8 && splits.length > 3) || matches.at(-3)?.singular === true)
        ) {
            lastTwo.next.side = 'blue'
        }

        if (lastTwo.next.side === 'blue') {
            lastTwo.next.round++
            next.gap++
        }

        if (lastTwo.singular === false) {
            console.log(matches.at(-3))
        }
    }
    
    if (next.side !== 'red') return next

    if (lastOne.next.side === 'red') {
        lastOne.next.side = 'blue'
    }

    if ([10, 11].indexOf(splits.length) >= 0) {
        const fixes = ['blue', 'red']
        const idx = [-4, -3]

        idx.forEach((n, i) => {
            const toFix = matches.at(n)
            
            if (toFix?.singular === false && toFix?.next.side !== fixes[i]) {
                toFix.next.side = fixes[i]
            }
        })
    }

    return next
}

/**
 * @typedef {Object} Match
 * @property {Number} id
 * @property {Number} round
 * @property {Boolean} singular
 * @property {Party[]} parties
 * @property {MatchNext} next
 * @property {Number} gap
 * 
 * @param {Party[]} parties
 * @param {Number} roundId
 * @param {(num: Number) => Number} fnId
 * @returns {Match[]}
 */
function createMatches(parties, roundId, fnId = (num) => num) {
    const sidedMatches = chunkPartiesBySide(parties, roundId)
    let half = Math.floor(sidedMatches.length / 2)

    if ([11, 13, 19, 23, 25].indexOf(sidedMatches.length) >= 0) {
        half++
    }

    /** @type {Match[]} */
    const matches = []
    const splits = half >= 4 ? [
        sidedMatches.slice(0, half),
        sidedMatches.slice(half)
    ] : [
        sidedMatches,
        []
    ]

    for (const split of splits) {
        split.forEach((side, n, split) => {
            const singular = side.red === undefined
            const match = {
                id: fnId(matches.length + 1),
                next: determineNextRound(singular, matches, n, split, sidedMatches.length),
                round: roundId - 1,
                gap: 0,
                singular,
                parties: [
                    { ...side.blue, side: 'blue' }
                ],
            }

            if (side.red !== undefined) {
                match.parties.push({
                    ...side.red,
                    side: 'red',
                })
            }

            if (side.blue?.match && side.red?.match) {
                match.gap = side.blue.match.gap + side.red.match.gap

                const lastMatch = matches.at(-1)
                const flips = {
                    blue: 'red',
                    red: 'blue',
                }

                if (match.next.side === lastMatch?.next.side) {
                    match.next.side = flips[match.next.side]
                }

                if (match.gap > 0) {
                    match.next.side = 'red'
                    
                    if (matches.length > 0 && lastMatch.next.side === 'blue') {
                        lastMatch.next.round++
                        match.next.gap += match.round
                    }
                }
            }

            match.next.round = roundId
    
            matches.push(match)
        })
    }

    return matches
}

/**
 * @typedef {Object} Chunk
 * @property {Party[]} blue
 * @property {Party[]} red
 * 
 * @typedef {Object} MatchSided
 * @property {Party} blue
 * @property {Party} red
 * 
 * @param {Party[]} parties 
 * @param {Number} roundId
 */
function chunkPartiesBySide(parties, roundId) {
    /** @type {MatchSided[]} */
    const returns = []

    if (roundId > 1) {
        // Track index of `parties` that has been added to `returns`
        const ns = []

        // Ensure current parties has correct ordering based on their prior
        // total match compared to their index on that match
        parties.sort((a, b) => a.order - b.order)

        return parties.reduce((returns, party, p, parties) => {
            // Skip arrangement if current `p` is already added to `ns`
            // or current `party` was a red one
            if (ns.includes(p) || party.side === 'red') return returns

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

    /** @type {Chunk[]} */
    let chunks = []
    let half = parties.length

    // Split each participants into chunked blue and red
    // with criteria of each chunk can only consist of max 2 blues and 1 red
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
                let part = assignPartySide(side, half)
                
                parts.push(part)
            }
        }

        chunks = []
        chunks.push(...parts)
    }

    return chunks.reduce((returns, chunk, n) => {
        if (chunk.blue.length > 1) {
            returns.push({
                blue: chunk.blue.splice(0, 1)[0],
                red: undefined,
            })
        }

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
 * @typedef {Object} Half
 * @property {Party[]} blue
 * @property {Party[]} red
 * 
 * @param {Party[]} parties 
 * @param {Number} slice 
 * @returns {Half}
 */
function assignPartySide(parties, slice) {
    if ((parties.length / 2) > slice) {
        slice++
    }

    const blue = parties.slice(0, slice)
    const red = parties.slice(slice)

    if (red.length > blue.length) {
        const gap = red.length - blue.length

        blue.push(...red.splice(0, gap))
    }

    // console.log(slice, parties.length, blue, red)
    return { blue, red }
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
            match.next.side && $match.setAttribute('data-side', match.next.side)

            $match.style.setProperty('--next-round', match.next.round)
            $match.style.setProperty('--span', match.gap)
            $match.classList.add('match')

            if (roundId > 0) {
                $match.classList.add('has-prev')
                
                if (roundId == (rounds.length - 1)) {
                    $match.classList.add('final-round')
                }
            }

            if (roundId > 0 && match.singular) {
                $match.classList.add('singular')
                // $matches.classList.add('has-singular')
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