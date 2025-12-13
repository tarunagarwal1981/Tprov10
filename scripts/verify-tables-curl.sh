#!/bin/bash

# Verify Itinerary Tables using API endpoint
# This script calls the API route to verify tables
#
# Usage:
#   ./scripts/verify-tables-curl.sh [API_URL]
#
# Example:
#   ./scripts/verify-tables-curl.sh http://localhost:3000
#   ./scripts/verify-tables-curl.sh https://your-app.amplifyapp.com

set -e

API_URL="${1:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/admin/verify-tables"

echo "🔍 Verifying itinerary tables via API..."
echo "📡 Calling: ${ENDPOINT}"
echo ""

response=$(curl -s -w "\n%{http_code}" "${ENDPOINT}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
  
  # Check if all tables exist
  all_exist=$(echo "$body" | grep -o '"allTablesExist": true' || echo "")
  if [ -n "$all_exist" ]; then
    echo ""
    echo "✅ All required tables exist!"
    exit 0
  else
    echo ""
    echo "⚠️  Some tables are missing. Check the output above."
    exit 1
  fi
else
  echo "❌ API call failed with HTTP $http_code"
  echo "$body"
  exit 1
fi

