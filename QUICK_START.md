# Quick Start Guide

Get your Betting App up and running in minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# From project root
cp .env.example .env
```

Edit `.env` and update:
- Database credentials (user, password, database name)
- JWT secrets (generate secure random strings)
- API keys (optional for now)

### 3. Set Up Database

**Option A: Automated (Recommended)**
```bash
# Make script executable (if needed)
chmod +x scripts/setup-database.sh

# Run setup
./scripts/setup-database.sh
```

**Option B: Manual**
```bash
# Create database
createdb -U postgres betting_app

# Initialize schema
cd backend
npm run db:init

# Seed initial data
npm run db:seed
```

### 4. Validate Setup

```bash
cd backend
npm run db:validate
```

You should see: ✅ "All environment validations passed"

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## First Steps

1. **Register an Account**
   - Go to http://localhost:3000/register
   - Create your account
   - Set your initial bankroll

2. **Explore the Dashboard**
   - View your bankroll summary
   - Check your betting performance (empty initially)

3. **Test API Endpoints**
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Register (example)
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
   ```

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -c "SELECT version();"

# Check if database exists
psql -U postgres -l | grep betting_app

# Verify environment variables
cd backend
npm run db:validate
```

### Port Already in Use

```bash
# Backend: Change PORT in .env (default: 3001)
# Frontend: Change port in vite.config.ts (default: 3000)
```

### Module Not Found Errors

```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## What's Next?

Now that your environment is set up:

1. ✅ Database is initialized
2. ✅ Backend API is running
3. ✅ Frontend is running
4. ✅ Authentication is working

**Next Development Steps:**
- Implement betting slip input
- Add NBA game data integration
- Build evaluation engine
- Create recommendation system

## Need Help?

- Check `DATABASE_SETUP.md` for detailed database setup
- Review `SETUP.md` for comprehensive setup instructions
- See `CONTEXT.md` for database schema and architecture

## Environment Variables Reference

### Required
- `DATABASE_NAME` - PostgreSQL database name
- `DATABASE_USER` - PostgreSQL username
- `DATABASE_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - Secret for JWT tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)

### Optional
- `DATABASE_URL` - Full connection string (overrides individual settings)
- `DATABASE_HOST` - Database host (default: localhost)
- `DATABASE_PORT` - Database port (default: 5432)
- `NBA_API_KEY` - For NBA data features
- `ODDS_API_KEY` - For odds data features

## Security Notes

⚠️ **Important for Production:**
- Never commit `.env` file to version control
- Use strong, randomly generated JWT secrets
- Enable SSL for database connections
- Use environment-specific configuration
- Set up proper CORS origins
