# Refinitiv API - Quick Start Guide

## ✅ YOU HAVE EVERYTHING YOU NEED!

You already have access to the Refinitiv APIs. Tokens just expire every ~10 minutes.

---

## 🎯 How to Get a Fresh Token (2 minutes)

### Method 1: API Playground (Easiest)

1. **Go to:** https://api.refinitiv.com/
2. **Sign in** with `anish@lithos-ai.com` / `REDACTED`
3. **Navigate to** any API endpoint (e.g., `/data/filings/v1`)
4. **Click "Try it"** or execute any test request
5. **Open Browser DevTools** (F12)
6. **Go to Network tab**
7. **Look for the request** - copy the `Authorization: Bearer ...` header
8. **Extract the token** (everything after "Bearer ")

### Method 2: Copy from Working Code Sample

When you click on an API endpoint in the playground, it shows code samples including the Bearer token.

Example from your screenshot:
```python
headers = {
    'Authorization': 'Bearer eyJhbGci...'  # This is what you need
}
```

### Method 3: Direct cURL (if supported)

```bash
curl -X POST "https://api.refinitiv.com/auth/oauth2/v1/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

*(If you have client_id/secret - check portal settings)*

---

## 🚀 Once You Have Fresh Token

### Step 1: Set Environment Variable

```bash
export REFINITIV_BEARER_TOKEN="paste_your_fresh_token_here"
```

### Step 2: Run Extractor

```bash
cd /Users/anishkganesh/Downloads/lithos

# Quick test
npx tsx scripts/refinitiv-working-extractor.ts

# Or use this one-liner with inline token
REFINITIV_BEARER_TOKEN="your_token" npx tsx scripts/refinitiv-working-extractor.ts
```

---

## 📋 What the Script Will Do

1. ✅ **Fetch GraphQL Schema** - Understand available data structure
2. ✅ **Search for NI 43-101 docs** - Find technical reports
3. ✅ **Download sample PDFs** - Test document retrieval
4. ✅ **Save to** `./downloads/refinitiv/`

---

## 🎯 For Production Use: Token Auto-Refresh

Once you have a fresh token, I can help you:

1. Extract the Client ID/Secret from the portal
2. Build an auto-refresh mechanism
3. Set up long-running extraction jobs

---

## 📊 Expected Results

**After running with fresh token:**

```
✅ API Access: Working
✅ Bearer Token: Valid
✅ Documents Downloaded: 3-5 test PDFs
✅ GraphQL Schema: Downloaded (review for NI 43-101 fields)
```

---

## ⚡ Super Quick Test (30 seconds)

### Get Fresh Token → Run This:

```bash
# Replace YOUR_FRESH_TOKEN with the token from API Playground
curl "https://api.refinitiv.com/data/filings/v1/retrieval/search/dcn/cr00329072" \
  -H "ClientID: REDACTED" \
  -H "X-Api-Key: REDACTED" \
  -H "Authorization: Bearer YOUR_FRESH_TOKEN"

# If it returns a signed URL → You're good to go!
```

---

## 🔄 Token Expiry Notes

- **Lifetime:** ~10 minutes
- **Refresh:** Get new token from API Playground
- **Auto-refresh:** Possible with client_id/secret (we can set this up)

---

## 📝 Ready-to-Use Scripts

All scripts are ready and waiting for your fresh token:

| Script | Purpose |
|--------|---------|
| `refinitiv-working-extractor.ts` | Download NI 43-101 docs |
| `refinitiv-auth-test.ts` | Test authentication |
| `refinitiv-ni43101-demo.ts` | Full demo with GraphQL |

**Just need:** Fresh bearer token!

---

**Next Action:** Get fresh token from API Playground → Run extractor → Download NI 43-101 PDFs! 🚀
