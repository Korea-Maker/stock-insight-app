# Security Guide

## Overview

This document outlines security practices, secret management, and required configurations for the Stock Insight App.

---

## Secret Management

### Environment Variables

All secrets MUST be stored in `.env` files and NEVER committed to git. The `.env` file is in `.gitignore`.

### Required Secrets

#### Backend Secrets

Create `backend/.env` with the following variables:

```bash
# AI APIs (Required)
OPENAI_API_KEY=sk-proj-your-actual-key
FINNHUB_API=your-finnhub-api-key

# AI APIs (Optional)
ANTHROPIC_API_KEY=sk-ant-your-actual-key

# Payment System (Production)
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_VARIANT_ID=67890
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_your-webhook-secret

# Database (Optional - defaults provided)
POSTGRES_USER=quantboard
POSTGRES_PASSWORD=secure-password-here
POSTGRES_DB=quantboard
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**Template:** Use `backend/.env.example` as a template.

---

## GitHub Actions Secrets

For CI/CD deployment, configure the following secrets in GitHub repository settings:

### Required Secrets

| Secret Name | Purpose | Where to Get |
|-------------|---------|--------------|
| `OPENAI_API_KEY` | AI analysis | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | AI fallback | https://console.anthropic.com/ |
| `FINNHUB_API` | Stock data | https://finnhub.io/dashboard |
| `LEMONSQUEEZY_API_KEY` | Payment processing | https://app.lemonsqueezy.com/settings/api |
| `LEMONSQUEEZY_STORE_ID` | Store identifier | Lemon Squeezy Dashboard |
| `LEMONSQUEEZY_VARIANT_ID` | Product variant | Lemon Squeezy Dashboard |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook verification | Lemon Squeezy Webhooks |
| `KOYEB_TOKEN` | Deployment to Koyeb | https://app.koyeb.com/account/api |
| `CLOUDFLARE_API_TOKEN` | CDN/DNS | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | CDN/DNS | Cloudflare Dashboard |

### How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name from the table above

---

## Secret Scanning

### Gitleaks Configuration

The project uses [Gitleaks](https://github.com/gitleaks/gitleaks) to prevent secret leaks.

**Configuration:** `.gitleaks.toml`

### Detected Secret Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `sk-proj-*` | OpenAI API Keys | `sk-proj-abc123...` |
| `sk-ant-*` | Anthropic API Keys | `sk-ant-xyz789...` |
| `eyJ0eXAi...` | Lemon Squeezy JWT | `eyJ0eXAiOiJKV1Qi...` |
| Generic | Finnhub keys | Detected via entropy |

### Running Secret Scan Locally

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from: https://github.com/gitleaks/gitleaks/releases

# Scan repository
gitleaks detect --verbose

# Scan git history
gitleaks detect --verbose --log-opts="--all"
```

### SAST Workflow

GitHub Actions automatically runs secret scanning on every push:

- **Workflow:** `.github/workflows/sast.yml`
- **Tools:** Gitleaks
- **Runs on:** Every push, pull request

---

## Security Best Practices

### DO ✅

1. **Always use `.env` files** for secrets
2. **Use `.env.example`** as a template (with placeholder values)
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use different secrets** for development/staging/production
5. **Enable GitHub secret scanning** (Settings → Security → Secret scanning)
6. **Review `.gitignore`** before committing new files
7. **Use HTTPS** for all API connections (enforced in code)

### DON'T ❌

1. **Never commit `.env` files** to git
2. **Never hardcode secrets** in source code
3. **Never log secrets** to console or files
4. **Never share secrets** via email/Slack/Discord
5. **Never use production secrets** in development
6. **Never commit `backend/.env`** (it's gitignored but be careful)
7. **Never bypass SSL verification** in production

---

## Incident Response

### If a Secret is Leaked

1. **Revoke immediately:**
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/
   - Finnhub: https://finnhub.io/dashboard
   - Lemon Squeezy: https://app.lemonsqueezy.com/settings/api

2. **Generate new secret** from the provider

3. **Update secret everywhere:**
   - Local `.env` file
   - GitHub Actions secrets
   - Deployment platform (Koyeb, Cloudflare, etc.)

4. **Review git history:**
   ```bash
   # Search for leaked secret in history
   git log -p | grep "sk-proj-"

   # If found in history, consider using git-filter-repo
   # https://github.com/newren/git-filter-repo
   ```

5. **Monitor for unauthorized usage:**
   - Check API usage dashboards
   - Look for unusual spikes or patterns

---

## Code Security Checklist

### Before Committing

- [ ] No secrets in code
- [ ] `.env` is in `.gitignore`
- [ ] All API keys use environment variables
- [ ] No sensitive data in logs
- [ ] HTTPS enforced for external APIs
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (using SQLAlchemy ORM)
- [ ] XSS prevention (React escapes by default)

### Before Deploying

- [ ] Production secrets configured
- [ ] GitHub Actions secrets set
- [ ] Deployment platform secrets set
- [ ] CORS origins restricted (not `*`)
- [ ] Debug mode disabled
- [ ] Error messages sanitized (no stack traces to users)
- [ ] Rate limiting configured (if applicable)
- [ ] HTTPS/TLS enabled

---

## API Key Security

### OpenAI API Key

- **Format:** `sk-proj-...` (new) or `sk-...` (legacy)
- **Permissions:** Limit to required models only
- **Monitoring:** Enable usage alerts
- **Rotation:** Every 90 days

### Anthropic API Key

- **Format:** `sk-ant-...`
- **Permissions:** Restrict to required workspaces
- **Monitoring:** Check usage in console
- **Rotation:** Every 90 days

### Finnhub API Key

- **Format:** 20-character alphanumeric
- **Tier:** Free tier limited to 60 calls/minute
- **Monitoring:** Check API quota in dashboard
- **Rotation:** On-demand

### Lemon Squeezy API Key

- **Format:** JWT (eyJ0eXAi...)
- **Permissions:** Minimal required scopes
- **Webhook Secret:** Unique per webhook endpoint
- **Rotation:** Every 90 days or on suspicion of leak

---

## Contact

For security issues, please:

1. **Do NOT create public issues**
2. Email security concerns to: [Maintainer Email]
3. Use GitHub Security Advisories (if critical)

---

**Last Updated:** 2026-01-30
