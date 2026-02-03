#!/bin/bash

# Seed All VTour Demos
# Usage: ./seed-all.sh [TOKEN]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Get token from argument, env, or .env file
TOKEN="${1:-$SEED_TOKEN}"

if [ -z "$TOKEN" ]; then
  # Try to get from cms .env
  if [ -f "../apps/cms/.env" ]; then
    TOKEN=$(grep '^SEED_TOKEN=' ../apps/cms/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "$TOKEN" ]; then
  # Try STRAPI_API_TOKEN
  if [ -f "../apps/cms/.env" ]; then
    TOKEN=$(grep '^STRAPI_API_TOKEN=' ../apps/cms/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "$TOKEN" ]; then
  echo "❌ No API token found!"
  echo ""
  echo "Usage: ./seed-all.sh <TOKEN>"
  echo "   Or: SEED_TOKEN=xxx ./seed-all.sh"
  echo "   Or: Add SEED_TOKEN to apps/cms/.env"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🚀 ArabiQ VTour Demo Seeder                        ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Seeding 6 demo types with products, rooms, facilities...  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Strapi is running
echo "🔍 Checking Strapi connection..."
if ! curl -s http://127.0.0.1:1337/_health > /dev/null 2>&1; then
  echo "❌ Strapi is not running! Start it first:"
  echo "   cd /home/ahmed/arabiq && ./manage.sh start cms"
  exit 1
fi
echo "✅ Strapi is running"
echo ""

# Seed demos
DEMOS=(
  "seed-awni.js:Awni Electronics (E-commerce)"
  "seed-cavalli.js:Cavalli Cafe (Restaurant)"
  "seed-royal-jewel.js:Royal Jewel Hotel (Hotel)"
  "seed-office.js:Office for Sale (Real Estate)"
  "seed-trust.js:Trust Co. Interior (Showroom)"
  "seed-eaac.js:EAAC Training (Training Center)"
)

SUCCESS=0
FAILED=0

for demo in "${DEMOS[@]}"; do
  SCRIPT="${demo%%:*}"
  NAME="${demo##*:}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Seeding: $NAME"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "$SCRIPT" ]; then
    if node "$SCRIPT" "$TOKEN"; then
      echo "✅ $NAME seeded successfully!"
      ((SUCCESS++))
    else
      echo "❌ $NAME failed to seed"
      ((FAILED++))
    fi
  else
    echo "⚠️  Script not found: $SCRIPT"
    ((FAILED++))
  fi
  
  echo ""
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    📊 Seeding Complete!                    ║"
echo "╠════════════════════════════════════════════════════════════╣"
printf "║  ✅ Success: %-3d                                          ║\n" $SUCCESS
printf "║  ❌ Failed:  %-3d                                          ║\n" $FAILED
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Next steps:                                               ║"
echo "║  1. Start web: cd apps/web && pnpm dev                     ║"
echo "║  2. Open: http://localhost:3000/en/demos                   ║"
echo "║  3. Set hotspots: /demos/[slug]/admin                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
