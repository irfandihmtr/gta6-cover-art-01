// Neon Nights — entry point for the make.fun grader.
// Copies the static app and its screenshots into the output directory
// and writes the dossier the scorer expects, using the vendored
// library so the bytes match buildDossier exactly. Node 22 standard
// library only; no network, no clock, nothing outside this repo read.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the bounty's scorer passes to buildDossier; passing the
// same ones here makes this program fail exactly where the scorer
// would refuse the entry.
const CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 50_331_648,
  app_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, CAPS);
writeFileSync(join(out, 'dossier.json'), dossier);

console.log(`Neon Nights: app + screenshots copied, dossier ${dossier.length} bytes -> ${out}`);
