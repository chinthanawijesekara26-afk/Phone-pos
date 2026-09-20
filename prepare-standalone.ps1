$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================"
Write-Host " PhonePOS - Prepare Next.js Standalone"
Write-Host "============================================"
Write-Host ""

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $ProjectRoot

$StandaloneSource = Join-Path $ProjectRoot ".next\standalone"

$PublicSource = Join-Path $ProjectRoot "public"

$StageRoot = Join-Path $ProjectRoot "electron\next"


Write-Host "Project:"
Write-Host $ProjectRoot
Write-Host ""

Write-Host "Standalone:"
Write-Host $StandaloneSource
Write-Host ""

Write-Host "Target:"
Write-Host $StageRoot
Write-Host ""


# ==================================================
# CHECK STANDALONE
# ==================================================

if (!(Test-Path $StandaloneSource)) {

    throw @"
.next\standalone was not found.

Run:

npm run build

first.
"@
}


$ServerSource = Join-Path `
    $StandaloneSource `
    "server.js"

$NextModuleSource = Join-Path `
    $StandaloneSource `
    "node_modules\next"

$PackageSource = Join-Path `
    $StandaloneSource `
    "package.json"


if (!(Test-Path $ServerSource)) {

    throw ".next\standalone\server.js was not found."
}


if (!(Test-Path $NextModuleSource)) {

    throw @"
.next\standalone\node_modules\next was not found.

Next.js standalone build is incomplete.
"@
}


if (!(Test-Path $PackageSource)) {

    throw ".next\standalone\package.json was not found."
}


# ==================================================
# REMOVE OLD STAGING
# ==================================================

if (Test-Path $StageRoot) {

    Write-Host "Removing old electron\next..."

    Remove-Item `
        $StageRoot `
        -Recurse `
        -Force
}


# ==================================================
# CREATE STAGING
# ==================================================

New-Item `
    -ItemType Directory `
    -Path $StageRoot `
    -Force | Out-Null


# ==================================================
# COPY STANDALONE
# ==================================================

Write-Host ""
Write-Host "Copying Next.js standalone..."

Copy-Item `
    "$StandaloneSource\*" `
    $StageRoot `
    -Recurse `
    -Force


# ==================================================
# COPY PUBLIC
# ==================================================

if (Test-Path $PublicSource) {

    Write-Host ""
    Write-Host "Copying public..."

    $PublicTarget = Join-Path `
        $StageRoot `
        "public"

    if (Test-Path $PublicTarget) {

        Remove-Item `
            $PublicTarget `
            -Recurse `
            -Force
    }

    Copy-Item `
        $PublicSource `
        $PublicTarget `
        -Recurse `
        -Force
}


# ==================================================
# VERIFY
# ==================================================

$TargetServer = Join-Path `
    $StageRoot `
    "server.js"

$TargetNext = Join-Path `
    $StageRoot `
    "node_modules\next"

$TargetPackage = Join-Path `
    $StageRoot `
    "package.json"

$TargetNextDist = Join-Path `
    $TargetNext `
    "dist"


Write-Host ""
Write-Host "============================================"
Write-Host " Verification"
Write-Host "============================================"

Write-Host ""
Write-Host "server.js:"
Write-Host (Test-Path $TargetServer)

Write-Host ""
Write-Host "node_modules\next:"
Write-Host (Test-Path $TargetNext)

Write-Host ""
Write-Host "node_modules\next\dist:"
Write-Host (Test-Path $TargetNextDist)

Write-Host ""
Write-Host "package.json:"
Write-Host (Test-Path $TargetPackage)


if (!(Test-Path $TargetServer)) {

    throw "ERROR: server.js was not copied."
}


if (!(Test-Path $TargetNext)) {

    throw "ERROR: node_modules\next was not copied."
}


if (!(Test-Path $TargetNextDist)) {

    throw "ERROR: node_modules\next\dist was not copied."
}


if (!(Test-Path $TargetPackage)) {

    throw "ERROR: package.json was not copied."
}


Write-Host ""
Write-Host "============================================"
Write-Host " Standalone preparation completed."
Write-Host "============================================"
Write-Host ""


Write-Host "Final structure:"
Write-Host ""

Get-ChildItem `
    $StageRoot `
    -Force


Write-Host ""
Write-Host "Next.js module:"
Write-Host ""

Get-ChildItem `
    $TargetNext `
    -Force `
    | Select-Object Name, Length


Write-Host ""
Write-Host "Next.js dist:"
Write-Host ""

Get-ChildItem `
    $TargetNextDist `
    -Force `
    | Select-Object -First 20 Name, Length