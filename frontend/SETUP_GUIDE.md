# Leave Management System - Setup Guide

This is a complete leave management system with separated frontend and backend. Follow this guide to set up and run the application.

## Project Structure

```
project/
├── backend/                 # Express.js REST API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication & error handling
│   │   ├── db/             # Database connection & schema
│   │   ├── utils/          # JWT & password utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── server.ts       # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                # Backend environment variables
│   └── dist/               # Compiled JavaScript (after build)
│
└── frontend/               # Next.js React application
    ├── app/
    │   ├── login/          # Login page
    │   └── protected/      # Protected routes (require auth)
    │       ├── dashboard/  # Employee dashboard
    │       ├── apply-leave/
    │       ├── manager/approvals/
    │       └── admin/
    ├── lib/
    │   ├── api.ts          # API client configuration
    │   ├── contexts/       # React Context (Auth)
    │   └── hooks/          # Custom hooks
    ├── types/              # TypeScript types
    ├── .env.local          # Frontend environment variables
    └── package.json
```

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- PostgreSQL database (Neon recommended for serverless)
- A code editor (VS Code recommended)

## Backend Setup

### 1. Database Setup

First, create a PostgreSQL database. You can use:
- **Neon** (serverless, recommended): https://neon.tech
- Local PostgreSQL: `createdb leave_management`

Get your database connection URL in this format:
```
postgresql://user:password@host:port/database_name
```

### 2. Configure Backend Environment

Edit `/backend/.env`:
```bash
DATABASE_URL=postgresql://user:password@host:port/leave_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Generate a strong JWT_SECRET:
```bash
openssl rand -base64 32
```

### 3. Install Backend Dependencies

```bash
cd backend
pnpm install
```

### 4. Initialize Database Schema

This creates tables and seeds test data:
```bash
pnpm db:init
```

**Test Credentials** created by initialization:
- **Admin**: admin@company.com / admin123
- **Manager**: manager@company.com / manager123
- **Employee**: employee@company.com / emp123

### 5. Start Backend Server

```bash
pnpm dev
```

You should see:
```
✓ Leave Management API Server running on http://localhost:5000
  CORS enabled for: http://localhost:3000
```

Test the backend:
```bash
curl http://localhost:5000/api/health
```

## Frontend Setup

### 1. Configure Frontend Environment

The frontend `.env.local` already contains:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If your backend runs on a different port, update this URL.

### 2. Install Frontend Dependencies

```bash
cd ..  # Back to root
pnpm install
```

(Dependencies are already installed from earlier setup)

### 3. Start Frontend Development Server

```bash
pnpm dev
```

The app should open at: http://localhost:3000

You'll be redirected to `/login` automatically.

## Using the Application

### Login
1. Go to http://localhost:3000
2. Use one of the test credentials above
3. You'll be redirected to your role-specific dashboard

### Employee Features
- View personal leave history
- Apply for new leave requests
- See leave status (Pending/Approved/Rejected)

### Manager Features
- Access `/manager/approvals` to see pending leave requests from subordinates
- Approve or reject with optional rejection reason
- View all leaves in the system

### Admin Features
- Access `/admin/employees` to create, view, and delete employees
- Access `/admin/holidays` to manage company holidays
- Full system access

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password

### Employees (Admin Only)
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Leaves
- `GET /api/leaves` - List leaves (role-based filtering)
- `GET /api/leaves/mine` - Get current user's leaves
- `GET /api/leaves/:id` - Get leave details
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave status (managers/admins)

### Holidays (Admin Only)
- `GET /api/holidays` - List all holidays
- `POST /api/holidays` - Create holiday
- `PUT /api/holidays/:id` - Update holiday
- `DELETE /api/holidays/:id` - Delete holiday

### Health Check
- `GET /api/health` - Server status

## Troubleshooting

### Backend won't start
- Check `.env` file exists with valid `DATABASE_URL`
- Ensure database is running and accessible
- Check port 5000 is not in use: `lsof -i :5000`

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Clear browser cache and cookies
- Check browser console for CORS errors

### Database errors
- Verify database credentials in `.env`
- Run `pnpm db:init` to create/reset schema
- Check PostgreSQL is running

### Login fails
- Ensure database was initialized with test data
- Try the exact credentials from the setup step
- Check password is correct (case-sensitive)

## Production Deployment

### Deploy Backend
1. Build: `cd backend && pnpm build`
2. Deploy `dist/` folder to:
   - Vercel (serverless Node.js)
   - Railway
   - Heroku
   - AWS Lambda + API Gateway

3. Set production environment variables:
   - Use strong `JWT_SECRET`
   - Set `NODE_ENV=production`
   - Use `CORS_ORIGIN` pointing to your frontend domain
   - Use production PostgreSQL database

### Deploy Frontend
1. Build: `pnpm build`
2. Deploy to Vercel (recommended)
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL=` pointing to your backend domain

## Database Schema

### Roles Table
```sql
id (PK) | name (unique)
1       | admin
2       | manager
3       | employee
```

### Employees Table
```sql
id (PK) | email | password_hash | name | role_id (FK) | manager_id (FK) | department | created_at
```

### Leaves Table
```sql
id (PK) | employee_id (FK) | start_date | end_date | reason | type | status | approved_by | rejection_reason | created_at
```

### Holidays Table
```sql
id (PK) | date (unique) | name | description | created_at
```

## Security Notes

- JWT tokens are stored in httpOnly cookies (secure by default)
- Passwords are hashed with bcryptjs
- Role-based access control on all API endpoints
- Input validation with Zod
- CORS configured to only allow frontend domain
- Never commit `.env` files with secrets

## Support & Development

- Backend uses Express.js with TypeScript
- Frontend uses Next.js 16 with React 19
- Database: PostgreSQL with pg client
- Auth: JWT with httpOnly cookies
- UI Components: shadcn/ui with Tailwind CSS
- API State: SWR for client-side data fetching

## Next Steps

1. Customize the UI design in `/app/globals.css`
2. Add more leave types in the database
3. Implement email notifications
4. Add user profile management
5. Implement leave balance tracking
6. Add leave history/analytics
