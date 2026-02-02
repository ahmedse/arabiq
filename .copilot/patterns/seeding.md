# Seeding Patterns

## Seed File Structure

### Collection Types
```json
{
  "identifierField": "slug",
  "items": [
    {
      "slug": "unique-identifier",
      "order": 1,
      "icon": "🎯",
      "en": {
        "title": "English Title",
        "description": "English description here."
      },
      "ar": {
        "title": "العنوان بالعربية",
        "description": "الوصف بالعربية هنا."
      }
    }
  ]
}
```

### Single Types
```json
{
  "en": {
    "heroTitle": "Welcome",
    "heroSubtitle": "Subtitle here"
  },
  "ar": {
    "heroTitle": "أهلاً وسهلاً", 
    "heroSubtitle": "النص الفرعي هنا"
  }
}
```

## Seeder Behavior

### Fresh Mode (Default)
- Deletes all existing records
- Creates new records from seed files
- Best for development/reset

### Update Mode
- Finds existing records by identifier
- Updates if exists, creates if not
- Use: `./manage.sh seed update`

## Common Issues

### 1. "This attribute must be unique"
**Cause**: Trying to create AR locale with same slug as EN
**Fix**: See strapi-i18n.md patterns

### 2. "Field is required"
**Cause**: Missing required field in payload
**Fix**: Ensure all required localized fields have values in both en/ar

### 3. "Invalid key {fieldName}"
**Cause**: Seed file has field that doesn't exist in Strapi schema
**Fix**: Add field to schema or remove from seed file

### 4. "documentId not found"
**Cause**: Trying to update record that doesn't exist
**Fix**: Run fresh seed or check identifier matches

## Adding New Seed Files

1. Create JSON file in `/seed/` directory
2. Name it same as Strapi API name (e.g., `faqs.json` for `/api/faqs`)
3. Follow structure patterns above
4. Add to seeder's collection/single-type list in `seed.js`
5. Test both locales: `./manage.sh seed`

## Validation Script

Before seeding, validate JSON:
```bash
for file in seed/*.json; do
  echo "Checking $file"
  python3 -m json.tool "$file" > /dev/null && echo "✓ OK" || echo "✗ ERROR"
done
```
