#!/bin/bash

# Install Supabase CLI
set -e

echo "🚀 Installing Supabase CLI..."

# Check if already installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is already installed"
    supabase --version
    exit 0
fi

# Try npm global install
if command -v npm &> /dev/null; then
    echo "📦 Installing via npm..."
    npm install -g supabase
    if command -v supabase &> /dev/null; then
        echo "✅ Supabase CLI installed via npm"
        supabase --version
        exit 0
    fi
fi

# Try Homebrew
if command -v brew &> /dev/null; then
    echo "🍺 Installing via Homebrew..."
    brew install supabase/tap/supabase
    if command -v supabase &> /dev/null; then
        echo "✅ Supabase CLI installed via Homebrew"
        supabase --version
        exit 0
    fi
fi

# Try direct download for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📥 Downloading Supabase CLI for macOS..."
    curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz -o /tmp/supabase.tar.gz
    tar -xzf /tmp/supabase.tar.gz -C /tmp
    sudo mv /tmp/supabase /usr/local/bin/supabase
    chmod +x /usr/local/bin/supabase
    rm /tmp/supabase.tar.gz
    
    if command -v supabase &> /dev/null; then
        echo "✅ Supabase CLI installed"
        supabase --version
        exit 0
    fi
fi

echo "❌ Failed to install Supabase CLI"
echo "💡 Please install manually from: https://github.com/supabase/cli"
exit 1

