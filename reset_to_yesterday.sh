#!/bin/bash

# Display what we're going to do
echo "This script will reset your repository to yesterday's state (commit 2e63c9b from 2025-04-23)"
echo "Warning: This will lose all changes from today unless you stash them first."
echo "Current uncommitted changes will be stashed automatically."
echo ""
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Stash any uncommitted changes
git stash save "Uncommitted changes before reset to yesterday $(date)"

# Reset to the commit from yesterday (2e63c9b - first v1 before prod)
git reset --hard 2e63c9b

echo ""
echo "Repository has been reset to the state from yesterday (commit 2e63c9b)."
echo "Your uncommitted changes are saved in the stash and can be recovered with 'git stash pop' if needed." 