# Arabiq CMS (Strapi)

Content management system for the Arabiq project, built with Strapi v5.

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Installation

Dependencies are already installed during project setup. If needed, run:

```bash
npm install
```

### Development

Start Strapi in development mode (with auto-reload):

```bash
npm run develop
```

The admin panel will be available at: **http://localhost:1337/admin**

### Production

Build the admin panel:

```bash
npm run build
```

Start in production mode:

```bash
npm start
```

## 📋 Content Types

### Site Settings (Single Type)
Global site configuration, localized content.

**Fields:**
- `title` (string, required) - Site title
- `description` (rich text) - Site description
- `contactEmail` (email) - Contact email address
- `contactPhone` (string) - Contact phone number

**API Endpoint:** `GET /api/site-setting?populate=*&locale=en`

---

### Solution (Collection Type)
Business solutions offered by Arabiq.

**Fields:**
- `title` (string, required) - Solution title
- `slug` (UID, required) - URL-safe identifier (auto-generated from title)
- `summary` (text) - Short summary
- `description` (rich text) - Full description
- `icon` (string) - Icon name or emoji

**API Endpoints:**
- List: `GET /api/solutions?populate=*&locale=en`
- Single: `GET /api/solutions/:id?populate=*&locale=en`
- By slug: `GET /api/solutions?filters[slug][$eq]=your-slug&populate=*&locale=en`

---

### Industry (Collection Type)
Industries served by Arabiq.

**Fields:**
- `title` (string, required) - Industry title
- `slug` (UID, required) - URL-safe identifier
- `summary` (text) - Short summary
- `description` (rich text) - Full description
- `icon` (string) - Icon name or emoji

**API Endpoints:**
- List: `GET /api/industries?populate=*&locale=en`
- Single: `GET /api/industries/:id?populate=*&locale=en`
- By slug: `GET /api/industries?filters[slug][$eq]=your-slug&populate=*&locale=en`

---

### Case Study (Collection Type)
Client success stories and case studies.

**Fields:**
- `title` (string, required) - Case study title
- `slug` (UID, required) - URL-safe identifier
- `summary` (text) - Short summary
- `description` (rich text) - Full case study content
- `client` (string) - Client name
- `industry` (string) - Industry sector

**API Endpoints:**
- List: `GET /api/case-studies?populate=*&locale=en`
- Single: `GET /api/case-studies/:id?populate=*&locale=en`
- By slug: `GET /api/case-studies?filters[slug][$eq]=your-slug&populate=*&locale=en`

---

### Demo (Collection Type)
Interactive product demonstrations.

**Fields:**
- `title` (string, required) - Demo title
- `slug` (UID, required) - URL-safe identifier
- `summary` (text) - Short summary
- `description` (rich text) - Full description
- `demoType` (enum, required) - Type of demo: `ai-chat`, `ecommerce`, or `cafe-booking`

**API Endpoints:**
- List: `GET /api/demos?populate=*&locale=en`
- Single: `GET /api/demos/:id?populate=*&locale=en`
- By slug: `GET /api/demos?filters[slug][$eq]=your-slug&populate=*&locale=en`
- By type: `GET /api/demos?filters[demoType][$eq]=ai-chat&populate=*&locale=en`

---

## 🌍 Internationalization (i18n)

All content types support English (`en`) and Arabic (`ar`) locales.

### Adding Localized Content

1. Create content in the default locale (English)
2. Click the locale switcher in the content editor
3. Select "Create new locale" and choose Arabic
4. Fill in the Arabic content
5. Save and publish

### API Usage

Fetch content in a specific locale:
```
GET /api/solutions?locale=ar
```

Fetch all locales:
```
GET /api/solutions?locale=all
```

---

## 🔐 API Authentication

### Generating an API Token

1. Go to **Settings** → **API Tokens** in the admin panel
2. Click **Create new API Token**
3. Configure:
   - **Name**: `Next.js App` (or any descriptive name)
   - **Token type**: `Read-only` (or `Full access` if needed)
   - **Token duration**: `Unlimited` (for development)
4. Click **Save**
5. Copy the generated token (shown only once!)

### Using the Token

Add the token to your Next.js `.env.local`:

```env
STRAPI_API_TOKEN=your_generated_token_here
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

Make authenticated requests:

```typescript
const res = await fetch('http://localhost:1337/api/solutions', {
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
  }
});
```

### Public Access (No Token)

To allow public read access without a token:

1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Select **Public**
3. Enable `find` and `findOne` permissions for each content type
4. Save

---

## 🔧 Configuration

### CORS

CORS is configured in `config/middlewares.ts` to allow requests from:
- `http://localhost:3000` (Next.js app)
- `http://localhost:1337` (Strapi admin)

### Database

**PostgreSQL is required for all environments.** Configure Postgres connection in `apps/cms/.env` or `apps/cms/.env.local` (see `README.DEV.md` for local dev recommendations). Example:

```dotenv
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=arabiq
DATABASE_USERNAME=arabiq
DATABASE_PASSWORD=pass
```

### Environment Variables

See `.env.example` for all available configuration options.

---

## 📦 Project Structure

```
apps/cms/
├── config/           # Configuration files
│   ├── admin.ts      # Admin panel config
│   ├── api.ts        # API config
│   ├── database.ts   # Database config
│   ├── middlewares.ts # Middleware config (CORS)
│   ├── plugins.ts    # Plugin config (i18n)
│   └── server.ts     # Server config
├── src/
│   └── api/          # API content types
│       ├── case-study/
│       ├── demo/
│       ├── industry/
│       ├── site-setting/
│       └── solution/
├── .env              # Environment variables (DO NOT COMMIT)
└── .env.example      # Example environment variables
```

---

## 🧪 Testing the API

### Using curl

```bash
# Fetch all solutions
curl http://localhost:1337/api/solutions

# Fetch a single solution by slug
curl 'http://localhost:1337/api/solutions?filters[slug][$eq]=ai-powered-solutions'

# Fetch with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:1337/api/solutions
```

### Using the Next.js App

From the Next.js app (`apps/web`), test the integration:

```typescript
// app/test-strapi/page.tsx
export default async function TestStrapiPage() {
  const res = await fetch('http://localhost:1337/api/solutions', {
    headers: {
      'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
    }
  });
  const data = await res.json();
  
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

---

## 📚 Resources

- [Strapi Documentation](https://docs.strapi.io)
- [REST API Reference](https://docs.strapi.io/dev-docs/api/rest)
- [i18n Plugin](https://docs.strapi.io/dev-docs/plugins/i18n)

---

## 🛠️ Common Tasks

### Reset Database (Postgres)
```bash
# Drop and recreate DB locally (example using psql)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS arabiq; CREATE DATABASE arabiq OWNER arabiq;"
# Or use your Docker / managed DB tooling
```

### View Database (Postgres)
```bash
# Connect with psql
PGPASSWORD=pass psql -U arabiq -h 127.0.0.1 -p 5432 -d arabiq
```
### Generate TypeScript Types
```bash
npm run strapi ts:generate-types
```

### Build Admin Panel
```bash
npm run build
```

---

## 🚨 Important Notes

- **Never commit `.env`** - it contains sensitive tokens
- **Ensure slugs are unique** - they're used for routing
- **Publish content** - unpublished content won't appear in the API
- **Locale defaults to `en`** - always specify locale in API calls
- **PostgreSQL required** - SQLite is not used anywhere

---

## 📝 Sample Content

The CMS includes sample content in English:
- 3 Solutions (AI-powered, Cloud Infrastructure, Custom Development)
- 3 Industries (Healthcare, Retail, Finance)
- 2 Case Studies
- 3 Demos (one for each demoType)
- Site Settings

You can add, edit, or delete this content from the admin panel.
