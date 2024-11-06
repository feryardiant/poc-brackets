/**
 * @typedef {Object} Participant
 * @property {String} name
 * 
 * @param {Number} count
 * @param {Boolean} unamed
 * @returns {Participant[]}
 */
function generateParties(count, unamed) {
    const participants = []

    for (let i = 1; i <= count; i++) {
        participants.push({
            name: `Participant ${i}`
        })
    }

    return participants
}

/**
 * @typedef {Object} Round
 * @property {Number} id
 * @property {Match[]} matches
 * 
 * @param {number} totalParties
 * @returns {Round[]}
 */
function generateRounds(totalParties) {
    const rounds = []
    let parties = generateParties(totalParties)
    let shouldNext = true
    let r = 0
    
    while (shouldNext) {
        /** @type {Round} round */
        const round = { id: r + 1 }
        const prevRound = r >= 1 ? rounds[r - 1] : null

        round.matches = prevRound === null 
            ? createMatches(parties, round.id)
            : configureNextMatches(prevRound, round.id, (parties) => {
                rounds[round.id] = { id: round.id + 1, matches: [], parties: parties }
                shouldNext = false
            })

        rounds[r] = round
        r++
    }

    const out = normalizeRounds(rounds)
    console.log(out)

    return out
}

function normalizeRounds(rounds) {
    const byId = (a, b) => a.id - b.id
    const addRound = (next) => {
        rounds[next] = {
            id: next + 1,
            matches: [],
            parties: []
        }
    }

    rounds = rounds.reduce((rounds, round, r) => {
        if (r === 0) return rounds

        round.matches.forEach(normalizeMatches(round, rounds, addRound))
        round.matches.sort(byId)
        round.parties = []

        rounds[r] = round

        return rounds
    }, rounds)

    return rounds.map((round, r) => {
        if (!round.parties || round.parties.length === 0) return round

        const parties = round.parties.sort((a, b) => a.matchId - b.matchId)
        round.matches = createMatches(parties, round.id, (num) => {
            return num + rounds.at(-2).matches.at(-1).id
        })

        round.matches.forEach(normalizeMatches(round, rounds, addRound))
        round.matches.sort(byId)

        round.parties = []

        return round
    })
}

function normalizeMatches(round, rounds, addRound) {
    return (match, m) => {
        if (rounds[match.next] === undefined) {
            addRound(match.next)
        }

        if (rounds[match.next].parties) {
            rounds[match.next].parties.push({
                matchId: match.id,
                side: match.side,
                name: `Winner match ${match.id}`
            })
        }

        if (
            [match.round, match.parties[0].round].includes(undefined) ||
            match.round === match.parties[0].round
        ) return

        match.round = match.parties[0].round
        match.gap = 1
        match.side = 'red'
        match.next += 1

        rounds[match.round]?.matches.unshift(match)

        round.matches.splice(m, 1)
        round.matches[m] && (round.matches[m].gap = 1)
    }
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
    let parties = []
    let matchId = 1

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
                gap: 0,
                next: roundId,
                parties
            })
            
            parties = []
            matchId++
        }

        return matches
    }, [])

    createChunks(matches).forEach((chunk) => {
        for (const [side, chunks] of Object.entries(chunk)) {
            chunks.forEach((match, c) => {
                const i = matches.findIndex((m) => m.id === match.id)
    
                matches[i].round = roundId - 1
                matches[i].side = side
                matches[i].prevs = []
                
                if (chunks.length > 1 && c > 0) {
                    // matches[i - 1].next = matches[i].next * chunks.length
                    matches[i - 1].next += 1
                }
            })
        }
    })

    return matches
}

/**
 * @typedef {Object} Party
 * @property {Number} round
 * 
 * @param {?Round} prevRound
 * @param {Number} roundId
 * @param {(parties: Party[]) => void} nextFn
 * @returns {Match[]}
 */
function configureNextMatches(prevRound, roundId, nextFn = () => {}) {
    const prevMatches = prevRound?.matches || []
    /** @type {Party[]} parties */
    const parties = []
    let prevSide = null

    for (const match of prevMatches) {
        let round = match.next

        if (prevSide === match.side) {
            parties.push({
                round: round + 1,
                matchId: null,
                side: 'red',
                name: '...'
            })
        }

        parties.push({
            round,
            matchId: match.id,
            side: match.side,
            name: `Winner match ${match.id}`
        })

        prevSide = match.side
    }

    const nextParties = parties.filter(party => party.round === roundId)

    if (nextParties.length > 0) {
        nextFn(nextParties)
    }

    return createMatches(parties, roundId, (num) => {
        return num + prevMatches[prevMatches.length - 1].id
    })
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
 * @param {Number} totalParties
 */
export function init(totalParties) {
    const rounds = generateRounds(totalParties)
    const matchGap = 30
    
    const $chart = document.getElementById('chart')

    $chart.style.setProperty('--participants', `${totalParties}`)

    for (const roundId in rounds) {
        const round = rounds[roundId]

        const $section = document.createElement('section')
        const $title = document.createElement('h3')
        const $matches = document.createElement('div')

        $section.id = `round-${roundId}`
        $title.innerText = `Round ${roundId}`
        $section.classList.add('rounds')
        $matches.classList.add('matches')
        $matches.style.setProperty('--gap', `${matchGap}px`)

        $section.append($title)

        for (const match of round.matches) {
            if (!match) continue

            const $match = document.createElement('div')
            const $matchTitle = document.createElement('h4')

            $match.setAttribute('data-match', match.id)
            $match.setAttribute('data-round', roundId)
            $match.setAttribute('data-side', match.side)
            $match.setAttribute('data-span', match.gap)
            $match.style.setProperty('--next-round', match.next)
            $match.style.setProperty('--curr-round', roundId)
            $match.style.setProperty('--span', match.gap)
            $match.classList.add('match')

            if (roundId > 0) {
                $match.classList.add('has-prev')
                
                if (roundId == (rounds.length - 1)) {
                    $match.classList.add('final-round')
                }
            }

            $matchTitle.innerText = match.id

            $match.append($matchTitle)

            for (const party of match.parties) {
                const $participant = document.createElement('div')
                const $name = document.createElement('label')
                const $check = document.createElement('input')

                $check.type = 'checkbox'
                $check.name = $check.id = [
                    roundId,
                    party.name.toLowerCase().replace(' ', '-')
                ].join('-')

                $name.setAttribute('for', $check.id)
                $name.innerText = party.name
                $participant.setAttribute('data-side', party.side)
                $participant.append($name, $check)

                $match.append($participant)
            }

            $matches.append($match)
        }
        
        $section.append($matches)
        $chart.append($section)
    }

    const $genMatches = document.getElementsByClassName('match')
    
    for (const $genMatch of $genMatches) {
        let matchRound = Number($genMatch.getAttribute('data-round'))
        let matchSpan = Number($genMatch.getAttribute('data-span'))
        
        if (matchRound > 1) {
            matchRound *= matchRound
            matchRound -= 1
        }

        const boxHeight = $genMatch.getBoundingClientRect().height
        const gap = (matchGap * matchRound) - matchRound
        const boxMargin = ((boxHeight * matchRound) + gap) / 2
        
        $genMatch.style.setProperty('--margin', `${Math.round(boxMargin)}px`)
        
        // console.log(matchRound)
    }
}