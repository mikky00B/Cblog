<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Clevermike Blog

Custom React + Tiptap blog frontend with a FastAPI/Postgres backend and admin editor.

## Run Locally

**Prerequisites:** Node.js, Python 3.11+, Postgres.

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Install backend dependencies:

   ```bash
   python -m pip install -r backend/requirements.txt
   ```

3. Copy `.envexample` to `.env` and fill the values, especially `DATABASE_URL`, `SECRET_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

4. Create tables and seed the admin user:

   ```bash
   cd backend
   python -m app.scripts.seed_admin
   ```

5. Run the backend:

   ```bash
   cd backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

6. Run the frontend:

   ```bash
   npm run dev
   ```

Open `http://127.0.0.1:3000/admin` and sign in with the seeded admin credentials.

## Useful Commands

```bash
npm run lint
npm run build
cd backend && pytest -q
```

RSS and sitemap are exposed from the API at `/api/rss.xml` and `/api/sitemap.xml`.
