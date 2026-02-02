# Copilot Custom Instructions

## Project Context
This is the Arabiq project - a virtual reality/3D tour platform for MENA region businesses.

## Critical Files to Read First
1. `.copilot/PROJECT-INTELLIGENCE.md` - Contains lessons learned, gotchas, and patterns
2. `docs/ARABIQ-WEBSITE-PLAN.md` - Overall project vision
3. `README.md` - Setup instructions

## Key Rules

### 1. Vendor Confidentiality
- NEVER mention "Matterport" in any public-facing content
- Use "advanced 3D technology" or "professional 3D scanning" instead
- This applies to: seed files, frontend components, API responses

### 2. Strapi v5 i18n
- Non-localized fields should NOT be `required: true`
- Use `documentId` not numeric `id` for API calls
- Default locale is EN, secondary is AR

### 3. Seed Files
- Located in `/seed/*.json`
- Structure: `{ en: {...}, ar: {...} }` for localized content
- Use `identifierField` to specify unique key (usually "slug")

### 4. Before Making Changes
- Check PROJECT-INTELLIGENCE.md for known issues
- Run `./manage.sh logs cms` to verify CMS is healthy
- Test both EN and AR locales when touching i18n content

## Common Commands
```bash
./manage.sh seed        # Seed database
./manage.sh restart cms # Restart CMS after schema changes
./manage.sh logs cms    # View CMS logs
```

## When Adding New Lessons
Update `.copilot/PROJECT-INTELLIGENCE.md` with:
- Date and issue description
- Root cause analysis
- Solution applied
- Prevention strategy
