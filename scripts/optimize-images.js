/* eslint-disable @typescript-eslint/no-var-requires */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '..', 'public', 'images');

  // Security check: Ensure we are operating within the allowed directory
  const validatePath = (filePath) => {
    const resolvedPath = path.resolve(filePath);
    const resolvedPublicDir = path.resolve(publicDir);
    if (!resolvedPath.startsWith(resolvedPublicDir)) {
      throw new Error(`Security Error: Access denied for path ${filePath}`);
    }
    return resolvedPath;
  };

  console.log('🖼️  Optimizing images...\n');

  // Optimize hero image (raju.jpg) - convert to WebP and resize
  const heroInput = validatePath(path.join(publicDir, 'raju.jpg'));
  const heroOutputWebP = validatePath(path.join(publicDir, 'raju.webp'));
  const heroOutputAvif = validatePath(path.join(publicDir, 'raju.avif'));

  if (fs.existsSync(heroInput)) {
    console.log('📸 Processing hero image (raju.jpg)...');

    // Create WebP version (900x900 for optimal display)
    await sharp(heroInput)
      .resize(1200, 1500, { // Maintain aspect ratio, fit within bounds
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85, effort: 6 })
      .toFile(heroOutputWebP);

    const webpStats = fs.statSync(heroOutputWebP);
    console.log(`  ✅ Created WebP: ${(webpStats.size / 1024).toFixed(2)} KB`);

    // Create AVIF version (even better compression)
    await sharp(heroInput)
      .resize(1200, 1500, {
        fit: 'cover',
        position: 'center'
      })
      .avif({ quality: 80, effort: 6 })
      .toFile(heroOutputAvif);

    const avifStats = fs.statSync(heroOutputAvif);
    console.log(`  ✅ Created AVIF: ${(avifStats.size / 1024).toFixed(2)} KB`);

    const originalStats = fs.statSync(heroInput);
    console.log(`  📊 Original: ${(originalStats.size / 1024).toFixed(2)} KB`);
    console.log(`  💾 Savings: ${((originalStats.size - avifStats.size) / 1024).toFixed(2)} KB\n`);
  }

  // Optimize logo
  // Optimize logo
  const logoInput = validatePath(path.join(publicDir, 'cybermate-logo.jpeg'));
  const logoOutputWebP = validatePath(path.join(publicDir, 'cybermate-logo.webp'));

  if (fs.existsSync(logoInput)) {
    console.log('🏷️  Processing logo (cybermate-logo.jpeg)...');

    await sharp(logoInput)
      .resize(80, null, { // 80px width for 40px display (2x for retina)
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 90 })
      .toFile(logoOutputWebP);

    const webpStats = fs.statSync(logoOutputWebP);
    const originalStats = fs.statSync(logoInput);
    console.log(`  ✅ Created WebP: ${(webpStats.size / 1024).toFixed(2)} KB`);
    console.log(`  📊 Original: ${(originalStats.size / 1024).toFixed(2)} KB`);
    console.log(`  💾 Savings: ${((originalStats.size - webpStats.size) / 1024).toFixed(2)} KB\n`);
  }

  console.log('✨ Image optimization complete!');
}

optimizeImages().catch(console.error);
