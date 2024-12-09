export type { Match, MatchNext } from './matches'
export type { MatchSided, Party } from './parties'
export type { Round } from './rounds'

export type Side = 'blue' | 'red'

export interface MatchPrev {
  id: number
  round: number
  size: number
  span: number
  index: number
}

declare global {
  interface GlobalEventHandlersEventMap {
    'assign-winner': CustomEvent<Party>
    'knockoff': CustomEvent<null>
  }
}
