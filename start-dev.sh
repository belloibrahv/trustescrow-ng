#!/bin/bash

# TrustEscrow NG - Development Startup Script
# This script starts all services needed for local development

set -e

echo "🚀 Starting TrustEscrow NG Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Run migrations if needed
echo "🗄️  Running database migrations..."
npm run db:migrate --workspace=apps/api

echo ""
echo "✅ Infrastructure ready!"
echo ""
echo "📊 Available services:"
echo "   • PostgreSQL: localhost:54320"
echo "   • Redis: localhost:6379"
echo "   • Bull Board: http://localhost:3002"
echo ""
echo "🚀 Starting application servers..."
echo ""
echo "   • API Server: http://localhost:3000"
echo "   • Admin Dashboard: http://localhost:3001"
echo ""
echo "📝 Logs will appear below..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start both API and Admin in parallel
npm run dev:all
