#!/bin/bash

# Create the ~/.local/bin folder if it doesn't exist
mkdir -p ~/.local/bin

# Get the absolute path to the project folder
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Make files executable
chmod +x "$PROJECT_DIR/dist/index.js"
chmod +x "$PROJECT_DIR/dist/wnpx.js"

# Recreate symlinks
ln -sf "$PROJECT_DIR/dist/index.js" ~/.local/bin/wnpm
ln -sf "$PROJECT_DIR/dist/wnpx.js" ~/.local/bin/wnpx

echo "✅ [wnpm] wnpm and wnpx commands are bound to ~/.local/bin!"