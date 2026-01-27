# Technical Context: Database Schema & Application Structure

This document provides the complete database schema and optimal folder structure for the Betting Slip Analysis & NBA Prediction Platform.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Folder Structure](#folder-structure)
3. [Technology Stack Recommendations](#technology-stack-recommendations)

---

## Database Schema

### Schema Overview

The database is designed to support:
- User management and authentication
- Betting slip storage and analysis
- NBA game and team data
- Historical statistics and performance metrics
- Odds tracking and market analysis
- AI recommendations and explanations
- Contextual factors (injuries, rest, travel)

### Entity Relationship Diagram (Conceptual)

```
Users ──┬──> BettingSlips ──> BettingSlipSelections ──> GameMarkets
        │
        ├──> UserPreferences
        ├──> UserPerformance
        └──> Recommendations

Games ──┬──> GameMarkets ──> OddsHistory
        ├──> GameStatistics
        ├──> GameContext
        └──> PlayerGameStats

Teams ──┬──> TeamStatistics
        ├──> TeamRosters ──> Players
        └──> InjuryReports

Players ──> PlayerStatistics

Recommendations ──> RecommendationExplanations
```

---

## Database Tables

### Core User Tables

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bankroll DECIMAL(12, 2) DEFAULT 0.00,
    risk_appetite VARCHAR(20) DEFAULT 'balanced', -- 'conservative', 'balanced', 'aggressive'
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
```

#### `user_preferences`
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_sports TEXT[] DEFAULT ARRAY['NBA'],
    notification_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    dashboard_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

#### `user_performance`
```sql
CREATE TABLE user_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_bets INTEGER DEFAULT 0,
    winning_bets INTEGER DEFAULT 0,
    total_staked DECIMAL(12, 2) DEFAULT 0.00,
    total_returned DECIMAL(12, 2) DEFAULT 0.00,
    roi DECIMAL(5, 2) DEFAULT 0.00, -- Return on Investment percentage
    hit_rate DECIMAL(5, 2) DEFAULT 0.00, -- Win percentage
    average_odds DECIMAL(4, 2),
    profit_loss DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX idx_user_performance_user_id ON user_performance(user_id);
CREATE INDEX idx_user_performance_period ON user_performance(period_start, period_end);
```

---

### Betting Slip Tables

#### `betting_slips`
```sql
CREATE TABLE betting_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slip_type VARCHAR(20) NOT NULL, -- 'user_created', 'ai_generated', 'analyzed'
    source VARCHAR(50), -- 'manual', 'pasted', 'api', 'ai_recommendation'
    total_stake DECIMAL(10, 2) NOT NULL,
    potential_payout DECIMAL(12, 2),
    combined_odds DECIMAL(8, 2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'placed', 'won', 'lost', 'void'
    value_rating VARCHAR(1), -- 'A', 'B', 'C', 'D', 'F'
    risk_level VARCHAR(20), -- 'low', 'medium', 'high'
    composite_quality_score DECIMAL(5, 2), -- 0-100
    correlation_score DECIMAL(3, 2), -- 0-1
    expected_value DECIMAL(8, 2),
    confidence_interval_lower DECIMAL(5, 2),
    confidence_interval_upper DECIMAL(5, 2),
    analysis_metadata JSONB, -- Additional analysis data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    placed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_betting_slips_user_id ON betting_slips(user_id);
CREATE INDEX idx_betting_slips_status ON betting_slips(status);
CREATE INDEX idx_betting_slips_created_at ON betting_slips(created_at);
```

#### `betting_slip_selections`
```sql
CREATE TABLE betting_slip_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    betting_slip_id UUID NOT NULL REFERENCES betting_slips(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    market_type VARCHAR(50) NOT NULL, -- 'moneyline', 'spread', 'total', 'player_prop'
    market_name VARCHAR(255) NOT NULL, -- e.g., 'Over 221.5', 'LAL -5.5'
    selection VARCHAR(255) NOT NULL, -- e.g., 'Over', 'LAL', 'LeBron James Over 25.5 Points'
    odds DECIMAL(6, 2) NOT NULL,
    stake DECIMAL(10, 2) NOT NULL,
    potential_payout DECIMAL(10, 2),
    model_probability DECIMAL(5, 2), -- Our model's probability (0-100)
    implied_probability DECIMAL(5, 2), -- Probability from odds
    expected_value DECIMAL(8, 2),
    value_rating VARCHAR(1), -- 'A', 'B', 'C', 'D', 'F'
    risk_level VARCHAR(20), -- 'low', 'medium', 'high'
    confidence_interval_lower DECIMAL(5, 2),
    confidence_interval_upper DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'won', 'lost', 'void', 'push'
    result_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_selections_slip_id ON betting_slip_selections(betting_slip_id);
CREATE INDEX idx_selections_game_id ON betting_slip_selections(game_id);
CREATE INDEX idx_selections_status ON betting_slip_selections(status);
```

---

### NBA Game & Team Tables

#### `leagues`
```sql
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 'NBA', 'EuroLeague', etc.
    sport VARCHAR(50) NOT NULL, -- 'basketball', 'football', etc.
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `teams`
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    external_id VARCHAR(100), -- ID from data provider
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL, -- 'LAL', 'BOS', etc.
    city VARCHAR(100),
    conference VARCHAR(50), -- 'Eastern', 'Western' for NBA
    division VARCHAR(50),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, abbreviation)
);

CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);
```

#### `players`
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100), -- ID from data provider
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(20), -- 'PG', 'SG', 'SF', 'PF', 'C'
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
```

#### `team_rosters`
```sql
CREATE TABLE team_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL, -- '2023-24'
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, player_id, season)
);

CREATE INDEX idx_rosters_team_id ON team_rosters(team_id);
CREATE INDEX idx_rosters_player_id ON team_rosters(player_id);
CREATE INDEX idx_rosters_season ON team_rosters(season);
```

#### `games`
```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    external_id VARCHAR(100), -- ID from data provider
    season VARCHAR(20) NOT NULL, -- '2023-24'
    game_date DATE NOT NULL,
    game_time TIMESTAMP WITH TIME ZONE,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished', 'postponed', 'cancelled'
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
```

#### `game_context`
```sql
CREATE TABLE game_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    home_rest_days INTEGER,
    away_rest_days INTEGER,
    home_travel_distance_miles DECIMAL(8, 2),
    away_travel_distance_miles DECIMAL(8, 2),
    home_back_to_back BOOLEAN DEFAULT false,
    away_back_to_back BOOLEAN DEFAULT false,
    rest_advantage DECIMAL(5, 2), -- Positive = home advantage, negative = away advantage
    injury_differential DECIMAL(5, 2), -- Impact score difference
    travel_fatigue_score DECIMAL(5, 2),
    motivation_index DECIMAL(5, 2), -- Playoff race, tanking signals
    referee_id UUID REFERENCES referees(id),
    referee_pace_factor DECIMAL(4, 2),
    referee_foul_factor DECIMAL(4, 2),
    context_score DECIMAL(6, 2), -- Composite context score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id)
);

CREATE INDEX idx_game_context_game_id ON game_context(game_id);
```

#### `injury_reports`
```sql
CREATE TABLE injury_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    injury_type VARCHAR(100),
    severity VARCHAR(20), -- 'questionable', 'doubtful', 'out', 'probable'
    impact_score DECIMAL(4, 2), -- 0-10, impact on team performance
    reported_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_injuries_game_id ON injury_reports(game_id);
CREATE INDEX idx_injuries_player_id ON injury_reports(player_id);
CREATE INDEX idx_injuries_team_id ON injury_reports(team_id);
```

#### `referees`
```sql
CREATE TABLE referees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    average_pace_factor DECIMAL(4, 2), -- Relative to league average
    average_foul_rate DECIMAL(4, 2),
    games_officiated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referees_name ON referees(last_name, first_name);
```

---

### Statistics Tables

#### `team_statistics`
```sql
CREATE TABLE team_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'season', -- 'season', 'last_10', 'last_5', 'home', 'away'
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    points_per_game DECIMAL(5, 2),
    points_allowed_per_game DECIMAL(5, 2),
    offensive_rating DECIMAL(6, 2),
    defensive_rating DECIMAL(6, 2),
    pace DECIMAL(5, 2), -- Possessions per game
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
```

#### `player_statistics`
```sql
CREATE TABLE player_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

#### `game_statistics`
```sql
CREATE TABLE game_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

#### `player_game_stats`
```sql
CREATE TABLE player_game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

---

### Odds & Markets Tables

#### `bookmakers`
```sql
CREATE TABLE bookmakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `game_markets`
```sql
CREATE TABLE game_markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    market_type VARCHAR(50) NOT NULL, -- 'moneyline', 'spread', 'total', 'player_prop'
    market_name VARCHAR(255) NOT NULL, -- e.g., 'Over 221.5', 'LAL -5.5'
    selection VARCHAR(255) NOT NULL, -- e.g., 'Over', 'LAL'
    player_id UUID REFERENCES players(id), -- For player props
    line_value DECIMAL(6, 2), -- For spreads and totals
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_markets_game_id ON game_markets(game_id);
CREATE INDEX idx_markets_type ON game_markets(market_type);
CREATE INDEX idx_markets_player_id ON game_markets(player_id);
```

#### `odds_history`
```sql
CREATE TABLE odds_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_market_id UUID NOT NULL REFERENCES game_markets(id) ON DELETE CASCADE,
    bookmaker_id UUID REFERENCES bookmakers(id),
    odds DECIMAL(6, 2) NOT NULL,
    implied_probability DECIMAL(5, 2),
    line_value DECIMAL(6, 2), -- For spreads/totals that can move
    is_closing_line BOOLEAN DEFAULT false,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_odds_history_market_id ON odds_history(game_market_id);
CREATE INDEX idx_odds_history_recorded_at ON odds_history(recorded_at);
CREATE INDEX idx_odds_history_closing_line ON odds_history(is_closing_line) WHERE is_closing_line = true;
```

---

### AI & Recommendations Tables

#### `recommendations`
```sql
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'conservative', 'balanced', 'aggressive'
    game_id UUID REFERENCES games(id),
    market_type VARCHAR(50) NOT NULL,
    market_name VARCHAR(255) NOT NULL,
    selection VARCHAR(255) NOT NULL,
    recommended_odds_min DECIMAL(6, 2),
    recommended_odds_max DECIMAL(6, 2),
    model_probability DECIMAL(5, 2) NOT NULL,
    expected_value DECIMAL(8, 2),
    kelly_fraction DECIMAL(4, 2), -- Recommended stake as % of bankroll
    confidence_score DECIMAL(5, 2), -- 0-100
    risk_level VARCHAR(20),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_game_id ON recommendations(game_id);
CREATE INDEX idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX idx_recommendations_generated_at ON recommendations(generated_at);
```

#### `recommendation_explanations`
```sql
CREATE TABLE recommendation_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    explanation_type VARCHAR(50) NOT NULL, -- 'statistical_driver', 'contextual_modifier', 'historical_analog'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_points JSONB, -- Supporting data
    importance_score DECIMAL(4, 2), -- 0-10
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_explanations_recommendation_id ON recommendation_explanations(recommendation_id);
```

#### `model_predictions`
```sql
CREATE TABLE model_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL, -- 'moneyline', 'spread', 'total', 'player_prop'
    predicted_value DECIMAL(8, 2), -- Predicted score, points, etc.
    probability DECIMAL(5, 2), -- Confidence in prediction
    confidence_interval_lower DECIMAL(8, 2),
    confidence_interval_upper DECIMAL(8, 2),
    feature_importance JSONB, -- Which features drove the prediction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, model_version, prediction_type)
);

CREATE INDEX idx_predictions_game_id ON model_predictions(game_id);
CREATE INDEX idx_predictions_model_version ON model_predictions(model_version);
```

---

### Feature Engineering Tables

#### `game_features`
```sql
CREATE TABLE game_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

---

### Audit & Logging Tables

#### `data_ingestion_logs`
```sql
CREATE TABLE data_ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- 'games', 'odds', 'injuries', 'stats'
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingestion_logs_source ON data_ingestion_logs(source);
CREATE INDEX idx_ingestion_logs_created_at ON data_ingestion_logs(created_at);
```

#### `user_activity_logs`
```sql
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'slip_created', 'recommendation_viewed', etc.
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at);
```

---

## Folder Structure

### Recommended Application Structure

```
betting-app/
├── README.md
├── SPECIFICATION.md
├── CONTEXT.md
├── LICENSE
├── .gitignore
├── .env.example
│
├── frontend/                          # Frontend application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/
│   │       ├── images/
│   │       └── icons/
│   │
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── common/
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Tooltip/
│   │   │   │   └── LoadingSpinner/
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── BankrollSummary/
│   │   │   │   ├── PerformanceChart/
│   │   │   │   ├── RiskIndicator/
│   │   │   │   └── StatsOverview/
│   │   │   │
│   │   │   ├── betting/
│   │   │   │   ├── BettingSlipInput/
│   │   │   │   ├── BettingSlipCard/
│   │   │   │   ├── SelectionCard/
│   │   │   │   ├── OddsInput/
│   │   │   │   └── MarketSelector/
│   │   │   │
│   │   │   ├── nba/
│   │   │   │   ├── GameCard/
│   │   │   │   ├── GameList/
│   │   │   │   ├── TeamSelector/
│   │   │   │   ├── MarketFilters/
│   │   │   │   └── PlayerPropSelector/
│   │   │   │
│   │   │   ├── analysis/
│   │   │   │   ├── ValueRating/
│   │   │   │   ├── RiskLevel/
│   │   │   │   ├── ConfidenceInterval/
│   │   │   │   ├── CorrelationMatrix/
│   │   │   │   └── ExpectedValueDisplay/
│   │   │   │
│   │   │   └── recommendations/
│   │   │       ├── RecommendationCard/
│   │   │       ├── RecommendationList/
│   │   │       ├── ExplanationPanel/
│   │   │       ├── StatisticalDriver/
│   │   │       └── HistoricalAnalog/
│   │   │
│   │   ├── pages/                     # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── BettingSlips/
│   │   │   │   ├── CreateSlip/
│   │   │   │   ├── AnalyzeSlip/
│   │   │   │   └── SlipHistory/
│   │   │   │
│   │   │   ├── NBA/
│   │   │   │   ├── Games/
│   │   │   │   ├── Teams/
│   │   │   │   ├── Players/
│   │   │   │   └── Markets/
│   │   │   │
│   │   │   ├── Recommendations/
│   │   │   │   ├── Generate/
│   │   │   │   ├── View/
│   │   │   │   └── History/
│   │   │   │
│   │   │   ├── Analytics/
│   │   │   │   ├── Performance/
│   │   │   │   ├── Trends/
│   │   │   │   └── Insights/
│   │   │   │
│   │   │   ├── Settings/
│   │   │   │   ├── Profile/
│   │   │   │   ├── Preferences/
│   │   │   │   └── RiskSettings/
│   │   │   │
│   │   │   ├── Auth/
│   │   │   │   ├── Login/
│   │   │   │   └── Register/
│   │   │   │
│   │   │   └── NotFound/
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useBettingSlips.ts
│   │   │   ├── useRecommendations.ts
│   │   │   ├── useGames.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useDebounce.ts
│   │   │
│   │   ├── services/                  # API service layer
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── bettingSlips.ts
│   │   │   │   ├── games.ts
│   │   │   │   ├── recommendations.ts
│   │   │   │   └── analytics.ts
│   │   │   │
│   │   │   └── websocket.ts
│   │   │
│   │   ├── store/                     # State management
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── bettingSlipSlice.ts
│   │   │   │   ├── gameSlice.ts
│   │   │   │   ├── recommendationSlice.ts
│   │   │   │   └── uiSlice.ts
│   │   │   │
│   │   │   └── store.ts
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── formatting.ts
│   │   │   ├── calculations.ts
│   │   │   ├── validation.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── types/                     # TypeScript type definitions
│   │   │   ├── user.ts
│   │   │   ├── betting.ts
│   │   │   ├── game.ts
│   │   │   ├── recommendation.ts
│   │   │   └── api.ts
│   │   │
│   │   ├── styles/                    # Global styles
│   │   │   ├── variables.css
│   │   │   ├── reset.css
│   │   │   └── theme.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── routes.tsx
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                 # or next.config.js, etc.
│   └── tailwind.config.js             # or other CSS framework config
│
├── backend/                           # Backend API
│   ├── src/
│   │   ├── config/                    # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── environment.ts
│   │   │   ├── logger.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── models/                    # Database models (ORM)
│   │   │   ├── User.ts
│   │   │   ├── BettingSlip.ts
│   │   │   ├── Game.ts
│   │   │   ├── Team.ts
│   │   │   ├── Player.ts
│   │   │   ├── Recommendation.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── schemas/                   # Validation schemas
│   │   │   ├── user.schema.ts
│   │   │   ├── bettingSlip.schema.ts
│   │   │   ├── game.schema.ts
│   │   │   └── recommendation.schema.ts
│   │   │
│   │   ├── controllers/               # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── bettingSlip.controller.ts
│   │   │   ├── game.controller.ts
│   │   │   ├── recommendation.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── user.controller.ts
│   │   │
│   │   ├── services/                  # Business logic
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── jwt.service.ts
│   │   │   │
│   │   │   ├── betting/
│   │   │   │   ├── bettingSlip.service.ts
│   │   │   │   ├── evaluation.service.ts
│   │   │   │   └── normalization.service.ts
│   │   │   │
│   │   │   ├── games/
│   │   │   │   ├── game.service.ts
│   │   │   │   ├── team.service.ts
│   │   │   │   └── player.service.ts
│   │   │   │
│   │   │   ├── recommendations/
│   │   │   │   ├── recommendation.service.ts
│   │   │   │   ├── optimization.service.ts
│   │   │   │   └── explanation.service.ts
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── performance.service.ts
│   │   │   │   └── statistics.service.ts
│   │   │   │
│   │   │   └── data/
│   │   │       ├── ingestion.service.ts
│   │   │       └── validation.service.ts
│   │   │
│   │   ├── middleware/                # Express/API middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   │
│   │   ├── routes/                    # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── bettingSlip.routes.ts
│   │   │   ├── game.routes.ts
│   │   │   ├── recommendation.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── errors.ts
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── types/                     # TypeScript types
│   │   │   ├── express.d.ts
│   │   │   └── index.ts
│   │   │
│   │   └── app.ts                     # Express app setup
│   │   └── server.ts                  # Server entry point
│   │
│   ├── migrations/                    # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_indexes.sql
│   │   └── ...
│   │
│   ├── seeds/                         # Database seed data
│   │   ├── leagues.seed.ts
│   │   ├── teams.seed.ts
│   │   └── ...
│   │
│   ├── tests/                         # Backend tests
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── utils/
│   │   │
│   │   ├── integration/
│   │   │   ├── api/
│   │   │   └── database/
│   │   │
│   │   └── fixtures/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── ml-engine/                         # Machine Learning & Analytics
│   ├── src/
│   │   ├── models/                    # ML models
│   │   │   ├── probability/
│   │   │   │   ├── game_outcome_model.py
│   │   │   │   ├── total_points_model.py
│   │   │   │   └── player_prop_model.py
│   │   │   │
│   │   │   ├── value/
│   │   │   │   └── expected_value_calculator.py
│   │   │   │
│   │   │   └── risk/
│   │   │       ├── correlation_analyzer.py
│   │   │       └── volatility_estimator.py
│   │   │
│   │   ├── feature_engineering/      # Feature extraction
│   │   │   ├── nba_features.py
│   │   │   ├── context_features.py
│   │   │   ├── pace_adjustment.py
│   │   │   └── efficiency_calculations.py
│   │   │
│   │   ├── optimization/              # Recommendation optimization
│   │   │   ├── kelly_criterion.py
│   │   │   ├── monte_carlo.py
│   │   │   ├── portfolio_optimizer.py
│   │   │   └── constraint_solver.py
│   │   │
│   │   ├── explainability/           # Model explanations
│   │   │   ├── feature_importance.py
│   │   │   ├── explanation_generator.py
│   │   │   └── analog_finder.py
│   │   │
│   │   ├── data_processing/          # Data pipeline
│   │   │   ├── ingestion/
│   │   │   │   ├── nba_api_client.py
│   │   │   │   ├── odds_api_client.py
│   │   │   │   └── injury_scraper.py
│   │   │   │
│   │   │   ├── cleaning/
│   │   │   │   ├── data_validator.py
│   │   │   │   └── outlier_detector.py
│   │   │   │
│   │   │   └── transformation/
│   │   │       ├── normalizer.py
│   │   │       └── aggregator.py
│   │   │
│   │   └── utils/
│   │       ├── database_connector.py
│   │       └── logger.py
│   │
│   ├── notebooks/                     # Jupyter notebooks for analysis
│   │   ├── exploratory_analysis.ipynb
│   │   ├── model_training.ipynb
│   │   └── feature_importance_analysis.ipynb
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/                              # Data storage (gitignored)
│   ├── raw/                           # Raw ingested data
│   ├── processed/                     # Processed/cleaned data
│   └── models/                        # Trained model artifacts
│
├── scripts/                           # Utility scripts
│   ├── setup.sh                       # Initial setup script
│   ├── migrate.sh                     # Database migration helper
│   ├── seed.sh                        # Database seeding
│   └── deploy.sh                      # Deployment script
│
├── docker/                            # Docker configurations
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── Dockerfile.ml-engine
│
├── docs/                              # Additional documentation
│   ├── api/                           # API documentation
│   │   └── endpoints.md
│   │
│   ├── deployment/                    # Deployment guides
│   │   └── production.md
│   │
│   └── development/                   # Development guides
│       └── setup.md
│
└── .github/                           # GitHub workflows
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

---

## Technology Stack Recommendations

### Frontend
- **Framework**: React with TypeScript (or Next.js for SSR)
- **State Management**: Redux Toolkit or Zustand
- **Styling**: Tailwind CSS or styled-components
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Routing**: React Router (or Next.js routing)

### Backend
- **Runtime**: Node.js with TypeScript (or Python with FastAPI)
- **Framework**: Express.js (or FastAPI)
- **ORM**: Prisma, TypeORM, or Sequelize (or SQLAlchemy for Python)
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Validation**: Zod or Joi
- **API Documentation**: Swagger/OpenAPI

### ML Engine
- **Language**: Python
- **ML Libraries**: scikit-learn, XGBoost, LightGBM
- **Deep Learning** (if needed): TensorFlow or PyTorch
- **Data Processing**: pandas, numpy
- **Feature Engineering**: Custom modules
- **Model Serving**: FastAPI or Flask

### Infrastructure
- **Database**: PostgreSQL (primary), Redis (caching)
- **Message Queue**: RabbitMQ or Redis (for async tasks)
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (optional)
- **Logging**: Winston (Node.js) or Python logging

### Data Sources (External APIs)
- **NBA Data**: NBA API, Basketball Reference scraping
- **Odds Data**: The Odds API, Betfair API
- **Injury Data**: Web scraping or specialized APIs

---

## Database Indexes Summary

### Critical Indexes for Performance

1. **User Queries**
   - `users.email`, `users.username`
   - `betting_slips.user_id`, `betting_slips.created_at`
   - `user_performance.user_id`, `user_performance.period_start`

2. **Game Queries**
   - `games.game_date`, `games.status`
   - `games.home_team_id`, `games.away_team_id`
   - `game_markets.game_id`
   - `game_context.game_id`

3. **Analytics Queries**
   - `odds_history.game_market_id`, `odds_history.recorded_at`
   - `team_statistics.team_id`, `team_statistics.season`
   - `player_statistics.player_id`, `player_statistics.season`

4. **Recommendation Queries**
   - `recommendations.user_id`, `recommendations.generated_at`
   - `recommendations.game_id`, `recommendations.recommendation_type`

---

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- UUIDs are used for primary keys to avoid enumeration attacks and support distributed systems
- JSONB columns are used for flexible metadata storage with indexing support
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately
- Indexes are created on frequently queried columns and foreign keys
- Consider partitioning large tables (e.g., `odds_history`, `game_statistics`) by date for better performance
