# 🚨 URGENT SECURITY ACTIONS REQUIRED

**Status:** CRITICAL - Exposed API Keys Detected
**Priority:** IMMEDIATE ACTION REQUIRED
**Estimated Time:** 15-20 minutes

---

## ⚡ Quick Action Steps

### 1. Revoke Exposed API Keys (5 minutes)

#### OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Find key starting with: `sk-proj-ZimyM43t...`
3. Click **Delete** or **Revoke**
4. Generate NEW key → Save securely

#### Finnhub API Key
1. Go to: https://finnhub.io/dashboard
2. Click **Regenerate API Token**
3. Copy new key → Save securely

#### Polar API Key (Legacy - Optional)
1. Go to: https://polar.sh/settings
2. Revoke token: `polar_oat_RQV4j9...`
3. (No replacement needed - migrating to Lemon Squeezy)

---

### 2. Get Lemon Squeezy Credentials (10 minutes)

1. Go to: https://app.lemonsqueezy.com/settings/api
2. Create new API key → Save securely
3. Go to: https://app.lemonsqueezy.com/products
4. Find your product → Copy Store ID and Variant ID
5. Go to Webhooks → Create webhook → Copy Webhook Secret

You need these 4 values:
- `LEMONSQUEEZY_API_KEY` (JWT format)
- `LEMONSQUEEZY_STORE_ID` (numeric)
- `LEMONSQUEEZY_VARIANT_ID` (numeric)
- `LEMONSQUEEZY_WEBHOOK_SECRET` (string)

---

### 3. Update backend/.env (2 minutes)

```bash
cd backend

# Backup old file (contains exposed keys)
mv .env .env.OLD_EXPOSED_KEYS

# Copy template
cp .env.example .env

# Edit with your NEW keys
nano .env  # or use your preferred editor
```

**Update these lines in `.env`:**
```bash
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
FINNHUB_API=YOUR_NEW_FINNHUB_KEY_HERE

# Remove these (Polar is deprecated):
# POLAR_API_KEY=...
# POLAR_BASE_URL=...
# POLAR_PRODUCT_ID=...

# Add Lemon Squeezy (NEW):
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1Qi...YOUR_KEY
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_VARIANT_ID=67890
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

**Save and exit.**

---

### 4. Update GitHub Actions Secrets (3 minutes)

Go to: https://github.com/Korea-Maker/stock-insight-app/settings/secrets/actions

Click **New repository secret** for each:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | Your NEW OpenAI key |
| `FINNHUB_API` | Your NEW Finnhub key |
| `LEMONSQUEEZY_API_KEY` | From Lemon Squeezy dashboard |
| `LEMONSQUEEZY_STORE_ID` | From Lemon Squeezy dashboard |
| `LEMONSQUEEZY_VARIANT_ID` | From Lemon Squeezy dashboard |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | From Lemon Squeezy webhooks |

---

### 5. Test Configuration (2 minutes)

```bash
# Start backend
cd backend
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows
python main.py

# In another terminal, test health check
curl http://localhost:8000/health

# If successful, you should see:
# {"status":"healthy","timestamp":"..."}
```

---

## ✅ Verification Checklist

After completing the above steps, verify:

- [ ] Old OpenAI key revoked
- [ ] Old Finnhub key revoked
- [ ] New `backend/.env` created with NEW keys
- [ ] Old `.env.OLD_EXPOSED_KEYS` exists (backup)
- [ ] Lemon Squeezy credentials obtained
- [ ] GitHub Actions secrets updated
- [ ] Backend starts without errors
- [ ] Health check passes

---

## 📋 Why This Happened

**Good News:**
- ✅ The `.env` file was NEVER committed to git
- ✅ Keys are NOT in git history
- ✅ Repository is properly configured with `.gitignore`

**How Keys Were Exposed:**
- The `.env` file exists in your local working directory
- During security audit, the file was read to verify configuration
- This is a LOCAL exposure only (not public)

**Risk Level:**
- 🟡 **Medium** - Keys exposed locally but not in git
- 🟢 **Low** - After revocation and replacement

---

## 🛡️ Prevention (Already Done)

The security review completed these protections:

✅ Updated `.env.example` with Lemon Squeezy config
✅ Enhanced `.gitleaks.toml` to detect Lemon Squeezy keys
✅ Created `docs/SECURITY.md` guide
✅ Verified `.gitignore` properly configured
✅ Scanned codebase - no hardcoded secrets

---

## 📚 Additional Resources

- **Full Security Audit:** `SECURITY_AUDIT_REPORT.md`
- **Security Guide:** `docs/SECURITY.md`
- **Gitleaks Config:** `.gitleaks.toml`
- **Template:** `backend/.env.example`

---

## ❓ Questions?

See detailed guides:
- **SECURITY_AUDIT_REPORT.md** - Complete security analysis
- **docs/SECURITY.md** - Ongoing security practices

---

**Created:** 2026-01-30
**Urgency:** IMMEDIATE
**Estimated Impact:** 15-20 minutes of work
