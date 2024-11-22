export type Side = 'blue' | 'red'

export interface MatchToPartyFn {
  (match: Match, n: number): Party
}

export interface Party {
  name: string
  round: number
  side: Side
  match?: MatchPrev
  order?: number
  continent?: string
}

interface BaseMatch {
  id: number
  round: number
  singular: boolean
  next: MatchNext
  gap: number
}

export interface Match extends BaseMatch {
  parties: Party[]
}

export interface MatchPrev extends BaseMatch {
  index: number
}

export interface MatchNext {
  round: number
  gap: number
  side: Side
}

export interface Round {
  id: number
  matches: Match[]
  parties: Party[]
}
