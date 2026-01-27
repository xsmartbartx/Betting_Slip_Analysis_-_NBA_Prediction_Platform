# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Betting Slip Analysis & NBA Prediction Platform.

## Prerequisites

- PostgreSQL 14 or higher installed and running
- Node.js and npm installed
- Backend dependencies installed (`npm install` in `backend/` directory)

## Quick Setup (Automated)

### Option 1: Using the Setup Script (Recommended)

```bash
# Make the script executable
chmod +x scripts/setup-database.sh

# Run the setup script
./scripts/setup-database.sh
```

The script will:
1. Check if PostgreSQL is installed
2. Test database connection
3. Create the database if it doesn't exist
4. Run all migrations
5. Optionally seed initial data (NBA teams, bookmakers)

### Option 2: Manual Setup

#### Step 1: Configure Environment Variables

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=betting_app
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password

# Or use a connection string
DATABASE_URL=postgresql://user:password@localhost:5432/betting_app
```

#### Step 2: Create Database

Connect to PostgreSQL and create the database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE betting_app;
\q

# Or using createdb command
createdb -U postgres betting_app
```

#### Step 3: Initialize Database

Navigate to the backend directory and run the initialization script:

```bash
cd backend
npm run db:init
```

This will:
- Create the database if it doesn't exist (if you have admin privileges)
- Run all migration files in `backend/migrations/`
- Create a `schema_migrations` table to track applied migrations

#### Step 4: Seed Initial Data (Optional)

Seed the database with initial NBA data:

```bash
npm run db:seed
```

This creates:
- NBA league
- All 30 NBA teams (Eastern and Western conferences)
- Sample bookmakers (DraftKings, FanDuel, BetMGM, etc.)

#### Step 5: Validate Configuration

Verify that everything is set up correctly:

```bash
npm run db:validate
```

This checks:
- Environment variables are properly configured
- Database connection is working
- JWT secrets are set (warns if using defaults)

## Manual Migration (Alternative)

If you prefer to run migrations manually using `psql`:

```bash
# Using connection string
psql $DATABASE_URL -f backend/migrations/001_initial_schema.sql

# Or using individual parameters
psql -h localhost -U your_username -d betting_app -f backend/migrations/001_initial_schema.sql
```

## Verification

After setup, verify the database is working:

1. **Test Connection:**
   ```bash
   cd backend
   npm run db:validate
   ```

2. **Check Tables:**
   ```bash
   psql -U your_username -d betting_app -c "\dt"
   ```

   You should see all tables including:
   - `users`
   - `teams`
   - `games`
   - `betting_slips`
   - `recommendations`
   - etc.

3. **Check Seeded Data:**
   ```bash
   psql -U your_username -d betting_app -c "SELECT name FROM leagues;"
   psql -U your_username -d betting_app -c "SELECT COUNT(*) FROM teams;"
   ```

## Troubleshooting

### Database Connection Errors

**Error: "password authentication failed"**
- Verify your `DATABASE_USER` and `DATABASE_PASSWORD` in `.env`
- Check PostgreSQL authentication settings in `pg_hba.conf`

**Error: "database does not exist"**
- Create the database manually: `createdb -U postgres betting_app`
- Or ensure the init script has proper permissions

**Error: "connection refused"**
- Ensure PostgreSQL is running: `pg_isready` or `brew services start postgresql` (macOS)
- Check `DATABASE_HOST` and `DATABASE_PORT` in `.env`

### Migration Errors

**Error: "relation already exists"**
- The migration has already been applied
- Check `schema_migrations` table: `SELECT * FROM schema_migrations;`
- To reset, drop and recreate the database (⚠️ **WARNING**: This deletes all data)

**Error: "permission denied"**
- Ensure your database user has CREATE privileges
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE betting_app TO your_username;`

### Environment Variable Issues

**Error: "DATABASE_URL is not defined"**
- Ensure `.env` file exists in the project root
- Check that variables are properly formatted (no spaces around `=`)
- Restart your terminal/IDE after creating `.env`

## Database Schema

The database includes the following main table groups:

### Core Tables
- `users` - User accounts and preferences
- `user_performance` - Historical betting performance
- `betting_slips` - User betting slips
- `betting_slip_selections` - Individual selections in slips

### NBA Data Tables
- `leagues` - Sports leagues (NBA, etc.)
- `teams` - NBA teams
- `players` - Player information
- `games` - Game schedules and results
- `game_context` - Contextual factors (rest, travel, injuries)
- `injury_reports` - Player injury information

### Statistics Tables
- `team_statistics` - Team performance metrics
- `player_statistics` - Player performance metrics
- `game_statistics` - Game-level statistics
- `player_game_stats` - Individual game stats

### Odds & Markets
- `bookmakers` - Bookmaker information
- `game_markets` - Available betting markets
- `odds_history` - Historical odds data

### AI & Recommendations
- `recommendations` - AI-generated recommendations
- `recommendation_explanations` - Explanation for each recommendation
- `model_predictions` - ML model predictions
- `game_features` - Engineered features for ML

### Audit & Logging
- `data_ingestion_logs` - Data import tracking
- `user_activity_logs` - User activity tracking
- `schema_migrations` - Migration tracking

## Resetting the Database

⚠️ **WARNING**: This will delete all data!

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS betting_app;"
psql -U postgres -c "CREATE DATABASE betting_app;"

# Reinitialize
cd backend
npm run db:init
npm run db:seed
```

## Production Considerations

For production environments:

1. **Use Connection Pooling**: Already configured in `database.ts`
2. **Set Strong JWT Secrets**: Generate secure random strings
3. **Enable SSL**: Add `?ssl=true` to `DATABASE_URL`
4. **Backup Regularly**: Set up automated backups
5. **Monitor Performance**: Use PostgreSQL monitoring tools
6. **Index Optimization**: Indexes are already created in migrations

## Next Steps

After database setup:
1. ✅ Database is initialized
2. ✅ Initial data is seeded
3. ✅ Configuration is validated
4. 🚀 Start the backend: `cd backend && npm run dev`
5. 🚀 Start the frontend: `cd frontend && npm run dev`

## Support

If you encounter issues:
1. Check the logs in `backend/logs/`
2. Verify environment variables with `npm run db:validate`
3. Review PostgreSQL logs
4. Check the [Troubleshooting](#troubleshooting) section above
