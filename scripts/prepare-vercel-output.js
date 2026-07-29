/* Copies the static catalogue into Vercel's configured public output folder. */
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
const entries = ['index.html', 'robots.txt', 'sitemap.xml', 'CNAME', 'assets', 'products', 'categories', 'about', 'contact', 'faq', 'shipping', 'returns', 'payment', 'guides', 'geargao-logo.svg', 'geargao-header-logo.svg', 'geargao-banner.svg', 'logo.svg'];
async function main() {
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  await Promise.all(entries.map(async entry => {
    await fs.cp(path.join(root, entry), path.join(output, entry), { recursive: true });
  }));
  console.log('Prepared Vercel output: public (' + entries.length + ' root entries).');
}
main().catch(error => {
  console.error('Vercel output preparation failed: ' + error.message);
  process.exitCode = 1;
});

