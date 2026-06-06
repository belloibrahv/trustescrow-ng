# TrustEscrow NG — Admin Dashboard

Next.js 14 admin dashboard for monitoring and managing TrustEscrow operations.

## Features

### 📊 Dashboard
- Real-time deal statistics
- Revenue tracking
- Active deals count
- Dispute alerts

### 📋 Deals Management
- View all deals with filtering
- Search by deal ref, phone, or item
- Status-based filtering
- Deal detail view with:
  - SMS message history
  - Audit log
  - Party verification status

### ⚖️ Dispute Resolution
- View all open disputes
- Review evidence from both parties
- Manual resolution interface
- AI mediation attempt history

### 👤 User Lookup
- Search users by phone number
- View KYC verification status
- Check deal history
- NDPR consent status

## Getting Started

### Prerequisites
- Node.js 20+ LTS
- API server running on port 3000
- PostgreSQL database with data

### Installation

```bash
# From project root
npm install

# Or from admin folder
cd apps/admin
npm install
```

### Development

```bash
# From project root
npm run dev:admin

# Or from admin folder
npm run dev
```

The dashboard will be available at **http://localhost:3001**

### Running Both API and Admin Together

```bash
# From project root
npm run dev:all
```

This starts:
- API server on http://localhost:3000
- Admin dashboard on http://localhost:3001

## Project Structure

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── login/
│   │   │   └── page.tsx             # Login page
│   │   ├── deals/
│   │   │   ├── page.tsx             # Deals list
│   │   │   └── [id]/page.tsx        # Deal detail
│   │   ├── disputes/
│   │   │   └── page.tsx             # Disputes list
│   │   ├── users/
│   │   │   └── page.tsx             # User lookup
│   │   ├── layout.tsx               # Root layout with AuthProvider
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── Navigation.tsx           # Top navigation with logout
│   │   └── LayoutContent.tsx        # Layout wrapper
│   └── lib/
│       ├── auth.tsx                 # Auth context and hooks
│       └── api.ts                   # Axios client with interceptors
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## API Endpoints Used

The admin dashboard connects to these backend endpoints:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/auth/login` | POST | No | Admin login |
| `/api/admin/auth/me` | GET | Yes | Get current user |
| `/api/admin/auth/refresh` | POST | Yes | Refresh token |
| `/api/admin/auth/logout` | POST | Yes | Logout (client-side) |
| `/api/admin/metrics` | GET | Yes | Dashboard statistics |
| `/api/admin/deals` | GET | Yes | List all deals (paginated) |
| `/api/admin/deals/:id` | GET | Yes | Single deal with audit log |
| `/api/admin/users/:phone` | GET | Yes | User KYC lookup |
| `/api/admin/disputes/:id/resolve` | POST | Yes | Manually resolve dispute |

## Authentication

**JWT-based authentication** is fully implemented for production security.

### Development Credentials

For development, use these credentials:
- Username: `admin` / Password: `admin123` (Super Admin)
- Username: `operator` / Password: `operator456` (Admin)

### Authentication Flow

1. **Login**: Navigate to `/login` and enter credentials
2. **Token Storage**: JWT token is stored in localStorage
3. **API Requests**: Token is automatically added to all API requests via axios interceptor
4. **Auto-Logout**: Invalid/expired tokens trigger automatic redirect to login
5. **Token Refresh**: Tokens are valid for 24 hours

### How It Works

```typescript
// Login
POST /api/admin/auth/login
Body: { username: "admin", password: "admin123" }
Response: { success: true, token: "eyJhbGc..." }

// Protected API calls (automatic)
GET /api/admin/deals
Headers: { Authorization: "Bearer eyJhbGc..." }

// Get current user
GET /api/admin/auth/me
Headers: { Authorization: "Bearer eyJhbGc..." }
```

### Components

- **Login Page** (`/login`): Authentication form
- **Auth Context** (`src/lib/auth.tsx`): React context for auth state
- **API Client** (`src/lib/api.ts`): Axios instance with token interceptor
- **Protected Routes**: All dashboard pages require authentication

### Adding New Admin Users

Edit `apps/api/.env.development`:

```bash
ADMIN_USERS={"admin":"admin123","operator":"operator456","newuser":"password"}
```

### Production Setup

For production, use strong passwords:

```bash
# Generate secure password
openssl rand -base64 32

# Update .env.production
ADMIN_USERS={"admin":"very-secure-password-here"}
ADMIN_JWT_SECRET=<64-char-hex-string>
```

**⚠️ Security Notes:**
- Never commit `.env` files to git
- Change default passwords before production
- Use HTTPS in production
- Consider moving admin users to database for larger teams
- Implement rate limiting on login endpoint
- Add 2FA for super admin accounts (future enhancement)

## Environment Variables

None required for development. The admin dashboard connects to:
- API: `http://localhost:3000`

For production, create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.trustescrow.ng
```

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Lucide icons
- **Data Fetching:** Axios
- **Tables:** Custom table component
- **Date Formatting:** date-fns

## Key Features Implemented

✅ **Authentication** - JWT-based login with token management  
✅ **Dashboard** - Real-time metrics with visual stats cards  
✅ **Deals List** - Filterable, searchable table of all deals  
✅ **Deal Detail** - Complete view with messages, audit log, dispute info  
✅ **Disputes** - List of all disputes with status badges  
✅ **User Lookup** - KYC status and deal history  
✅ **Navigation** - Responsive navbar with user info and logout  
✅ **Status Badges** - Color-coded status indicators  
✅ **Mobile Responsive** - Works on all screen sizes  
✅ **Auto-Logout** - Invalid tokens trigger redirect to login

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from admin folder
cd apps/admin
vercel
```

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Production Checklist

Before deploying to production:

- [x] Enable JWT authentication
- [x] Add login page
- [x] Implement auth context and token management
- [x] Add logout functionality
- [ ] Change default admin passwords (see .env.development)
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Configure CORS on API to allow admin domain
- [ ] Add error boundary components
- [ ] Implement loading states for all pages
- [ ] Add pagination to deals list
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Configure Sentry for error tracking
- [ ] Add user role-based access control
- [ ] Implement audit logging for admin actions
- [ ] Add 2FA for super admin (optional)

## Troubleshooting

### Admin dashboard shows "Loading..." forever
- Check that API server is running on port 3000
- Verify CORS is enabled on API server
- Open browser console for error messages

### "User not found" when searching
- Verify the phone number format (+234... or 08...)
- Check that users exist in the database
- Ensure API authentication is working

### Deals not showing
- Confirm deals exist in database: `npm run db:studio`
- Check API logs for errors
- Verify `/api/admin/deals` endpoint works in Postman/curl

## Contributing

1. Make changes in `apps/admin/src`
2. Test locally with `npm run dev:all`
3. Run type checking: `npm run typecheck --workspace=apps/admin`
4. Submit PR with screenshots

---

**Need Help?** Check the main project README or API documentation.
