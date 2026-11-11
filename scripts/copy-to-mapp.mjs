import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const build = 'build';
const dest = 'mapp/public';
if (!existsSync(build)) {
  console.error('no build/ — run vite build first');
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(build, dest, { recursive: true });

// keep manifest at mapp root
const man = 'mapp/mapp.manifest.json';
if (existsSync(man)) {
  const j = JSON.parse(readFileSync(man, 'utf8'));
  j.version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  writeFileSync(man, JSON.stringify(j, null, 2) + '\n');
}
console.log('copied build → mapp/public');
