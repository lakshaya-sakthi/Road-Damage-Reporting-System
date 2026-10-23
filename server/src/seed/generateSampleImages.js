import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1x1 gray pixel PNG base64
const grayPixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const files = [
  'sample-pothole-1.jpg',
  'sample-crack-1.jpg',
  'sample-crack-2.jpg',
  'sample-pothole-2.jpg',
  'sample-repair-after.jpg'
];

files.forEach((file) => {
  const filePath = path.join(uploadsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, grayPixelPng);
    console.log(`Created sample image asset: ${filePath}`);
  }
});
