# VPS Deployment Guide

This guide deploys the Clevermike Blog stack to a Linux VPS and sets up GitHub Actions so every push to `main` updates the server.

The app has two deployable parts:

- Frontend: React/Vite static build served by Nginx.
- Backend: FastAPI app served by Uvicorn behind Nginx.
- Database: PostgreSQL.
- Media uploads: local `backend/uploads` directory served by FastAPI at `/uploads`.

The examples use Ubuntu 22.04/24.04, Nginx, systemd, PostgreSQL, Python 3.11+, and Node.js 20.

## Assumptions

Replace these values throughout the guide:

```bash
APP_NAME=clevermike-blog
DOMAIN=yourdomain.com
DEPLOY_USER=deploy
APP_DIR=/var/www/clevermike-blog
BACKEND_PORT=8000
DB_NAME=clevermike_blog
DB_USER=clevermike_blog
```

Use your real domain, repository URL, and strong passwords/secrets.

## 1. Prepare DNS

Create DNS records for the domain:

```txt
A     yourdomain.com       YOUR_VPS_IPV4
A     www.yourdomain.com   YOUR_VPS_IPV4
```

Wait until DNS resolves before enabling HTTPS.

## 2. Initial VPS Setup

SSH into the VPS as root:

```bash
ssh root@YOUR_VPS_IP
```

Update packages:

```bash
apt update
apt upgrade -y
```

Install required system packages:

```bash
apt install -y \
  nginx \
  postgresql postgresql-contrib \
  python3 python3-venv python3-pip \
  git curl unzip \
  build-essential \
  certbot python3-certbot-nginx
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

Create a non-root deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
```

Set up SSH access for the deploy user. From your local machine:

```bash
ssh-copy-id deploy@YOUR_VPS_IP
```

Then log in as deploy:

```bash
ssh deploy@YOUR_VPS_IP
```

## 3. Create PostgreSQL Database

On the VPS:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE clevermike_blog;
CREATE USER clevermike_blog WITH ENCRYPTED PASSWORD 'REPLACE_WITH_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE clevermike_blog TO clevermike_blog;
\c clevermike_blog
GRANT ALL ON SCHEMA public TO clevermike_blog;
\q
```

The backend `DATABASE_URL` will look like:

```bash
postgresql+psycopg://clevermike_blog:REPLACE_WITH_STRONG_DB_PASSWORD@127.0.0.1:5432/clevermike_blog
```

## 4. Clone the Repository

Create the app directory:

```bash
sudo mkdir -p /var/www/clevermike-blog
sudo chown deploy:deploy /var/www/clevermike-blog
```

Clone your repo:

```bash
git clone git@github.com:YOUR_GITHUB_USERNAME/YOUR_REPO.git /var/www/clevermike-blog
cd /var/www/clevermike-blog
```

If the repo is private, add a deploy key in GitHub first:

```bash
ssh-keygen -t ed25519 -C "clevermike-blog-vps" -f ~/.ssh/clevermike_blog_deploy
cat ~/.ssh/clevermike_blog_deploy.pub
```

Add the public key to GitHub:

```txt
Repository Settings -> Deploy keys -> Add deploy key -> Allow read access
```

Configure SSH for GitHub:

```bash
nano ~/.ssh/config
```

Add:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/clevermike_blog_deploy
  IdentitiesOnly yes
```

Test:

```bash
ssh -T git@github.com
```

## 5. Configure Environment Variables

Create the production `.env` file in the repository root:

```bash
cd /var/www/clevermike-blog
nano .env
```

Use:

```bash
APP_NAME="Clevermike Blog API"
APP_ENV="production"
API_PREFIX="/api"

FRONTEND_ORIGIN="https://yourdomain.com"
SITE_URL="https://yourdomain.com"

SECRET_KEY="REPLACE_WITH_LONG_RANDOM_SECRET"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

DATABASE_URL="postgresql+psycopg://clevermike_blog:REPLACE_WITH_STRONG_DB_PASSWORD@127.0.0.1:5432/clevermike_blog"

MEDIA_STORAGE="local"
MEDIA_LOCAL_DIR="/var/www/clevermike-blog/backend/uploads"
MEDIA_PUBLIC_BASE_URL="https://yourdomain.com/uploads"
MAX_UPLOAD_MB=5

ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="REPLACE_WITH_STRONG_ADMIN_PASSWORD"

VITE_API_BASE_URL="https://yourdomain.com/api"
```

Generate a strong `SECRET_KEY`:

```bash
python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
```

Lock down the `.env` file:

```bash
chmod 600 .env
```

## 6. Install Backend Dependencies

```bash
cd /var/www/clevermike-blog/backend
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Run migrations:

```bash
alembic upgrade head
```

Seed the admin user and default categories:

```bash
python -m app.scripts.seed_admin
```

Create the upload directory:

```bash
mkdir -p /var/www/clevermike-blog/backend/uploads
chmod 755 /var/www/clevermike-blog/backend/uploads
```

## 7. Build the Frontend

From the repository root:

```bash
cd /var/www/clevermike-blog
npm ci
npm run build
```

The static frontend is now in:

```bash
/var/www/clevermike-blog/dist
```

## 8. Create the Backend systemd Service

Create a systemd service:

```bash
sudo nano /etc/systemd/system/clevermike-blog.service
```

Add:

```ini
[Unit]
Description=Clevermike Blog FastAPI backend
After=network.target postgresql.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/var/www/clevermike-blog/backend
EnvironmentFile=/var/www/clevermike-blog/.env
ExecStart=/var/www/clevermike-blog/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable clevermike-blog
sudo systemctl start clevermike-blog
sudo systemctl status clevermike-blog
```

Check logs:

```bash
sudo journalctl -u clevermike-blog -f
```

Test locally on the VPS:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/posts
```

## 9. Configure Nginx

Create the Nginx site:

```bash
sudo nano /etc/nginx/sites-available/clevermike-blog
```

Add:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 6M;

    root /var/www/clevermike-blog/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/clevermike-blog /etc/nginx/sites-enabled/clevermike-blog
sudo nginx -t
sudo systemctl reload nginx
```

If the default Nginx page is still active:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Enable HTTPS

Run Certbot:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Test certificate renewal:

```bash
sudo certbot renew --dry-run
```

After HTTPS is enabled, confirm `.env` uses HTTPS:

```bash
FRONTEND_ORIGIN="https://yourdomain.com"
SITE_URL="https://yourdomain.com"
MEDIA_PUBLIC_BASE_URL="https://yourdomain.com/uploads"
VITE_API_BASE_URL="https://yourdomain.com/api"
```

If you change `.env`, rebuild and restart:

```bash
cd /var/www/clevermike-blog
npm run build
sudo systemctl restart clevermike-blog
```

## 11. Verify Production

Open:

```txt
https://yourdomain.com
https://yourdomain.com/admin
https://yourdomain.com/api/posts
https://yourdomain.com/api/rss.xml
https://yourdomain.com/api/sitemap.xml
```

Log in to:

```txt
https://yourdomain.com/admin
```

Use the admin account from `.env`:

```bash
ADMIN_EMAIL
ADMIN_PASSWORD
```

Create or edit a post, then verify:

- Published posts appear on the public site.
- `Editor's pick` appears when `Editor's pick` is enabled in the post editor.
- `Popular Notes` appears when `Popular note` is enabled.
- Categories and tags come from admin settings.
- Uploaded media displays from `/uploads/...`.

## 12. GitHub Actions Auto Deploy

This workflow will SSH into the VPS after every push to `main`, pull the latest code, install dependencies, run migrations, build the frontend, and restart the backend service.

### 12.1 Create a VPS Deploy SSH Key

On your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-clevermike-blog" -f ./clevermike_blog_actions
```

Copy the public key:

```bash
cat ./clevermike_blog_actions.pub
```

Add it to the VPS deploy user:

```bash
ssh deploy@YOUR_VPS_IP
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste the public key into `authorized_keys`, then:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Keep the private key content for GitHub:

```bash
cat ./clevermike_blog_actions
```

### 12.2 Add GitHub Repository Secrets

In GitHub:

```txt
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

```txt
VPS_HOST=YOUR_VPS_IP
VPS_USER=deploy
VPS_SSH_KEY=contents of ./clevermike_blog_actions private key
VPS_APP_DIR=/var/www/clevermike-blog
```

Optional if SSH runs on a non-standard port:

```txt
VPS_PORT=22
```

### 12.3 Add GitHub Actions Workflow

Create:

```bash
mkdir -p .github/workflows
nano .github/workflows/deploy.yml
```

Add:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

concurrency:
  group: production-deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Validate frontend
        run: |
          npm ci
          npm run lint
          npm run build

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Validate backend
        working-directory: backend
        run: |
          python -m pip install --upgrade pip
          python -m pip install -r requirements.txt
          python -m pytest

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script_stop: true
          script: |
            set -e

            cd "${{ secrets.VPS_APP_DIR }}"

            git fetch origin main
            git reset --hard origin/main

            npm ci
            npm run build

            cd backend
            . .venv/bin/activate
            python -m pip install -r requirements.txt
            alembic upgrade head
            python -m app.scripts.seed_admin

            sudo systemctl restart clevermike-blog
            sudo systemctl reload nginx
```

Commit and push:

```bash
git add DEPLOYMENT.md .github/workflows/deploy.yml
git commit -m "Add VPS deployment guide and workflow"
git push origin main
```

### 12.4 Allow Restart Without Password

The GitHub Actions SSH command runs as `deploy`. It needs to restart the service and reload Nginx without an interactive sudo password.

On the VPS:

```bash
sudo visudo -f /etc/sudoers.d/clevermike-blog-deploy
```

Add:

```sudoers
deploy ALL=(root) NOPASSWD: /bin/systemctl restart clevermike-blog, /bin/systemctl reload nginx
```

Depending on your system, `systemctl` may live at `/usr/bin/systemctl`. Check with:

```bash
which systemctl
```

If it returns `/usr/bin/systemctl`, use:

```sudoers
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart clevermike-blog, /usr/bin/systemctl reload nginx
```

Test as `deploy`:

```bash
sudo systemctl restart clevermike-blog
sudo systemctl reload nginx
```

## 13. Safer Deploy Script Option

For cleaner GitHub Actions logs, you can put the deploy commands on the VPS.

Create:

```bash
nano /var/www/clevermike-blog/deploy.sh
```

Add:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/clevermike-blog

git fetch origin main
git reset --hard origin/main

npm ci
npm run build

cd backend
. .venv/bin/activate
python -m pip install -r requirements.txt
alembic upgrade head
python -m app.scripts.seed_admin

sudo systemctl restart clevermike-blog
sudo systemctl reload nginx
```

Make it executable:

```bash
chmod +x /var/www/clevermike-blog/deploy.sh
```

Then replace the GitHub Actions SSH script with:

```yaml
script: |
  /var/www/clevermike-blog/deploy.sh
```

## 14. Operational Commands

Backend status:

```bash
sudo systemctl status clevermike-blog
```

Backend logs:

```bash
sudo journalctl -u clevermike-blog -f
```

Nginx status:

```bash
sudo systemctl status nginx
```

Nginx config test:

```bash
sudo nginx -t
```

Manual deploy:

```bash
cd /var/www/clevermike-blog
git pull origin main
npm ci
npm run build
cd backend
. .venv/bin/activate
python -m pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart clevermike-blog
sudo systemctl reload nginx
```

Create or update the admin user/categories:

```bash
cd /var/www/clevermike-blog/backend
. .venv/bin/activate
python -m app.scripts.seed_admin
```

## 15. Backup Plan

Back up PostgreSQL:

```bash
pg_dump "postgresql://clevermike_blog:DB_PASSWORD@127.0.0.1:5432/clevermike_blog" > clevermike_blog_$(date +%F).sql
```

Back up uploads:

```bash
tar -czf uploads_$(date +%F).tar.gz /var/www/clevermike-blog/backend/uploads
```

Restore database:

```bash
psql "postgresql://clevermike_blog:DB_PASSWORD@127.0.0.1:5432/clevermike_blog" < backup.sql
```

## 16. Common Issues

### Admin login fails

Check:

```bash
sudo journalctl -u clevermike-blog -n 100
```

Then verify:

- `SECRET_KEY` is set and stable.
- `DATABASE_URL` is correct.
- `python -m app.scripts.seed_admin` has run.
- Frontend `VITE_API_BASE_URL` points to `https://yourdomain.com/api`.

### Frontend shows no posts

Check API directly:

```bash
curl https://yourdomain.com/api/posts
```

Then verify posts are:

- `published`, not `draft`.
- Saved with valid `published_at`.
- Not blocked by CORS or Nginx proxy config.

### Media uploads fail

Check:

```bash
ls -la /var/www/clevermike-blog/backend/uploads
sudo journalctl -u clevermike-blog -n 100
```

Verify:

- `MEDIA_LOCAL_DIR` points to the uploads directory.
- `MEDIA_PUBLIC_BASE_URL` is `https://yourdomain.com/uploads`.
- Nginx `client_max_body_size` is greater than `MAX_UPLOAD_MB`.

### GitHub Actions deploy fails at restart

Check sudoers:

```bash
sudo visudo -f /etc/sudoers.d/clevermike-blog-deploy
```

Make sure the path from `which systemctl` matches the sudoers rule.

### Alembic says tables already exist

This means tables were created before Alembic versioning was stamped. For an existing initialized database, stamp the current base revision once:

```bash
cd /var/www/clevermike-blog/backend
. .venv/bin/activate
alembic stamp 20260610_0001
alembic upgrade head
```

Do this only if the schema already matches the initial migration.

