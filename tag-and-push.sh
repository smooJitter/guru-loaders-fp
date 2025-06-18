#!/bin/bash
# Usage: ./tag-and-push.sh v1.2.3
# Bumps version, tags, and pushes to origin

if [ -z "$1" ]; then
  echo "Usage: $0 <tag-name> (e.g. v1.2.3)"
  exit 1
fi

tag=$1

echo "Tagging and pushing $tag..."

# Update package.json version (optional, manual step recommended for accuracy)
# npm version ${tag#v} --no-git-tag-version

git add package.json

git commit -m "Bump version to $tag" || true

git tag $tag

git push origin main

git push origin $tag

echo "Done." 