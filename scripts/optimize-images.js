const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC = path.join(__dirname, '..', 'public', 'images');

async function optimizeFile(filePath, maxWidth, quality) {
  const ext = path.extname(filePath).toLowerCase();
  const originalSize = fs.statSync(filePath).size;
  
  let pipeline = sharp(filePath);
  const metadata = await pipeline.metadata();
  
  // Resize if wider than maxWidth
  if (metadata.width > maxWidth) {
    pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
  }
  
  const tmpPath = filePath + '.tmp';
  
  if (ext === '.webp') {
    await pipeline.webp({ quality, effort: 6 }).toFile(tmpPath);
    const newSize = fs.statSync(tmpPath).size;
    fs.renameSync(tmpPath, filePath);
    const saved = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(`  ${path.basename(filePath)}: ${(originalSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB (${saved}% saved)`);
    return { originalSize, newSize };
  } else if (ext === '.png') {
    const newPath = filePath.replace(/\.png$/, '.webp');
    await pipeline.webp({ quality, effort: 6 }).toFile(newPath);
    const newSize = fs.statSync(newPath).size;
    const saved = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(`  ${path.basename(filePath)} -> .webp: ${(originalSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB (${saved}% saved)`);
    return { originalSize, newSize, converted: true };
  }
  
  return null;
}

async function main() {
  let totalOriginal = 0;
  let totalNew = 0;

  // 1. Wallpapers: max 1920px wide, quality 75
  console.log('\n=== WALLPAPERS (max 1920px, quality 75) ===');
  const wallpaperDir = path.join(PUBLIC, 'wallpapers');
  const wallpapers = fs.readdirSync(wallpaperDir).filter(f => f.endsWith('.webp') && !f.includes('-thumb'));
  for (const file of wallpapers) {
    const result = await optimizeFile(path.join(wallpaperDir, file), 1920, 75);
    if (result) { totalOriginal += result.originalSize; totalNew += result.newSize; }
  }

  // 2. Game thumbnails: max 800px wide, quality 80
  console.log('\n=== GAME THUMBNAILS (max 800px, quality 80) ===');
  const gamesDir = path.join(PUBLIC, 'games');
  const games = fs.readdirSync(gamesDir).filter(f => f.endsWith('.webp'));
  for (const file of games) {
    const result = await optimizeFile(path.join(gamesDir, file), 800, 80);
    if (result) { totalOriginal += result.originalSize; totalNew += result.newSize; }
  }

  // 3. Memory card-back.png -> webp
  console.log('\n=== MEMORY CARD BACK (convert PNG to WebP) ===');
  const cardBackPath = path.join(PUBLIC, 'games', 'memory', 'card-back.png');
  if (fs.existsSync(cardBackPath)) {
    const result = await optimizeFile(cardBackPath, 400, 80);
    if (result) { totalOriginal += result.originalSize; totalNew += result.newSize; }
  }

  console.log(`\n=== TOTAL ===`);
  console.log(`Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(2)} MB (${((1 - totalNew/totalOriginal) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
