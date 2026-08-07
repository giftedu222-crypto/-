import fs from 'node:fs/promises';
import path from 'node:path';

globalThis.window = {};
await import('../catalog-data.js');
await import('../recipe-photo-data.js');

const catalog = window.SEAFOOD_CATALOG;
const photos = { ...window.RECIPE_PHOTOS };
const usedSources = new Set();
const clearSoupWords = /맑은|지리|생선탕|조개탕|대구탕|아귀탕|동태탕|홍합탕|가리비탕|백합탕|재첩국|굴국|해물탕/;
const rejectedSoupWords = /돼지|김치|부대|순두부|된장|청국장|닭|소고기|감자국|콩나물|버섯|어묵|오뎅|매운탕|꽃게탕/;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const isClearSeafoodSoup = title => clearSoupWords.test(title) && !rejectedSoupWords.test(title);

async function searchRecipes(query) {
  const response = await fetch(`https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Recipe search failed: ${response.status}`);
  const html = await response.text();
  const results = [];
  const pattern = /<a href="\/recipe\/(\d+)" class="common_sp_link">[\s\S]*?<img src="([^"]+)">[\s\S]*?<div class="common_sp_caption_tit line2">([^<]+)<\/div>/g;
  for (const match of html.matchAll(pattern)) {
    const source = `https://www.10000recipe.com/recipe/${match[1]}`;
    if (!usedSources.has(source)) results.push({ source, imageUrl: match[2], title: match[3].trim() });
  }
  return results;
}

async function download(result, outputPath) {
  const response = await fetch(result.imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: result.source } });
  const type = response.headers.get('content-type') || '';
  if (!response.ok || !type.startsWith('image/')) return false;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 8000) return false;
  await fs.writeFile(outputPath, bytes);
  usedSources.add(result.source);
  return true;
}

async function buildPool(queries) {
  const pool = [];
  for (const query of queries) {
    const results = await searchRecipes(query);
    pool.push(...results.filter(result => isClearSeafoodSoup(result.title)));
    await sleep(100);
  }
  return pool;
}

const fishPool = await buildPool(['생선 맑은탕', '생선 지리탕', '맑은 생선국', '해산물 맑은탕', '대구 지리탕', '아귀 지리탕', '광어 지리탕', '도미 맑은탕', '농어 지리탕', '민어 맑은탕', '복어 지리탕', '우럭 맑은탕', '동태 맑은탕', '조기 맑은탕', '생선 맑은국']);
const shellPool = await buildPool(['조개 맑은탕', '조개탕', '바지락 맑은탕', '홍합 맑은탕', '해산물 맑은국', '가리비 맑은탕', '굴국', '재첩국', '백합탕', '모시조개탕']);

let soupCount = 0;
for (const fish of catalog.filter(item => item.recipe.split(' · ').includes('맑은탕'))) {
  const key = `${fish.name}|맑은탕`;
  const current = photos[key];
  const exact = await searchRecipes(`${fish.name} 맑은탕`);
  const exactCandidates = exact.filter(result => result.title.includes(fish.name) && isClearSeafoodSoup(result.title));
  const pool = fish.group === '어류' ? fishPool : shellPool;
  const candidates = [...exactCandidates, ...pool].filter(result => !usedSources.has(result.source));
  let selected = null;
  for (const candidate of candidates) {
    if (await download(candidate, path.resolve(current.image))) { selected = candidate; break; }
  }
  if (!selected) throw new Error(`No verified soup photo for ${fish.name}`);
  photos[key] = { ...current, source: selected.source, title: selected.title };
  soupCount += 1;
  console.log(`[${soupCount}] ${key} <- ${selected.title}`);
  await sleep(100);
}

const yangmiri = catalog.find(item => item.name === '양미리');
let sandCount = 0;
for (const recipeName of yangmiri.recipe.split(' · ')) {
  const key = `양미리|${recipeName}`;
  const current = photos[key];
  const results = await searchRecipes(`양미리 ${recipeName}`);
  const candidates = results.filter(result => result.title.includes('양미리') && result.title.includes(recipeName));
  let selected = null;
  for (const candidate of candidates) {
    if (await download(candidate, path.resolve(current.image))) { selected = candidate; break; }
  }
  if (!selected) throw new Error(`No verified Yangmiri photo for ${recipeName}`);
  photos[key] = { ...current, source: selected.source, title: selected.title };
  sandCount += 1;
  console.log(`${key} <- ${selected.title}`);
}

await fs.writeFile('recipe-photo-data.js', `window.RECIPE_PHOTOS=${JSON.stringify(photos)};\n`);
console.log(`Updated ${soupCount} soup photos and ${sandCount} Yangmiri photos.`);
