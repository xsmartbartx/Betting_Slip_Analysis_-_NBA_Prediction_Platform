-- Initial Database Schema Migration
-- Betting Slip Analysis & NBA Prediction Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Core User Tables
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bankroll DECIMAL(12, 2) DEFAULT 0.00,
    risk_appetite VARCHAR(20) DEFAULT 'balanced',
    preferred_odds_range_min DECIMAL(4, 2),
    preferred_odds_range_max DECIMAL(4, 2),
    max_correlation_threshold DECIMAL(3, 2) DEFAULT 0.50,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_sports TEXT[] DEFAULT ARRAY['NBA'],
    notification_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    dashboard_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE user_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_bets INTEGER DEFAULT 0,
    winning_bets INTEGER DEFAULT 0,
    total_staked DECIMAL(12, 2) DEFAULT 0.00,
    total_returned DECIMAL(12, 2) DEFAULT 0.00,
    roi DECIMAL(5, 2) DEFAULT 0.00,
    hit_rate DECIMAL(5, 2) DEFAULT 0.00,
    average_odds DECIMAL(4, 2),
    profit_loss DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX idx_user_performance_user_id ON user_performance(user_id);
CREATE INDEX idx_user_performance_period ON user_performance(period_start, period_end);

-- ============================================
-- NBA Game & Team Tables
-- ============================================

CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    sport VARCHAR(50) NOT NULL,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    external_id VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    conference VARCHAR(50),
    division VARCHAR(50),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, abbreviation)
);

CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(20),
    height_inches INTEGER,
    weight_lbs INTEGER,
    jersey_number INTEGER,
    birth_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_name ON players(last_name, first_name);
CREATE INDEX idx_players_external_id ON players(external_id);

CREATE TABLE team_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, player_id, season)
);

CREATE INDEX idx_rosters_team_id ON team_rosters(team_id);
CREATE INDEX idx_rosters_player_id ON team_rosters(player_id);
CREATE INDEX idx_rosters_season ON team_rosters(season);

CREATE TABLE referees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    average_pace_factor DECIMAL(4, 2),
    average_foul_rate DECIMAL(4, 2),
    games_officiated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referees_name ON referees(last_name, first_name);

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    external_id VARCHAR(100),
    season VARCHAR(20) NOT NULL,
    game_date DATE NOT NULL,
    game_time TIMESTAMP WITH TIME ZONE,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    status VARCHAR(20) DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    venue VARCHAR(255),
    attendance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, external_id)
);

CREATE INDEX idx_games_league_id ON games(league_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX idx_games_status ON games(status);

CREATE TABLE game_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    home_rest_days INTEGER,
    away_rest_days INTEGER,
    home_travel_distance_miles DECIMAL(8, 2),
    away_travel_distance_miles DECIMAL(8, 2),
    home_back_to_back BOOLEAN DEFAULT false,
    away_back_to_back BOOLEAN DEFAULT false,
    rest_advantage DECIMAL(5, 2),
    injury_differential DECIMAL(5, 2),
    travel_fatigue_score DECIMAL(5, 2),
    motivation_index DECIMAL(5, 2),
    referee_id UUID REFERENCES referees(id),
    referee_pace_factor DECIMAL(4, 2),
    referee_foul_factor DECIMAL(4, 2),
    context_score DECIMAL(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id)
);

CREATE INDEX idx_game_context_game_id ON game_context(game_id);

CREATE TABLE injury_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    injury_type VARCHAR(100),
    severity VARCHAR(20),
    impact_score DECIMAL(4, 2),
    reported_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_injuries_game_id ON injury_reports(game_id);
CREATE INDEX idx_injuries_player_id ON injury_reports(player_id);
CREATE INDEX idx_injuries_team_id ON injury_reports(team_id);

-- ============================================
-- Statistics Tables
-- ============================================

CREATE TABLE team_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'season',
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    points_per_game DECIMAL(5, 2),
    points_allowed_per_game DECIMAL(5, 2),
    offensive_rating DECIMAL(6, 2),
    defensive_rating DECIMAL(6, 2),
    pace DECIMAL(5, 2),
    true_shooting_percentage DECIMAL(5, 2),
    rebound_rate DECIMAL(5, 2),
    assist_rate DECIMAL(5, 2),
    turnover_rate DECIMAL(5, 2),
    free_throw_rate DECIMAL(5, 2),
    three_point_rate DECIMAL(5, 2),
    effective_field_goal_percentage DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, season, period_type)
);

CREATE INDEX idx_team_stats_team_season ON team_statistics(team_id, season);

CREATE TABLE player_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    season VARCHAR(20) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'season',
    games_played INTEGER DEFAULT 0,
    minutes_per_game DECIMAL(4, 1),
    points_per_game DECIMAL(5, 2),
    rebounds_per_game DECIMAL(4, 2),
    assists_per_game DECIMAL(4, 2),
    usage_rate DECIMAL(5, 2),
    true_shooting_percentage DECIMAL(5, 2),
    player_efficiency_rating DECIMAL(5, 2),
    win_shares DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, team_id, season, period_type)
);

CREATE INDEX idx_player_stats_player_season ON player_statistics(player_id, season);
CREATE INDEX idx_player_stats_team_season ON player_statistics(team_id, season);

CREATE TABLE game_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    is_home BOOLEAN NOT NULL,
    points INTEGER,
    field_goals_made INTEGER,
    field_goals_attempted INTEGER,
    three_pointers_made INTEGER,
    three_pointers_attempted INTEGER,
    free_throws_made INTEGER,
    free_throws_attempted INTEGER,
    rebounds INTEGER,
    assists INTEGER,
    steals INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    fouls INTEGER,
    offensive_rating DECIMAL(6, 2),
    defensive_rating DECIMAL(6, 2),
    pace DECIMAL(5, 2),
    true_shooting_percentage DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, team_id)
);

CREATE INDEX idx_game_stats_game_id ON game_statistics(game_id);
CREATE INDEX idx_game_stats_team_id ON game_statistics(team_id);

CREATE TABLE player_game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    minutes_played INTEGER,
    points INTEGER,
    rebounds INTEGER,
    assists INTEGER,
    steals INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    fouls INTEGER,
    field_goals_made INTEGER,
    field_goals_attempted INTEGER,
    three_pointers_made INTEGER,
    three_pointers_attempted INTEGER,
    free_throws_made INTEGER,
    free_throws_attempted INTEGER,
    plus_minus INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_id)
);

CREATE INDEX idx_player_game_stats_game_id ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player_id ON player_game_stats(player_id);

-- ============================================
-- Odds & Markets Tables
-- ============================================

CREATE TABLE bookmakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    market_type VARCHAR(50) NOT NULL,
    market_name VARCHAR(255) NOT NULL,
    selection VARCHAR(255) NOT NULL,
    player_id UUID REFERENCES players(id),
    line_value DECIMAL(6, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_markets_game_id ON game_markets(game_id);
CREATE INDEX idx_markets_type ON game_markets(market_type);
CREATE INDEX idx_markets_player_id ON game_markets(player_id);

CREATE TABLE odds_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_market_id UUID NOT NULL REFERENCES game_markets(id) ON DELETE CASCADE,
    bookmaker_id UUID REFERENCES bookmakers(id),
    odds DECIMAL(6, 2) NOT NULL,
    implied_probability DECIMAL(5, 2),
    line_value DECIMAL(6, 2),
    is_closing_line BOOLEAN DEFAULT false,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_odds_history_market_id ON odds_history(game_market_id);
CREATE INDEX idx_odds_history_recorded_at ON odds_history(recorded_at);
CREATE INDEX idx_odds_history_closing_line ON odds_history(is_closing_line) WHERE is_closing_line = true;

-- ============================================
-- Betting Slip Tables
-- ============================================

CREATE TABLE betting_slips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slip_type VARCHAR(20) NOT NULL,
    source VARCHAR(50),
    total_stake DECIMAL(10, 2) NOT NULL,
    potential_payout DECIMAL(12, 2),
    combined_odds DECIMAL(8, 2),
    status VARCHAR(20) DEFAULT 'pending',
    value_rating VARCHAR(1),
    risk_level VARCHAR(20),
    composite_quality_score DECIMAL(5, 2),
    correlation_score DECIMAL(3, 2),
    expected_value DECIMAL(8, 2),
    confidence_interval_lower DECIMAL(5, 2),
    confidence_interval_upper DECIMAL(5, 2),
    analysis_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    placed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_betting_slips_user_id ON betting_slips(user_id);
CREATE INDEX idx_betting_slips_status ON betting_slips(status);
CREATE INDEX idx_betting_slips_created_at ON betting_slips(created_at);

CREATE TABLE betting_slip_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    betting_slip_id UUID NOT NULL REFERENCES betting_slips(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    market_type VARCHAR(50) NOT NULL,
    market_name VARCHAR(255) NOT NULL,
    selection VARCHAR(255) NOT NULL,
    odds DECIMAL(6, 2) NOT NULL,
    stake DECIMAL(10, 2) NOT NULL,
    potential_payout DECIMAL(10, 2),
    model_probability DECIMAL(5, 2),
    implied_probability DECIMAL(5, 2),
    expected_value DECIMAL(8, 2),
    value_rating VARCHAR(1),
    risk_level VARCHAR(20),
    confidence_interval_lower DECIMAL(5, 2),
    confidence_interval_upper DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'pending',
    result_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_selections_slip_id ON betting_slip_selections(betting_slip_id);
CREATE INDEX idx_selections_game_id ON betting_slip_selections(game_id);
CREATE INDEX idx_selections_status ON betting_slip_selections(status);

-- ============================================
-- AI & Recommendations Tables
-- ============================================

CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL,
    game_id UUID REFERENCES games(id),
    market_type VARCHAR(50) NOT NULL,
    market_name VARCHAR(255) NOT NULL,
    selection VARCHAR(255) NOT NULL,
    recommended_odds_min DECIMAL(6, 2),
    recommended_odds_max DECIMAL(6, 2),
    model_probability DECIMAL(5, 2) NOT NULL,
    expected_value DECIMAL(8, 2),
    kelly_fraction DECIMAL(4, 2),
    confidence_score DECIMAL(5, 2),
    risk_level VARCHAR(20),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_game_id ON recommendations(game_id);
CREATE INDEX idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX idx_recommendations_generated_at ON recommendations(generated_at);

CREATE TABLE recommendation_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    explanation_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_points JSONB,
    importance_score DECIMAL(4, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_explanations_recommendation_id ON recommendation_explanations(recommendation_id);

CREATE TABLE model_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    predicted_value DECIMAL(8, 2),
    probability DECIMAL(5, 2),
    confidence_interval_lower DECIMAL(8, 2),
    confidence_interval_upper DECIMAL(8, 2),
    feature_importance JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, model_version, prediction_type)
);

CREATE INDEX idx_predictions_game_id ON model_predictions(game_id);
CREATE INDEX idx_predictions_model_version ON model_predictions(model_version);

-- ============================================
-- Feature Engineering Tables
-- ============================================

CREATE TABLE game_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    adjusted_pace_index DECIMAL(6, 2),
    true_offensive_efficiency_home DECIMAL(6, 2),
    true_offensive_efficiency_away DECIMAL(6, 2),
    defensive_mismatch_score DECIMAL(6, 2),
    player_absence_impact_home DECIMAL(5, 2),
    player_absence_impact_away DECIMAL(5, 2),
    lineup_continuity_home DECIMAL(5, 2),
    lineup_continuity_away DECIMAL(5, 2),
    home_away_split_advantage DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id)
);

CREATE INDEX idx_game_features_game_id ON game_features(game_id);

-- ============================================
-- Audit & Logging Tables
-- ============================================

CREATE TABLE data_ingestion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingestion_logs_source ON data_ingestion_logs(source);
CREATE INDEX idx_ingestion_logs_created_at ON data_ingestion_logs(created_at);

CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at);
