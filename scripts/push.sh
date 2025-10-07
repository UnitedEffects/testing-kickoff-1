#!/bin/bash
# Runs checks and prevents pushing directly to main/master
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ Cannot push directly to $BRANCH"
  echo "Create a feature branch instead:"
  echo "  git checkout -b feature/your-feature"
  exit 1
fi

echo "Running final checks before push..."
yarn test --run
yarn lint
yarn type-check

echo "Pushing to origin/$BRANCH..."
git push -u origin "$BRANCH"

echo "✅ Pushed successfully"
