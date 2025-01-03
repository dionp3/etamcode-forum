#!/bin/sh

{
  echo "Running refresh script at $(date)"
  cd /app || { echo "Failed to cd to /app"; exit 1; }
  git pull origin master || { echo "Git pull failed"; exit 1; }
  export NODE_ENV=development;
  npm i || { echo "npm i failed"; exit 1; }
  node ace build --ignore-ts-errors || { echo "Build failed"; exit 1; }
  cd build || { echo "Failed to cd to build"; exit 1; }
  export NODE_ENV=production;
  npm ci --omit="dev" || { echo "npm ci failed"; exit 1; }
  node ace migration:run --force || { echo "Migration failed"; exit 1; }

  cd .. || { echo "Failed to cd .."; exit 1; }
  pm2 restart all --update-env || { echo "PM2 restart failed"; exit 1; }

  echo "Refresh script completed at $(date)"
} >> /var/log/cron.log 2>&1

