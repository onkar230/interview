#!/bin/bash

# AI Mock Interview Platform - Setup Verification Script
# This script verifies that the project setup is complete and correct

echo "🔍 Verifying AI Mock Interview Platform Setup..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

# Function to check if a directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

# Check core files
echo "📄 Checking Core Files:"
check_file "package.json"
check_file "tsconfig.json"
check_file "tailwind.config.ts"
check_file ".env.local"
check_file ".env.example"
check_file "components.json"
echo ""

# Check lib files
echo "📚 Checking Library Files:"
check_file "src/lib/openai.ts"
check_file "src/lib/supabase.ts"
check_file "src/lib/interview-prompts.ts"
check_file "src/lib/utils.ts"
echo ""

# Check type definitions
echo "📝 Checking Type Definitions:"
check_file "src/types/interview.ts"
echo ""

# Check shadcn/ui components
echo "🎨 Checking shadcn/ui Components:"
check_file "src/components/ui/button.tsx"
check_file "src/components/ui/card.tsx"
check_file "src/components/ui/input.tsx"
check_file "src/components/ui/textarea.tsx"
check_file "src/components/ui/badge.tsx"
check_file "src/components/ui/alert.tsx"
check_file "src/components/ui/dialog.tsx"
echo ""

# Check directory structure
echo "📁 Checking Directory Structure:"
check_dir "src/app/(auth)/login"
check_dir "src/app/(auth)/signup"
check_dir "src/app/(dashboard)/dashboard"
check_dir "src/app/interview/select"
check_dir "src/app/interview/configure"
check_dir "src/app/interview/[sessionId]"
check_dir "src/app/api/interview/start"
check_dir "src/app/api/interview/audio"
check_dir "src/app/api/interview/message"
check_dir "src/app/api/interview/evaluate"
check_dir "src/app/api/tts"
check_dir "src/components/interview"
echo ""

# Check dependencies
echo "📦 Checking Key Dependencies:"
if npm list openai --depth=0 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} openai"
else
    echo -e "${RED}✗${NC} openai (not installed)"
fi

if npm list @supabase/supabase-js --depth=0 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} @supabase/supabase-js"
else
    echo -e "${RED}✗${NC} @supabase/supabase-js (not installed)"
fi

if npm list next --depth=0 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} next"
else
    echo -e "${RED}✗${NC} next (not installed)"
fi

if npm list typescript --depth=0 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} typescript"
else
    echo -e "${RED}✗${NC} typescript (not installed)"
fi
echo ""

# Check environment variables
echo "🔐 Checking Environment Variables:"
if grep -q "OPENAI_API_KEY=" .env.local 2>/dev/null; then
    if grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env.local; then
        echo -e "${YELLOW}⚠${NC} OPENAI_API_KEY (placeholder - needs configuration)"
    else
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY (configured)"
    fi
else
    echo -e "${RED}✗${NC} OPENAI_API_KEY (missing)"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=your_supabase" .env.local; then
        echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_SUPABASE_URL (placeholder - needs configuration)"
    else
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_URL (configured)"
    fi
else
    echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL (missing)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Setup Summary:"
echo "  Project: AI Mock Interview Platform"
echo "  Framework: Next.js 16.1.1"
echo "  Language: TypeScript"
echo "  UI Library: shadcn/ui + Tailwind CSS v4"
echo "  Backend: Supabase"
echo "  AI: OpenAI GPT-4"
echo ""
echo "📖 Next Steps:"
echo "  1. Configure .env.local with your API keys"
echo "  2. Set up Supabase database tables (see SETUP.md)"
echo "  3. Start development: npm run dev"
echo "  4. Read SETUP.md for detailed instructions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
