# Vercel Deployment - Quick Reference

## Prerequisites

1. Deploy Socket.io server first (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. Get your Socket.io server URL

## Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from deckhand directory)
cd deckhand
vercel

# For production
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure:
   - **Root Directory**: `deckhand`
   - **Framework Preset**: Next.js
   - **Build Command**: (auto-detected)
   - **Install Command**: `bun install`

## Environment Variables

Add this in Vercel Dashboard → Settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-socket.railway.app` | Production, Preview, Development |

**Important**: Environment variables must be set in the Vercel Dashboard, not in `vercel.json` (deprecated).

Example values:
- Railway: `https://deckhand-socket-production.up.railway.app`
- Render: `https://deckhand-socket.onrender.com`
- Fly.io: `https://deckhand-socket.fly.dev`

## Vercel Settings

### Build & Development Settings
- **Framework Preset**: Next.js
- **Build Command**: `bun run build` (from vercel.json)
- **Install Command**: `bun install` (from vercel.json)
- **Output Directory**: `.next`

### Project Settings
- **Node.js Version**: 18.x or 20.x
- **Regions**: bom1 (Mumbai) - configured in vercel.json

## After Deployment

1. **Get your Vercel URL**: `https://your-app.vercel.app`

2. **Update Socket.io CORS** in your socket server:
   ```javascript
   cors: {
     origin: [
       'http://localhost:3000',
       'https://your-app.vercel.app',
       'https://*.vercel.app',
     ],
   }
   ```

3. **Test**:
   - Visit: `https://your-app.vercel.app`
   - Upload presentation
   - Start presentation
   - Check browser console: Should see Socket.io connection

## Vercel Domains

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `deckhand.yourdomain.com`
3. Update DNS records as instructed
4. Update Socket.io CORS with new domain

## Deployment Commands

```bash
# Preview deployment
bun run deploy:preview

# Production deployment
bun run deploy:vercel
```

## Troubleshooting

### Build Fails
- Check `bun install` works locally
- Verify no TypeScript errors: `bun run lint`
- Check build logs in Vercel dashboard

### Socket Connection Fails
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
- Check Socket.io server is running: `curl https://your-socket-url/health`
- Check CORS allows Vercel domain
- Open browser DevTools → Console for connection errors

### Environment Variables Not Working
- Redeploy after adding variables
- Check variable is set in correct environment (Production/Preview/Development)

## Monitoring

- **Dashboard**: https://vercel.com/dashboard
- **Analytics**: Project → Analytics
- **Logs**: Project → Deployments → Latest → Function Logs
- **Speed Insights**: Project → Speed Insights

## Costs

**Vercel Free Tier**:
- ✅ 100 GB bandwidth
- ✅ 100 GB-hours serverless function execution
- ✅ Unlimited deployments
- ✅ Unlimited sites

Good for:
- Personal projects
- Testing
- Small team demos

**Pro Plan** ($20/month):
- More bandwidth
- Analytics
- Password protection
- Better support

## Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Next.js on Vercel: https://nextjs.org/docs/deployment
