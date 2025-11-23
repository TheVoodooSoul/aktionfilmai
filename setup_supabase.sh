#!/bin/bash

# AktionFilmAI - Supabase Setup Script
# This script sets up your Supabase database with all tables and policies

set -e  # Exit on error

echo "🚀 Setting up Supabase for AktionFilmAI..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    brew install supabase/tap/supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Login (will open browser)
echo "📝 Step 1: Logging in to Supabase..."
supabase login
echo ""

# Step 2: Initialize if not already initialized
if [ ! -d "supabase" ]; then
    echo "📝 Step 2: Initializing Supabase in project..."
    supabase init
else
    echo "✅ Supabase already initialized"
fi
echo ""

# Step 3: Link to project
echo "📝 Step 3: Linking to your Supabase project..."
echo "Project ref: bqxxyqlbxyvfuanoiwyh"
supabase link --project-ref bqxxyqlbxyvfuanoiwyh
echo ""

# Step 4: Pull current schema
echo "📝 Step 4: Pulling current database schema..."
supabase db pull
echo ""

# Step 5: Check what we have
echo "📊 Current state:"
ls -la supabase/migrations/ 2>/dev/null || echo "No migrations yet"
echo ""

# Step 6: Create new migration
echo "📝 Step 5: Creating new migration..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_complete_setup.sql"

# Copy our setup SQL to the new migration
cp migrations/00_complete_setup.sql "$MIGRATION_FILE"
echo "✅ Migration file created: $MIGRATION_FILE"
echo ""

# Step 7: Push to Supabase
echo "📝 Step 6: Pushing migration to Supabase..."
echo "This will create all tables, RLS policies, triggers, and storage buckets."
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Go to Supabase Dashboard → Authentication → Users"
    echo "2. Create admin user: admin@aktionfilm.ai"
    echo "3. Copy the user ID"
    echo "4. Run: UPDATE profiles SET credits = 9999, is_admin = true WHERE id = 'USER_ID';"
else
    echo "❌ Cancelled. Run this script again when ready."
fi
