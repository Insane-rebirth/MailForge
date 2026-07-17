const tls = require('tls');

const IMAP_HOST = 'imap.qq.com';
const IMAP_PORT = 993;
const USERNAME = '1573089608';
const PASSWORD = 'lizhixin151';

let buffer = '';
let state = 'connecting';

const socket = tls.connect({
  host: IMAP_HOST,
  port: IMAP_PORT,
  rejectUnauthorized: false,
}, () => {
  console.log('Connected to IMAP server');
});

socket.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\r\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    console.log('Server:', line);

    if (state === 'connecting' && line.includes('OK')) {
      state = 'authenticating';
      socket.write(`A001 LOGIN ${USERNAME} ${PASSWORD}\r\n`);
      console.log('Sent: LOGIN');
    } else if (state === 'authenticating' && line.includes('OK')) {
      state = 'selecting';
      socket.write(`A002 SELECT INBOX\r\n`);
      console.log('Sent: SELECT INBOX');
    } else if (state === 'selecting' && line.includes('OK')) {
      state = 'searching';
      socket.write(`A003 SEARCH FROM "creem"\r\n`);
      console.log('Sent: SEARCH FROM "creem"');
    } else if (state === 'searching' && line.includes('SEARCH')) {
      const match = line.match(/SEARCH (.+)/);
      if (match) {
        const ids = match[1].split(' ').filter(Boolean);
        if (ids.length > 0) {
          state = 'fetching';
          const latestId = ids[ids.length - 1];
          console.log(`Found ${ids.length} emails from Creem. Fetching latest: ${latestId}`);
          socket.write(`A004 FETCH ${latestId} BODY.PEEK[]\r\n`);
          console.log('Sent: FETCH BODY');
        } else {
          console.log('No emails found from Creem');
          socket.end();
        }
      }
    } else if (state === 'fetching' && line.includes('A004 OK')) {
      state = 'done';
      console.log('\n=== Email content extracted ===');
      socket.end();
    } else if (state === 'fetching') {
      console.log(line);
    }
  }
});

socket.on('error', (err) => {
  console.error('Error:', err.message);
  socket.end();
});

socket.on('end', () => {
  console.log('\nConnection closed');
});
