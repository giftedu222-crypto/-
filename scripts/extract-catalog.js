const fs = require('fs');
const path = require('path');

const sourcePath = 'C:/Users/Have a good day^^/Downloads/seafood-dex.html';
const outputPath = path.resolve(__dirname, '../catalog-data.js');
const source = fs.readFileSync(sourcePath, 'utf8')
  .replace(/&quot;/g, '"')
  .replace(/&#x27;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

function namesFromSet(label) {
  const match = source.match(new RegExp(`const ${label}=new Set\\(\\[([^\\]]+)\\]\\)`));
  if (!match) throw new Error(`${label} 목록을 찾을 수 없습니다.`);
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]));
}

const rawMatch = source.match(/const rawCatalog=\{([\s\S]*?)\n\s*\};/);
if (!rawMatch) throw new Error('수산생물 목록을 찾을 수 없습니다.');
const groups = [];
for (const match of rawMatch[1].matchAll(/'([^']+)':\[([^\]]+)\]/g)) {
  groups.push([match[1], [...match[2].matchAll(/'([^']+)'/g)].map(item => item[1])]);
}

const legendary = namesFromSet('legendary');
const rare = namesFromSet('rare');

const photoLabel = source.indexOf('const photoData=');
const photoStart = photoLabel + 'const photoData='.length;
const stateStart = source.indexOf('const S=', photoStart);
const photoEnd = source.lastIndexOf(';', stateStart);
if (photoLabel < 0 || stateStart < 0 || photoEnd < photoStart) throw new Error('사진 데이터를 찾을 수 없습니다.');
const photos = JSON.parse(source.slice(photoStart, photoEnd));

const traitStart = source.indexOf('const traitData=Object.fromEntries([');
const traitEnd = source.indexOf(']);', traitStart);
const traits = {};
const traitBlock = source.slice(traitStart, traitEnd);
for (const match of traitBlock.matchAll(/\['([^']+)','([^']+)'\]/g)) traits[match[1]] = match[2];

const seasonMatch = source.match(/const seasonGroups=\{([\s\S]*?)\n\s*\};/);
const seasons = {};
if (seasonMatch) {
  for (const match of seasonMatch[1].matchAll(/'([^']+)':'([^']+)'/g)) {
    for (const name of match[2].split(',')) seasons[name] = match[1];
  }
}

function recipeFor(item) {
  const name = item.name;
  if (['멸치','정어리','조기','양미리','도루묵'].includes(name)) return '볶음 · 구이 · 조림';
  if (['뱀장어','붕장어','갯장어'].includes(name)) return '숯불구이 · 덮밥 · 맑은탕';
  if (['갈치','고등어','삼치','꽁치'].includes(name)) return '소금구이 · 무조림 · 튀김';
  if (item.form === 'ceph') return '숙회 · 볶음 · 구이';
  if (item.form === 'shell') return '찜 · 숯불구이 · 맑은탕';
  if (item.form === 'crust') return '찜 · 소금구이 · 해물탕';
  if (name === '성게') return '성게알밥 · 비빔밥 · 초밥';
  if (name === '해삼') return '회 · 볶음 · 해삼탕';
  if (name === '멍게' || name === '미더덕') return '회 · 비빔밥 · 된장찌개';
  if (['아귀','대구','명태','꼼치'].includes(name)) return '맑은탕 · 찜 · 전';
  return '회 · 소금구이 · 맑은탕';
}

const items = [];
for (const [group, names] of groups) {
  names.forEach((name, index) => {
    const tier = legendary.has(name) ? 3 : rare.has(name) ? 2 : 1;
    const form = group === '어류' ? 'fish' : group === '연체류' ? (index < 8 ? 'ceph' : 'shell') : group === '갑각류' ? 'crust' : 'other';
    const photo = photos[name];
    if (!photo) throw new Error(`${name} 사진이 없습니다.`);
    const base = { name, group, tier, form };
    items.push({
      id: name,
      name,
      group,
      tier,
      form,
      value: tier === 3 ? 60 : tier === 2 ? 30 : 12,
      trait: traits[name] || `${name}의 생태 정보가 기록되어 있습니다.`,
      season: seasons[name] || '연중',
      recipe: recipeFor(base),
      photo: photo.data,
      source: photo.source,
      license: photo.license
    });
  });
}

if (items.length !== 90) throw new Error(`예상한 90종이 아니라 ${items.length}종이 추출되었습니다.`);
fs.writeFileSync(outputPath, `window.SEAFOOD_CATALOG=${JSON.stringify(items)};\n`, 'utf8');
console.log(`${items.length}종 도감 데이터를 생성했습니다: ${outputPath}`);
