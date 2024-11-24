export type Side = 'blue' | 'red'

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
  next: MatchNext
  size: number
  span: number
}

export interface Match extends BaseMatch {
  singular: boolean
  parties: Party[]
}

export interface MatchPrev extends BaseMatch {
  index: number
}

export interface MatchNext {
  round: number
  side: Side
  span: number
}

export interface Round {
  id: number
  matches: Match[]
  parties: Party[]
}
