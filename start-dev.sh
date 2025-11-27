#!/bin/bash

# Load environment variables from .env.local
export NEXT_PUBLIC_SUPABASE_URL=https://owbuzpxttovfssoarzwc.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=REDACTED_SUPABASE_JWT
export SUPABASE_SERVICE_ROLE_KEY=REDACTED_SUPABASE_JWT

echo "🔧 Environment Variables Set:"
echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Start dev server
npm run dev
