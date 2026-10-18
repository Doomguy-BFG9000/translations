// Checks the language pack. Run from this folder: node check.mjs
// Exit code 1 lists every problem; the same checks run on pull requests.
import { readFileSync } from 'node:fs';

const LANGS = ['ko', 'en'];
const problems = [];
const packs = {};

for (const lang of LANGS) {
  const text = readFileSync(new URL(`lang/${lang}.json`, import.meta.url), 'utf8');
  try { packs[lang] = JSON.parse(text); } catch (error) { problems.push(`lang/${lang}.json is not valid JSON: ${error.message}`); continue; }
  const keys = [...text.matchAll(/^ {2}"((?:[^"\\]|\\.)*)"\s*:/gm)].map(m => m[1]);
  for (const key of keys.filter((k, i) => keys.indexOf(k) !== i)) problems.push(`${lang}: duplicate key ${key}`);
}

const slots = value => [...value.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]).sort().join(',');
// Game localization IDs, hashes and file paths belong in the viewer, never here.
const rawIdentifier = (text, isKey) => text.match(/\d{6,}|(?<![0-9A-Fa-f])[0-9A-Fa-f]{8,}(?![0-9A-Fa-f])|[\w-]+[\\/][\w.-]+\.\w{2,4}\b/)?.[0]
  ?? (isKey ? null : text.match(/\.(?:dds|log|png|svg|js|json)\b/)?.[0]) ?? null;

if (packs.ko && packs.en) {
  for (const [a, b] of [['ko', 'en'], ['en', 'ko']]) {
    for (const key of Object.keys(packs[a])) if (!Object.hasOwn(packs[b], key)) problems.push(`${key}: in ${a}.json but missing from ${b}.json`);
  }
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(packs[lang])) {
      if (typeof value !== 'string') { problems.push(`${lang} ${key}: value must be a string`); continue; }
      if (/^[\s·]|[\s·]$/.test(value)) problems.push(`${lang} ${key}: starts or ends with a space or ·`);
      const id = rawIdentifier(key, true) ?? rawIdentifier(value, false);
      if (id) problems.push(`${lang} ${key}: looks like a game ID, hash or file path (${id})`);
    }
  }
  for (const key of Object.keys(packs.ko)) {
    if (Object.hasOwn(packs.en, key) && typeof packs.ko[key] === 'string' && typeof packs.en[key] === 'string' && slots(packs.ko[key]) !== slots(packs.en[key])) {
      problems.push(`${key}: slots differ (ko {${slots(packs.ko[key])}} vs en {${slots(packs.en[key])}})`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`OK: ${Object.keys(packs.ko).length} keys in ko and en`);
