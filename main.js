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
    const isOddPrev = prevs.length > 1 && prevs.length % 2 > 0
    const singularMatches = prevs.filter(m => m.parties.length === 1)

    return (match) => {
        const singularMatch = singularMatches.filter(m => m.id === match.id).length > 0

        /** @type {Party} */
        const party = {
            round: match.next.round,
            side: match.next.side,
            name: `Winner match ${match.id}`,
            match: {
                id: match.id,
                round: match.round,
                gap: match.next.gap,
                singular: (singularMatch && isOddPrev) && match.singular,
            }
        }

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
                        if (rounds[match.next.round] === undefined) {
                            rounds[match.next.round] = createEmptyRound(match.next.round)
                        }
                    })

                    parties.forEach((party, p) => {
                        if (!party.round) return

                        if (rounds[party.round] === undefined) {
                            rounds[party.round] = createEmptyRound(party.round)
                        }

                        if (rounds[party.round].parties.find(pt => pt.match.id === party.match.id) === undefined) {
                            rounds[party.round].parties.push(party)
                        }
                    })

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

        // if (r > 0 && prevMatches.length > round.parties.length) {
        //     const nextRoundParties = prevMatches.filter(m => m.next.round === round.id)

        //     for (const nextParty of nextRoundParties) {
        //         const foundMatch = round.matches.find((match) => {
        //             return match.parties.filter(p => p.match.id > nextParty.id).length > 0
        //         })

        //         if (!foundMatch) {
        //             continue
        //         }

        //         foundMatch.gap++

        //         if (nextParty.next.side === 'red') {
        //             foundMatch.next.round++
        //         }

        //         if (nextParty.next.side === foundMatch.next.side) {
        //             foundMatch.next.side = 'red'
        //         }
        //         // console.log(foundMatch)
        //     }

        //     // console.log(nextRoundParties, round.matches)
        // }

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
 * @param {Number} roundId
 * @param {Match[]} matches 
 * @param {Boolean} singular
 * @param {Number} index
 * @param {MatchSided[]} sides
 * @returns {MatchNext}
 */
function determineNextRound(roundId, matches, singular, index, sides) {
    const lastOne = matches.at(-1)
    
    /** @type {MatchNext} */
    const next = {
        round: roundId,
        side: (index + 1) % 2 > 0 ? 'blue' : 'red',
        party: undefined,
        gap: 0,
    }

    if (roundId === 1) {
        console.log('s', sides, index)
    }

    // Ensure last match should next be red side
    if (index > 0 && (index + 1) === sides.length && next.side === 'blue') {
        next.side = 'red'

        if (!singular && lastOne?.singular) {
            next.gap = 1
        }
    }

    // Overwrite 2 previous matches if available and currently a singular
    if (singular && next.side === 'red') {
        const lastTwo = matches.at(-2)

        if (lastOne.next.side === 'red') {
            lastOne.next.side = 'blue'
        }

        if (lastTwo?.next.side === 'blue' && lastTwo?.singular === false) {
            lastTwo.next.round++
            next.gap = 1
        }
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

    if (half >= 5 && (half % 2 > 0 || sidedMatches.length % 2 > 0)) {
        half++
    }

    /** @type {Match[]} */
    const matches = []
    const splits = half > 3 ? [
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
                next: determineNextRound(roundId, matches, singular, n, split),
                round: roundId - 1,
                gap: 0,
                singular,
                parties: [
                    { ...side.blue, side: 'blue' }
                ],
            }

            if (side.blue?.match && side.red?.match) {
                match.gap = side.blue.match.gap + side.red.match.gap
            }

            if (side.red !== undefined) {
                match.parties.push({
                    ...side.red,
                    side: 'red',
                })
            }
    
            matches.push(match)
        })
    }

    if (roundId === 2) {
        console.log('matches', roundId, matches)
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
    /** @type {Chunk[]} */
    let chunks = []
    let half = parties.length

    if (roundId > 1) {
        /**
         * @type {MatchSided[]}
         */
        const returns = []
        let side = {}

        for (const party of parties) {
            side[party.side] = party
            
            if (party.side === 'blue') {
                continue
            }

            returns.push(side)
            side = {}
        }

        // // console.log('ret', roundId, chunks, returns)
        return returns
    }

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

    /**
     * @type {MatchSided[]}
     */
    // const returns = []
    const returns = chunks.reduce((chunks, chunk, n) => {
        if (chunk.blue.length > 1) {
            chunks.push({
                blue: chunk.blue.splice(0, 1)[0],
                red: undefined,
            })
        }

        if (chunk.red.length === 0 && (chunks.length > 0 && chunks.at(-1).red === undefined)) {
            chunks.at(-1).red = chunk.blue[0]
            return chunks
        }

        chunks.push({
            blue: chunk.blue[0],
            red: chunk.red[0],
        })

        return chunks
    }, [])

    if (roundId === 1) {
        // console.log('ret', returns)
    }

    return returns
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
        if (roundId > 1) break

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