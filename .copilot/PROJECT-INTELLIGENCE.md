# Arabiq Project Intelligence

> **Purpose**: This file captures project-specific knowledge, patterns, gotchas, and lessons learned.
> AI agents and developers should read this file first when working on this project.

---

## 🏗️ Architecture Overview

### Tech Stack
- **CMS**: Strapi v5 (Document Service API) with i18n plugin
- **Frontend**: Next.js 15 with App Router
- **Languages**: TypeScript, Node.js
- **Database**: SQLite (dev), PostgreSQL (prod)
- **Locales**: English (en) as default, Arabic (ar) as secondary

### Project Structure
```
arabiq/
├── apps/
│   ├── cms/          # Strapi v5 CMS
│   └── web/          # Next.js frontend
├── seed/             # Database seeding scripts
├── docs/             # Project documentation
└── manage.sh         # Central management script
```

---

## ⚠️ Critical Gotchas

### 1. Strapi v5 i18n + Non-Localized Required Fields

**Problem**: When a field is marked as `"localized": false` AND `"required": true`, Strapi throws conflicting errors:
- Including the field in AR locale → "This attribute must be unique"
- Excluding the field from AR locale → "Field must be a string, was null"

**Root Cause**: Non-localized fields are shared across all locales. When creating the AR locale, Strapi:
1. Expects the field to be present (because it's required)
2. But rejects it because the value already exists from EN (unique constraint)

**Solution**: Remove `required: true` from non-localized fields in Strapi schemas:
```json
// ❌ WRONG - causes i18n conflicts
"slug": {
  "type": "string",
  "unique": true,
  "required": true,
  "pluginOptions": { "i18n": { "localized": false } }
}

// ✅ CORRECT - works with i18n
"slug": {
  "type": "string", 
  "unique": true,
  "pluginOptions": { "i18n": { "localized": false } }
}
```

**Affected Content Types**: All collections with slugs
- faq, pricing-plan, partner, demo, case-study, solution, industry

### 2. Strapi v5 API Changes from v4

| Feature | Strapi v4 | Strapi v5 |
|---------|-----------|-----------|
| API Response | `data.attributes` | `data` (flat) |
| Document ID | `id` (numeric) | `documentId` (string) |
| Localization | POST to `/localizations` | PUT with `?locale=xx` |
| Find by field | `filters[field][$eq]=value` | Same, but returns `documentId` |

### 3. Strapi draftAndPublish Behavior

**Problem**: When `draftAndPublish: true` is enabled in a content type schema, Strapi stores BOTH draft and published versions of every entry, even when using API calls with `publishedAt`.

**Impact**: 
- 2x data duplication in database
- Performance degradation with large datasets
- Confusion when querying database directly (multiple rows per document_id)

**Solution**: For seed-based or programmatically managed content, set `draftAndPublish: false` in schema:
```json
{
  "kind": "collectionType",
  "collectionName": "nav_items",
  "info": { "singularName": "nav-item", "pluralName": "nav-items" },
  "options": {
    "draftAndPublish": false  // ✅ Prevents dual storage
  }
}
```

**When to use draftAndPublish: true**:
- Content requires editorial review workflow
- Need to preview changes before publishing
- Multiple editors working on content

**When to use draftAndPublish: false**:
- Seed data and configuration
- Programmatically managed content
- Simple CRUD operations without review process

### 4. Seeder Script Behavior

**Location**: `/seed/seed.js`

**Key Points**:
- Uses `identifierField` (usually "slug") to find existing records
- Creates EN locale first, then updates with AR locale
- Non-localized fields should be excluded from AR payload
- The seeder auto-authenticates using stored token or login
- Assumes `draftAndPublish: false` to avoid duplicate entries

**Debug Mode**: Set `DEBUG=true` in environment to see API responses

### 5. Matterport Branding - CONFIDENTIAL

**Rule**: Never mention "Matterport" in public-facing content.

**Reason**: Business/licensing considerations - we use their technology but shouldn't expose vendor names to end users.

**Replacements**:
| Instead of | Use |
|------------|-----|
| Matterport technology | Advanced 3D technology |
| Matterport Pro3 | Professional 3D scanning equipment |
| Matterport capture | Professional 3D capture |

**Files to check when adding content**:
- `seed/*.json` (all seed files)
- `apps/cms/backups/*.json`
- Frontend components mentioning 3D tech

---

## 🔧 Common Operations

### Running Seeds
```bash
./manage.sh seed          # Run seeder with fresh data
./manage.sh seed update   # Update existing without deleting
```

### Checking CMS Logs
```bash
./manage.sh logs cms
```

### Restarting Services
```bash
./manage.sh restart cms   # Restart CMS only
./manage.sh restart web   # Restart frontend only  
./manage.sh restart       # Restart all
```

### Schema Changes in Strapi
After modifying `schema.json` files:
1. Restart CMS: `./manage.sh restart cms`
2. Wait for Strapi to sync schema
3. Re-run seeds if needed

---

## 📋 Content Type Patterns

### Localized vs Non-Localized Fields

**Always Localized** (different per language):
- `title`, `name`, `description`, `summary`
- `question`, `answer` (FAQs)
- Rich text / markdown content

**Never Localized** (shared across languages):
- `slug` (URL identifier)
- `order`, `step` (sorting)
- `icon`, `logoUrl`, `imageUrl`
- `email`, `phone`, `websiteUrl`
- `category`, `type` (enum values)
- `price`, `currency` (numbers)

### Seed File Structure
```json
{
  "identifierField": "slug",
  "items": [
    {
      "slug": "example-item",
      "order": 1,
      "icon": "🔥",
      "en": {
        "title": "English Title",
        "description": "English description"
      },
      "ar": {
        "title": "العنوان بالعربية",
        "description": "الوصف بالعربية"
      }
    }
  ]
}
```

---

## 🐛 Debugging Tips

### API Errors
1. Check CMS logs: `./manage.sh logs cms`
2. Look for validation errors in response body
3. Verify schema matches expected data structure

### Seed Failures
1. Run with DEBUG to see API responses
2. Check if slug/identifier already exists
3. Verify Strapi is running: `curl http://127.0.0.1:1337/api/health`

### i18n Issues
1. Confirm default locale is EN in Strapi admin
2. Check that AR locale is enabled
3. Verify content type has i18n enabled in schema

---

## 📝 Lessons Learned Log

### 2026-02-02: Strapi draftAndPublish Feature Causing Data Duplication
**Issue**: Database showed 2x expected records (216 nav-items instead of 27, 594 rows instead of 54 in total including locales).

**Investigation**: 
- PostgreSQL queries revealed each `document_id` had 4 rows instead of 2 (EN + AR)
- Each locale had 2 rows: one with `published_at = NULL` (draft) and one with timestamp (published)
- This happened despite seeder using `publishedAt: new Date()` in API calls
- Root cause: `draftAndPublish: true` in collection schemas creates dual storage

**Root Cause**: Strapi v5 with `draftAndPublish: true`:
- Stores BOTH draft and published versions simultaneously
- Every API create/update creates a draft row first
- Publishing creates a second row with `published_at` timestamp
- Even if API includes `publishedAt`, Strapi maintains both versions
- This is by design for editorial workflows but unnecessary for seed data

**Resolution**: 
- Changed `draftAndPublish: false` in all 20 collection type schemas
- Restarted CMS to apply schema changes: `./manage.sh restart cms`
- Truncated all collection tables to remove old duplicates
- Reseeded with fresh data using `./manage.sh seed --fresh`

**Verification**:
```bash
# Should show exactly 27 EN + 27 AR = 54 total (not 108)
psql -U postgres -d arabiq_strapi -c "SELECT COUNT(*), locale FROM nav_items GROUP BY locale;"

# Should return 0 rows (no duplicates per document_id)
psql -U postgres -d arabiq_strapi -c "SELECT document_id, COUNT(*) FROM nav_items GROUP BY document_id HAVING COUNT(*) > 2;"
```

**Prevention**: 
- For seed-based content without editorial workflow, always set `draftAndPublish: false`
- Only use `draftAndPublish: true` for content that requires draft/review/publish cycles
- When debugging duplicate records, check `published_at` column for NULL/timestamp pairs
- Consider adding database count validation to seed scripts

**Related Files**:
- All schemas in `/apps/cms/src/api/*/content-types/*/schema.json`
- Seed script: `/seed/seed.js` and `/seed/strapi-client.js`

### 2026-02-02: i18n Unique Constraint Issue
**Issue**: Seeding Arabic locales failed with "slug must be unique" errors for all collections.

**Investigation**: 
- Slugs marked as `localized: false` + `required: true`
- Strapi v5 creates unique constraint globally, not per-locale
- When updating AR locale, slug was either duplicated (error) or missing (error)

**Resolution**: 
- Remove `required: true` from all non-localized fields
- Keep `unique: true` (it works correctly for non-localized fields)
- Restart CMS to apply schema changes

**Prevention**: When adding new content types with i18n:
- Never combine `required: true` with `localized: false`
- Test both EN and AR seeding before committing

---

## 🔮 Future Considerations

1. **Database Migrations**: When changing schemas, consider writing migrations for production data
2. **Backup Strategy**: Use `./manage.sh backup` before major changes
3. **Content Validation**: Add pre-seed validation script to catch issues early
4. **Vendor Abstraction**: Consider creating constants for vendor names to easily swap them

---

## 🎯 Quick Troubleshooting Checklist

**Duplicate records appearing?**
1. Check `draftAndPublish` setting in schema (should be `false` for most cases)
2. Query DB for `published_at NULL` entries: `SELECT * FROM table WHERE published_at IS NULL;`
3. Truncate tables and reseed if needed

**Arabic locale failing to create?**
1. Verify no `required: true` on non-localized fields
2. Ensure non-localized fields are excluded from AR payload in seeder
3. Check Strapi logs for specific validation errors

**Seeder creating new records instead of updating?**
1. Verify `identifierField` matches schema (must be unique, non-localized)
2. Check if existing record has that field populated
3. For nav-items, use "slug" not "order" (order is not unique)

---

*Last Updated: 2026-02-02*
*Maintainers: AI Agents & Development Team*
