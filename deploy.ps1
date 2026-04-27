param(
  [string]$Server = "root@113.44.50.108",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\ai_resume_server",
  [string]$RemoteDir = "/root/ai_customize_resume"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying AI resume platform to $Server ..."

ssh -i $KeyPath $Server @"
set -e
cd $RemoteDir

echo '[1/6] Sync repository'
git fetch origin main
git reset --hard origin/main

echo '[2/6] Install dependencies'
pnpm install

echo '[3/6] Generate Prisma client'
cd apps/api
pnpm prisma generate

echo '[4/6] Build API'
pnpm build

echo '[5/6] Build Web'
cd ../web
pnpm build

echo '[6/6] Restart services'
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || true
else
  pkill -f 'node dist/main' || true
  pkill -f 'next start' || true
  cd $RemoteDir/apps/api
  nohup pnpm start:prod > /tmp/ai-resume-api.log 2>&1 &
  cd $RemoteDir/apps/web
  nohup pnpm start > /tmp/ai-resume-web.log 2>&1 &
fi

echo 'Deployment complete'
"@

Write-Host "Done. Frontend: http://113.44.50.108:3000"
Write-Host "API:      http://113.44.50.108:3001"
