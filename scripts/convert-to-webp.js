/**
 * Script to convert PNG/JPG images to optimized WebP format
 * Run with: node scripts/convert-to-webp.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const QUALITY = 80; // WebP quality (0-100)
const PUBLIC_PATH = path.join(__dirname, '..', 'public', 'images');

let totalSaved = 0;
let filesConverted = 0;

async function convertToWebP(inputPath, quality = QUALITY) {
  const outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const originalSize = fs.statSync(inputPath).size;

  try {
    await sharp(inputPath)
      .webp({ quality, effort: 6 })
      .toFile(outputPath);

    const newSize = fs.statSync(outputPath).size;
    const saved = originalSize - newSize;
    const percentage = ((saved / originalSize) * 100).toFixed(1);

    return { success: true, originalSize, newSize, saved, percentage };
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
    return { success: false };
  }
}

async function processDirectory(dirPath, pattern = /\.(png|jpg|jpeg)$/i) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => pattern.test(f));
  console.log(`\nProcessing ${dirPath}: ${files.length} files`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dirPath, file);
    
    process.stdout.write(`\r  Converting ${i + 1}/${files.length}: ${file}`.padEnd(60));

    const result = await convertToWebP(filePath);

    if (result.success) {
      filesConverted++;
      totalSaved += result.saved;
      // Remove original file after successful conversion
      fs.unlinkSync(filePath);
    }
  }
  console.log('\n  Done!');
}

async function main() {
  console.log('=== WebP Image Optimization ===');
  console.log(`Quality: ${QUALITY}%\n`);

  // Convert cards (PNG)
  await processDirectory(path.join(PUBLIC_PATH, 'cards'), /\.png$/i);

  // Convert elixir.png if exists
  const elixirPath = path.join(PUBLIC_PATH, 'elixir.png');
  if (fs.existsSync(elixirPath)) {
    console.log('\nConverting elixir.png...');
    const result = await convertToWebP(elixirPath);
    if (result.success) {
      filesConverted++;
      totalSaved += result.saved;
      fs.unlinkSync(elixirPath);
      console.log(`  Saved ${result.percentage}%`);
    }
  }

  // Convert wallpaper thumbs (JPG)
  const wallpapersPath = path.join(PUBLIC_PATH, 'wallpapers');
  if (fs.existsSync(wallpapersPath)) {
    const jpgThumbs = fs.readdirSync(wallpapersPath).filter(f => /-thumb\.jpg$/i.test(f));
    if (jpgThumbs.length > 0) {
      console.log(`\nConverting ${jpgThumbs.length} wallpaper thumbnails...`);
      for (const file of jpgThumbs) {
        const filePath = path.join(wallpapersPath, file);
        const result = await convertToWebP(filePath);
        if (result.success) {
          filesConverted++;
          totalSaved += result.saved;
          fs.unlinkSync(filePath);
        }
      }
    }
  }

  // Summary
  console.log('\n=== Conversion Complete ===');
  console.log(`Files converted: ${filesConverted}`);
  console.log(`Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
