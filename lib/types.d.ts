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
  singular: boolean
  size: number
  span: number
}

export interface Match extends BaseMatch {
  bye: boolean
  parties: Party[]
  hidden: boolean
}

export interface MatchPrev extends BaseMatch {
  index: number
}

export interface MatchNext {
  round: number
  side: Side
  span: number
}

export interface MatchSided {
  blue: Party
  red: Party
}

export interface Round {
  id: number
  matches: Match[]
  parties: Party[]
}
