# Script para descargar todas las imágenes de cartas de Clash Royale
# Fuente: RoyaleAPI CDN

$outputDir = "c:\RoyaleHaus\public\images\cards"

# Mapeo de nombres de cartas a sus IDs en la API de Supercell
# Los nombres en la URL usan kebab-case sin espacios especiales
$cards = @(
    @{id=1; name="knight"; display="Knight"},
    @{id=2; name="archers"; display="Archers"},
    @{id=3; name="goblins"; display="Goblins"},
    @{id=4; name="giant"; display="Giant"},
    @{id=5; name="pekka"; display="P.E.K.K.A"},
    @{id=6; name="minions"; display="Minions"},
    @{id=7; name="balloon"; display="Balloon"},
    @{id=8; name="witch"; display="Witch"},
    @{id=9; name="barbarians"; display="Barbarians"},
    @{id=10; name="golem"; display="Golem"},
    @{id=11; name="skeletons"; display="Skeletons"},
    @{id=12; name="valkyrie"; display="Valkyrie"},
    @{id=13; name="skeleton-army"; display="Skeleton Army"},
    @{id=14; name="bomber"; display="Bomber"},
    @{id=15; name="musketeer"; display="Musketeer"},
    @{id=16; name="baby-dragon"; display="Baby Dragon"},
    @{id=17; name="prince"; display="Prince"},
    @{id=18; name="wizard"; display="Wizard"},
    @{id=19; name="mini-pekka"; display="Mini P.E.K.K.A"},
    @{id=20; name="spear-goblins"; display="Spear Goblins"},
    @{id=21; name="giant-skeleton"; display="Giant Skeleton"},
    @{id=22; name="hog-rider"; display="Hog Rider"},
    @{id=23; name="minion-horde"; display="Minion Horde"},
    @{id=24; name="ice-wizard"; display="Ice Wizard"},
    @{id=25; name="royal-giant"; display="Royal Giant"},
    @{id=26; name="three-musketeers"; display="Three Musketeers"},
    @{id=27; name="dark-prince"; display="Dark Prince"},
    @{id=28; name="princess"; display="Princess"},
    @{id=29; name="fire-spirit"; display="Fire Spirit"},
    @{id=30; name="guards"; display="Guards"},
    @{id=31; name="lava-hound"; display="Lava Hound"},
    @{id=32; name="miner"; display="Miner"},
    @{id=33; name="sparky"; display="Sparky"},
    @{id=34; name="ice-spirit"; display="Ice Spirit"},
    @{id=35; name="bowler"; display="Bowler"},
    @{id=36; name="lumberjack"; display="Lumberjack"},
    @{id=37; name="mega-minion"; display="Mega Minion"},
    @{id=38; name="inferno-dragon"; display="Inferno Dragon"},
    @{id=39; name="ice-golem"; display="Ice Golem"},
    @{id=40; name="elite-barbarians"; display="Elite Barbarians"},
    @{id=41; name="electro-wizard"; display="Electro Wizard"},
    @{id=42; name="dart-goblin"; display="Dart Goblin"},
    @{id=43; name="executioner"; display="Executioner"},
    @{id=44; name="battle-ram"; display="Battle Ram"},
    @{id=45; name="goblin-gang"; display="Goblin Gang"},
    @{id=46; name="bandit"; display="Bandit"},
    @{id=47; name="night-witch"; display="Night Witch"},
    @{id=48; name="bats"; display="Bats"},
    @{id=49; name="cannon-cart"; display="Cannon Cart"},
    @{id=50; name="mega-knight"; display="Mega Knight"},
    @{id=51; name="flying-machine"; display="Flying Machine"},
    @{id=52; name="skeleton-barrel"; display="Skeleton Barrel"},
    @{id=53; name="hunter"; display="Hunter"},
    @{id=54; name="zappies"; display="Zappies"},
    @{id=55; name="royal-ghost"; display="Royal Ghost"},
    @{id=56; name="magic-archer"; display="Magic Archer"},
    @{id=57; name="rascals"; display="Rascals"},
    @{id=58; name="royal-hogs"; display="Royal Hogs"},
    @{id=59; name="royal-recruits"; display="Royal Recruits"},
    @{id=60; name="goblin-giant"; display="Goblin Giant"},
    @{id=61; name="electro-dragon"; display="Electro Dragon"},
    @{id=62; name="ram-rider"; display="Ram Rider"},
    @{id=63; name="wall-breakers"; display="Wall Breakers"},
    @{id=64; name="fisherman"; display="Fisherman"},
    @{id=65; name="elixir-golem"; display="Elixir Golem"},
    @{id=66; name="battle-healer"; display="Battle Healer"},
    @{id=67; name="firecracker"; display="Firecracker"},
    @{id=68; name="heal-spirit"; display="Heal Spirit"},
    @{id=69; name="skeleton-dragons"; display="Skeleton Dragons"},
    @{id=70; name="electro-spirit"; display="Electro Spirit"},
    @{id=71; name="electro-giant"; display="Electro Giant"},
    @{id=72; name="mother-witch"; display="Mother Witch"},
    @{id=73; name="phoenix"; display="Phoenix"},
    @{id=74; name="goblin-demolisher"; display="Goblin Demolisher"},
    @{id=75; name="goblin-machine"; display="Goblin Machine"},
    @{id=76; name="suspicious-bush"; display="Suspicious Bush"},
    @{id=77; name="rune-giant"; display="Rune Giant"},
    @{id=78; name="berserker"; display="Berserker"},
    @{id=79; name="spirit-empress"; display="Spirit Empress"},
    @{id=80; name="arrows"; display="Arrows"},
    @{id=81; name="zap"; display="Zap"},
    @{id=82; name="fireball"; display="Fireball"},
    @{id=83; name="goblin-barrel"; display="Goblin Barrel"},
    @{id=84; name="rocket"; display="Rocket"},
    @{id=85; name="lightning"; display="Lightning"},
    @{id=86; name="mirror"; display="Mirror"},
    @{id=87; name="rage"; display="Rage"},
    @{id=88; name="freeze"; display="Freeze"},
    @{id=89; name="poison"; display="Poison"},
    @{id=90; name="the-log"; display="The Log"},
    @{id=91; name="graveyard"; display="Graveyard"},
    @{id=92; name="tornado"; display="Tornado"},
    @{id=93; name="clone"; display="Clone"},
    @{id=94; name="barbarian-barrel"; display="Barbarian Barrel"},
    @{id=95; name="giant-snowball"; display="Giant Snowball"},
    @{id=96; name="earthquake"; display="Earthquake"},
    @{id=97; name="royal-delivery"; display="Royal Delivery"},
    @{id=98; name="void"; display="Void"},
    @{id=99; name="goblin-curse"; display="Goblin Curse"},
    @{id=100; name="vines"; display="Vines"},
    @{id=101; name="cannon"; display="Cannon"},
    @{id=102; name="goblin-hut"; display="Goblin Hut"},
    @{id=103; name="mortar"; display="Mortar"},
    @{id=104; name="inferno-tower"; display="Inferno Tower"},
    @{id=105; name="bomb-tower"; display="Bomb Tower"},
    @{id=106; name="barbarian-hut"; display="Barbarian Hut"},
    @{id=107; name="tesla"; display="Tesla"},
    @{id=108; name="x-bow"; display="X-Bow"},
    @{id=109; name="tombstone"; display="Tombstone"},
    @{id=110; name="elixir-collector"; display="Elixir Collector"},
    @{id=111; name="furnace"; display="Furnace"},
    @{id=112; name="goblin-cage"; display="Goblin Cage"},
    @{id=113; name="goblin-drill"; display="Goblin Drill"},
    @{id=114; name="golden-knight"; display="Golden Knight"},
    @{id=115; name="archer-queen"; display="Archer Queen"},
    @{id=116; name="skeleton-king"; display="Skeleton King"},
    @{id=117; name="mighty-miner"; display="Mighty Miner"},
    @{id=118; name="monk"; display="Monk"},
    @{id=119; name="little-prince"; display="Little Prince"},
    @{id=120; name="goblinstein"; display="Goblinstein"},
    @{id=121; name="boss-bandit"; display="Boss Bandit"},
    @{id=122; name="tower-princess"; display="Tower Princess"},
    @{id=123; name="cannoneer"; display="Cannoneer"},
    @{id=124; name="dagger-duchess"; display="Dagger Duchess"},
    @{id=125; name="royal-chef"; display="Royal Chef"}
)

# Para evoluciones usaremos el nombre base con sufijo -evolution
$evolutions = @(
    @{id=126; name="knight-evolution"; display="Knight Evolution"},
    @{id=127; name="archers-evolution"; display="Archers Evolution"},
    @{id=128; name="skeletons-evolution"; display="Skeletons Evolution"},
    @{id=129; name="barbarians-evolution"; display="Barbarians Evolution"},
    @{id=130; name="royal-giant-evolution"; display="Royal Giant Evolution"},
    @{id=131; name="mortar-evolution"; display="Mortar Evolution"},
    @{id=132; name="bats-evolution"; display="Bats Evolution"},
    @{id=133; name="bomber-evolution"; display="Bomber Evolution"},
    @{id=134; name="ice-spirit-evolution"; display="Ice Spirit Evolution"},
    @{id=135; name="zap-evolution"; display="Zap Evolution"},
    @{id=136; name="skeleton-barrel-evolution"; display="Skeleton Barrel Evolution"},
    @{id=137; name="firecracker-evolution"; display="Firecracker Evolution"},
    @{id=138; name="royal-recruits-evolution"; display="Royal Recruits Evolution"},
    @{id=139; name="valkyrie-evolution"; display="Valkyrie Evolution"},
    @{id=140; name="musketeer-evolution"; display="Musketeer Evolution"},
    @{id=141; name="battle-ram-evolution"; display="Battle Ram Evolution"},
    @{id=142; name="wizard-evolution"; display="Wizard Evolution"},
    @{id=143; name="royal-hogs-evolution"; display="Royal Hogs Evolution"},
    @{id=144; name="dart-goblin-evolution"; display="Dart Goblin Evolution"},
    @{id=145; name="furnace-evolution"; display="Furnace Evolution"},
    @{id=146; name="goblin-cage-evolution"; display="Goblin Cage Evolution"},
    @{id=147; name="baby-dragon-evolution"; display="Baby Dragon Evolution"},
    @{id=148; name="skeleton-army-evolution"; display="Skeleton Army Evolution"},
    @{id=149; name="witch-evolution"; display="Witch Evolution"},
    @{id=150; name="pekka-evolution"; display="P.E.K.K.A Evolution"},
    @{id=151; name="hunter-evolution"; display="Hunter Evolution"},
    @{id=152; name="electro-dragon-evolution"; display="Electro Dragon Evolution"},
    @{id=153; name="wall-breakers-evolution"; display="Wall Breakers Evolution"},
    @{id=154; name="executioner-evolution"; display="Executioner Evolution"},
    @{id=155; name="goblin-giant-evolution"; display="Goblin Giant Evolution"},
    @{id=156; name="goblin-barrel-evolution"; display="Goblin Barrel Evolution"},
    @{id=157; name="goblin-drill-evolution"; display="Goblin Drill Evolution"},
    @{id=158; name="mega-knight-evolution"; display="Mega Knight Evolution"},
    @{id=159; name="inferno-dragon-evolution"; display="Inferno Dragon Evolution"},
    @{id=160; name="lumberjack-evolution"; display="Lumberjack Evolution"},
    @{id=161; name="royal-ghost-evolution"; display="Royal Ghost Evolution"},
    @{id=162; name="cannon-evolution"; display="Cannon Evolution"},
    @{id=163; name="tesla-evolution"; display="Tesla Evolution"},
    @{id=164; name="giant-snowball-evolution"; display="Giant Snowball Evolution"}
)

# Heroes (nuevos)
$heroes = @(
    @{id=165; name="hero-knight"; display="Hero Knight"},
    @{id=166; name="hero-mini-pekka"; display="Hero Mini P.E.K.K.A"},
    @{id=167; name="hero-musketeer"; display="Hero Musketeer"},
    @{id=168; name="hero-giant"; display="Hero Giant"}
)

# Combinamos todas las cartas
$allCards = $cards + $evolutions + $heroes

Write-Host "Descargando $($allCards.Count) imagenes de cartas de Clash Royale..." -ForegroundColor Cyan
Write-Host "Destino: $outputDir" -ForegroundColor Cyan
Write-Host ""

$success = 0
$failed = 0
$failedCards = @()

foreach ($card in $allCards) {
    $fileName = "$($card.id).png"
    $outputPath = Join-Path $outputDir $fileName
    
    # URLs alternativas para intentar
    $urls = @(
        "https://cdn.royaleapi.com/static/img/cards-150/$($card.name).png",
        "https://api-assets.clashroyale.com/cards/300/$($card.name).png",
        "https://cdn.statsroyale.com/images/cards/$($card.name).png"
    )
    
    $downloaded = $false
    
    foreach ($url in $urls) {
        try {
            $response = Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop -UseBasicParsing
            Write-Host "[OK] $($card.display) (#$($card.id))" -ForegroundColor Green
            $success++
            $downloaded = $true
            break
        }
        catch {
            # Intentar siguiente URL
        }
    }
    
    if (-not $downloaded) {
        Write-Host "[FAIL] $($card.display) (#$($card.id))" -ForegroundColor Red
        $failed++
        $failedCards += $card
    }
    
    # Pequeña pausa para no saturar el servidor
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "RESUMEN:" -ForegroundColor Yellow
Write-Host "  Exitosas: $success" -ForegroundColor Green
Write-Host "  Fallidas: $failed" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Yellow

if ($failedCards.Count -gt 0) {
    Write-Host ""
    Write-Host "Cartas que no se pudieron descargar:" -ForegroundColor Red
    foreach ($fc in $failedCards) {
        Write-Host "  - $($fc.display) (ID: $($fc.id), nombre: $($fc.name))" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Imagenes guardadas en: $outputDir" -ForegroundColor Cyan
