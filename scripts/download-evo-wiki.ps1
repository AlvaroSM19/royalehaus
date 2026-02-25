# Download evolution card images from Clash Royale Fandom Wiki
# Uses the MediaWiki API to get actual image URLs

$outputDir = "c:\Users\UO288\royalehaus\public\images\cards"

# Map: id => wiki filename (pattern: {CardName}CardEvolution.png)
$evolutions = @(
    @{id=126; wiki="KnightCardEvolution.png"; name="Knight"},
    @{id=127; wiki="ArchersCardEvolution.png"; name="Archers"},
    @{id=128; wiki="SkeletonsCardEvolution.png"; name="Skeletons"},
    @{id=129; wiki="BarbariansCardEvolution.png"; name="Barbarians"},
    @{id=130; wiki="RoyalGiantCardEvolution.png"; name="Royal Giant"},
    @{id=131; wiki="MortarCardEvolution.png"; name="Mortar"},
    @{id=132; wiki="BatsCardEvolution.png"; name="Bats"},
    @{id=133; wiki="BomberCardEvolution.png"; name="Bomber"},
    @{id=134; wiki="IceSpiritCardEvolution.png"; name="Ice Spirit"},
    @{id=135; wiki="ZapCardEvolution.png"; name="Zap"},
    @{id=136; wiki="SkeletonBarrelCardEvolution.png"; name="Skeleton Barrel"},
    @{id=137; wiki="FirecrackerCardEvolution.png"; name="Firecracker"},
    @{id=138; wiki="RoyalRecruitsCardEvolution.png"; name="Royal Recruits"},
    @{id=139; wiki="ValkyrieCardEvolution.png"; name="Valkyrie"},
    @{id=140; wiki="MusketeerCardEvolution.png"; name="Musketeer"},
    @{id=141; wiki="BattleRamCardEvolution.png"; name="Battle Ram"},
    @{id=142; wiki="WizardCardEvolution.png"; name="Wizard"},
    @{id=143; wiki="RoyalHogsCardEvolution.png"; name="Royal Hogs"},
    @{id=144; wiki="DartGoblinCardEvolution.png"; name="Dart Goblin"},
    @{id=145; wiki="FurnaceCardEvolution.png"; name="Furnace"},
    @{id=146; wiki="GoblinCageCardEvolution.png"; name="Goblin Cage"},
    @{id=147; wiki="BabyDragonCardEvolution.png"; name="Baby Dragon"},
    @{id=148; wiki="SkeletonArmyCardEvolution.png"; name="Skeleton Army"},
    @{id=149; wiki="WitchCardEvolution.png"; name="Witch"},
    @{id=150; wiki="PEKKACardEvolution.png"; name="P.E.K.K.A"},
    @{id=151; wiki="HunterCardEvolution.png"; name="Hunter"},
    @{id=152; wiki="ElectroDragonCardEvolution.png"; name="Electro Dragon"},
    @{id=153; wiki="WallBreakersCardEvolution.png"; name="Wall Breakers"},
    @{id=154; wiki="ExecutionerCardEvolution.png"; name="Executioner"},
    @{id=155; wiki="GoblinGiantCardEvolution.png"; name="Goblin Giant"},
    @{id=156; wiki="GoblinBarrelCardEvolution.png"; name="Goblin Barrel"},
    @{id=157; wiki="GoblinDrillCardEvolution.png"; name="Goblin Drill"},
    @{id=158; wiki="MegaKnightCardEvolution.png"; name="Mega Knight"},
    @{id=159; wiki="InfernoDragonCardEvolution.png"; name="Inferno Dragon"},
    @{id=160; wiki="LumberjackCardEvolution.png"; name="Lumberjack"},
    @{id=161; wiki="RoyalGhostCardEvolution.png"; name="Royal Ghost"},
    @{id=162; wiki="CannonCardEvolution.png"; name="Cannon"},
    @{id=163; wiki="TeslaCardEvolution.png"; name="Tesla"},
    @{id=164; wiki="GiantSnowballCardEvolution.png"; name="Giant Snowball"}
)

Write-Host "=== Downloading Evolution Card Images from Fandom Wiki ===" -ForegroundColor Cyan
Write-Host ""

# Threshold: files below this size (bytes) are likely placeholders
$minSize = 10000

$success = 0
$skipped = 0
$failed = 0

foreach ($evo in $evolutions) {
    $outputPath = Join-Path $outputDir "$($evo.id).png"
    
    # Check existing file size - skip if already good
    if (Test-Path $outputPath) {
        $existingSize = (Get-Item $outputPath).Length
        if ($existingSize -ge $minSize) {
            Write-Host "[SKIP] $($evo.name) (#$($evo.id)) - already good ($existingSize bytes)" -ForegroundColor DarkGray
            $skipped++
            continue
        }
        Write-Host "[REPLACING] $($evo.name) (#$($evo.id)) - placeholder ($existingSize bytes)" -ForegroundColor Yellow
    }
    
    # Query wiki API for real image URL
    $apiUrl = "https://clashroyale.fandom.com/api.php?action=query&titles=File:$($evo.wiki)&prop=imageinfo&iiprop=url&format=json"
    
    try {
        $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -ErrorAction Stop
        $json = $response.Content | ConvertFrom-Json
        
        # Extract image URL from API response
        $pages = $json.query.pages
        $imageUrl = $null
        
        foreach ($page in $pages.PSObject.Properties) {
            if ($page.Value.imageinfo) {
                $imageUrl = $page.Value.imageinfo[0].url
                break
            }
        }
        
        if (-not $imageUrl) {
            Write-Host "[FAIL] $($evo.name) (#$($evo.id)) - image not found on wiki" -ForegroundColor Red
            $failed++
            continue
        }
        
        # Download the image
        Invoke-WebRequest -Uri $imageUrl -OutFile $outputPath -UseBasicParsing -ErrorAction Stop
        $newSize = (Get-Item $outputPath).Length
        
        if ($newSize -ge $minSize) {
            Write-Host "[OK] $($evo.name) (#$($evo.id)) - $newSize bytes" -ForegroundColor Green
            $success++
        } else {
            Write-Host "[WARN] $($evo.name) (#$($evo.id)) - downloaded but small ($newSize bytes)" -ForegroundColor Yellow
            $success++
        }
    }
    catch {
        Write-Host "[FAIL] $($evo.name) (#$($evo.id)) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Small delay to be nice to the wiki
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Downloaded: $success" -ForegroundColor Green
Write-Host "Skipped (already good): $skipped" -ForegroundColor DarkGray
Write-Host "Failed: $failed" -ForegroundColor Red
