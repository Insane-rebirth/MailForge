const fs = require('fs');
const https = require('https');
const path = require('path');

const APP_ID = '1330758902461953';
const APP_SECRET = 'f3335a10dd2eba15d43720bf215a967c';
const ACCESS_TOKEN = `${APP_ID}|${APP_SECRET}`;
const ICON_PATH = path.join(__dirname, 'public', 'facebook-icon.png');

async function uploadIcon() {
  try {
    const fileBuffer = fs.readFileSync(ICON_PATH);
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    
    // Try the photos endpoint with app icon tag
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="source"; filename="facebook-icon.png"\r\n`),
      Buffer.from(`Content-Type: image/png\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="tagged_place_here"\r\n\r\n`),
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="no_story"\r\n\r\n`),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/me/photos?access_token=${ACCESS_TOKEN}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('Upload response:', data);
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve({ raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

uploadIcon()
  .then((result) => {
    console.log('Final result:', JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  });