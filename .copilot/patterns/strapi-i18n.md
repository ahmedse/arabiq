# Strapi v5 i18n Patterns

## The Golden Rules
> **1. Never combine `required: true` with `localized: false`**  
> This causes a catch-22 during localization creation.

> **2. Always set `draftAndPublish: false` for seed data**  
> Otherwise Strapi stores BOTH draft and published versions, causing 2x duplication.

## Field Configuration Patterns

### ✅ Correct: Non-Localized Unique Field
```json
"slug": {
  "type": "string",
  "unique": true,
  "pluginOptions": {
    "i18n": { "localized": false }
  }
}
```

### ✅ Correct: Localized Required Field  
```json
"title": {
  "type": "string",
  "required": true,
  "pluginOptions": {
    "i18n": { "localized": true }
  }
}
```

### ❌ Wrong: Non-Localized Required Field
```json
"slug": {
  "type": "string",
  "unique": true,
  "required": true,  // ← REMOVE THIS
  "pluginOptions": {
    "i18n": { "localized": false }
  }
}
```

## API Patterns for Localizations

### Creating Default Locale (EN)
```javascript
// POST /api/collection-name
const response = await fetch(`${STRAPI_URL}/api/faqs`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    data: {
      slug: 'my-faq',
      category: 'general',
      question: 'English question?',
      answer: 'English answer.'
    }
  })
});
```

### Creating/Updating Secondary Locale (AR)
```javascript
// PUT /api/collection-name/{documentId}?locale=ar
const response = await fetch(`${STRAPI_URL}/api/faqs/${documentId}?locale=ar`, {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    data: {
      // Include non-localized fields (they're shared but still expected)
      slug: 'my-faq',
      category: 'general',
      // Localized fields with Arabic content
      question: 'السؤال بالعربية؟',
      answer: 'الإجابة بالعربية.'
    }
  })
});
```

## Content Type Schema Template

```json
{
  "kind": "collectionType",
  "collectionName": "my_items",
  "info": {
    "singularName": "my-item",
    "pluralName": "my-items",
    "displayName": "My Item"
  },
  "options": { 
    "draftAndPublish": false  // ✅ Critical: prevents duplicate storage
  },
  "pluginOptions": {
    "i18n": { "localized": true }
  },
  "attributes": {
    "slug": {
      "type": "string",
      "unique": true,
      "pluginOptions": { "i18n": { "localized": false } }
    },
    "order": {
      "type": "integer",
      "default": 0,
      "pluginOptions": { "i18n": { "localized": false } }
    },
    "title": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
}
```

## Debugging Checklist

When i18n seeding fails:

1. [ ] Check if failing field has `required: true` + `localized: false`
2. [ ] Verify default locale (EN) is set in Strapi admin
3. [ ] Confirm AR locale is enabled in Strapi settings
4. [ ] Check CMS logs for detailed error: `./manage.sh logs cms`
5. [ ] Restart CMS after schema changes: `./manage.sh restart cms`
6. [ ] Wait ~10 seconds for schema sync before re-seeding
When seeing duplicate records:

1. [ ] Check `draftAndPublish` in schema (should be `false` for seeds)
2. [ ] Query database for NULL vs timestamped `published_at` values
3. [ ] Truncate affected tables and reseed: `./manage.sh seed --fresh`

## Common Errors & Solutions

### "This attribute must be unique"
- **Cause**: Non-localized field included in secondary locale creation
- **Fix**: Exclude non-localized fields from AR payload OR remove `required: true`

### "Field must be a string type, but was null"
- **Cause**: Required non-localized field not included in AR locale
- **Fix**: Remove `required: true` from the field definition

### Duplicate entries (2x expected count)
- **Cause**: `draftAndPublish: true` creates both draft and published versions
- **Fix**: Set `draftAndPublish: false` in schema, truncate tables, reseed