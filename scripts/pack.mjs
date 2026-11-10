import { execSync } from 'node:child_process';
import { mkdirSync, cpSync, existsSync } from 'node:fs';
import path from 'node:path';

const build = 'build';
if (!existsSync(build)) {
  console.error('run npm run build first');
  process.exit(1);
}
const out = 'dist-pkg';
mkdirSync(out, { recursive: true });
cpSync(build, out, { recursive: true });
for (const f of ['mappmanifest.json', 'icon.svg']) {
  if (existsSync(f)) cpSync(f, path.join(out, f));
}
execSync(`cd ${out} && zip -r -q ../app.zip .`);
console.log('wrote app.zip');
