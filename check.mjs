// Checks the language pack. Run from this folder: node check.mjs
// Exit code 1 lists every problem; the same checks run on pull requests.
// ko and en must have exactly the same keys. Any other lang/<code>.json may be
// partial, but may only use keys that en.json has.
import { readdirSync, readFileSync } from 'node:fs';

const problems = [];
const packs = {};
const langs = readdirSync(new URL('lang/', import.meta.url)).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5)).sort();

for (const lang of langs) {
  if (!/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/.test(lang)) problems.push(`lang/${lang}.json: use a language code such as ja, zh-Hans or pt-BR`);
  const text = readFileSync(new URL(`lang/${lang}.json`, import.meta.url), 'utf8');
  try { packs[lang] = JSON.parse(text); } catch (error) { problems.push(`lang/${lang}.json is not valid JSON: ${error.message}`); continue; }
  const keys = [...text.matchAll(/^ {2}"((?:[^"\\]|\\.)*)"\s*:/gm)].map(m => m[1]);
  for (const key of keys.filter((k, i) => keys.indexOf(k) !== i)) problems.push(`${lang}: duplicate key ${key}`);
}

const slots = value => [...value.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]).sort().join(',');
// Game localization IDs, hashes and file paths belong in the viewer, never here.
const rawIdentifier = (text, isKey) => text.match(/\d{6,}|(?<![0-9A-Fa-f])[0-9A-Fa-f]{8,}(?![0-9A-Fa-f])|[\w-]+[\\/][\w.-]+\.\w{2,4}\b/)?.[0]
  ?? (isKey ? null : text.match(/\.(?:dds|log|png|svg|js|json)\b/)?.[0]) ?? null;

if (!packs.ko || !packs.en) problems.push('lang/ko.json and lang/en.json are required');
else {
  for (const [a, b] of [['ko', 'en'], ['en', 'ko']]) {
    for (const key of Object.keys(packs[a])) if (!Object.hasOwn(packs[b], key)) problems.push(`${key}: in ${a}.json but missing from ${b}.json`);
  }
  for (const lang of Object.keys(packs)) {
    for (const [key, value] of Object.entries(packs[lang])) {
      if (lang !== 'ko' && lang !== 'en' && !Object.hasOwn(packs.en, key)) { problems.push(`${lang} ${key}: not a key in en.json`); continue; }
      if (typeof value !== 'string') { problems.push(`${lang} ${key}: value must be a string`); continue; }
      if (/^[\s·]|[\s·]$/.test(value)) problems.push(`${lang} ${key}: starts or ends with a space or ·`);
      const id = rawIdentifier(key, true) ?? rawIdentifier(value, false);
      if (id) problems.push(`${lang} ${key}: looks like a game ID, hash or file path (${id})`);
      if (lang !== 'en' && typeof packs.en[key] === 'string' && slots(value) !== slots(packs.en[key])) {
        problems.push(`${lang} ${key}: slots differ from en ({${slots(value)}} vs {${slots(packs.en[key])}})`);
      }
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
const total = Object.keys(packs.en).length;
console.log(`OK: ${langs.map(lang => `${lang} ${Object.keys(packs[lang]).length}/${total}`).join(', ')}`);
