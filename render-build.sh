#!/bin/bash

# Set production environment
export NODE_ENV=production

# Clean install
rm -rf node_modules
rm -f package-lock.json

# Install all dependencies
npm install

# Build the application
npm run build
