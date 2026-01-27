import { Pool } from 'pg';
import { config } from '../config/environment';
import { logger } from '../config/logger';

/**
 * Seed initial data for the application
 */
async function seedDatabase(): Promise<void> {
  // Use DATABASE_URL if provided, otherwise construct from config
  const poolConfig = config.database.url
    ? { connectionString: config.database.url }
    : {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
      };

  const pool = new Pool(poolConfig);

  try {
    logger.info('Starting database seeding...');

    // 1. Create NBA League
    const leagueResult = await pool.query(
      `INSERT INTO leagues (name, sport, country, is_active)
       VALUES ('NBA', 'basketball', 'United States', true)
       ON CONFLICT (name) DO UPDATE SET is_active = true
       RETURNING id`
    );
    const nbaLeagueId = leagueResult.rows[0].id;
    logger.info('NBA league created/updated');

    // 2. Create NBA Teams (Eastern Conference)
    const easternTeams = [
      { name: 'Atlanta Hawks', abbreviation: 'ATL', city: 'Atlanta', conference: 'Eastern', division: 'Southeast' },
      { name: 'Boston Celtics', abbreviation: 'BOS', city: 'Boston', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Brooklyn Nets', abbreviation: 'BKN', city: 'Brooklyn', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Charlotte Hornets', abbreviation: 'CHA', city: 'Charlotte', conference: 'Eastern', division: 'Southeast' },
      { name: 'Chicago Bulls', abbreviation: 'CHI', city: 'Chicago', conference: 'Eastern', division: 'Central' },
      { name: 'Cleveland Cavaliers', abbreviation: 'CLE', city: 'Cleveland', conference: 'Eastern', division: 'Central' },
      { name: 'Detroit Pistons', abbreviation: 'DET', city: 'Detroit', conference: 'Eastern', division: 'Central' },
      { name: 'Indiana Pacers', abbreviation: 'IND', city: 'Indianapolis', conference: 'Eastern', division: 'Central' },
      { name: 'Miami Heat', abbreviation: 'MIA', city: 'Miami', conference: 'Eastern', division: 'Southeast' },
      { name: 'Milwaukee Bucks', abbreviation: 'MIL', city: 'Milwaukee', conference: 'Eastern', division: 'Central' },
      { name: 'New York Knicks', abbreviation: 'NYK', city: 'New York', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Orlando Magic', abbreviation: 'ORL', city: 'Orlando', conference: 'Eastern', division: 'Southeast' },
      { name: 'Philadelphia 76ers', abbreviation: 'PHI', city: 'Philadelphia', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Toronto Raptors', abbreviation: 'TOR', city: 'Toronto', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Washington Wizards', abbreviation: 'WAS', city: 'Washington', conference: 'Eastern', division: 'Southeast' },
    ];

    // 3. Create NBA Teams (Western Conference)
    const westernTeams = [
      { name: 'Dallas Mavericks', abbreviation: 'DAL', city: 'Dallas', conference: 'Western', division: 'Southwest' },
      { name: 'Denver Nuggets', abbreviation: 'DEN', city: 'Denver', conference: 'Western', division: 'Northwest' },
      { name: 'Golden State Warriors', abbreviation: 'GSW', city: 'San Francisco', conference: 'Western', division: 'Pacific' },
      { name: 'Houston Rockets', abbreviation: 'HOU', city: 'Houston', conference: 'Western', division: 'Southwest' },
      { name: 'Los Angeles Clippers', abbreviation: 'LAC', city: 'Los Angeles', conference: 'Western', division: 'Pacific' },
      { name: 'Los Angeles Lakers', abbreviation: 'LAL', city: 'Los Angeles', conference: 'Western', division: 'Pacific' },
      { name: 'Memphis Grizzlies', abbreviation: 'MEM', city: 'Memphis', conference: 'Western', division: 'Southwest' },
      { name: 'Minnesota Timberwolves', abbreviation: 'MIN', city: 'Minneapolis', conference: 'Western', division: 'Northwest' },
      { name: 'New Orleans Pelicans', abbreviation: 'NOP', city: 'New Orleans', conference: 'Western', division: 'Southwest' },
      { name: 'Oklahoma City Thunder', abbreviation: 'OKC', city: 'Oklahoma City', conference: 'Western', division: 'Northwest' },
      { name: 'Phoenix Suns', abbreviation: 'PHX', city: 'Phoenix', conference: 'Western', division: 'Pacific' },
      { name: 'Portland Trail Blazers', abbreviation: 'POR', city: 'Portland', conference: 'Western', division: 'Northwest' },
      { name: 'Sacramento Kings', abbreviation: 'SAC', city: 'Sacramento', conference: 'Western', division: 'Pacific' },
      { name: 'San Antonio Spurs', abbreviation: 'SAS', city: 'San Antonio', conference: 'Western', division: 'Southwest' },
      { name: 'Utah Jazz', abbreviation: 'UTA', city: 'Salt Lake City', conference: 'Western', division: 'Northwest' },
    ];

    const allTeams = [...easternTeams, ...westernTeams];

    logger.info(`Creating ${allTeams.length} NBA teams...`);

    for (const team of allTeams) {
      await pool.query(
        `INSERT INTO teams (league_id, name, abbreviation, city, conference, division, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (league_id, abbreviation) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           city = EXCLUDED.city,
           conference = EXCLUDED.conference,
           division = EXCLUDED.division,
           is_active = true`,
        [nbaLeagueId, team.name, team.abbreviation, team.city, team.conference, team.division]
      );
    }

    logger.info('All NBA teams created/updated successfully');

    // 4. Create sample bookmakers
    const bookmakers = [
      { name: 'DraftKings', is_active: true },
      { name: 'FanDuel', is_active: true },
      { name: 'BetMGM', is_active: true },
      { name: 'Caesars', is_active: true },
      { name: 'Bet365', is_active: true },
    ];

    logger.info(`Creating ${bookmakers.length} bookmakers...`);

    for (const bookmaker of bookmakers) {
      await pool.query(
        `INSERT INTO bookmakers (name, is_active)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET is_active = EXCLUDED.is_active`,
        [bookmaker.name, bookmaker.is_active]
      );
    }

    logger.info('All bookmakers created/updated successfully');

    await pool.end();
    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding database', error);
    await pool.end();
    throw error;
  }
}

/**
 * Main seeding function
 */
async function main(): Promise<void> {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedDatabase };
