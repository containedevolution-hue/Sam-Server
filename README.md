# Sam Server

Backend for Sam — personal AI assistant. Hosted on Railway, auto-deploys from main.

## Architecture
- Node.js / Express
- PostgreSQL on Railway
- Google OAuth auth (JWT sessions)
- Config/ holds SOUL.md + PERSONALITY.md (Sam's identity, loaded at boot)
- Frontend: `sam.containedevolution.com` (Vercel PWA) calls this server
- No Drive, no third-party data dependencies

## Env
- `DATABASE_URL` (Railway Postgres)
- `GOOGLE_CLIENT_ID`
- `JWT_SECRET`
- `FRONTEND_URL` (for CORS — e.g. https://sam.containedevolution.com)
- `PORT` (Railway sets this)

## Boot sequence
1. Server starts
2. Migrations auto-run (idempotent, IF NOT EXISTS)
3. Config files (SOUL, PERSONALITY) cached in process memory
4. Listens on PORT

## Endpoints
- `GET /health` — status check
- `POST /api/auth/login` — Google id_token → JWT
- `GET /api/auth/me` — current session
- `GET /api/sam-memory/*` — Sam's persistent memory (to be built)
- `GET /api/identity` — returns SOUL + PERSONALITY content
