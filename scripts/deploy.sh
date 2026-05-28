#!/bin/bash
set -e
cd /var/www/kgr
git pull
npm install
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npx prisma generate
rm -rf .next
npm run build
pm2 restart kgr
echo "✓ Deploy complete"
