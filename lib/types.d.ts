export type { Match, MatchNext } from './matches'
export type { MatchSided, Party } from './parties'
export type { Round } from './rounds'

export type Side = 'blue' | 'red'

interface BaseMatch {
  id: number
  round: number
  next: MatchNext
  singular: boolean
  size: number
  span: number
}

export interface MatchPrev extends BaseMatch {
  index: number
}
