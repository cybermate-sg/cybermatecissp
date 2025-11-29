/* eslint-disable no-undef */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeHeroImage() {
  // Security Note: This script uses only literal hardcoded paths with no user input
  // The path.join usage is safe as all arguments are literal strings
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
  const scriptsDir = __dirname;

  // Hardcoded literal paths - safe from path traversal as no user input is accepted
  // deepcode ignore PT: All path components are literal strings, no user input
  const inputPath = path.join(scriptsDir, '..', 'public', 'images', 'raju.jpg');
  // deepcode ignore PT: All path components are literal strings, no user input
  const outputPathWebP = path.join(scriptsDir, '..', 'public', 'images', 'raju.webp');
  // deepcode ignore PT: All path components are literal strings, no user input
  const outputPathJpg = path.join(scriptsDir, '..', 'public', 'images', 'raju-optimized.jpg');

  console.log('Optimizing hero image...');

  // Get original file size - inputPath uses only literal strings, no user input
  // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename
  const originalSize = fs.statSync(inputPath).size;
  console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);

  // Convert to WebP (best compression)
  await sharp(inputPath)
    .resize(1200, 1200, { // Reasonable size for hero image
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 85 })
    .toFile(outputPathWebP);

  // outputPathWebP uses only literal strings, no user input
  // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename
  const webpSize = fs.statSync(outputPathWebP).size;
  console.log(`WebP size: ${(webpSize / 1024).toFixed(2)} KB (${((webpSize/originalSize)*100).toFixed(1)}% of original)`);

  // Also create optimized JPG fallback
  await sharp(inputPath)
    .resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outputPathJpg);

  // outputPathJpg uses only literal strings, no user input
  // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename
  const jpgSize = fs.statSync(outputPathJpg).size;
  console.log(`Optimized JPG size: ${(jpgSize / 1024).toFixed(2)} KB (${((jpgSize/originalSize)*100).toFixed(1)}% of original)`);

  console.log('\nOptimization complete! ✓');
  console.log('Files created:');
  console.log('- public/images/raju.webp');
  console.log('- public/images/raju-optimized.jpg');
}

optimizeHeroImage().catch(console.error);
