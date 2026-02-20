# Script para descargar sonidos de cartas de Clash Royale
# Fuente: GitHub - Henrylq/Clash-Royale-SFX

param(
    [switch]$Help,
    [switch]$Test
)

if ($Help) {
    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host "  Descarga de Sonidos de Cartas - Clash Royale"
    Write-Host "  Fuente: GitHub - Henrylq/Clash-Royale-SFX"
    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host ""
    Write-Host "EJECUCIÓN:"
    Write-Host "  .\download-card-sounds.ps1          # Descarga todos los sonidos"
    Write-Host "  .\download-card-sounds.ps1 -Test    # Descarga solo 5 de prueba"
    Write-Host ""
    return
}

# Directorio de destino
$soundsDir = Join-Path $PSScriptRoot "..\public\sounds\cards"
if (-not (Test-Path $soundsDir)) {
    New-Item -ItemType Directory -Path $soundsDir -Force | Out-Null
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Descarga de Sonidos de Cartas - Clash Royale" -ForegroundColor Cyan
Write-Host "  Fuente: GitHub - Henrylq/Clash-Royale-SFX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Mapeo de nombres a IDs
$cardMapping = @{
    "Knight" = 1; "Archers" = 2; "Goblins" = 3; "Giant" = 4
    "PEKKA" = 5; "Minions" = 6; "Balloon" = 7; "Witch" = 8
    "Barbarians" = 9; "Golem" = 10; "Skeletons" = 11; "Valkyrie" = 12
    "Bomber" = 14; "Musketeer" = 15; "Baby Dragon" = 16; "Prince" = 17
    "Wizard" = 18; "Mini PEKKA" = 19; "Miner" = 20; "Giant Skeleton" = 21
    "Hog Rider" = 22; "Ice Wizard" = 24; "Royal Giant" = 25
    "Guards" = 26; "Princess" = 27; "Dark Prince" = 28
    "Lava Hound" = 31; "Ice Spirit" = 32; "Sparky" = 33
    "Bowler" = 34; "Lumberjack" = 35; "Battle Ram" = 36
    "Inferno Dragon" = 38; "Mega Minion" = 39; "Spear Goblins" = 40
    "Electro Wizard" = 41; "Elite Barbarians" = 42; "Fire Spirits" = 43
    "Hunter" = 44; "Executioner" = 45; "Bandit" = 46
    "Night Witch" = 48; "Bats" = 49; "Mega Knight" = 50
    "Flying Machine" = 52; "Rascals" = 56; "Ram Rider" = 57
    "Magic Archer" = 58
}

# Modo Test
if ($Test) {
    Write-Host "⚠️  MODO TEST: Descargando solo 5 cartas de prueba" -ForegroundColor Yellow
    Write-Host ""
    $testCards = @("Knight", "PEKKA", "Wizard", "Giant", "Prince")
    $filteredMapping = @{}
    foreach ($key in $testCards) {
        $filteredMapping[$key] = $cardMapping[$key]
    }
    $cardMapping = $filteredMapping
}

$downloaded = 0
$failed = 0
$skipped = 0

foreach ($cardName in $cardMapping.Keys) {
    $cardId = $cardMapping[$cardName]
    $outputFile = Join-Path $soundsDir "$cardId.mp3"
    
    if (Test-Path $outputFile) {
        Write-Host "⊘ $cardName (ID: $cardId) - Ya existe" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    $baseUrl = "https://raw.githubusercontent.com/Henrylq/Clash-Royale-SFX/master/Cards/$($cardName.Replace(' ', '%20'))"
    $cardNameLower = $cardName.ToLower().Replace(' ', '_')
    
    # Posibles archivos (deploy, attack, hit)
    $possibleFiles = @(
        "${cardNameLower}_deploy_end_01.ogg",
        "${cardNameLower}_deploy_31111.ogg",
        "${cardNameLower}_attack_start_01.ogg",
        "${cardNameLower}_attack_hack_01.ogg",
        "${cardNameLower}_hit_01.ogg"
    )
    
    Write-Host "Descargando $cardName (ID: $cardId)... " -NoNewline
    
    $success = $false
    foreach ($fileName in $possibleFiles) {
        $url = "$baseUrl/$fileName"
        $tempFile = Join-Path $env:TEMP "temp_sound_$cardId.ogg"
        
        Invoke-WebRequest -Uri $url -OutFile $tempFile -ErrorAction SilentlyContinue
        
        if ((Test-Path $tempFile) -and ((Get-Item $tempFile).Length -gt 100)) {
            Move-Item $tempFile $outputFile -Force
            Write-Host "✓" -ForegroundColor Green
            $downloaded++
            $success = $true
            break
        }
        
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
    
    if (-not $success) {
        Write-Host "✗" -ForegroundColor Red
        $failed++
    }
    
    Start-Sleep -Milliseconds 250
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Descargados: $downloaded | Omitidos: $skipped | Fallados: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($downloaded -gt 0) {
    Write-Host "✓ Sonidos descargados en: $soundsDir" -ForegroundColor Green
    Write-Host ""
    Write-Host "IDs descargados:" -ForegroundColor Cyan
    $ids = $cardMapping.Values | Sort-Object
    Write-Host "  $($ids -join ', ')" -ForegroundColor White
    Write-Host ""
}
