export const BETTING_SLIP_STATUS = {
  PENDING: 'pending',
  PLACED: 'placed',
  WON: 'won',
  LOST: 'lost',
  VOID: 'void',
} as const;

export const SELECTION_STATUS = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
  VOID: 'void',
  PUSH: 'push',
} as const;

export const VALUE_RATING = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  F: 'F',
} as const;

export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const RISK_APPETITE = {
  CONSERVATIVE: 'conservative',
  BALANCED: 'balanced',
  AGGRESSIVE: 'aggressive',
} as const;

export const MARKET_TYPE = {
  MONEYLINE: 'moneyline',
  SPREAD: 'spread',
  TOTAL: 'total',
  PLAYER_PROP: 'player_prop',
} as const;

export const GAME_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
} as const;

export const RECOMMENDATION_TYPE = {
  CONSERVATIVE: 'conservative',
  BALANCED: 'balanced',
  AGGRESSIVE: 'aggressive',
} as const;

export type BettingSlipStatus = typeof BETTING_SLIP_STATUS[keyof typeof BETTING_SLIP_STATUS];
export type SelectionStatus = typeof SELECTION_STATUS[keyof typeof SELECTION_STATUS];
export type ValueRating = typeof VALUE_RATING[keyof typeof VALUE_RATING];
export type RiskLevel = typeof RISK_LEVEL[keyof typeof RISK_LEVEL];
export type RiskAppetite = typeof RISK_APPETITE[keyof typeof RISK_APPETITE];
export type MarketType = typeof MARKET_TYPE[keyof typeof MARKET_TYPE];
export type GameStatus = typeof GAME_STATUS[keyof typeof GAME_STATUS];
export type RecommendationType = typeof RECOMMENDATION_TYPE[keyof typeof RECOMMENDATION_TYPE];
