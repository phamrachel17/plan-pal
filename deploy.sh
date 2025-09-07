#!/bin/bash

# 🚀 Plan Pal Deployment Script

echo "🚀 Preparing Plan Pal for deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run: git init"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "Pre-deployment commit"
fi

# Generate NextAuth secret
echo "🔐 Generating NextAuth secret..."
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "Your NEXTAUTH_SECRET: $NEXTAUTH_SECRET"

echo ""
echo "✅ Ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Go to vercel.com and import your repository"
echo "3. Add these environment variables:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET" 
echo "   - NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL=https://your-app-name.vercel.app"
echo "   - GEMINI_API_KEY"
echo ""
echo "4. Update Google OAuth redirect URIs to include your Vercel domain"
echo ""
echo "🎉 Your app will be live at: https://your-app-name.vercel.app"
