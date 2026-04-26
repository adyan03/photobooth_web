const fs = require('fs');

async function processImage() {
    try {
        const { Jimp } = require('jimp');
        const imagePath = 'public/frames/desain3.png';
        const image = await Jimp.read(imagePath);
        
        let redPixelCount = 0;
        
        // Scan all pixels
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            // Detect pure/strong red (assuming the box is solid red like #FF0000 or similar)
            if (r > 150 && g < 80 && b < 80) {
                // Set alpha to 0 (transparent)
                this.bitmap.data[idx + 3] = 0;
                redPixelCount++;
            }
        });
        
        console.log(`Removed ${redPixelCount} red pixels.`);
        
        await image.writeAsync(imagePath);
        console.log('Saved back to ' + imagePath);
    } catch (e) {
        console.error('Error processing image:', e);
    }
}

processImage();
