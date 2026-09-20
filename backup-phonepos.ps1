# ============================================================
# PHONEPOS - DAILY BACKUP SYSTEM
# Google Drive + USB + Local Backup
# ============================================================

$ErrorActionPreference = "Stop"

# ============================================================
# CONFIGURATION
# ============================================================

$ProjectPath = "C:\Users\USER\phoneshop-pos"

# Google Drive
$GoogleDrivePath = "G:\My Drive\PhonePOS-Backups"

# USB Drive
# IMPORTANT:
# Change E: to your actual USB drive letter if different.
$USBDrivePath = "F:\PhonePOS-Backups"

# Local backup
$LocalBackupPath = "C:\PhonePOS-Backups"

# ============================================================
# DATE / TIME
# ============================================================

$BackupTime = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       PHONEPOS DAILY BACKUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backup Time : $BackupTime"
Write-Host "Project     : $ProjectPath"
Write-Host "Database    : phone_pos"
Write-Host ""

# ============================================================
# CHECK PROJECT
# ============================================================

if (-not (Test-Path $ProjectPath)) {
    Write-Host "ERROR: Project folder not found!" -ForegroundColor Red
    Write-Host $ProjectPath
    exit 1
}

# ============================================================
# CREATE BACKUP FOLDERS
# ============================================================

$LocalBackupFolder = Join-Path $LocalBackupPath $BackupTime
$GoogleBackupFolder = Join-Path $GoogleDrivePath $BackupTime
$USBBackupFolder = Join-Path $USBDrivePath $BackupTime

New-Item -ItemType Directory -Force -Path $LocalBackupFolder | Out-Null

Write-Host "[1/8] Local backup folder created." -ForegroundColor Yellow
Write-Host $LocalBackupFolder
Write-Host ""

# ============================================================
# FIND MYSQLDUMP
# ============================================================

Write-Host "[2/8] Checking MySQL mysqldump..." -ForegroundColor Yellow

$MySQLDump = $null

# First check PATH
$Command = Get-Command mysqldump.exe -ErrorAction SilentlyContinue

if ($Command) {

    $MySQLDump = $Command.Source

    Write-Host "mysqldump found in PATH:" -ForegroundColor Green
    Write-Host $MySQLDump

}
else {

    # Common MySQL locations
    $PossiblePaths = @(
        "C:\Program Files\MySQL\MySQL Server 9.7\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 9.5\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
    )

    foreach ($Path in $PossiblePaths) {

        if (Test-Path $Path) {

            $MySQLDump = $Path

            Write-Host "mysqldump found:" -ForegroundColor Green
            Write-Host $MySQLDump

            break
        }
    }
}

if (-not $MySQLDump) {

    Write-Host ""
    Write-Host "ERROR: mysqldump.exe was not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this command:"
    Write-Host "where.exe mysqldump"
    Write-Host ""

    exit 1
}

Write-Host ""

# ============================================================
# READ .ENV
# ============================================================

Write-Host "[3/8] Reading database settings..." -ForegroundColor Yellow

$EnvFile = Join-Path $ProjectPath ".env"

if (-not (Test-Path $EnvFile)) {

    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host $EnvFile

    exit 1
}

$EnvContent = Get-Content $EnvFile -Raw

# ============================================================
# GET DATABASE_URL
# ============================================================

$DatabaseMatch = [regex]::Match(
    $EnvContent,
    '(?m)^\s*DATABASE_URL\s*=\s*["'']([^"'']+)["'']'
)

if (-not $DatabaseMatch.Success) {

    Write-Host ""
    Write-Host "ERROR: DATABASE_URL not found in .env" -ForegroundColor Red
    Write-Host ""

    exit 1
}

$DatabaseUrl = $DatabaseMatch.Groups[1].Value.Trim()

Write-Host "DATABASE_URL found." -ForegroundColor Green

# ============================================================
# PARSE MYSQL DATABASE URL
# ============================================================

# Expected:
# mysql://root:password@localhost:3306/phone_pos

$DatabasePattern = '^mysql://([^:]+):(.+)@([^:]+):(\d+)/(.+)$'

$DbMatch = [regex]::Match($DatabaseUrl, $DatabasePattern)

if (-not $DbMatch.Success) {

    Write-Host ""
    Write-Host "ERROR: DATABASE_URL format is not supported." -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected:"
    Write-Host 'mysql://root:password@localhost:3306/phone_pos'
    Write-Host ""

    exit 1
}

$DbUser = $DbMatch.Groups[1].Value
$DbPassword = $DbMatch.Groups[2].Value
$DbHost = $DbMatch.Groups[3].Value
$DbPort = $DbMatch.Groups[4].Value
$DbName = $DbMatch.Groups[5].Value

Write-Host "Database Host : $DbHost"
Write-Host "Database Port : $DbPort"
Write-Host "Database Name : $DbName"
Write-Host "Database User : $DbUser"
Write-Host ""

# ============================================================
# DATABASE BACKUP
# ============================================================

Write-Host "[4/8] Creating MySQL database backup..." -ForegroundColor Yellow

$DatabaseFolder = Join-Path $LocalBackupFolder "Database"

New-Item -ItemType Directory -Force -Path $DatabaseFolder | Out-Null

$SQLFile = Join-Path `
    $DatabaseFolder `
    "phone_pos_$BackupTime.sql"

Write-Host "Creating:"
Write-Host $SQLFile
Write-Host ""

# Create mysqldump arguments
$DumpArguments = @(
    "--host=$DbHost",
    "--port=$DbPort",
    "--user=$DbUser",
    "--password=$DbPassword",
    "--routines",
    "--triggers",
    "--events",
    "--single-transaction",
    "--quick",
    "--add-drop-table",
    "--default-character-set=utf8mb4",
    "--result-file=$SQLFile",
    $DbName
)

# Run mysqldump
$Process = Start-Process `
    -FilePath $MySQLDump `
    -ArgumentList $DumpArguments `
    -Wait `
    -PassThru `
    -NoNewWindow

if ($Process.ExitCode -ne 0) {

    Write-Host ""
    Write-Host "ERROR: MySQL backup failed!" -ForegroundColor Red
    Write-Host "Exit Code: $($Process.ExitCode)"
    Write-Host ""

    exit 1
}

if (-not (Test-Path $SQLFile)) {

    Write-Host ""
    Write-Host "ERROR: SQL backup file was not created!" -ForegroundColor Red

    exit 1
}

$SQLSize = (Get-Item $SQLFile).Length

Write-Host ""
Write-Host "Database backup completed." -ForegroundColor Green
Write-Host "SQL Size: $SQLSize bytes"
Write-Host ""

# ============================================================
# COPY PROJECT
# ============================================================

Write-Host "[5/8] Copying PhonePOS project..." -ForegroundColor Yellow

$ProjectBackupFolder = Join-Path $LocalBackupFolder "Project"

New-Item -ItemType Directory -Force -Path $ProjectBackupFolder | Out-Null

# Robocopy exclusions
$RobocopyArguments = @(
    $ProjectPath,
    $ProjectBackupFolder,
    "/E",
    "/R:2",
    "/W:2",
    "/NFL",
    "/NDL",
    "/NP",
    "/XD",
    "node_modules",
    ".next",
    ".git",
    ".turbo",
    "coverage",
    "dist",
    "build"
)

$RobocopyProcess = Start-Process `
    -FilePath "robocopy.exe" `
    -ArgumentList $RobocopyArguments `
    -Wait `
    -PassThru `
    -NoNewWindow

# Robocopy exit codes 0-7 are normally success / acceptable
if ($RobocopyProcess.ExitCode -ge 8) {

    Write-Host ""
    Write-Host "ERROR: Project copy failed." -ForegroundColor Red
    Write-Host "Robocopy Exit Code: $($RobocopyProcess.ExitCode)"

    exit 1
}

Write-Host "Project copied." -ForegroundColor Green
Write-Host ""

# ============================================================
# COPY IMPORTANT BACKUP INFORMATION
# ============================================================

Write-Host "[6/8] Creating backup information..." -ForegroundColor Yellow

$InfoFile = Join-Path $LocalBackupFolder "Backup-Information.txt"

$InfoText = @"
====================================================
PHONEPOS BACKUP INFORMATION
====================================================

Backup Date:
$BackupDate

Backup Folder:
$BackupTime

Project:
$ProjectPath

Database:
$DbName

Database Host:
$DbHost

Database Port:
$DbPort

Database User:
$DbUser

MySQL Dump:
$MySQLDump

====================================================
RESTORE INFORMATION
====================================================

1. Install Node.js
2. Install MySQL
3. Copy the Project folder back.
4. Open the project in VS Code.
5. Run:

npm install

6. Make sure .env contains the correct DATABASE_URL.

7. Create the database if required.

8. Restore the SQL file using:

mysql -u root -p phone_pos < backup.sql

====================================================
"@

Set-Content `
    -Path $InfoFile `
    -Value $InfoText `
    -Encoding UTF8

Write-Host "Backup information created." -ForegroundColor Green
Write-Host ""

# ============================================================
# GOOGLE DRIVE BACKUP
# ============================================================

Write-Host "[7/8] Copying backup to Google Drive..." -ForegroundColor Yellow

if (Test-Path "G:\") {

    if (-not (Test-Path $GoogleDrivePath)) {

        New-Item `
            -ItemType Directory `
            -Force `
            -Path $GoogleDrivePath | Out-Null
    }

    Copy-Item `
        -Path $LocalBackupFolder `
        -Destination $GoogleBackupFolder `
        -Recurse `
        -Force

    Write-Host "Google Drive backup completed." -ForegroundColor Green
    Write-Host $GoogleBackupFolder

}
else {

    Write-Host ""
    Write-Host "WARNING: Google Drive G: is not available." -ForegroundColor Yellow
    Write-Host "Google Drive backup skipped."
    Write-Host ""
}

# ============================================================
# USB BACKUP
# ============================================================

Write-Host ""
Write-Host "[8/8] Copying backup to USB..." -ForegroundColor Yellow

# Check USB drive
$USBDriveLetter = Split-Path $USBDrivePath -Qualifier

if (Test-Path $USBDriveLetter) {

    if (-not (Test-Path $USBDrivePath)) {

        New-Item `
            -ItemType Directory `
            -Force `
            -Path $USBDrivePath | Out-Null
    }

    Copy-Item `
        -Path $LocalBackupFolder `
        -Destination $USBBackupFolder `
        -Recurse `
        -Force

    Write-Host "USB backup completed." -ForegroundColor Green
    Write-Host $USBBackupFolder

}
else {

    Write-Host ""
    Write-Host "WARNING: USB drive $USBDriveLetter is not available." -ForegroundColor Yellow
    Write-Host "USB backup skipped."
    Write-Host ""
}

# ============================================================
# FINAL SUMMARY
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       BACKUP COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Backup ID:"
Write-Host $BackupTime
Write-Host ""

Write-Host "LOCAL:"
Write-Host $LocalBackupFolder
Write-Host ""

if (Test-Path $GoogleBackupFolder) {

    Write-Host "GOOGLE DRIVE:"
    Write-Host $GoogleBackupFolder
    Write-Host ""
}

if (Test-Path $USBBackupFolder) {

    Write-Host "USB:"
    Write-Host $USBBackupFolder
    Write-Host ""
}

Write-Host "Database:"
Write-Host $SQLFile
Write-Host ""

Write-Host "Your PhonePOS backup is ready." -ForegroundColor Green
Write-Host ""