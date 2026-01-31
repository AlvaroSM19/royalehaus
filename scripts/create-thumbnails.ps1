# Script para crear thumbnails de wallpapers
Add-Type -AssemblyName System.Drawing

$sourceDir = "c:\RoyaleHaus\public\images\wallpapers"
$thumbWidth = 200
$thumbHeight = 120

Write-Host "Creando thumbnails..." -ForegroundColor Cyan

for ($i = 1; $i -le 4; $i++) {
    $sourcePath = Join-Path $sourceDir "wallpaper$i.webp"
    $thumbPath = Join-Path $sourceDir "wallpaper$i-thumb.jpg"
    
    if (Test-Path $sourcePath) {
        try {
            $image = [System.Drawing.Image]::FromFile($sourcePath)
            $bitmap = New-Object System.Drawing.Bitmap($thumbWidth, $thumbHeight)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($image, 0, 0, $thumbWidth, $thumbHeight)
            $bitmap.Save($thumbPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
            $graphics.Dispose()
            $bitmap.Dispose()
            $image.Dispose()
            Write-Host "[OK] wallpaper$i-thumb.jpg creado" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERROR] wallpaper$i : $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "[SKIP] wallpaper$i.webp no encontrado" -ForegroundColor Yellow
    }
}

Write-Host "`nListo! Thumbnails creados:" -ForegroundColor Cyan
Get-ChildItem $sourceDir | Format-Table Name, @{N='KB';E={[math]::Round($_.Length/1KB,1)}}
