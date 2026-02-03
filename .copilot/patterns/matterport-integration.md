# Matterport Integration Patterns

## SDK Key Configuration

**SDK Key:** `bxec1h0gt5qpbsh2dt4984uyc`

### Domain Whitelist (my.matterport.com → Settings → Developer Tools)
- `localhost:3000` (dev)
- `arabiq.tech` (production)
- `arabiqdevs.duckdns.org` (staging)
- `goonerdevs.duckdns.org` (alt staging)

## Embedding Modes

### 1. Iframe Mode (Default - Recommended for reliability)
```typescript
// Simple iframe embed - no SDK key needed in URL
const url = `https://my.matterport.com/show?m=${modelId}&play=1&qs=1&title=0&brand=0`;
```
- ✅ Always works for public/unlisted models
- ✅ No SDK key required in URL
- ❌ No programmatic control (hotspots, navigation)

### 2. SDK Mode (Advanced - for interactive features)
```typescript
// Requires SDK key in URL and @matterport/sdk package
import { setupSdk } from '@matterport/sdk';
const sdk = await setupSdk(MATTERPORT_SDK_KEY, {
  space: modelId,
  container: containerRef.current,
});
```
- ✅ Full API control (Mattertags, navigation, events)
- ❌ Requires model in your Matterport account
- ❌ SDK key must be whitelisted for domain

## Common Issues & Fixes

### "Could not load the sdk from api.matterport.com"
**Cause:** Domain not whitelisted OR model not in your account
**Fix:** Use iframe mode (default), or whitelist domain in Matterport dev portal

### "ApolloError: Failed to fetch" / "MdsReadError"
**Cause:** Model API access issue (model not owned or SDK access disabled)
**Fix:** Enable SDK access in model settings, or use iframe mode

### applicationKey in URL causes issues
**Rule:** Don't include `applicationKey` in iframe URL for simple embeds. Only use it with SDK mode.

## Environment Variables

```env
# apps/web/.env.local
NEXT_PUBLIC_MATTERPORT_SDK_KEY=bxec1h0gt5qpbsh2dt4984uyc
```

## Model IDs in Use

| Demo | Model ID | Type |
|------|----------|------|
| Awni Electronics | 6WxfcPSW7KM | ecommerce |
| Cavalli Cafe | dA2YT3w5Jgs | cafe |
| Royal Jewel Hotel | bBwDnZTv2qm | hotel |
| Office for Sale | Tv2upLvBLZ6 | realestate |
| Trust Interior | wheLaeajqUu | showroom |
| EAAC Training | fNbgwVqbf5R | training |

## Hotspot Workflow

Hotspots are managed in Strapi CMS. Each demo type has related items (products, rooms, menu items) with position coordinates.

### Getting Hotspot Position
1. Open model in Matterport: `https://my.matterport.com/show?m=MODEL_ID`
2. Navigate to desired location
3. Use browser console to get position (if SDK mode enabled)
4. Or use Matterport Workshop to place Mattertags

### Strapi Schema for Hotspot Position
```json
{
  "hotspotPosition": {
    "x": 1.23,
    "y": 0.5,
    "z": -2.45
  }
}
```
