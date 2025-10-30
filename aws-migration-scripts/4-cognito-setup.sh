#!/bin/bash
# ============================================================================
# AWS Cognito User Pool Setup Script
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== AWS Cognito Setup ===${NC}"

# Configuration
USER_POOL_NAME="travel-app-users"
APP_CLIENT_NAME="travel-app-client"
DOMAIN_PREFIX="travel-app-$(date +%s)" # Unique domain prefix
AWS_REGION="us-east-1"
CALLBACK_URLS="https://yourdomain.com/auth/callback,http://localhost:3000/auth/callback"
LOGOUT_URLS="https://yourdomain.com,http://localhost:3000"

# OAuth Provider Credentials (set these)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

echo -e "${YELLOW}Step 1: Creating User Pool...${NC}"

# Create User Pool
USER_POOL_OUTPUT=$(aws cognito-idp create-user-pool \
  --pool-name "$USER_POOL_NAME" \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" \
  --auto-verified-attributes email \
  --mfa-configuration OFF \
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT \
  --schema \
    Name=email,AttributeDataType=String,Required=true,Mutable=true \
    Name=name,AttributeDataType=String,Required=false,Mutable=true \
  --schema \
    Name=role,AttributeDataType=String,Required=false,Mutable=true \
  --region "$AWS_REGION" \
  --output json)

USER_POOL_ID=$(echo "$USER_POOL_OUTPUT" | jq -r '.UserPool.Id')
echo -e "${GREEN}✅ User Pool created: ${USER_POOL_ID}${NC}"

echo -e "${YELLOW}Step 2: Creating App Client...${NC}"

# Create App Client
APP_CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "$APP_CLIENT_NAME" \
  --generate-secret false \
  --refresh-token-validity 30 \
  --access-token-validity 60 \
  --id-token-validity 60 \
  --token-validity-units "AccessToken=minutes,IdToken=minutes,RefreshToken=days" \
  --read-attributes email name custom:role \
  --write-attributes email name \
  --explicit-auth-flows \
    ALLOW_USER_PASSWORD_AUTH \
    ALLOW_REFRESH_TOKEN_AUTH \
    ALLOW_USER_SRP_AUTH \
  --supported-identity-providers COGNITO \
  --callback-urls "$CALLBACK_URLS" \
  --logout-urls "$LOGOUT_URLS" \
  --allowed-o-auth-flows code implicit \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client \
  --region "$AWS_REGION" \
  --output json)

APP_CLIENT_ID=$(echo "$APP_CLIENT_OUTPUT" | jq -r '.UserPoolClient.ClientId')
echo -e "${GREEN}✅ App Client created: ${APP_CLIENT_ID}${NC}"

echo -e "${YELLOW}Step 3: Creating User Pool Domain...${NC}"

# Create User Pool Domain
aws cognito-idp create-user-pool-domain \
  --domain "$DOMAIN_PREFIX" \
  --user-pool-id "$USER_POOL_ID" \
  --region "$AWS_REGION"

echo -e "${GREEN}✅ User Pool Domain created: ${DOMAIN_PREFIX}.auth.${AWS_REGION}.amazoncognito.com${NC}"

# Add OAuth Providers if credentials are provided
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ]; then
  echo -e "${YELLOW}Step 4a: Configuring Google OAuth...${NC}"
  
  aws cognito-idp create-identity-provider \
    --user-pool-id "$USER_POOL_ID" \
    --provider-name Google \
    --provider-type Google \
    --provider-details \
      client_id="$GOOGLE_CLIENT_ID" \
      client_secret="$GOOGLE_CLIENT_SECRET" \
      authorize_scopes="email profile openid" \
    --attribute-mapping \
      email=email \
      name=name \
    --region "$AWS_REGION"
  
  echo -e "${GREEN}✅ Google OAuth configured${NC}"
  
  # Update app client to support Google
  aws cognito-idp update-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$APP_CLIENT_ID" \
    --supported-identity-providers COGNITO Google \
    --region "$AWS_REGION"
fi

if [ -n "$GITHUB_CLIENT_ID" ] && [ -n "$GITHUB_CLIENT_SECRET" ]; then
  echo -e "${YELLOW}Step 4b: Configuring GitHub OAuth...${NC}"
  
  aws cognito-idp create-identity-provider \
    --user-pool-id "$USER_POOL_ID" \
    --provider-name GitHub \
    --provider-type GitHub \
    --provider-details \
      client_id="$GITHUB_CLIENT_ID" \
      client_secret="$GITHUB_CLIENT_SECRET" \
    --attribute-mapping \
      email=email \
      name=name \
    --region "$AWS_REGION"
  
  echo -e "${GREEN}✅ GitHub OAuth configured${NC}"
  
  # Update app client to support GitHub
  aws cognito-idp update-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$APP_CLIENT_ID" \
    --supported-identity-providers COGNITO Google GitHub \
    --region "$AWS_REGION"
fi

echo -e "${GREEN}=== Cognito Setup Complete ===${NC}"
echo ""
echo -e "=== SAVE THESE CREDENTIALS ==="
echo -e "User Pool ID: ${USER_POOL_ID}"
echo -e "App Client ID: ${APP_CLIENT_ID}"
echo -e "Region: ${AWS_REGION}"
echo -e "Domain: https://${DOMAIN_PREFIX}.auth.${AWS_REGION}.amazoncognito.com"
echo ""
echo -e "Add these to your .env file:"
echo -e "NEXT_PUBLIC_COGNITO_USER_POOL_ID=${USER_POOL_ID}"
echo -e "NEXT_PUBLIC_COGNITO_CLIENT_ID=${APP_CLIENT_ID}"
echo -e "NEXT_PUBLIC_COGNITO_REGION=${AWS_REGION}"
echo -e "NEXT_PUBLIC_COGNITO_DOMAIN=${DOMAIN_PREFIX}.auth.${AWS_REGION}.amazoncognito.com"
echo ""
echo -e "${YELLOW}Next step: Run user migration script 5-migrate-users.ts${NC}"

