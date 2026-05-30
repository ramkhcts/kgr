#!/bin/bash
set -e
cd /var/www/kgr
git pull
npm install
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npx prisma generate
rm -rf .next
npm run build
# Restart or start — handles case where PM2 process was removed
if pm2 describe kgr > /dev/null 2>&1; then
  pm2 restart kgr
else
  DATABASE_URL="file:./dev.db" pm2 start npm --name kgr -- start
  pm2 save
fi
echo "✓ Deploy complete"
