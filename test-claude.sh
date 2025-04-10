#!/bin/bash

# Script to run the application with Claude testing settings

# Check if .env.testing-claude exists
if [ ! -f .env.testing-claude ]; then
  echo "Error: .env.testing-claude file not found!"
  exit 1
fi

# Make sure to update the API key
if grep -q "ANTHROPIC_API_KEY=your_key_here" .env.testing-claude; then
  echo "Warning: You need to set your actual Anthropic API key in .env.testing-claude"
  echo "Edit the file and replace 'your_key_here' with your actual API key."
  exit 1
fi

# Uncomment max retries if needed
if grep -q "^# CLAUDE_MAX_RETRIES=" .env.testing-claude; then
  echo "Note: CLAUDE_MAX_RETRIES is commented out. Edit .env.testing-claude if you want to enable retries."
fi

echo "Running application with Claude testing settings..."
echo "DISABLE_OPENAI_FALLBACK=true"

# Export environment variables from the testing file
export $(grep -v '^#' .env.testing-claude | xargs)

# Run the application
npm run dev

# Clean up
unset DISABLE_OPENAI_FALLBACK
unset ANTHROPIC_API_KEY
unset CLAUDE_MAX_RETRIES 