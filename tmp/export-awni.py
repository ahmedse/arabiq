#!/usr/bin/env python3
"""Export current Awni demo products from local CMS to update seed file."""
import subprocess, json, sys, os

token_line = subprocess.run(
    ['grep', '^SEED_TOKEN=', '/home/ahmed/arabiq/apps/cms/.env'],
    capture_output=True, text=True
).stdout.strip()
token = token_line.split('=', 1)[1] if '=' in token_line else ''

if not token:
    print("ERROR: No SEED_TOKEN found"); sys.exit(1)

base = 'http://localhost:1337'
headers = f'Authorization: Bearer {token}'

# Fetch EN products
en = subprocess.run([
    'curl', '-s',
    f'{base}/api/demo-products?filters[demo][slug][$eq]=awni-electronics&locale=en&populate=images&pagination[pageSize]=50',
    '-H', headers
], capture_output=True, text=True, timeout=10)
en_data = json.loads(en.stdout)

# Fetch AR products
ar = subprocess.run([
    'curl', '-s',
    f'{base}/api/demo-products?filters[demo][slug][$eq]=awni-electronics&locale=ar&populate=images&pagination[pageSize]=50',
    '-H', headers
], capture_output=True, text=True, timeout=10)
ar_data = json.loads(ar.stdout)

# Build AR lookup by documentId
ar_map = {p['documentId']: p for p in ar_data.get('data', [])}

print(f"=== Awni Electronics Products (EN: {len(en_data.get('data',[]))}, AR: {len(ar_data.get('data',[]))}) ===\n")

for p in en_data.get('data', []):
    ar_p = ar_map.get(p['documentId'], {})
    pos = p.get('hotspotPosition')
    has_pos = bool(pos and (pos.get('x',0) != 0 or pos.get('y',0) != 0 or pos.get('z',0) != 0))
    imgs = p.get('images', [])
    img_count = len(imgs) if imgs else 0
    
    print(f"ID: {p['id']} | DocID: {p['documentId']}")
    print(f"  EN: {p.get('name','')}")
    print(f"  AR: {ar_p.get('name','(missing)')}")
    print(f"  Price: {p.get('price',0)} {p.get('currency','EGP')} | Cat: {p.get('category','')} | Brand: {p.get('brand','')}")
    print(f"  SKU: {p.get('sku','')} | InStock: {p.get('inStock',False)}")
    print(f"  Images: {img_count} | HasPosition: {has_pos}")
    if has_pos:
        print(f"  Position: x={pos['x']:.3f} y={pos['y']:.3f} z={pos['z']:.3f}")
        if pos.get('nearestSweepId'):
            print(f"  Sweep: {pos['nearestSweepId']}")
    print()

# Also dump full JSON for reference
with open('/tmp/awni-export.json', 'w') as f:
    json.dump({'en': en_data, 'ar': ar_data}, f, indent=2, ensure_ascii=False)
print(f"Full JSON saved to /tmp/awni-export.json")
