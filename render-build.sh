#!/bin/bash

# Set production environment
export NODE_ENV=production

# Skip husky installation in production
export HUSKY_SKIP_INSTALL=1

# Install dependencies
npm install

# Build the application
npm run build
