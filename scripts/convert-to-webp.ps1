# Script to convert PNG images to WebP format for optimization
# Requires: cwebp (from libwebp) - Install via: winget install Google.WebP

param(
    [int]$Quality = 80,
    [switch]$KeepOriginals = $false
)

$ErrorActionPreference = "Stop"

# Check if cwebp is available
$cwebp = Get-Command cwebp -ErrorAction SilentlyContinue
if (-not $cwebp) {
    Write-Host "cwebp not found. Installing libwebp tools..." -ForegroundColor Yellow
    Write-Host "Please run: winget install Google.WebP" -ForegroundColor Cyan
    Write-Host "Or download from: https://developers.google.com/speed/webp/download" -ForegroundColor Cyan
    exit 1
}

$publicPath = Join-Path $PSScriptRoot "..\public\images"
$totalSaved = 0
$filesConverted = 0

Write-Host "`n=== WebP Image Optimization Script ===" -ForegroundColor Cyan
Write-Host "Quality: $Quality%" -ForegroundColor Gray
Write-Host ""

# Function to convert a single file
function Convert-ToWebP {
    param(
        [string]$InputFile,
        [int]$Quality
    )
    
    $outputFile = [System.IO.Path]::ChangeExtension($InputFile, ".webp")
    $originalSize = (Get-Item $InputFile).Length
    
    # Convert using cwebp
    & cwebp -q $Quality -m 6 -af -mt $InputFile -o $outputFile 2>$null
    
    if (Test-Path $outputFile) {
        $newSize = (Get-Item $outputFile).Length
        $saved = $originalSize - $newSize
        $percentage = [math]::Round(($saved / $originalSize) * 100, 1)
        
        return @{
            Success = $true
            OriginalSize = $originalSize
            NewSize = $newSize
            Saved = $saved
            Percentage = $percentage
        }
    }
    
    return @{ Success = $false }
}

# Convert cards folder
$cardsPath = Join-Path $publicPath "cards"
Write-Host "Processing cards folder..." -ForegroundColor Yellow

$pngFiles = Get-ChildItem -Path $cardsPath -Filter "*.png" -ErrorAction SilentlyContinue
$totalFiles = $pngFiles.Count

if ($totalFiles -gt 0) {
    Write-Host "Found $totalFiles PNG files to convert" -ForegroundColor Gray
    
    $i = 0
    foreach ($file in $pngFiles) {
        $i++
        $percent = [math]::Round(($i / $totalFiles) * 100)
        Write-Progress -Activity "Converting cards" -Status "$i of $totalFiles" -PercentComplete $percent
        
        $result = Convert-ToWebP -InputFile $file.FullName -Quality $Quality
        
        if ($result.Success) {
            $filesConverted++
            $totalSaved += $result.Saved
            
            if (-not $KeepOriginals) {
                Remove-Item $file.FullName -Force
            }
        }
    }
    Write-Progress -Activity "Converting cards" -Completed
}

# Convert elixir.png if exists
$elixirPng = Join-Path $publicPath "elixir.png"
if (Test-Path $elixirPng) {
    Write-Host "Converting elixir.png..." -ForegroundColor Yellow
    $result = Convert-ToWebP -InputFile $elixirPng -Quality $Quality
    if ($result.Success) {
        $filesConverted++
        $totalSaved += $result.Saved
        if (-not $KeepOriginals) {
            Remove-Item $elixirPng -Force
        }
    }
}

# Convert wallpaper thumbs (jpg to webp)
$wallpapersPath = Join-Path $publicPath "wallpapers"
$jpgFiles = Get-ChildItem -Path $wallpapersPath -Filter "*-thumb.jpg" -ErrorAction SilentlyContinue

foreach ($file in $jpgFiles) {
    Write-Host "Converting $($file.Name)..." -ForegroundColor Yellow
    $outputFile = $file.FullName -replace '\.jpg$', '.webp'
    
    & cwebp -q $Quality -m 6 $file.FullName -o $outputFile 2>$null
    
    if (Test-Path $outputFile) {
        $originalSize = $file.Length
        $newSize = (Get-Item $outputFile).Length
        $totalSaved += ($originalSize - $newSize)
        $filesConverted++
        
        if (-not $KeepOriginals) {
            Remove-Item $file.FullName -Force
        }
    }
}

# Summary
Write-Host "`n=== Conversion Complete ===" -ForegroundColor Green
Write-Host "Files converted: $filesConverted" -ForegroundColor Cyan
Write-Host "Total space saved: $([math]::Round($totalSaved / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update code references from .png to .webp" -ForegroundColor Gray
Write-Host "2. Test the application" -ForegroundColor Gray
Write-Host "3. Commit and push changes" -ForegroundColor Gray
