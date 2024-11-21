export type Side = 'blue' | 'red'

export interface MatchToPartyFn {
  (match: Match, n: number): Party
}

export interface Party {
  name: string
  round: number
  side: Side
  match?: Match
  order?: number
  continent?: string
}

export interface Match {
  id: number
  round: number
  singular: boolean
  parties: Party[]
  next: MatchNext
  gap: number
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
