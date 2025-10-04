# Netlify Deployment Guide

## 🚀 Quick Setup

### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Login to Netlify
```bash
netlify login
```

### 3. Initialize Netlify in your project
```bash
netlify init
```

### 4. Deploy to Netlify
```bash
netlify deploy
```

## 📋 Manual Setup Steps

### Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Connect your repository

### Step 2: Configure Build Settings
In Netlify dashboard:
- **Build command**: `npm run netlify:build`
- **Publish directory**: `out`
- **Node version**: `18`

### Step 3: Set Environment Variables
In Netlify dashboard → Site settings → Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 4: Configure Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS records as instructed

## 🔧 Local Development with Netlify

### Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Start local development server
```bash
npm run netlify:dev
```

This will:
- Start Next.js dev server
- Simulate Netlify functions locally
- Provide Netlify-specific environment variables

## 📁 Project Structure for Netlify

```
your-project/
├── netlify.toml          # Netlify configuration
├── netlify/
│   └── functions/        # Serverless functions
├── out/                  # Static export output
├── public/              # Static assets
└── src/                 # Source code
```

## 🛠️ Build Process

1. **Development**: `npm run dev`
2. **Build**: `npm run build`
3. **Export**: `npm run export` (creates static files in `out/`)
4. **Deploy**: `netlify deploy`

## 🔄 Continuous Deployment

Netlify automatically deploys when you:
- Push to main branch
- Create a pull request
- Merge a pull request

## 📊 Performance Optimization

### Enable Build Plugins
In `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Cache Headers
Static assets are automatically cached with optimal headers.

### Edge Functions
Use Netlify Edge Functions for:
- API routes
- Authentication
- Form handling
- Image optimization

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version (use 18)
   - Verify all dependencies are installed
   - Check environment variables

2. **Routing Issues**
   - Ensure `netlify.toml` has proper redirects
   - Check that static export is working

3. **Environment Variables**
   - Verify all required variables are set
   - Check variable names match exactly

### Debug Commands:
```bash
# Check build locally
npm run build && npm run export

# Test Netlify functions locally
netlify dev

# Check deployment logs
netlify logs
```

## 📈 Monitoring & Analytics

### Netlify Analytics
- Built-in analytics in Netlify dashboard
- Page views, bandwidth usage
- Build times and success rates

### Custom Analytics
Add to your app:
```javascript
// Google Analytics
gtag('config', 'GA_MEASUREMENT_ID');

// Mixpanel
mixpanel.track('Page View');
```

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Automatically enabled on Netlify
3. **Headers**: Configured in `netlify.toml`
4. **Dependencies**: Keep updated for security patches

## 💰 Pricing

- **Free Tier**: 100GB bandwidth, 300 build minutes
- **Pro**: $19/month - 1TB bandwidth, 1000 build minutes
- **Business**: $99/month - 1TB bandwidth, 5000 build minutes

## 🆘 Support

- [Netlify Docs](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Community Forum](https://community.netlify.com/)

