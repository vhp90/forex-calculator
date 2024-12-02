#!/bin/bash

# Skip husky installation in production
export HUSKY_SKIP_INSTALL=1

# Install dependencies
npm install

# Build the application
npm run build
