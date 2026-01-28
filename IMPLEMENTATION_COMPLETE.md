# Environment Variables Configuration

## Web Application (.env.local)

```bash
# Strapi API URL
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Production
# NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com
```

## CMS/Strapi (.env)

```bash
# Server
HOST=0.0.0.0
PORT=1337

# Database (PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=arabiq
DATABASE_USERNAME=arabiq
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=false

# Secrets
APP_KEYS=your_app_key_1,your_app_key_2,your_app_key_3,your_app_key_4
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret

# Email Configuration (for password reset)
EMAIL_PROVIDER=sendgrid
EMAIL_PROVIDER_API_KEY=your_sendgrid_api_key
EMAIL_DEFAULT_FROM=noreply@yourdomain.com
EMAIL_DEFAULT_REPLY_TO=support@yourdomain.com

# Optional: Disable AI localizations if not using AI features
DISABLE_AI_LOCALIZATIONS=true

# CORS Origins (add your production domain)
# CLIENT_URL=https://yourdomain.com
```

## Key Features Enabled:

1. **User Self-Registration** ✅
   - Custom fields: phone (required), country, company
   - Sales contact permission flag
   - Account starts in 'pending' status

2. **Authentication** ✅
   - Login with email/username + password
   - JWT-based authentication
   - Password reset via email
   - Logout functionality

3. **Authorization (RBAC)** ✅
   - Roles: admin, authenticated, potential-customer, client, premium
   - Demo access controlled by roles
   - User-specific demo grants

4. **Account Management** ✅
   - Users can view/edit their profile
   - Update display name, country, company
   - View accessible demos
   - View account status

5. **Admin Features** ✅
   - Elevate user roles
   - Grant/revoke demo access
   - Change account status (pending/active/suspended)
   - View all users
   - View audit logs per user

6. **Audit Logging** ✅
   - All actions recorded (login, logout, registration, etc.)
   - IP address and user agent tracking
   - Demo access attempts logged
   - Profile updates tracked
   - Admin actions logged with reason

## Next Steps:

1. Install dependencies in web app:
   ```bash
   cd apps/web
   pnpm install
   ```

2. Start Strapi (will auto-create custom roles on bootstrap):
   ```bash
   cd apps/cms
   pnpm develop
   ```

3. Configure email provider in Strapi for password resets

4. Create first admin user in Strapi admin panel

5. Test the full flow:
   - Register new user
   - Admin approves user (change status to 'active')
   - User logs in
   - Admin grants demo access
   - User accesses demo
