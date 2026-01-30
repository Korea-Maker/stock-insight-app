# Deployment Guide

## Prerequisites

### Required GitHub Secrets

Add the following secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

#### Backend (Koyeb)
- `KOYEB_TOKEN`: Your Koyeb API token
  - Get it from: https://app.koyeb.com/account/api

#### Frontend (Cloudflare Pages)
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
  - Get it from: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: `Cloudflare Pages - Edit`
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID
  - Find it in: https://dash.cloudflare.com → Account Home → Account ID

### Required GitHub Variables

Add the following variable in `Settings` → `Secrets and variables` → `Actions` → `Variables`:

- `NEXT_PUBLIC_API_URL`: Your backend API URL
  - Example: `https://stock-insight-api-zerocoke-labs-425ef635.koyeb.app`

## Deployment Workflow

The deployment runs automatically on:
- Push to `master` or `main` branch
- Manual trigger via GitHub Actions UI

### Jobs

1. **deploy-backend**: Redeploys backend to Koyeb
   - Uses Koyeb CLI
   - Continues even if it fails (non-blocking)

2. **deploy-frontend**: Builds and deploys frontend to Cloudflare Pages
   - Runs `npm run build:pages`
   - Deploys `.vercel/output/static` to Cloudflare Pages

## Manual Deployment

### Backend (Koyeb)
```bash
cd backend
koyeb service redeploy stock-insight-api/stock-insight-api
```

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run build:pages
npx wrangler pages deploy .vercel/output/static --project-name=stock-insight-app
```

## Troubleshooting

### Backend deployment fails
- Check `KOYEB_TOKEN` is valid
- Verify service name matches: `stock-insight-api/stock-insight-api`

### Frontend deployment fails
- Verify `CLOUDFLARE_API_TOKEN` has correct permissions
- Check `CLOUDFLARE_ACCOUNT_ID` is correct
- Ensure `NEXT_PUBLIC_API_URL` variable is set
- Verify project name matches: `stock-insight-app`

### Build fails
- Check Node.js version is 20
- Verify all dependencies are in `package.json`
- Review build logs for specific errors
