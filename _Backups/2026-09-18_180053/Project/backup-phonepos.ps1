# ============================================================
# PHONEPOS DAILY BACKUP
# Project + MySQL Database + Google Drive + USB
# ============================================================

$ErrorActionPreference = "Stop"

# ------------------------------------------------------------
# SETTINGS
# ------------------------------------------------------------

$ProjectPath = "C:\Users\USER\phoneshop-pos"

$DatabaseName = "phone_pos"
$DatabaseUser = "root"
$DatabaseHost = "localhost"
$DatabasePort = "3306"

# Google Drive
$GoogleDriveBackupRoot = "G:\My Drive\PhonePOS-Backups"

# USB backup folder name
$UsbBackupFolderName = "PhonePOS-Backups"

# ------------------------------------------------------------
# TIME
# ------------------------------------------------------------

$BackupTime = Get-Date -Format "yyyy-MM-dd_HHmmss"

# Main temporary/local backup location
$LocalBackupRoot = Join-Path $ProjectPath "_Backups"

$BackupFolder = Join-Path `
    $LocalBackupRoot `
    $BackupTime

$ProjectBackupFolder = Join-Path `
    $BackupFolder `
    "Project"

$DatabaseBackupFolder = Join-Path `
    $BackupFolder `
    "Database"

$InfoFile = Join-Path `
    $BackupFolder `
    "Backup-Information.txt"

# ------------------------------------------------------------
# FUNCTIONS
# ------------------------------------------------------------

function Write-Header {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       PHONEPOS DAILY BACKUP" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Find-MySqlDump {

    Write-Host "[2/7] Checking MySQL mysqldump..." -ForegroundColor Yellow

    # 1. Check PATH
    $command = Get-Command mysqldump.exe -ErrorAction SilentlyContinue

    if ($command) {
        Write-Host "mysqldump found in PATH:" -ForegroundColor Green
        Write-Host $command.Source -ForegroundColor Green
        return $command.Source
    }

    # 2. Check common locations
    $PossiblePaths = @(

        "C:\Program Files\MySQL\MySQL Server 9.7\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 9.5\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 9.4\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 9.3\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",

        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe",

        "C:\xampp\mysql\bin\mysqldump.exe",

        "C:\wamp64\bin\mysql\mysql8.0.XX\bin\mysqldump.exe"
    )

    foreach ($Path in $PossiblePaths) {

        if (Test-Path $Path) {

            Write-Host "mysqldump found:" -ForegroundColor Green
            Write-Host $Path -ForegroundColor Green

            return $Path
        }
    }

    # 3. Search Program Files\MySQL
    $MySqlRoot = "C:\Program Files\MySQL"

    if (Test-Path $MySqlRoot) {

        Write-Host "Searching MySQL installation..." -ForegroundColor Yellow

        $Found = Get-ChildItem `
            -Path $MySqlRoot `
            -Filter "mysqldump.exe" `
            -Recurse `
            -File `
            -ErrorAction SilentlyContinue |
            Select-Object -First 1

        if ($Found) {

            Write-Host "mysqldump found:" -ForegroundColor Green
            Write-Host $Found.FullName -ForegroundColor Green

            return $Found.FullName
        }
    }

    throw "mysqldump.exe could not be found."
}

function Get-DatabasePassword {

    Write-Host "[3/7] Reading database settings..." -ForegroundColor Yellow

    $EnvFile = Join-Path $ProjectPath ".env"

    if (!(Test-Path $EnvFile)) {

        throw ".env file not found: $EnvFile"
    }

    $EnvContent = Get-Content $EnvFile -Raw

    $DatabaseUrlLine = $EnvContent |
        Select-String -Pattern 'DATABASE_URL\s*=' |
        Select-Object -First 1

    if (!$DatabaseUrlLine) {

        throw "DATABASE_URL was not found in .env"
    }

    $DatabaseUrl = $DatabaseUrlLine.Line `
        -replace '^\s*DATABASE_URL\s*=\s*', '' `
        -replace '\s+$', ''

    $DatabaseUrl = $DatabaseUrl.Trim('"').Trim("'")

    # Example:
    # mysql://root:password@localhost:3306/phone_pos

    if ($DatabaseUrl -notmatch '^mysql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)$') {

        throw "DATABASE_URL format is not supported."
    }

    $script:DatabaseUser = $Matches[1]

    $EncodedPassword = $Matches[2]

    $script:DatabaseHost = $Matches[3]

    $script:DatabasePort = $Matches[4]

    $script:DatabaseName = ($Matches[5] -split '\?')[0]

    try {

        $script:DatabasePassword =
            [System.Uri]::UnescapeDataString($EncodedPassword)
    }
    catch {

        $script:DatabasePassword = $EncodedPassword
    }

    Write-Host "Database : $script:DatabaseName" -ForegroundColor Green
    Write-Host "Host     : $script:DatabaseHost" -ForegroundColor Green
    Write-Host "Port     : $script:DatabasePort" -ForegroundColor Green
    Write-Host "User     : $script:DatabaseUser" -ForegroundColor Green
}

function Find-UsbDrive {

    Write-Host "[6/7] Checking USB drive..." -ForegroundColor Yellow

    $RemovableDrives = Get-CimInstance Win32_LogicalDisk |
        Where-Object {
            $_.DriveType -eq 2
        }

    if (!$RemovableDrives) {

        Write-Host "No USB/removable drive detected." -ForegroundColor DarkYellow

        return $null
    }

    # Select first removable drive
    $UsbDrive = $RemovableDrives |
        Select-Object -First 1

    $UsbRoot = "$($UsbDrive.DeviceID)\"

    $UsbBackupRoot = Join-Path `
        $UsbRoot `
        $UsbBackupFolderName

    Write-Host "USB drive detected: $UsbRoot" -ForegroundColor Green

    return $UsbBackupRoot
}

# ------------------------------------------------------------
# START
# ------------------------------------------------------------

Write-Header

Write-Host "Backup Time : $BackupTime"
Write-Host "Project     : $ProjectPath"
Write-Host "Database    : $DatabaseName"
Write-Host ""

# ------------------------------------------------------------
# CHECK PROJECT
# ------------------------------------------------------------

if (!(Test-Path $ProjectPath)) {

    Write-Host "ERROR: Project folder not found!" -ForegroundColor Red

    exit 1
}

# ------------------------------------------------------------
# CREATE BACKUP FOLDER
# ------------------------------------------------------------

New-Item `
    -ItemType Directory `
    -Path $BackupFolder `
    -Force | Out-Null

New-Item `
    -ItemType Directory `
    -Path $ProjectBackupFolder `
    -Force | Out-Null

New-Item `
    -ItemType Directory `
    -Path $DatabaseBackupFolder `
    -Force | Out-Null

# ------------------------------------------------------------
# 1. PROJECT BACKUP
# ------------------------------------------------------------

Write-Host "[1/7] Copying project..." -ForegroundColor Yellow

$ExcludeDirectories = @(
    "node_modules",
    ".next",
    ".git",
    "_Backups"
)

Get-ChildItem $ProjectPath -Force |
    Where-Object {
        $ExcludeDirectories -notcontains $_.Name
    } |
    ForEach-Object {

        Copy-Item `
            $_.FullName `
            $ProjectBackupFolder `
            -Recurse `
            -Force `
            -ErrorAction SilentlyContinue
    }

Write-Host "Project copied." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# 2. FIND MYSQLDUMP
# ------------------------------------------------------------

$MySqlDump = Find-MySqlDump

Write-Host ""

# ------------------------------------------------------------
# 3. READ DATABASE SETTINGS
# ------------------------------------------------------------

Get-DatabasePassword

Write-Host ""

# ------------------------------------------------------------
# 4. DATABASE BACKUP
# ------------------------------------------------------------

Write-Host "[4/7] Creating MySQL database backup..." -ForegroundColor Yellow

$SqlFileName = "phonepos-$BackupTime.sql"

$SqlFile = Join-Path `
    $DatabaseBackupFolder `
    $SqlFileName

$DumpArguments = @(
    "--host=$DatabaseHost"
    "--port=$DatabasePort"
    "--user=$DatabaseUser"
    "--password=$DatabasePassword"
    "--routines"
    "--triggers"
    "--events"
    "--single-transaction"
    "--set-gtid-purged=OFF"
    $DatabaseName
)

try {

    & $MySqlDump @DumpArguments |
        Out-File `
            -FilePath $SqlFile `
            -Encoding utf8

    if ($LASTEXITCODE -ne 0) {

        throw "mysqldump returned error code $LASTEXITCODE"
    }

    if (!(Test-Path $SqlFile)) {

        throw "SQL backup file was not created."
    }

    $SqlSize = (Get-Item $SqlFile).Length

    if ($SqlSize -lt 100) {

        throw "SQL backup file appears to be empty."
    }

    Write-Host "Database backup completed." -ForegroundColor Green
    Write-Host "SQL file: $SqlFile" -ForegroundColor Green
}
catch {

    Write-Host ""
    Write-Host "DATABASE BACKUP FAILED!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    throw
}

Write-Host ""

# ------------------------------------------------------------
# 5. BACKUP INFORMATION
# ------------------------------------------------------------

Write-Host "[5/7] Creating backup information..." -ForegroundColor Yellow

$ProjectSize =
    (Get-ChildItem $ProjectBackupFolder -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum

$DatabaseSize =
    (Get-Item $SqlFile).Length

$InfoContent = @"
==================================================
PHONEPOS BACKUP
==================================================

Backup Date : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Project:
$ProjectPath

Database:
$DatabaseName

Database Host:
$DatabaseHost

Database Port:
$DatabasePort

Database User:
$DatabaseUser

Project Backup Size:
$ProjectSize bytes

Database Backup Size:
$DatabaseSize bytes

MySQL Dump:
$MySqlDump

==================================================
BACKUP CONTENT
==================================================

Project/
Database/
Backup-Information.txt

==================================================
"@

Set-Content `
    -Path $InfoFile `
    -Value $InfoContent `
    -Encoding UTF8

Write-Host "Backup information created." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# 6. GOOGLE DRIVE
# ------------------------------------------------------------

Write-Host "[6/7] Copying backup to Google Drive..." -ForegroundColor Yellow

if (Test-Path "G:\") {

    New-Item `
        -ItemType Directory `
        -Path $GoogleDriveBackupRoot `
        -Force | Out-Null

    $GoogleDriveDestination = Join-Path `
        $GoogleDriveBackupRoot `
        $BackupTime

    Copy-Item `
        $BackupFolder `
        $GoogleDriveDestination `
        -Recurse `
        -Force

    Write-Host "Google Drive backup completed." -ForegroundColor Green
    Write-Host $GoogleDriveDestination -ForegroundColor Green

}
else {

    Write-Host "Google Drive G: not available." -ForegroundColor DarkYellow
}

Write-Host ""

# ------------------------------------------------------------
# 7. USB BACKUP
# ------------------------------------------------------------

Write-Host "[7/7] Copying backup to USB..." -ForegroundColor Yellow

$UsbBackupRoot = Find-UsbDrive

if ($UsbBackupRoot) {

    New-Item `
        -ItemType Directory `
        -Path $UsbBackupRoot `
        -Force | Out-Null

    $UsbDestination = Join-Path `
        $UsbBackupRoot `
        $BackupTime

    Copy-Item `
        $BackupFolder `
        $UsbDestination `
        -Recurse `
        -Force

    Write-Host "USB backup completed." -ForegroundColor Green
    Write-Host $UsbDestination -ForegroundColor Green
}
else {

    Write-Host "USB backup skipped because no USB drive was found." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------
# FINAL
# ------------------------------------------------------------

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       BACKUP COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Local Backup:" -ForegroundColor Cyan
Write-Host $BackupFolder

Write-Host ""

if (Test-Path "G:\") {

    Write-Host "Google Drive:" -ForegroundColor Cyan
    Write-Host $GoogleDriveBackupRoot
}

Write-Host ""
Write-Host "Backup Time: $BackupTime" -ForegroundColor Cyan
Write-Host ""