#!/bin/bash
# Build standalone Next.js production bundle with static assets
set -e

echo "Building Next.js standalone bundle..."
yarn build

echo "Copying static assets to standalone output..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "✅ Standalone build complete"
echo "To test locally: yarn start:local"
