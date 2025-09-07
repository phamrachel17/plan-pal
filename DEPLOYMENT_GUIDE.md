# 🚀 Plan Pal Deployment Guide

## Quick Start (Vercel - Recommended)

### 1. Prepare Your Repository
```bash
# Make sure all your changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your `plan-pal` repository
5. Click "Deploy"

### 3. Add Environment Variables
In your Vercel dashboard, go to Settings → Environment Variables and add:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app-name.vercel.app
GEMINI_API_KEY=your_gemini_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid (optional)
TWILIO_AUTH_TOKEN=your_twilio_auth_token (optional)
TWILIO_PHONE_NUMBER=your_twilio_phone_number (optional)
```

### 4. Update Google OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to "Authorized redirect URIs":
   - `https://your-app-name.vercel.app/api/auth/callback/google`

## Alternative Deployment Options

### Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Add environment variables in Site Settings
4. Deploy automatically

### Railway
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add environment variables
4. Deploy with one click

## Environment Variables Needed

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `NEXTAUTH_URL` | Your app's URL | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | ❌ |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ❌ |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | ❌ |

## Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## Post-Deployment Checklist

- [ ] Test Google OAuth login
- [ ] Test calendar integration
- [ ] Test event creation
- [ ] Test conflict detection
- [ ] Test calendar view
- [ ] Update any hardcoded localhost URLs

## Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable
4. Update Google OAuth redirect URIs

## Troubleshooting

### Common Issues:
1. **OAuth errors**: Check redirect URIs in Google Console
2. **Environment variables**: Ensure all required vars are set
3. **Build errors**: Check for TypeScript errors locally first
4. **API errors**: Check server logs in Vercel dashboard

### Getting Help:
- Check Vercel deployment logs
- Test locally with production environment variables
- Verify all API keys are valid and active
