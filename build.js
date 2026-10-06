// Copies src/ to dist/ and injects N8N_WEBHOOK_URL into index.html.
// Reads from the process environment (Vercel) or a local .env file.
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadDotEnv();

const url = process.env.N8N_WEBHOOK_URL;
if (!url) {
  console.error('N8N_WEBHOOK_URL is not set. Add it to .env or your Vercel project environment variables.');
  process.exit(1);
}

const src = path.join(__dirname, 'src');
const dist = path.join(__dirname, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(src, dist, { recursive: true });

const indexPath = path.join(dist, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8').replace('__N8N_WEBHOOK_URL__', url.replace(/'/g, "\\'"));
fs.writeFileSync(indexPath, html);
console.log('Built dist/ with webhook', new URL(url).origin);
