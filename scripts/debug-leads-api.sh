#!/bin/bash

# Debug script to query leads via API endpoint
# Usage: ./scripts/debug-leads-api.sh <lead-id>
# Or: ./scripts/debug-leads-api.sh (uses default lead ID)

LEAD_ID=${1:-"f186f9c5-1f6b-41b1-8ab2-8db7c937cdba"}
BASE_URL=${2:-"http://localhost:3000"}

echo "=================================================================================="
echo "🔍 DEBUGGING MISSING LEADS VIA API"
echo "=================================================================================="
echo "Lead ID: $LEAD_ID"
echo "Base URL: $BASE_URL"
echo ""

# Note: This requires authentication token
# You'll need to get the token from browser localStorage or login first
echo "⚠️  This script requires an authentication token."
echo "Please get your access token from browser localStorage:"
echo "  localStorage.getItem('cognito_access_token')"
echo ""
echo "Then run:"
echo "  curl -H 'Authorization: Bearer YOUR_TOKEN' '$BASE_URL/api/debug/leads?leadId=$LEAD_ID' | jq"
echo ""
echo "Or use the browser console:"
echo "  fetch('/api/debug/leads?leadId=$LEAD_ID', {"
echo "    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('cognito_access_token') }"
echo "  }).then(r => r.json()).then(console.log)"
echo ""

