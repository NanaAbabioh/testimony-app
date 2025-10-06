#!/bin/bash

# Git Pre-commit Check Script
# Run this before every commit to ensure clean repository

echo "🔍 Git Pre-commit Check"
echo "======================="

# Check for large files
echo "📊 Checking for large files (>1MB)..."
find . -type f -size +1M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./functions/node_modules/*" | head -10

# Check current status
echo ""
echo "📋 Current git status:"
git status --porcelain

# Count files to be committed
echo ""
echo "📈 Files to be committed:"
git diff --cached --name-only | wc -l | tr -d ' '

# Check for common problematic patterns
echo ""
echo "⚠️  Checking for problematic files:"
git diff --cached --name-only | grep -E '\.(mp4|webm|avi|mov|mkv|zip|tar|gz)$' || echo "✅ No video/archive files"
git diff --cached --name-only | grep -E 'node_modules' || echo "✅ No node_modules"
git diff --cached --name-only | grep -E 'player-script\.js$' || echo "✅ No player script files"

echo ""
echo "🎯 Ready to commit? Run: git commit -m 'Your message'"