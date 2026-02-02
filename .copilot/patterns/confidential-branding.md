# Confidential Information & Branding Rules

## Vendor Names - DO NOT EXPOSE

### Matterport
- **Status**: Technology partner (confidential)
- **Reason**: Licensing/business considerations
- **Rule**: Never mention in public-facing content

**Replacement Table**:
| ❌ Never Use | ✅ Use Instead |
|--------------|----------------|
| Matterport | (don't mention) |
| Matterport technology | Advanced 3D technology |
| Matterport Pro3 | Professional 3D equipment |
| Matterport Pro3 cameras | Professional 3D cameras |
| Matterport capture | Professional 3D capture |
| Matterport scanning | Professional 3D scanning |
| Certified Matterport partner | Certified 3D technology partner |

### Files to Audit for Vendor Names

When adding or editing content, check:
```
seed/*.json              # All seed files
apps/cms/backups/*.json  # CMS backups
apps/web/components/     # Frontend components
apps/web/messages/       # i18n translation files
docs/*.md               # Documentation (if public)
```

### Grep Command to Find Violations
```bash
grep -ri "matterport" seed/ apps/web/components/ apps/web/messages/ --include="*.json" --include="*.tsx" --include="*.ts"
```

## Brand Voice

### Arabiq Brand Guidelines
- Focus on outcomes, not technology vendors
- Emphasize "Arabic-first" and "MENA region"
- Use "virtual experiences" and "digital twins"
- Highlight AI capabilities with Arabic language support

### Approved Marketing Terms
- "Advanced 3D technology"
- "Photorealistic digital twins"
- "Immersive virtual experiences"
- "Arabic-first AI"
- "Professional 3D capture"
- "Enterprise-grade virtual tours"
