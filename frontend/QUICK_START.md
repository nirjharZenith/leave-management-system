# Quick Start Guide

## TL;DR - Get Running in 5 Minutes

### Step 1: Set Up Database
Get a free PostgreSQL database:
- Go to https://neon.tech and create an account
- Create a new project and get the connection string
- It looks like: `postgresql://user:password@host:port/database`

### Step 2: Configure Backend
```bash
cd backend
```

Edit `.env` and replace `DATABASE_URL` with your database connection string:
```
DATABASE_URL=your_connection_string_here
JWT_SECRET=your-secret-key-here
```

### Step 3: Install & Initialize Backend
```bash
pnpm install
pnpm db:init
```

### Step 4: Start Backend
```bash
pnpm dev
```

Backend is running! Check: http://localhost:5000/api/health

### Step 5: Start Frontend
In a new terminal:
```bash
cd .. # back to root
pnpm dev
```

Visit: http://localhost:3000

### Step 6: Login
Use test credentials:
```
Email: admin@company.com
Password: admin123
```

## What You Get

✅ Complete leave management system
✅ Role-based access (admin, manager, employee)
✅ Leave request workflow
✅ Employee management
✅ Holiday management
✅ Secure JWT authentication

## Default Credentials

```
Admin     : admin@company.com / admin123
Manager   : manager@company.com / manager123
Employee  : employee@company.com / emp123
```

## Commands Cheat Sheet

```bash
# Backend
cd backend
pnpm install           # Install dependencies
pnpm build             # Build for production
pnpm dev               # Start development server
pnpm db:init           # Initialize database (creates tables & seeds data)

# Frontend
pnpm install           # Install dependencies
pnpm dev               # Start development server
pnpm build             # Build for production
pnpm start             # Run production build
```

## Troubleshooting

**Backend won't start?**
- Check `.env` has valid `DATABASE_URL`
- Make sure database is running
- Try: `DATABASE_URL=your_url pnpm dev`

**Login doesn't work?**
- Run `pnpm db:init` to create test users
- Use exact credentials from above

**Frontend can't reach backend?**
- Verify backend is on http://localhost:5000
- Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000`

## Full Documentation

See `SETUP_GUIDE.md` for:
- Complete architecture overview
- All API endpoints
- Production deployment guide
- Database schema details
- Security information

Happy coding! 🎉
