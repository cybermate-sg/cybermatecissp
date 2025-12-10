import sharp from 'sharp';
import { join } from 'path';

async function makeBackgroundTransparent() {
  const inputPath = join(process.cwd(), 'public', 'images', 'cybermate-logo-trans.png');
  const outputPath = join(process.cwd(), 'public', 'images', 'cybermate-logo-trans.png');
  const tempOutput = join(process.cwd(), 'public', 'images', 'cybermate-logo-trans-temp.png');

  try {
    // First, use sharp to remove white background
    await sharp(inputPath)
      .removeAlpha() // Remove any existing alpha
      .toBuffer()
      .then(buffer => {
        // Now add transparency by treating white as transparent
        return sharp(buffer)
          .unflatten() // Add alpha channel
          .raw()
          .toBuffer({ resolveWithObject: true });
      })
      .then(({ data, info }) => {
        const pixels = Buffer.from(data);
        const threshold = 245; // Slightly lower threshold

        console.log(`Processing ${info.width}x${info.height} image with ${info.channels} channels`);

        let changed = 0;
        // Make white/light pixels transparent
        for (let i = 0; i < pixels.length; i += info.channels) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          // Check if pixel is white or very light
          if (r >= threshold && g >= threshold && b >= threshold) {
            pixels[i + 3] = 0; // Make transparent
            changed++;
          }
        }

        console.log(`Made ${changed} white pixels transparent`);

        return sharp(pixels, {
          raw: {
            width: info.width,
            height: info.height,
            channels: info.channels
          }
        })
        .png({ compressionLevel: 9 })
        .toFile(tempOutput);
      });

    // Replace original with temp
    const fs = await import('fs/promises');
    await fs.unlink(inputPath);
    await fs.rename(tempOutput, outputPath);

    console.log('✓ Background successfully made transparent!');
    console.log(`  Saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeBackgroundTransparent();
