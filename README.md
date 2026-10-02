# User Guidance App (dev + deployment test)

React + Vite (Vercel) → FastAPI (Render) → Supabase (Auth + Postgres)

```
guidance-app/
├── supabase_schema.sql
├── backend/    FastAPI  (Render)
└── frontend/   React    (Vercel)
```

**Flow:** Frontend logs in via Supabase Auth → gets an access token → sends it as
`Authorization: Bearer <token>` to FastAPI → FastAPI verifies the token with Supabase and
reads/writes the `profiles` table using the service-role key.

**API**
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Render health check |
| GET | `/api/profile` | Get logged-in user's profile |
| PUT | `/api/profile` | Create/update profile |
| GET | `/api/suggestions` | Rule-based suggestions |

---
## 1. Supabase setup
1. https://supabase.com → **New project** (save the DB password).
2. **SQL Editor** → paste `supabase_schema.sql` → **Run**.
3. **Authentication → Providers → Email**: for quick testing, turn **off** "Confirm email"
   (otherwise users must click an email link before logging in).
4. **Project Settings → API** (or "API Keys"). Copy:
   - Project URL → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` / publishable key → `VITE_SUPABASE_ANON_KEY` (frontend, public)
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (backend ONLY, never expose)

## 2. Run locally
**Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in values
uvicorn main:app --reload --port 8000
```
Check http://localhost:8000/health and http://localhost:8000/docs

**Frontend** (new terminal)
```bash
cd frontend
npm install
cp .env.example .env             # fill in values (VITE_API_URL=http://localhost:8000)
npm run dev
```
Open http://localhost:5173 → register → fill profile → see suggestions.

## 3. Push to GitHub
Push the whole `guidance-app` folder as one repo (monorepo). `.env` files are git-ignored.

## 4. Deploy backend → Render
1. https://render.com → **New → Web Service** → connect the GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
3. **Environment variables:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS` = `http://localhost:5173` for now (update after Vercel deploy)
   - `PYTHON_VERSION` = `3.12.3` (optional but recommended)
4. Deploy. Copy your URL, e.g. `https://guidance-api.onrender.com`. Test `/health`.
   (Free tier sleeps after inactivity; first request can take ~30-60 s.)

## 5. Deploy frontend → Vercel
1. https://vercel.com → **Add New → Project** → import the same repo.
2. **Root Directory:** `frontend` (Framework preset: Vite — auto-detected).
3. **Environment Variables:**
   - `VITE_API_URL` = your Render URL (no trailing slash)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Copy your URL, e.g. `https://guidance-app.vercel.app`.

## 6. Connect Vercel ↔ Render
1. **Render → your service → Environment** → set
   `ALLOWED_ORIGINS=https://guidance-app.vercel.app`
   (comma-separate to keep localhost: `https://guidance-app.vercel.app,http://localhost:5173`).
   No trailing slash. Save → Render redeploys.
2. **Supabase → Authentication → URL Configuration:** set **Site URL** to your Vercel URL
   (matters if email confirmation is on).
3. If you change `VITE_API_URL` later, **redeploy** the Vercel project — Vite bakes env vars in at build time.

## Troubleshooting
- **CORS error in browser console** → `ALLOWED_ORIGINS` doesn't exactly match the Vercel URL.
- **401 Invalid or expired token** → backend `SUPABASE_URL`/service key belong to a different project than the frontend's.
- **Request hangs first time** → Render free instance is waking up.
- **Register says "check your email"** → email confirmation is on; confirm or disable it.
