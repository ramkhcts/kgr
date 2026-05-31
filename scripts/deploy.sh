#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# KGR iDemand — Production Deploy Script
#
# Strategy: build on the local dev machine (adequate RAM), then rsync the
# compiled .next artefacts to the server. This avoids OOM-kills on the 1-vCPU
# 951 MB Vultr instance.
#
# Usage (from repo root on Mac):
#   bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REMOTE_HOST="root@kgr.math-mojo.com"
REMOTE_DIR="/var/www/kgr"
APP_USER="kgr"

echo "▶ Pulling latest…"
git pull

echo "▶ Installing deps locally…"
npm install

echo "▶ Generating Prisma client locally…"
DATABASE_URL="file:./dev.db" npx prisma generate

echo "▶ Building locally (avoids OOM on server)…"
rm -rf .next
npm run build

# ── Detect hashed external module names baked into the Turbopack build ────────
# Turbopack (macOS build) appends a content hash to external package names.
# On Linux these won't resolve, so we create thin shims in node_modules.
PRISMA_HASH=$(grep -oP '"@prisma/client-[a-f0-9]+"' .next/server/chunks/\[externals\]*.js 2>/dev/null \
  | head -1 | tr -d '"' | sed 's|@prisma/client-||')
BCRYPT_HASH=$(grep -oP '"bcryptjs-[a-f0-9]+"' .next/server/chunks/\[externals\]*.js 2>/dev/null \
  | head -1 | tr -d '"' | sed 's|bcryptjs-||')

echo "  Prisma hash: ${PRISMA_HASH:-none}"
echo "  bcryptjs hash: ${BCRYPT_HASH:-none}"

echo "▶ Syncing code + build to server…"
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='prisma/dev.db' \
  --exclude='.env*' \
  --exclude='uploads/' \
  ./ "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "▶ Running server-side post-deploy steps…"
ssh "${REMOTE_HOST}" bash <<ENDSSH
  set -euo pipefail
  cd ${REMOTE_DIR}

  echo "  → Full npm install (needed for Prisma CLI)…"
  npm install 2>&1 | tail -3

  echo "  → Regenerating Prisma client for Linux…"
  DATABASE_URL="file:./dev.db" npx prisma db push --skip-generate
  DATABASE_URL="file:./dev.db" npx prisma generate

  echo "  → Creating Turbopack cross-platform shims…"
  # Turbopack bakes platform-specific hashes into external module names.
  # These shims redirect the hashed name back to the real package.
  if [ -n "${PRISMA_HASH}" ]; then
    SHIM="node_modules/@prisma/client-${PRISMA_HASH}"
    mkdir -p "\$SHIM"
    echo '{"name":"@prisma/client-${PRISMA_HASH}","version":"1.0.0","main":"index.js"}' > "\$SHIM/package.json"
    echo 'module.exports = require("@prisma/client");' > "\$SHIM/index.js"
    echo "    ✓ @prisma/client-${PRISMA_HASH}"
  fi
  if [ -n "${BCRYPT_HASH}" ]; then
    SHIM="node_modules/bcryptjs-${BCRYPT_HASH}"
    mkdir -p "\$SHIM"
    echo '{"name":"bcryptjs-${BCRYPT_HASH}","version":"1.0.0","main":"index.js"}' > "\$SHIM/package.json"
    echo 'module.exports = require("bcryptjs");' > "\$SHIM/index.js"
    echo "    ✓ bcryptjs-${BCRYPT_HASH}"
  fi

  echo "  → Fixing file ownership…"
  chown -R ${APP_USER}:${APP_USER} ${REMOTE_DIR}

  echo "  → Stopping any zombie next-server processes…"
  fuser -k 3000/tcp 2>/dev/null || true
  sleep 1

  echo "  → Restarting kgr under ${APP_USER} user…"
  su -s /bin/bash ${APP_USER} -c "
    cd ${REMOTE_DIR}
    export HOME=${REMOTE_DIR}
    export DATABASE_URL='file:./dev.db'
    PM2_HOME=${REMOTE_DIR}/.pm2 /usr/bin/pm2 restart kgr 2>/dev/null || \
    PM2_HOME=${REMOTE_DIR}/.pm2 /usr/bin/pm2 start npm --name kgr -- start
    PM2_HOME=${REMOTE_DIR}/.pm2 /usr/bin/pm2 save --force
  "

  sleep 5
  echo "  → Final status…"
  su -s /bin/bash ${APP_USER} -c "PM2_HOME=${REMOTE_DIR}/.pm2 /usr/bin/pm2 list"

  echo "  → HTTP check…"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/login
  echo "✓ Server-side steps complete"
ENDSSH

echo "✓ Deploy complete — https://kgr.math-mojo.com"
