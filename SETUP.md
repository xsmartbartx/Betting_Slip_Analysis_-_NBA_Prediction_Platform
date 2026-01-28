# Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Database Setup

1. Create a PostgreSQL database:
```bash
createdb betting_app
```

2. Run the migration:
```bash
cd backend
psql -d betting_app -f migrations/001_initial_schema.sql
```

Or using the connection string:
```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp ../.env.example .env
```

4. Update `.env` with your database credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/betting_app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

5. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are set):
```bash
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Testing the Application

1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Register a new account
4. You'll be redirected to the dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile (protected)

### Health Check
- `GET /api/health` - Check API status

## Project Structure

```
betting-app/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── config/   # Configuration files
│   │   ├── models/   # Database models
│   │   ├── services/ # Business logic
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/   # API routes
│   │   └── middleware/ # Express middleware
│   └── migrations/   # Database migrations
│
├── frontend/         # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/    # Page components
│   │   ├── store/    # Redux store
│   │   ├── services/ # API services
│   │   └── hooks/    # Custom hooks
│
└── CONTEXT.md        # Database schema & structure
```

## Next Steps

1. Install dependencies for both backend and frontend
2. Set up PostgreSQL database
3. Run database migrations
4. Configure environment variables
5. Start both servers
6. Test authentication flow

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Port Already in Use
- Backend: Change `PORT` in `.env` (default: 3001)
- Frontend: Change port in `vite.config.ts` (default: 3000)

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- Check that `tsconfig.json` is properly configured
