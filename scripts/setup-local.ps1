# Thiết lập DB local cho nestjs01 (PostgreSQL 16 trên Windows)
param(
  [string]$PostgresPassword = $env:LOCAL_POSTGRES_PASSWORD
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
$createdb = 'C:\Program Files\PostgreSQL\16\bin\createdb.exe'

if (-not (Test-Path $psql)) {
  throw 'Không tìm thấy psql. Cài PostgreSQL 16 hoặc sửa đường dẫn trong scripts/setup-local.ps1.'
}

if (-not $PostgresPassword -and (Test-Path '.env.local')) {
  $directUrl = Get-Content '.env.local' |
    Where-Object { $_ -match '^\s*DIRECT_DATABASE_URL\s*=' } |
    Select-Object -First 1
  if ($directUrl -match 'postgresql://[^:]+:([^@]+)@') {
    $PostgresPassword = [uri]::UnescapeDataString($matches[1])
    Write-Host 'Lấy mật khẩu PostgreSQL từ DIRECT_DATABASE_URL trong .env.local.'
  }
}

if (-not $PostgresPassword) {
  $PostgresPassword = 'nestjs_local_dev'
  Write-Host 'Dùng mật khẩu mặc định nestjs_local_dev (sửa .env.local hoặc set LOCAL_POSTGRES_PASSWORD).'
}

$env:PGPASSWORD = $PostgresPassword

Write-Host 'Kiểm tra kết nối PostgreSQL...'
& $psql -U postgres -h 127.0.0.1 -p 5432 -tAc 'SELECT 1' | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw @"
Không đăng nhập được PostgreSQL user postgres.
1) Sửa mật khẩu trong .env.local (DATABASE_URL / DIRECT_DATABASE_URL)
2) Hoặc chạy: `$env:LOCAL_POSTGRES_PASSWORD='mat-khau-cua-ban'; npm run setup:local
"@
}

Write-Host 'Tạo database nestjs01 (nếu chưa có)...'
$createdbOutput = & $createdb -U postgres -h 127.0.0.1 -p 5432 nestjs01 2>&1
if ($LASTEXITCODE -ne 0) {
  if ($createdbOutput -match 'already exists') {
    Write-Host 'Database nestjs01 đã tồn tại — tiếp tục.'
  } else {
    throw $createdbOutput
  }
}

Write-Host 'Prisma generate...'
npx prisma generate

Write-Host 'Prisma migrate deploy...'
npx prisma migrate deploy

Write-Host 'Prisma db seed...'
npx prisma db seed

Write-Host 'Xong. Chạy: npm run start:dev'
