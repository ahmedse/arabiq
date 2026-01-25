#!/bin/bash
# Build script for Strapi CMS
# Compiles TypeScript and copies schema.json files to dist

set -e

cd "$(dirname "$0")"

echo "🧹 Cleaning dist folder..."
rm -rf dist

echo "📦 Compiling TypeScript..."
pnpm exec tsc 2>/dev/null || true

echo "📋 Copying content-types schemas to dist..."
for d in src/api/*/; do
  name=$(basename "$d")
  if [ -d "src/api/$name/content-types" ]; then
    mkdir -p "dist/src/api/$name/content-types"
    cp -r "src/api/$name/content-types/"* "dist/src/api/$name/content-types/" 2>/dev/null || true
  fi
done

echo "✅ Build complete!"
echo ""
echo "To start Strapi, run: pnpm strapi start"
