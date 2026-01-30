# ARABIQ

Monorepo for the ARABIQ website and CMS.

- Apps: `apps/web` (Next.js frontend), `apps/cms` (Strapi CMS)
- Docs: design and implementation notes in `docs/`

# Production Environment Variables for Arabiq
# Generated for production deployment

# Database
DB_PASSWORD=IDI5+1dEhv8FBGBGgegZJe4D9p/M7ndU2cNypGTdtcc=
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=arabiq
DATABASE_USERNAME=arabiq
DATABASE_PASSWORD=IDI5+1dEhv8FBGBGgegZJe4D9p/M7ndU2cNypGTdtcc=

# Strapi CMS
HOST=0.0.0.0
PORT=1337
APP_KEYS=fOjPbUernqAm+17/gqfVbQ==,vIJPwXROeiEyWsmTwia0wQ==
JWT_SECRET=6feb6a9d131d02ab0534ccfad6d17c6c49bd510cb0bd7139e6e6dae78a127a5c
API_TOKEN_SALT=6b0c54ee6e4bf6f92f4b826ea4039def38da79f7fa59bda356a79ed5023a1713
ADMIN_JWT_SECRET=14a79e34fa12d3d6b967123008fd10ba4cc11b84018fb502f2d3c6bfd47f5429

# CORS
CORS_ORIGIN=https://arabiq.tech

# Email
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USERNAME=resend
EMAIL_PASSWORD=re_gehvWfDA_NWk38U57Hi1vnhG4aQnoQrTf
EMAIL_FROM=noreply@arabiq.tech
EMAIL_REPLY_TO=support@arabiq.tech

# Next.js Web App
NEXT_PUBLIC_CMS_URL=http://localhost:1337
NEXT_PUBLIC_SITE_URL=https://arabiq.tech

# Auth
AUTH_SECRET=ZH97vKhR5HKrLw71Amb93VGXBuK+JdV6eWV0aumAxyg=
AUTH_TRUST_HOST=true
STRAPI_JWT_COOKIE_NAME=strapi_jwt

# Seeding (for initial setup)
SEED_TOKEN=89e78ae63fd417af8fa4baacc6538d6c213fb04ef1dbd89728cd65a13abec4a727c7b21a6ee5af32fb1c44c4acbf25abf74c85920a5565d47ba41c1436bb69c0bd80783fbad71c41fc7b32f028b3bc1516897361335714de6ab77f6fbcdadb4d4abaecfc9f5e812e82a64072cb6f6cabed8bf24a
STRAPI_API_TOKEN=89e78ae63fd417af8fa4baacc6538d6c213fb04ef1dbd89728cd65a13abec4a727c7b21a6ee5af32fb1c44c4acbf25abf74c85920a5565d47ba41c1436bb69c0bd80783fbad71c41fc7b32f028b3bc1516897361335714de6ab77f6fbcdadb4d4abaecfc9f5e812e82a64072cb6f6cabed8bf24a
Quick start

1. Frontend (apps/web):
   - Install: `pnpm install`
   - Dev: `pnpm dev`

2. CMS (apps/cms):
   - See `apps/cms/SETUP.md` and `manage.sh cms` for helpers.

Contributing

- Please open issues and PRs on the repository.

License

MIT
