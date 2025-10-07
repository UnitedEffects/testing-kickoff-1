#!/bin/bash
# Runs tests, lint, and type-check before committing
set -e

if [ -z "$1" ]; then
  echo "Error: Commit message required"
  echo "Usage: ./scripts/commit.sh \"your commit message\""
  exit 1
fi

echo "Running tests..."
yarn test --run

echo "Running lint..."
yarn lint

echo "Running type-check..."
yarn type-check

echo "All checks passed! Committing..."
git add .
git commit -m "$1"

echo "✅ Committed successfully"
