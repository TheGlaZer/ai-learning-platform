#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a commit message"
  echo "Usage: ./git-push.sh \"Your commit message here\""
  exit 1
fi

# Get the commit message from the first argument
COMMIT_MESSAGE="$1"

# Get current branch name
BRANCH=$(git symbolic-ref --short HEAD)

# Add all changes
echo "Adding all changes..."
git add .

# Commit with the provided message
echo "Committing with message: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# Push to the current branch
echo "Pushing to branch: $BRANCH"
git push origin $BRANCH

echo "Done! Changes have been pushed to $BRANCH" 