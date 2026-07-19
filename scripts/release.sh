#!/usr/bin/env bash
set -e

# FuelStats App Release Script

VERSION=$(node -p "require('./package.json').version")

echo "=========================================="
echo " Releasing FuelStats App v$VERSION"
echo "=========================================="

# 1. Check working directory status
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Working tree has uncommitted changes. Please commit or stash them first."
  exit 1
fi

# 2. Type-check & Production Build
echo "📦 Running type-checks and production build..."
npm run build

# 3. Build & Embed Client for Server Production
echo "🚀 Embedding production client to server..."
npm run build:embed

# 4. Create Git Tag if not tagged
TAG_NAME="v$VERSION"
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo "⚠️ Tag $TAG_NAME already exists."
else
  echo "🏷️ Creating Git Tag $TAG_NAME..."
  git tag -a "$TAG_NAME" -m "FuelStats App $TAG_NAME"
  echo "✅ Tag $TAG_NAME created."
fi

echo "=========================================="
echo " 🎉 FuelStats App v$VERSION release ready!"
echo " Run 'git push origin master --tags' to push tags."
echo "=========================================="
