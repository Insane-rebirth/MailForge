const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateFacebookIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(1, '#a855f7');
  ctx.fillStyle = gradient;
  
  // Draw rounded rectangle
  const radius = 180;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Draw envelope icon
  ctx.fillStyle = '#ffffff';
  const envelopeX = 256;
  const envelopeY = 320;
  const envelopeWidth = 512;
  const envelopeHeight = 320;
  
  // Envelope body
  ctx.beginPath();
  ctx.roundRect(envelopeX, envelopeY, envelopeWidth, envelopeHeight, 32);
  ctx.fill();
  
  // Envelope flap
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(envelopeX, envelopeY + 64);
  ctx.lineTo(envelopeX + envelopeWidth / 2, envelopeY + envelopeHeight - 40);
  ctx.lineTo(envelopeX + envelopeWidth, envelopeY + 64);
  ctx.stroke();
  
  // Mail slot
  ctx.fillStyle = '#6366f1';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.roundRect(envelopeX + 60, envelopeY, 44, 96, 8);
  ctx.fill();
  
  // Check mark
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(envelopeX + envelopeWidth - 60, envelopeY + 48, 28, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(envelopeX + envelopeWidth - 70, envelopeY + 48);
  ctx.lineTo(envelopeX + envelopeWidth - 56, envelopeY + 58);
  ctx.lineTo(envelopeX + envelopeWidth - 38, envelopeY + 38);
  ctx.stroke();
  
  ctx.globalAlpha = 1;
  
  // Draw "MF" text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 128px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MF', size / 2, size - 160);
  
  // Save to file
  const outputPath = path.join(__dirname, '..', 'public', 'facebook-icon.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log('Icon generated successfully:', outputPath);
  console.log('Size:', size + 'x' + size);
  console.log('File size:', buffer.length + ' bytes');
}

generateFacebookIcon();
