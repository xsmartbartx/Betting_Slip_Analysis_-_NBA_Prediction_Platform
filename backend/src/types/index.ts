import {
  BettingSlipStatus,
  SelectionStatus,
  ValueRating,
  RiskLevel,
  RiskAppetite,
  MarketType,
  GameStatus,
  RecommendationType,
} from '../config/constants';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  bankroll: number;
  risk_appetite: RiskAppetite;
  preferred_odds_range_min?: number;
  preferred_odds_range_max?: number;
  max_correlation_threshold: number;
  timezone: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_sports: string[];
  notification_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BettingSlip {
  id: string;
  user_id: string;
  slip_type: 'user_created' | 'ai_generated' | 'analyzed';
  source?: string;
  total_stake: number;
  potential_payout?: number;
  combined_odds?: number;
  status: BettingSlipStatus;
  value_rating?: ValueRating;
  risk_level?: RiskLevel;
  composite_quality_score?: number;
  correlation_score?: number;
  expected_value?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  analysis_metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  placed_at?: Date;
  resolved_at?: Date;
}

export interface BettingSlipSelection {
  id: string;
  betting_slip_id: string;
  game_id?: string;
  market_type: MarketType;
  market_name: string;
  selection: string;
  odds: number;
  stake: number;
  potential_payout?: number;
  model_probability?: number;
  implied_probability?: number;
  expected_value?: number;
  value_rating?: ValueRating;
  risk_level?: RiskLevel;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  status: SelectionStatus;
  result_metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Game {
  id: string;
  league_id: string;
  external_id?: string;
  season: string;
  game_date: Date;
  game_time?: Date;
  home_team_id: string;
  away_team_id: string;
  status: GameStatus;
  home_score?: number;
  away_score?: number;
  venue?: string;
  attendance?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Team {
  id: string;
  league_id: string;
  external_id?: string;
  name: string;
  abbreviation: string;
  city?: string;
  conference?: string;
  division?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Player {
  id: string;
  external_id?: string;
  first_name: string;
  last_name: string;
  position?: string;
  height_inches?: number;
  weight_lbs?: number;
  jersey_number?: number;
  birth_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
