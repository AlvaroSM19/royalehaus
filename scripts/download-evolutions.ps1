# Script para descargar evoluciones de Clash Royale (Intentando diferentes fuentes)

$outputDir = "c:\RoyaleHaus\public\images\cards"

# Las evoluciones usan un formato diferente en algunos CDNs
$evolutions = @(
    @{id=126; base="knight"; display="Knight Evolution"},
    @{id=127; base="archers"; display="Archers Evolution"},
    @{id=128; base="skeletons"; display="Skeletons Evolution"},
    @{id=129; base="barbarians"; display="Barbarians Evolution"},
    @{id=130; base="royal-giant"; display="Royal Giant Evolution"},
    @{id=131; base="mortar"; display="Mortar Evolution"},
    @{id=132; base="bats"; display="Bats Evolution"},
    @{id=133; base="bomber"; display="Bomber Evolution"},
    @{id=134; base="ice-spirit"; display="Ice Spirit Evolution"},
    @{id=135; base="zap"; display="Zap Evolution"},
    @{id=136; base="skeleton-barrel"; display="Skeleton Barrel Evolution"},
    @{id=137; base="firecracker"; display="Firecracker Evolution"},
    @{id=138; base="royal-recruits"; display="Royal Recruits Evolution"},
    @{id=139; base="valkyrie"; display="Valkyrie Evolution"},
    @{id=140; base="musketeer"; display="Musketeer Evolution"},
    @{id=141; base="battle-ram"; display="Battle Ram Evolution"},
    @{id=142; base="wizard"; display="Wizard Evolution"},
    @{id=143; base="royal-hogs"; display="Royal Hogs Evolution"},
    @{id=144; base="dart-goblin"; display="Dart Goblin Evolution"},
    @{id=145; base="furnace"; display="Furnace Evolution"},
    @{id=146; base="goblin-cage"; display="Goblin Cage Evolution"},
    @{id=147; base="baby-dragon"; display="Baby Dragon Evolution"},
    @{id=148; base="skeleton-army"; display="Skeleton Army Evolution"},
    @{id=149; base="witch"; display="Witch Evolution"},
    @{id=150; base="pekka"; display="P.E.K.K.A Evolution"},
    @{id=151; base="hunter"; display="Hunter Evolution"},
    @{id=152; base="electro-dragon"; display="Electro Dragon Evolution"},
    @{id=153; base="wall-breakers"; display="Wall Breakers Evolution"},
    @{id=154; base="executioner"; display="Executioner Evolution"},
    @{id=155; base="goblin-giant"; display="Goblin Giant Evolution"},
    @{id=156; base="goblin-barrel"; display="Goblin Barrel Evolution"},
    @{id=157; base="goblin-drill"; display="Goblin Drill Evolution"},
    @{id=158; base="mega-knight"; display="Mega Knight Evolution"},
    @{id=159; base="inferno-dragon"; display="Inferno Dragon Evolution"},
    @{id=160; base="lumberjack"; display="Lumberjack Evolution"},
    @{id=161; base="royal-ghost"; display="Royal Ghost Evolution"},
    @{id=162; base="cannon"; display="Cannon Evolution"},
    @{id=163; base="tesla"; display="Tesla Evolution"},
    @{id=164; base="giant-snowball"; display="Giant Snowball Evolution"}
)

$heroes = @(
    @{id=165; base="knight"; display="Hero Knight"},
    @{id=166; base="mini-pekka"; display="Hero Mini P.E.K.K.A"},
    @{id=167; base="musketeer"; display="Hero Musketeer"},
    @{id=168; base="giant"; display="Hero Giant"}
)

Write-Host "Intentando descargar evoluciones con formatos alternativos..." -ForegroundColor Cyan
Write-Host ""

$success = 0
$failed = 0

foreach ($evo in $evolutions) {
    $fileName = "$($evo.id).png"
    $outputPath = Join-Path $outputDir $fileName
    
    # Diferentes formatos de URL para evoluciones
    $urls = @(
        "https://cdn.royaleapi.com/static/img/cards-150/evo-$($evo.base).png",
        "https://cdn.royaleapi.com/static/img/cards-150/$($evo.base)-evo.png",
        "https://cdn.royaleapi.com/static/img/cards-150/$($evo.base)_evolution.png",
        "https://cdn.royaleapi.com/static/img/cards-150/evolved-$($evo.base).png",
        "https://api-assets.clashroyale.com/cards/300/evo-$($evo.base).png",
        "https://cdn.statsroyale.com/images/cards/evo-$($evo.base).png"
    )
    
    $downloaded = $false
    
    foreach ($url in $urls) {
        try {
            Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop -UseBasicParsing
            Write-Host "[OK] $($evo.display) (#$($evo.id))" -ForegroundColor Green
            $success++
            $downloaded = $true
            break
        }
        catch {
            # Intentar siguiente URL
        }
    }
    
    if (-not $downloaded) {
        # Copiar la imagen de la carta base como placeholder
        $baseId = switch ($evo.base) {
            "knight" { 1 }
            "archers" { 2 }
            "skeletons" { 11 }
            "barbarians" { 9 }
            "royal-giant" { 25 }
            "mortar" { 103 }
            "bats" { 48 }
            "bomber" { 14 }
            "ice-spirit" { 34 }
            "zap" { 81 }
            "skeleton-barrel" { 52 }
            "firecracker" { 67 }
            "royal-recruits" { 59 }
            "valkyrie" { 12 }
            "musketeer" { 15 }
            "battle-ram" { 44 }
            "wizard" { 18 }
            "royal-hogs" { 58 }
            "dart-goblin" { 42 }
            "furnace" { 111 }
            "goblin-cage" { 112 }
            "baby-dragon" { 16 }
            "skeleton-army" { 13 }
            "witch" { 8 }
            "pekka" { 5 }
            "hunter" { 53 }
            "electro-dragon" { 61 }
            "wall-breakers" { 63 }
            "executioner" { 43 }
            "goblin-giant" { 60 }
            "goblin-barrel" { 83 }
            "goblin-drill" { 113 }
            "mega-knight" { 50 }
            "inferno-dragon" { 38 }
            "lumberjack" { 36 }
            "royal-ghost" { 55 }
            "cannon" { 101 }
            "tesla" { 107 }
            "giant-snowball" { 95 }
            default { 1 }
        }
        
        $basePath = Join-Path $outputDir "$baseId.png"
        if (Test-Path $basePath) {
            Copy-Item $basePath $outputPath -Force
            Write-Host "[COPY] $($evo.display) (#$($evo.id)) - Usando imagen base como placeholder" -ForegroundColor Yellow
            $success++
        } else {
            Write-Host "[FAIL] $($evo.display) (#$($evo.id))" -ForegroundColor Red
            $failed++
        }
    }
    
    Start-Sleep -Milliseconds 50
}

# Heroes - usar cartas base como placeholder
foreach ($hero in $heroes) {
    $fileName = "$($hero.id).png"
    $outputPath = Join-Path $outputDir $fileName
    
    $baseId = switch ($hero.base) {
        "knight" { 1 }
        "mini-pekka" { 19 }
        "musketeer" { 15 }
        "giant" { 4 }
        default { 1 }
    }
    
    $basePath = Join-Path $outputDir "$baseId.png"
    if (Test-Path $basePath) {
        Copy-Item $basePath $outputPath -Force
        Write-Host "[COPY] $($hero.display) (#$($hero.id)) - Usando imagen base como placeholder" -ForegroundColor Yellow
        $success++
    } else {
        Write-Host "[FAIL] $($hero.display) (#$($hero.id))" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "RESUMEN EVOLUCIONES + HEROES:" -ForegroundColor Yellow
Write-Host "  Completadas: $success" -ForegroundColor Green
Write-Host "  Fallidas: $failed" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Yellow
