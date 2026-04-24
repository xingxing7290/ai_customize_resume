#!/bin/bash

# Deploy script for ai_customize_resume

echo "Deploying to server..."

# Pull latest code
ssh root@113.44.50.108 << 'ENDSSH'
cd /root/ai_customize_resume
git pull origin main

# Rebuild frontend
cd apps/web
pnpm install
pnpm build

# Restart services
pm2 restart all

echo "Deployment complete!"
ENDSSH
