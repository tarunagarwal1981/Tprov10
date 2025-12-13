#!/bin/bash

# Install AWS CLI v2 on macOS
# This script downloads and installs AWS CLI v2

set -e

echo "🚀 Installing AWS CLI v2..."

# Check if already installed
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI is already installed"
    aws --version
    exit 0
fi

# Download AWS CLI v2 installer
echo "📥 Downloading AWS CLI v2 installer..."
INSTALLER="/tmp/AWSCLIV2.pkg"
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "$INSTALLER"

# Install
echo "📦 Installing AWS CLI v2..."
echo "⚠️  You may be prompted for your password"
sudo installer -pkg "$INSTALLER" -target /

# Clean up
rm "$INSTALLER"

# Verify installation
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI installed successfully!"
    aws --version
else
    echo "❌ Installation failed. Please install manually:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

