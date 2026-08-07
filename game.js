const canvas = document.querySelector('#game');
const statusEl = document.querySelector('#status');
const helpEl = document.querySelector('#help');
const startScreen = document.querySelector('#start');
const collectionScreen = document.querySelector('#collection');
const collectionGrid = document.querySelector('#collection-grid');
const collectionProgress = document.querySelector('#collection-progress');
const catchInfo = document.querySelector('#catch-info');
const menuBack = document.querySelector('#menu-back');
const locationScreen = document.querySelector('#location-select');
const currentPlaceEl = document.querySelector('#current-place');
const gameClockEl = document.querySelector('#game-clock');
const clockIconEl = document.querySelector('#clock-icon');
const clockTimeEl = document.querySelector('#clock-time');
const catchRatesToggleEl = document.querySelector('#catch-rates-toggle');
const catchRatesPanelEl = document.querySelector('#catch-rates-panel');
const catchRatesTitleEl = document.querySelector('#catch-rates-title');
const catchRatesListEl = document.querySelector('#catch-rates-list');
const seasonWidgetEl = document.querySelector('#season-widget');
const seasonTitleEl = document.querySelector('#season-title');
const seasonListEl = document.querySelector('#season-list');
const seasonToggleEl = document.querySelector('#season-toggle');

const fishCatalog = window.SEAFOOD_CATALOG || [];
const recipePhotos = window.RECIPE_PHOTOS || {};
const pageSize = 16;
let catalogPage = 0;
let catalogFilter = '전체';
let catalogTier = '전체';
let catalogCaughtOnly = false;
let collectionReturnToGame = false;
const rarityNames = { 1: '일반', 2: '희귀', 3: '전설' };
const rarityColors = { 1: '#4d916e', 2: '#1976c9', 3: '#e0a800' };
const trashCatches = [
  { id: 'trash-can', name: '찌그러진 빈 캔', group: '바다 쓰레기', model: 'trash-can', icon: '🥫', trait: '물고기인 줄 알았지만 오래된 빈 캔이었습니다.', isTrash: true },
  { id: 'trash-bottle', name: '떠다니던 페트병', group: '바다 쓰레기', model: 'trash-bottle', icon: '🧴', trait: '바다를 떠돌던 페트병을 건져 올렸습니다.', isTrash: true },
  { id: 'trash-boot', name: '낡은 장화', group: '바다 쓰레기', model: 'trash-boot', icon: '🥾', trait: '묵직한 손맛의 정체는 물고기가 아니라 낡은 장화였습니다.', isTrash: true }
];
const fishingPlaces = {
  amnam: { id: 'amnam', name: '암남공원 방파제', sky: 0x91cfe0, fog: 0x8bc8db, water: [0x0b4169, 0x082f56, 0x061f3f], sun: 0xffd281, light: 0xffdfad, catchRates: [{ name: '고등어', rate: 18 }, { name: '전갱이', rate: 15 }, { name: '감성돔', rate: 10 }, { name: '삼치', rate: 9 }, { name: '갈치', rate: 8 }, { name: '학꽁치', rate: 7 }, { name: '갑오징어', rate: 5 }], otherRate: 18, trashRate: 10 },
  yeongdo: { id: 'yeongdo', name: '영도 신방파제', sky: 0x789fb8, fog: 0x779aab, water: [0x0a3559, 0x072944, 0x041a31], sun: 0xffe0a8, light: 0xd9e7ed, catchRates: [{ name: '전갱이', rate: 17 }, { name: '갈치', rate: 14 }, { name: '붕장어', rate: 12 }, { name: '학꽁치', rate: 9 }, { name: '고등어', rate: 8 }, { name: '감성돔', rate: 6 }], otherRate: 24, trashRate: 10 },
  dadaepo: { id: 'dadaepo', name: '다대포 · 몰운대', sky: 0xd99070, fog: 0xb98270, water: [0x104a72, 0x0b365b, 0x072341], sun: 0xffb657, light: 0xffc88b, catchRates: [{ name: '도다리', rate: 16 }, { name: '감성돔', rate: 15 }, { name: '숭어', rate: 11 }, { name: '농어', rate: 9 }, { name: '참돔', rate: 7 }, { name: '벵에돔', rate: 5 }], otherRate: 27, trashRate: 10 }
};
let selectedFishingPlace = null;
const initialClock = new Date();
let gameMinutes = initialClock.getHours() * 60 + initialClock.getMinutes();

function seasonIncludesMonth(season, month) {
  if (season === '연중') return true;
  const range = season.match(/(\d{1,2})\s*[~–-]\s*(\d{1,2})월/);
  if (!range) return false;
  const start = Number(range[1]);
  const end = Number(range[2]);
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

function renderSeasonWidget() {
  const month = new Date().getMonth() + 1;
  const candidates = fishCatalog.filter(fish => seasonIncludesMonth(fish.season, month));
  const groups = ['어류', '연체류', '갑각류', '기타'];
  const buckets = groups.map(group => candidates.filter(fish => fish.group === group));
  const featured = [];
  while (featured.length < 6 && buckets.some(bucket => bucket.length)) {
    buckets.forEach(bucket => {
      if (bucket.length && featured.length < 6) featured.push(bucket.shift());
    });
  }
  const groupIcons = { 어류: '🐟', 연체류: '🐚', 갑각류: '🦀', 기타: '🌊' };
  seasonTitleEl.textContent = `${month}월 제철 해산물`;
  seasonListEl.innerHTML = featured.map(fish => `<li><span>${groupIcons[fish.group]}</span><b>${fish.name}</b><small>${fish.season}</small></li>`).join('');
}

function renderCatchRates(place) {
  catchRatesTitleEl.textContent = place.name;
  const rows = [...place.catchRates, { name: '기타 해산물', rate: place.otherRate }, { name: '바다 쓰레기', rate: place.trashRate }];
  catchRatesListEl.innerHTML = rows.map(item => `<li><div><span>${item.name}</span><b>${item.rate}%</b></div><i><span style="width:${item.rate}%"></span></i></li>`).join('');
}

function setSeasonWidgetCollapsed(collapsed) {
  seasonWidgetEl.classList.toggle('collapsed', collapsed);
  seasonToggleEl.textContent = collapsed ? '+' : '−';
  seasonToggleEl.setAttribute('aria-expanded', String(!collapsed));
  seasonToggleEl.setAttribute('aria-label', collapsed ? '제철 목록 펼치기' : '제철 목록 접기');
}

seasonToggleEl.addEventListener('click', () => {
  const collapsed = !seasonWidgetEl.classList.contains('collapsed');
  setSeasonWidgetCollapsed(collapsed);
  try { localStorage.setItem('season-widget-collapsed-v1', collapsed ? '1' : '0'); } catch {}
});

try { setSeasonWidgetCollapsed(localStorage.getItem('season-widget-collapsed-v1') === '1'); } catch { setSeasonWidgetCollapsed(false); }

let discoveredFish = new Set();
let catchCounts = {};
try {
  discoveredFish = new Set(JSON.parse(localStorage.getItem('seafood-dex-collection-v1') || '[]'));
  catchCounts = JSON.parse(localStorage.getItem('seafood-dex-catch-counts-v1') || '{}');
} catch {
  discoveredFish = new Set();
  catchCounts = {};
}

function saveCollection() {
  try {
    localStorage.setItem('seafood-dex-collection-v1', JSON.stringify([...discoveredFish]));
    localStorage.setItem('seafood-dex-catch-counts-v1', JSON.stringify(catchCounts));
  } catch {}
}

function getFilteredCatalog() {
  const groupFilteredCatalog = catalogFilter === '전체' ? fishCatalog : fishCatalog.filter(fish => fish.group === catalogFilter);
  const tierFilteredCatalog = catalogTier === '전체' ? groupFilteredCatalog : groupFilteredCatalog.filter(fish => fish.tier === Number(catalogTier));
  return catalogCaughtOnly ? tierFilteredCatalog.filter(fish => discoveredFish.has(fish.id)) : tierFilteredCatalog;
}

function renderCollection() {
  const groupFilteredCatalog = catalogFilter === '전체' ? fishCatalog : fishCatalog.filter(fish => fish.group === catalogFilter);
  const tierFilteredCatalog = catalogTier === '전체' ? groupFilteredCatalog : groupFilteredCatalog.filter(fish => fish.tier === Number(catalogTier));
  const filteredCatalog = getFilteredCatalog();
  const pageCount = Math.max(1, Math.ceil(filteredCatalog.length / pageSize));
  catalogPage = THREE.MathUtils.clamp(catalogPage, 0, Math.max(0, pageCount - 1));
  const start = catalogPage * pageSize;
  const filteredDiscovered = tierFilteredCatalog.filter(fish => discoveredFish.has(fish.id)).length;
  collectionProgress.textContent = `${filteredDiscovered} / ${tierFilteredCatalog.length} 등록`;
  document.querySelector('#page-label').textContent = `${catalogPage + 1} / ${pageCount}`;
  document.querySelector('#page-prev').disabled = catalogPage === 0;
  document.querySelector('#page-next').disabled = catalogPage === pageCount - 1;
  document.querySelectorAll('.dex-category').forEach(button => {
    const active = button.dataset.group === catalogFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.dex-rarity').forEach(button => {
    const active = button.dataset.tier === catalogTier;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const caughtOnlyButton = document.querySelector('#dex-caught-only');
  caughtOnlyButton.classList.toggle('active', catalogCaughtOnly);
  caughtOnlyButton.setAttribute('aria-pressed', String(catalogCaughtOnly));
  collectionGrid.innerHTML = filteredCatalog.length ? filteredCatalog.slice(start, start + pageSize).map(fish => {
    const index = fishCatalog.indexOf(fish);
    const found = discoveredFish.has(fish.id);
    return `<button type="button" class="fish-card ${found ? '' : 'locked'}" data-index="${index}">
      <img src="${fish.photo}" alt=""><span class="fish-number">${String(index + 1).padStart(4, '0')}</span>
      <strong>${fish.name}</strong><small>${fish.group} · <span class="rarity-text tier-${fish.tier}">${rarityNames[fish.tier]}</span> · ${found ? '등록 완료' : '미등록'}</small>
    </button>`;
  }).join('') : `<p class="dex-empty">${catalogCaughtOnly ? '아직 잡은 해산물이 없습니다.' : '이 분류에는 해당 등급의 해산물이 없습니다.'}</p>`;
  collectionGrid.querySelectorAll('.fish-card').forEach(card => card.addEventListener('click', () => showCatalogDetail(Number(card.dataset.index))));
}

function showCatalogDetail(index) {
  const fish = fishCatalog[index];
  const found = discoveredFish.has(fish.id);
  const detail = document.querySelector('#collection-detail');
  detail.dataset.index = String(index);
  const photo = document.querySelector('#detail-photo');
  photo.src = fish.photo;
  photo.alt = `${fish.name} 실제 사진`;
  photo.classList.toggle('is-locked', !found);
  document.querySelector('#detail-number').textContent = `No.${String(index + 1).padStart(3, '0')}`;
  const detailRarity = document.querySelector('#detail-rarity');
  detailRarity.textContent = rarityNames[fish.tier];
  detailRarity.className = `tier-${fish.tier}`;
  document.querySelector('#detail-name').textContent = fish.name;
  document.querySelector('#detail-meta').textContent = `${fish.group} · ${found ? '등록 완료' : '미등록 · 회색 미리보기'}`;
  document.querySelector('#detail-trait').textContent = fish.trait;
  document.querySelector('#detail-season').textContent = `대표 제철 ${fish.season} · 지역별 차이 있음`;
  const recipeNames = fish.recipe.split(' · ');
  document.querySelector('#detail-recipe-list').innerHTML = recipeNames.map(recipeName => {
    const visual = recipePhotos[`${fish.name}|${recipeName}`];
    const lockedClass = found ? '' : 'is-locked';
    return `<article class="detail-recipe-item"><img class="${lockedClass}" src="${visual.image}?v=3" alt="${fish.name} ${recipeName} 실제 완성 요리 사진"><div class="detail-recipe-copy"><strong>${fish.name} ${recipeName}</strong><a href="${visual.source}" target="_blank" rel="noreferrer">실제 요리 사진 출처</a></div></article>`;
  }).join('');
  const credit = document.querySelector('#detail-credit');
  credit.href = fish.source;
  credit.textContent = `사진 출처 · ${fish.license}`;
  const filteredCatalog = getFilteredCatalog();
  const filteredIndex = filteredCatalog.indexOf(fish);
  const previousFish = filteredCatalog[filteredIndex - 1];
  const nextFish = filteredCatalog[filteredIndex + 1];
  const previousButton = document.querySelector('#detail-prev');
  const nextButton = document.querySelector('#detail-next');
  previousButton.disabled = !previousFish;
  nextButton.disabled = !nextFish;
  previousButton.title = previousFish ? `이전 · ${previousFish.name}` : '첫 번째 해산물입니다';
  nextButton.title = nextFish ? `다음 · ${nextFish.name}` : '마지막 해산물입니다';
  detail.hidden = false;
}

function moveCatalogDetail(direction) {
  const detail = document.querySelector('#collection-detail');
  const currentFish = fishCatalog[Number(detail.dataset.index)];
  const filteredCatalog = getFilteredCatalog();
  const nextPosition = filteredCatalog.indexOf(currentFish) + direction;
  const nextFish = filteredCatalog[nextPosition];
  if (!nextFish) return;
  catalogPage = Math.floor(nextPosition / pageSize);
  renderCollection();
  showCatalogDetail(fishCatalog.indexOf(nextFish));
}

function showCatchInformation(fish, isNew, count) {
  const catchLabel = document.querySelector('#catch-label');
  catchLabel.textContent = fish.isTrash ? '꽝!' : isNew ? 'NEW CATCH' : 'DUPLICATE';
  catchLabel.classList.toggle('duplicate', fish.isTrash || !isNew);
  const caughtIcon = document.querySelector('#caught-icon');
  caughtIcon.classList.toggle('is-trash', fish.isTrash);
  caughtIcon.innerHTML = fish.isTrash ? fish.icon : `<img src="${fish.photo}" alt="${fish.name}">`;
  const caughtKind = document.querySelector('#caught-kind');
  caughtKind.textContent = fish.isTrash ? fish.group : `${fish.group} · ${rarityNames[fish.tier]}`;
  caughtKind.style.color = fish.isTrash ? '#9eb0b7' : rarityColors[fish.tier];
  document.querySelector('#caught-name').textContent = fish.name;
  document.querySelector('#caught-description').textContent = fish.trait;
  document.querySelector('#caught-recipe').textContent = fish.isTrash ? '추천 요리 없음' : fish.recipe;
  document.querySelector('#caught-season').textContent = fish.isTrash ? '해당 없음' : fish.season;
  document.querySelector('#caught-state').textContent = fish.isTrash ? '도감에 등록되지 않음' : isNew ? '새로 발견!' : `중복 획득 · 총 ${count}회`;
  const caughtDexButton = document.querySelector('#caught-open-dex');
  caughtDexButton.hidden = Boolean(fish.isTrash);
  if (!fish.isTrash) caughtDexButton.dataset.index = String(fishCatalog.indexOf(fish));
  catchInfo.style.setProperty('--catch-color', fish.isTrash ? '#69747a' : rarityColors[fish.tier]);
  catchInfo.style.display = 'flex';
}

function pickCatch() {
  const place = selectedFishingPlace || fishingPlaces.amnam;
  const roll = Math.random() * 100;
  if (roll < place.trashRate) return trashCatches[Math.floor(Math.random() * trashCatches.length)];
  let cursor = place.trashRate;
  for (const entry of place.catchRates) {
    cursor += entry.rate;
    if (roll < cursor) return fishCatalog.find(fish => fish.name === entry.name);
  }
  const featuredNames = new Set(place.catchRates.map(entry => entry.name));
  const otherPool = fishCatalog.filter(fish => !featuredNames.has(fish.name));
  const tierRoll = Math.random();
  const tier = tierRoll < 0.06 ? 3 : tierRoll < 0.28 ? 2 : 1;
  const tierPool = otherPool.filter(fish => fish.tier === tier);
  const pool = tierPool.length ? tierPool : otherPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8bc8db, 0.011);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 800);
camera.position.set(0, 2.35, 11);
camera.lookAt(0, 0.2, -16);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x91cfe0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;

const hemisphereLight = new THREE.HemisphereLight(0xe9fbff, 0x183b48, 2.1);
scene.add(hemisphereLight);
const sunLight = new THREE.DirectionalLight(0xffdfad, 2.6);
sunLight.position.set(-35, 45, 20);
scene.add(sunLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(5.5, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0xffd281, fog: false })
);
sun.position.set(-52, 38, -145);
scene.add(sun);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4.1, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0xe6efff, fog: false })
);
moon.visible = false;
scene.add(moon);

const starPositions = [];
for (let i = 0; i < 420; i++) {
  starPositions.push((Math.random() - 0.5) * 320, 18 + Math.random() * 110, -70 - Math.random() * 260);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.72, transparent: true, opacity: 0, depthWrite: false, fog: false });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Layered Gerstner-like waves made from several moving sine bands.
const waterGeometry = new THREE.PlaneGeometry(600, 600, 90, 90);
const waterPosition = waterGeometry.attributes.position;
function applyWaterGradient(colors) {
  const nearWater = new THREE.Color(colors[0]);
  const middleWater = new THREE.Color(colors[1]);
  const deepWater = new THREE.Color(colors[2]);
  const waterColors = [];
  for (let i = 0; i < waterPosition.count; i++) {
    const distance = THREE.MathUtils.clamp((waterPosition.getY(i) + 4) / 125, 0, 1);
    const color = distance < 0.45
      ? nearWater.clone().lerp(middleWater, distance / 0.45)
      : middleWater.clone().lerp(deepWater, (distance - 0.45) / 0.55);
    waterColors.push(color.r, color.g, color.b);
  }
  waterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
  waterGeometry.attributes.color.needsUpdate = true;
}
applyWaterGradient(fishingPlaces.amnam.water);
const waterMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  vertexColors: true,
  transparent: true,
  opacity: 0.98,
  flatShading: false
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
scene.add(water);

function applyFishingPlace(place) {
  selectedFishingPlace = place;
  renderCatchRates(place);
  catchRatesToggleEl.style.display = 'block';
  catchRatesToggleEl.setAttribute('aria-expanded', 'false');
  catchRatesPanelEl.hidden = true;
  applyWaterGradient(place.water);
  sun.material.color.set(place.sun);
  sunLight.color.set(place.light);
  currentPlaceEl.textContent = `현재 장소 · ${place.name}`;
  currentPlaceEl.style.display = 'block';
  gameClockEl.style.display = 'grid';
  seasonWidgetEl.classList.add('in-game');
  Object.entries(placeScenery).forEach(([key, group]) => { group.visible = key === place.id; });
  updateTimeOfDay(0);
}

function updateTimeOfDay(delta) {
  if (!selectedFishingPlace) return;
  if (started) gameMinutes = (gameMinutes + delta) % 1440;
  const hour = Math.floor(gameMinutes / 60);
  const minute = Math.floor(gameMinutes % 60);
  const solarAngle = ((gameMinutes - 360) / 1440) * Math.PI * 2;
  const altitude = Math.sin(solarAngle);
  const daylight = THREE.MathUtils.clamp((altitude + 0.08) / 0.43, 0, 1);
  const twilight = Math.max(0, 1 - Math.abs(altitude) * 7);

  const skyColor = new THREE.Color(0x020817).lerp(new THREE.Color(selectedFishingPlace.sky), daylight);
  skyColor.lerp(new THREE.Color(0xcf6b55), twilight * 0.48);
  const fogColor = new THREE.Color(0x081322).lerp(new THREE.Color(selectedFishingPlace.fog), daylight);
  fogColor.lerp(new THREE.Color(0xa55e55), twilight * 0.3);
  renderer.setClearColor(skyColor);
  scene.fog.color.copy(fogColor);

  sun.position.set(Math.cos(solarAngle) * 105, altitude * 72, -145);
  sun.visible = altitude > -0.08;
  moon.position.set(-Math.cos(solarAngle) * 100, -altitude * 62, -150);
  moon.visible = altitude < 0.12;
  starMaterial.opacity = THREE.MathUtils.clamp((-altitude + 0.02) / 0.42, 0, 0.92);
  sunLight.intensity = 0.12 + daylight * 2.48;
  hemisphereLight.intensity = 0.28 + daylight * 1.82;
  waterMaterial.color.setScalar(0.28 + daylight * 0.72);

  clockTimeEl.textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  clockIconEl.textContent = altitude > 0.18 ? '☀' : altitude > -0.08 ? '◐' : '☾';
}

const shore = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 24),
  new THREE.MeshStandardMaterial({ color: 0xcbb27f, roughness: 0.95 })
);
shore.rotation.x = -Math.PI / 2;
shore.position.set(0, -0.08, 16);
scene.add(shore);

for (let i = 0; i < 34; i++) {
  const radius = 0.28 + Math.random() * 0.9;
  const rockColor = new THREE.Color().setHSL(0.54 + Math.random() * 0.035, 0.12, 0.17 + Math.random() * 0.07);
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(radius, 1),
    new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.96 })
  );
  const x = (Math.random() - 0.5) * 42;
  const z = 4 + Math.random() * 24;
  rock.position.set(x, radius * 0.2, z);
  rock.scale.set(0.75 + Math.random() * 0.8, 0.45 + Math.random() * 0.55, 0.7 + Math.random() * 0.8);
  rock.rotation.set(Math.random() * 0.45, Math.random() * Math.PI, Math.random() * 0.35);
  rock.receiveShadow = true;
  scene.add(rock);

  if (i % 4 === 0) {
    const moss = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.52, 10, 7),
      new THREE.MeshStandardMaterial({ color: 0x344f3e, roughness: 1 })
    );
    moss.position.set(x, radius * 0.58, z);
    moss.scale.set(0.85, 0.16, 0.65);
    moss.rotation.y = Math.random() * Math.PI;
    scene.add(moss);
  }
}

const islands = new THREE.Group();
for (let i = 0; i < 11; i++) {
  const height = 11 + Math.random() * 18;
  const radius = 9 + Math.random() * 10;
  const mountainColor = new THREE.Color().setHSL(0.45 + Math.random() * 0.025, 0.28, 0.19 + Math.random() * 0.055);
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 9 + Math.floor(Math.random() * 3), 3),
    new THREE.MeshStandardMaterial({ color: mountainColor, roughness: 1, flatShading: true })
  );
  mountain.position.set(-76 + i * 15.5, height * 0.5 - 0.6, -78 - Math.random() * 28);
  mountain.scale.z = 0.58 + Math.random() * 0.25;
  mountain.rotation.y = Math.random() * Math.PI;
  islands.add(mountain);

  const foothill = new THREE.Mesh(
    new THREE.DodecahedronGeometry(radius * 0.85, 1),
    new THREE.MeshStandardMaterial({ color: 0x254942, roughness: 1, flatShading: true })
  );
  foothill.position.set(mountain.position.x + (Math.random() - 0.5) * 6, 1.1, mountain.position.z + 5);
  foothill.scale.set(1.35, 0.35, 0.72);
  islands.add(foothill);
}
scene.add(islands);

// Place-specific Busan landmarks.
const placeScenery = { amnam: new THREE.Group(), yeongdo: new THREE.Group(), dadaepo: new THREE.Group() };

const amnamCliff = new THREE.Mesh(
  new THREE.DodecahedronGeometry(7.5, 1),
  new THREE.MeshStandardMaterial({ color: 0x263c3b, roughness: 1, flatShading: true })
);
amnamCliff.position.set(-18, 5.2, -31);
amnamCliff.scale.set(1.35, 1.55, 0.72);
placeScenery.amnam.add(amnamCliff);
const cableStart = new THREE.Vector3(-22, 15.5, -29);
const cableEnd = new THREE.Vector3(19, 18, -49);
placeScenery.amnam.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([cableStart, cableEnd]),
  new THREE.LineBasicMaterial({ color: 0x1a2226 })
));
for (let i = 0; i < 3; i++) {
  const gondola = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.82, 0.86),
    new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf0b43d : 0xd34738, roughness: 0.55 })
  );
  gondola.position.lerpVectors(cableStart, cableEnd, 0.2 + i * 0.28);
  gondola.position.y -= 0.62;
  placeScenery.amnam.add(gondola);
}

const breakwater = new THREE.Mesh(
  new THREE.BoxGeometry(31, 0.8, 3.2),
  new THREE.MeshStandardMaterial({ color: 0x555d5f, roughness: 0.96 })
);
breakwater.position.set(-4, 0.25, -25);
breakwater.rotation.y = -0.08;
placeScenery.yeongdo.add(breakwater);
const lighthouse = new THREE.Mesh(
  new THREE.CylinderGeometry(0.85, 1.15, 5.8, 14),
  new THREE.MeshStandardMaterial({ color: 0xededdf, roughness: 0.68 })
);
lighthouse.position.set(-18.2, 3.35, -23.9);
placeScenery.yeongdo.add(lighthouse);
const lighthouseTop = new THREE.Mesh(
  new THREE.CylinderGeometry(1.05, 0.88, 1.3, 14),
  new THREE.MeshStandardMaterial({ color: 0xd84c43, roughness: 0.55 })
);
lighthouseTop.position.set(-18.2, 6.85, -23.9);
placeScenery.yeongdo.add(lighthouseTop);
const ship = new THREE.Group();
const shipHull = new THREE.Mesh(new THREE.BoxGeometry(9, 1.3, 2.2), new THREE.MeshStandardMaterial({ color: 0x253d50, roughness: 0.8 }));
const shipCabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.7, 1.7), new THREE.MeshStandardMaterial({ color: 0xd8ddd7, roughness: 0.7 }));
shipCabin.position.set(1.2, 1.25, 0);
ship.add(shipHull, shipCabin);
ship.position.set(20, 1.2, -48);
placeScenery.yeongdo.add(ship);

const sandMaterial = new THREE.MeshStandardMaterial({ color: 0xa58c65, roughness: 1 });
for (let i = 0; i < 4; i++) {
  const sandbar = new THREE.Mesh(new THREE.SphereGeometry(5 + i * 1.1, 18, 10), sandMaterial);
  sandbar.scale.set(1.8, 0.07, 0.48);
  sandbar.position.set(-18 + i * 12, 0.02, -26 - (i % 2) * 9);
  placeScenery.dadaepo.add(sandbar);
}
const reedMaterial = new THREE.MeshStandardMaterial({ color: 0x6e6938, roughness: 1 });
for (let i = 0; i < 34; i++) {
  const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.1 + Math.random() * 1.2, 5), reedMaterial);
  reed.position.set((i % 2 ? 1 : -1) * (8 + Math.random() * 8), 0.7, 4 + Math.random() * 12);
  reed.rotation.z = (Math.random() - 0.5) * 0.15;
  placeScenery.dadaepo.add(reed);
}

Object.values(placeScenery).forEach(group => { group.visible = false; scene.add(group); });

// Detailed first-person fishing rod.
const handRig = new THREE.Group();
camera.add(handRig);
scene.add(camera);
handRig.position.set(0.42, -0.72, -1.0);
handRig.rotation.set(0.08, -0.08, 0);

const rod = new THREE.Group();
rod.rotation.set(-0.1, -0.22, 1.25);
handRig.add(rod);

const corkMaterial = new THREE.MeshStandardMaterial({ color: 0x9b6c3c, roughness: 0.9 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x17232a, roughness: 0.3, metalness: 0.65 });
const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xd6a536, roughness: 0.24, metalness: 0.82 });
const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xd79a70, roughness: 0.8 });

const rearGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.5, 14), corkMaterial);
rearGrip.rotation.z = Math.PI / 2;
rearGrip.position.x = -0.12;
rod.add(rearGrip);

const foreGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.055, 0.34, 14), corkMaterial);
foreGrip.rotation.z = Math.PI / 2;
foreGrip.position.x = 0.32;
rod.add(foreGrip);

const rodCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.38, 0, 0),
  new THREE.Vector3(1.0, 0.012, 0),
  new THREE.Vector3(1.72, 0.035, 0),
  new THREE.Vector3(2.42, 0.08, 0),
  new THREE.Vector3(2.92, 0.13, 0)
]);
const pole = new THREE.Mesh(new THREE.TubeGeometry(rodCurve, 30, 0.018, 8, false), darkMaterial);
rod.add(pole);

for (const x of [0.8, 1.35, 1.9, 2.4, 2.82]) {
  const guide = new THREE.Mesh(new THREE.TorusGeometry(0.038 - x * 0.006, 0.006, 6, 12), goldMaterial);
  guide.rotation.y = Math.PI / 2;
  guide.position.set(x, -0.035 + x * 0.02, 0);
  rod.add(guide);
}

const reelBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.17, 16), goldMaterial);
reelBody.rotation.x = Math.PI / 2;
reelBody.position.set(0.25, -0.14, 0);
rod.add(reelBody);
const reelSpool = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 16), darkMaterial);
reelSpool.rotation.x = Math.PI / 2;
reelSpool.position.copy(reelBody.position);
rod.add(reelSpool);
const reelHandle = new THREE.Group();
reelHandle.position.set(0.25, -0.14, 0.13);
const crank = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.025, 0.025), goldMaterial);
reelHandle.add(crank);
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), darkMaterial);
knob.position.x = 0.1;
reelHandle.add(knob);
rod.add(reelHandle);

const hand = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.09, 0.28, 12), skinMaterial);
hand.rotation.z = Math.PI / 2;
hand.position.set(0.04, -0.04, 0.02);
rod.add(hand);

const bobber = new THREE.Group();
const bobberTop = new THREE.Mesh(
  new THREE.SphereGeometry(0.105, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xff4d36, emissive: 0x4b0b06, roughness: 0.4 })
);
const bobberBottom = new THREE.Mesh(
  new THREE.SphereGeometry(0.085, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xf4f1d8, roughness: 0.55 })
);
bobberBottom.position.y = -0.09;
bobber.add(bobberTop, bobberBottom);
bobber.visible = false;
scene.add(bobber);

const hookedFish = new THREE.Group();
const hookedFishMaterial = new THREE.MeshStandardMaterial({ color: 0x4f916f, roughness: 0.48, metalness: 0.08 });
const hookedCatchAccentMaterial = new THREE.MeshStandardMaterial({ color: 0xd6c89e, roughness: 0.62 });
const hookedCatchEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x07131a });
const hookedCatchModels = {};

function catchPart(geometry, material = hookedFishMaterial, position, scale, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  if (rotation) mesh.rotation.set(...rotation);
  return mesh;
}

function registerCatchModel(key, parts) {
  const model = new THREE.Group();
  parts.forEach(part => model.add(part));
  model.visible = false;
  hookedCatchModels[key] = model;
  hookedFish.add(model);
}

registerCatchModel('fish', [
  catchPart(new THREE.SphereGeometry(0.24, 16, 10), hookedFishMaterial, [0, 0, 0], [1.65, 0.72, 0.58]),
  catchPart(new THREE.ConeGeometry(0.17, 0.3, 3), hookedFishMaterial, [-0.43, 0, 0], null, [0, 0, -Math.PI / 2]),
  catchPart(new THREE.ConeGeometry(0.1, 0.22, 3), hookedFishMaterial, [0.02, 0.17, 0]),
  catchPart(new THREE.SphereGeometry(0.025, 8, 6), hookedCatchEyeMaterial, [0.25, 0.055, 0.12])
]);

registerCatchModel('eel', [
  catchPart(new THREE.CylinderGeometry(0.075, 0.11, 0.95, 12), hookedFishMaterial, [0, -0.18, 0], null, [0, 0, Math.PI / 2]),
  catchPart(new THREE.SphereGeometry(0.12, 12, 8), hookedFishMaterial, [0.46, -0.18, 0], [1.15, 0.8, 0.8]),
  catchPart(new THREE.ConeGeometry(0.08, 0.28, 8), hookedFishMaterial, [-0.58, -0.18, 0], null, [0, 0, Math.PI / 2]),
  catchPart(new THREE.SphereGeometry(0.02, 7, 5), hookedCatchEyeMaterial, [0.51, -0.14, 0.085])
]);

registerCatchModel('flatfish', [
  catchPart(new THREE.SphereGeometry(0.3, 18, 10), hookedFishMaterial, [0, -0.08, 0], [1.35, 0.82, 0.2]),
  catchPart(new THREE.ConeGeometry(0.17, 0.28, 3), hookedFishMaterial, [-0.43, -0.08, 0], [1, 1.2, 0.45], [0, 0, -Math.PI / 2]),
  catchPart(new THREE.SphereGeometry(0.022, 7, 5), hookedCatchEyeMaterial, [0.2, 0.05, 0.065]),
  catchPart(new THREE.SphereGeometry(0.022, 7, 5), hookedCatchEyeMaterial, [0.28, 0.01, 0.065])
]);

registerCatchModel('ray', [
  catchPart(new THREE.DodecahedronGeometry(0.34, 0), hookedFishMaterial, [0, -0.05, 0], [1.35, 0.62, 0.16], [0, 0, Math.PI / 4]),
  catchPart(new THREE.CylinderGeometry(0.018, 0.04, 0.7, 7), hookedFishMaterial, [-0.52, -0.2, 0], null, [0, 0, Math.PI / 2]),
  catchPart(new THREE.SphereGeometry(0.02, 7, 5), hookedCatchEyeMaterial, [0.2, 0.02, 0.075])
]);

const squidParts = [
  catchPart(new THREE.ConeGeometry(0.2, 0.62, 12), hookedFishMaterial, [0, -0.15, 0]),
  catchPart(new THREE.SphereGeometry(0.14, 12, 8), hookedFishMaterial, [0, -0.48, 0], [1, 0.65, 1]),
  catchPart(new THREE.ConeGeometry(0.12, 0.24, 3), hookedFishMaterial, [-0.14, 0.04, 0], [1, 1, 0.35], [0, 0, 0.5]),
  catchPart(new THREE.ConeGeometry(0.12, 0.24, 3), hookedFishMaterial, [0.14, 0.04, 0], [1, 1, 0.35], [0, 0, -0.5]),
  catchPart(new THREE.SphereGeometry(0.022, 7, 5), hookedCatchEyeMaterial, [0.09, -0.43, 0.11])
];
for (let i = 0; i < 6; i++) squidParts.push(catchPart(new THREE.CylinderGeometry(0.012, 0.022, 0.34 + (i % 2) * 0.1, 6), hookedFishMaterial, [(i - 2.5) * 0.035, -0.73, 0], null, [0, 0, (i - 2.5) * 0.09]));
registerCatchModel('squid', squidParts);

const octopusParts = [
  catchPart(new THREE.SphereGeometry(0.23, 16, 10), hookedFishMaterial, [0, -0.2, 0], [1, 1.15, 1]),
  catchPart(new THREE.SphereGeometry(0.025, 7, 5), hookedCatchEyeMaterial, [0.09, -0.18, 0.2]),
  catchPart(new THREE.SphereGeometry(0.025, 7, 5), hookedCatchEyeMaterial, [-0.09, -0.18, 0.2])
];
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  octopusParts.push(catchPart(new THREE.CylinderGeometry(0.018, 0.04, 0.45, 7), hookedFishMaterial, [Math.cos(angle) * 0.18, -0.5, Math.sin(angle) * 0.12], null, [Math.sin(angle) * 0.38, 0, Math.cos(angle) * 0.38]));
}
registerCatchModel('octopus', octopusParts);

registerCatchModel('shell', [
  catchPart(new THREE.SphereGeometry(0.28, 18, 10), hookedFishMaterial, [0, -0.22, 0], [1.15, 0.85, 0.34], [0.08, 0, 0]),
  catchPart(new THREE.SphereGeometry(0.22, 18, 9), hookedCatchAccentMaterial, [0, -0.27, 0.06], [1.05, 0.64, 0.12])
]);

registerCatchModel('snail', [
  catchPart(new THREE.SphereGeometry(0.25, 18, 12), hookedFishMaterial, [0, -0.25, 0], [1, 0.88, 0.56]),
  catchPart(new THREE.TorusGeometry(0.12, 0.025, 7, 18), hookedCatchAccentMaterial, [0.02, -0.23, 0.15]),
  catchPart(new THREE.ConeGeometry(0.12, 0.3, 12), hookedFishMaterial, [-0.24, -0.3, 0], null, [0, 0, Math.PI / 2])
]);

const crabParts = [
  catchPart(new THREE.SphereGeometry(0.25, 14, 9), hookedFishMaterial, [0, -0.2, 0], [1.3, 0.55, 1]),
  catchPart(new THREE.SphereGeometry(0.13, 10, 7), hookedFishMaterial, [-0.42, -0.12, 0], [1.15, 0.72, 1]),
  catchPart(new THREE.SphereGeometry(0.13, 10, 7), hookedFishMaterial, [0.42, -0.12, 0], [1.15, 0.72, 1])
];
for (let side of [-1, 1]) for (let i = 0; i < 4; i++) crabParts.push(catchPart(new THREE.CylinderGeometry(0.014, 0.025, 0.4, 6), hookedFishMaterial, [side * (0.25 + i * 0.035), -0.34 - i * 0.025, 0], null, [0, 0, side * (0.75 + i * 0.12)]));
registerCatchModel('crab', crabParts);

const shrimpParts = [];
for (let i = 0; i < 6; i++) shrimpParts.push(catchPart(new THREE.SphereGeometry(0.11 - i * 0.009, 10, 7), hookedFishMaterial, [0.28 - i * 0.105, -0.18 - Math.sin(i * 0.45) * 0.12, 0], [1.2, 0.85, 0.75]));
shrimpParts.push(catchPart(new THREE.ConeGeometry(0.13, 0.24, 3), hookedFishMaterial, [-0.37, -0.28, 0], null, [0, 0, Math.PI / 2]));
shrimpParts.push(catchPart(new THREE.SphereGeometry(0.018, 7, 5), hookedCatchEyeMaterial, [0.35, -0.12, 0.085]));
registerCatchModel('shrimp', shrimpParts);

const urchinParts = [catchPart(new THREE.SphereGeometry(0.24, 14, 9), hookedFishMaterial, [0, -0.25, 0])];
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  urchinParts.push(catchPart(new THREE.ConeGeometry(0.025, 0.22, 5), hookedFishMaterial, [Math.cos(angle) * 0.27, -0.25 + Math.sin(angle) * 0.27, 0], null, [0, 0, -angle + Math.PI / 2]));
}
registerCatchModel('urchin', urchinParts);

registerCatchModel('cucumber', [
  catchPart(new THREE.SphereGeometry(0.22, 14, 9), hookedFishMaterial, [0, -0.3, 0], [0.72, 1.7, 0.72]),
  catchPart(new THREE.SphereGeometry(0.04, 7, 5), hookedCatchAccentMaterial, [0.08, -0.12, 0.14]),
  catchPart(new THREE.SphereGeometry(0.035, 7, 5), hookedCatchAccentMaterial, [-0.1, -0.3, 0.15]),
  catchPart(new THREE.SphereGeometry(0.04, 7, 5), hookedCatchAccentMaterial, [0.07, -0.48, 0.13])
]);

registerCatchModel('tunicate', [
  catchPart(new THREE.SphereGeometry(0.25, 14, 9), hookedFishMaterial, [0, -0.28, 0], [0.92, 1.25, 0.9]),
  catchPart(new THREE.CylinderGeometry(0.045, 0.08, 0.15, 9), hookedCatchAccentMaterial, [-0.08, -0.03, 0], null, [0, 0, -0.2]),
  catchPart(new THREE.CylinderGeometry(0.035, 0.07, 0.13, 9), hookedCatchAccentMaterial, [0.1, -0.08, 0.04], null, [0, 0, 0.28])
]);

registerCatchModel('trash-can', [
  catchPart(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 14), hookedFishMaterial, [0, -0.27, 0], null, [0.08, 0, 0.25]),
  catchPart(new THREE.TorusGeometry(0.12, 0.014, 6, 14), hookedCatchAccentMaterial, [0.05, -0.06, 0.01], null, [Math.PI / 2, 0, 0.25]),
  catchPart(new THREE.TorusGeometry(0.12, 0.014, 6, 14), hookedCatchAccentMaterial, [-0.05, -0.47, -0.01], null, [Math.PI / 2, 0, 0.25])
]);

registerCatchModel('trash-bottle', [
  catchPart(new THREE.CylinderGeometry(0.13, 0.16, 0.48, 12), hookedFishMaterial, [0, -0.31, 0], [0.72, 1, 0.72], [0.05, 0, -0.18]),
  catchPart(new THREE.CylinderGeometry(0.055, 0.08, 0.18, 10), hookedFishMaterial, [-0.055, -0.01, 0], null, [0.05, 0, -0.18]),
  catchPart(new THREE.CylinderGeometry(0.061, 0.061, 0.07, 10), hookedCatchAccentMaterial, [-0.07, 0.1, 0], null, [0.05, 0, -0.18])
]);

registerCatchModel('trash-boot', [
  catchPart(new THREE.BoxGeometry(0.24, 0.5, 0.22), hookedFishMaterial, [0, -0.23, 0], null, [0, 0, 0.12]),
  catchPart(new THREE.BoxGeometry(0.43, 0.18, 0.24), hookedFishMaterial, [0.12, -0.52, 0], null, [0, 0, -0.08]),
  catchPart(new THREE.BoxGeometry(0.48, 0.045, 0.27), hookedCatchAccentMaterial, [0.12, -0.62, 0], null, [0, 0, -0.08])
]);

function getCatchModelKey(fish) {
  if (fish.isTrash) return fish.model;
  if (fish.form === 'fish') {
    if (['갈치', '뱀장어', '붕장어', '갯장어', '학꽁치'].includes(fish.name)) return 'eel';
    if (['가자미', '도다리', '넙치', '서대'].includes(fish.name)) return 'flatfish';
    if (['홍어', '가오리'].includes(fish.name)) return 'ray';
    return 'fish';
  }
  if (fish.form === 'ceph') return ['문어', '낙지', '주꾸미', '피문어'].includes(fish.name) ? 'octopus' : 'squid';
  if (fish.form === 'shell') return ['전복', '소라', '골뱅이'].includes(fish.name) ? 'snail' : 'shell';
  if (fish.form === 'crust') return fish.name.includes('게') || fish.name.includes('크랩') ? 'crab' : 'shrimp';
  if (fish.name === '성게') return 'urchin';
  if (fish.name === '해삼') return 'cucumber';
  return 'tunicate';
}

function setHookedCatchModel(fish) {
  Object.values(hookedCatchModels).forEach(model => { model.visible = false; });
  hookedCatchModels[getCatchModelKey(fish)].visible = true;
  hookedFishMaterial.color.set(fish.isTrash ? 0x657078 : rarityColors[fish.tier]);
  hookedCatchAccentMaterial.color.copy(hookedFishMaterial.color).offsetHSL(0.03, -0.12, 0.2);
}

hookedFish.visible = false;
scene.add(hookedFish);

const line = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0xeaffff, transparent: true, opacity: 0.82 })
);
scene.add(line);

const rippleMaterial = new THREE.MeshBasicMaterial({
  color: 0xc7f6ff,
  transparent: true,
  opacity: 0,
  side: THREE.DoubleSide,
  depthWrite: false
});
const ripple = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.22, 36), rippleMaterial);
ripple.rotation.x = -Math.PI / 2;
ripple.visible = false;
scene.add(ripple);

const splashBursts = [];
function splashAt(point, strength = 1) {
  const count = Math.round(36 * strength);
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const index = i * 3;
    positions[index] = point.x + (Math.random() - 0.5) * 0.18;
    positions[index + 1] = Math.max(0.14, point.y) + Math.random() * 0.12;
    positions[index + 2] = point.z + (Math.random() - 0.5) * 0.18;
    const angle = Math.random() * Math.PI * 2;
    const spread = (0.5 + Math.random() * 1.05) * strength;
    velocities.push(new THREE.Vector3(Math.cos(angle) * spread, (1.8 + Math.random() * 2.5) * strength, Math.sin(angle) * spread));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 * strength, transparent: true, opacity: 1, depthWrite: false, sizeAttenuation: true });
  const burst = new THREE.Points(geometry, material);
  burst.userData = { velocities, life: 1.02 + strength * 0.16, maxLife: 1.02 + strength * 0.16 };
  splashBursts.push(burst);
  scene.add(burst);
}

function updateSplashes(delta) {
  for (let burstIndex = splashBursts.length - 1; burstIndex >= 0; burstIndex--) {
    const burst = splashBursts[burstIndex];
    const positions = burst.geometry.attributes.position;
    burst.userData.life -= delta;
    for (let i = 0; i < positions.count; i++) {
      const velocity = burst.userData.velocities[i];
      velocity.y -= 4.8 * delta;
      positions.setXYZ(i, positions.getX(i) + velocity.x * delta, positions.getY(i) + velocity.y * delta, positions.getZ(i) + velocity.z * delta);
    }
    positions.needsUpdate = true;
    burst.material.opacity = Math.max(0, burst.userData.life / burst.userData.maxLife);
    if (burst.userData.life <= 0) {
      scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
      splashBursts.splice(burstIndex, 1);
    }
  }
}

let started = false;
let cast = false;
let launched = false;
let landed = false;
let bite = false;
let catchAnimating = false;
let catchAnimationStart = 0;
let pendingCatch = null;
let retrieving = false;
let retrievalStart = 0;
let retrievalCompleteMessage = '';
let castTime = 0;
let biteAt = 0;
let biteStartedAt = 0;
const castStart = new THREE.Vector3();
const castControl = new THREE.Vector3();
const target = new THREE.Vector3();
const bobPosition = new THREE.Vector3();
const rodTip = new THREE.Vector3();
const catchStartPosition = new THREE.Vector3();
const catchControlPosition = new THREE.Vector3();
const catchEndPosition = new THREE.Vector3();
const retrieveStartPosition = new THREE.Vector3();
const retrieveControlPosition = new THREE.Vector3();
const retrieveEndPosition = new THREE.Vector3();

function easeInOut(value) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function getRodTip() {
  camera.updateMatrixWorld(true);
  rodTip.set(2.92, 0.13, 0).applyMatrix4(rod.matrixWorld);
  return rodTip;
}

function setBezierPoint(out, start, control, end, amount) {
  const inverse = 1 - amount;
  out.set(
    inverse * inverse * start.x + 2 * inverse * amount * control.x + amount * amount * end.x,
    inverse * inverse * start.y + 2 * inverse * amount * control.y + amount * amount * end.y,
    inverse * inverse * start.z + 2 * inverse * amount * control.z + amount * amount * end.z
  );
}

function updateLine(flightAmount = 1) {
  const tip = getRodTip().clone();
  const points = [];
  for (let i = 0; i <= 22; i++) {
    const amount = i / 22;
    const point = tip.clone().lerp(bobPosition, amount);
    const slack = landed ? -Math.sin(amount * Math.PI) * 0.18 : Math.sin(amount * Math.PI) * (0.28 + flightAmount * 0.25);
    point.y += slack;
    points.push(point);
  }
  line.geometry.setFromPoints(points);
}

function castRod() {
  if (!started || cast || catchAnimating || retrieving) return;
  cast = true;
  launched = false;
  landed = false;
  bite = false;
  biteStartedAt = 0;
  castTime = performance.now();
  biteAt = 3.1 + Math.random() * 2.1;
  getRodTip();
  castStart.copy(rodTip);
  target.set((Math.random() - 0.5) * 2.7, 0.11, -7 - Math.random() * 5);
  bobPosition.copy(castStart);
  bobber.position.copy(bobPosition);
  bobber.visible = true;
  hookedFish.visible = false;
  line.visible = true;
  ripple.visible = false;
  statusEl.textContent = '낚싯대를 휘둘러 찌를 던지는 중...';
}

function startEmptyRetrieval(message, completeMessage) {
  const pulledFromWater = landed;
  statusEl.textContent = message;
  cast = false;
  landed = false;
  bite = false;
  biteStartedAt = 0;
  retrieving = true;
  retrievalCompleteMessage = completeMessage;
  hookedFish.visible = false;
  retrievalStart = performance.now();
  retrieveStartPosition.copy(bobPosition);
  camera.updateMatrixWorld(true);
  retrieveEndPosition.set(0.22, 0.22, -1.75).applyMatrix4(camera.matrixWorld);
  retrieveControlPosition.copy(retrieveStartPosition).lerp(retrieveEndPosition, 0.5);
  retrieveControlPosition.y += 1.8;
  ripple.visible = false;
  if (pulledFromWater) splashAt(bobPosition, 1.05);
}

function reelIn() {
  if (!cast) return;
  if (bite) {
    const fish = pickCatch();
    const isNew = !fish.isTrash && !discoveredFish.has(fish.id);
    let count = 0;
    if (!fish.isTrash) {
      discoveredFish.add(fish.id);
      catchCounts[fish.id] = (catchCounts[fish.id] || 0) + 1;
      count = catchCounts[fish.id];
      saveCollection();
      renderCollection();
    }
    statusEl.textContent = `챔질 성공! 낚싯대를 들어 올리는 중...`;
    cast = false;
    landed = false;
    bite = false;
    biteStartedAt = 0;
    ripple.visible = false;
    catchAnimating = true;
    catchAnimationStart = performance.now();
    pendingCatch = { fish, isNew, count };
    setHookedCatchModel(fish);
    hookedFish.visible = true;
    splashAt(bobPosition, 1.6);
    catchStartPosition.copy(bobPosition);
    camera.updateMatrixWorld(true);
    catchEndPosition.set(0.25, 0.38, -2.15).applyMatrix4(camera.matrixWorld);
    catchControlPosition.copy(catchStartPosition).lerp(catchEndPosition, 0.5);
    catchControlPosition.y += 3.4;
    return;
  }
  startEmptyRetrieval('너무 일찍 감았습니다! 찌를 회수하는 중...', '입질 전 회수로 실패! 바다를 클릭해 바로 다시 던져보세요');
}

document.querySelector('#start-fishing').addEventListener('click', () => {
  startScreen.style.display = 'none';
  locationScreen.style.display = 'flex';
});

document.querySelectorAll('.location-card').forEach(card => card.addEventListener('click', () => {
  const place = fishingPlaces[card.dataset.place];
  applyFishingPlace(place);
  started = true;
  locationScreen.style.display = 'none';
  menuBack.style.display = 'block';
  statusEl.style.display = 'block';
  helpEl.style.display = 'block';
  statusEl.textContent = `${place.name} · 바다를 클릭해 찌를 던져보세요`;
}));

document.querySelector('#location-back').addEventListener('click', () => {
  locationScreen.style.display = 'none';
  startScreen.style.display = 'flex';
});

document.querySelector('#open-collection').addEventListener('click', () => {
  collectionReturnToGame = false;
  renderCollection();
  startScreen.style.display = 'none';
  collectionScreen.style.display = 'flex';
});

document.querySelector('#collection-back').addEventListener('click', () => {
  collectionScreen.style.display = 'none';
  if (collectionReturnToGame) {
    collectionReturnToGame = false;
    statusEl.textContent = '바다를 클릭해 다시 찌를 던져보세요';
  } else {
    startScreen.style.display = 'flex';
  }
});

catchRatesToggleEl.addEventListener('click', () => {
  const willOpen = catchRatesPanelEl.hidden;
  catchRatesPanelEl.hidden = !willOpen;
  catchRatesToggleEl.setAttribute('aria-expanded', String(willOpen));
});

document.querySelector('#catch-rates-close').addEventListener('click', () => {
  catchRatesPanelEl.hidden = true;
  catchRatesToggleEl.setAttribute('aria-expanded', 'false');
});

document.querySelector('#caught-open-dex').addEventListener('click', event => {
  const index = Number(event.currentTarget.dataset.index);
  if (!Number.isInteger(index) || !fishCatalog[index]) return;
  collectionReturnToGame = true;
  catalogFilter = '전체';
  catalogTier = '전체';
  catalogCaughtOnly = false;
  catalogPage = Math.floor(index / pageSize);
  catchInfo.style.display = 'none';
  renderCollection();
  collectionScreen.style.display = 'flex';
  showCatalogDetail(index);
});

document.querySelectorAll('.dex-category').forEach(button => button.addEventListener('click', () => {
  catalogFilter = button.dataset.group;
  catalogPage = 0;
  document.querySelector('#collection-detail').hidden = true;
  renderCollection();
}));

document.querySelectorAll('.dex-rarity').forEach(button => button.addEventListener('click', () => {
  catalogTier = button.dataset.tier;
  catalogPage = 0;
  document.querySelector('#collection-detail').hidden = true;
  renderCollection();
}));

document.querySelector('#dex-caught-only').addEventListener('click', () => {
  catalogCaughtOnly = !catalogCaughtOnly;
  catalogPage = 0;
  document.querySelector('#collection-detail').hidden = true;
  renderCollection();
});

document.querySelector('#page-prev').addEventListener('click', () => {
  catalogPage -= 1;
  renderCollection();
});

document.querySelector('#page-next').addEventListener('click', () => {
  catalogPage += 1;
  renderCollection();
});

document.querySelector('#detail-close').addEventListener('click', () => {
  document.querySelector('#collection-detail').hidden = true;
});

document.querySelector('#detail-prev').addEventListener('click', () => moveCatalogDetail(-1));
document.querySelector('#detail-next').addEventListener('click', () => moveCatalogDetail(1));

document.querySelector('#collection-detail').addEventListener('click', event => {
  if (event.target !== event.currentTarget) return;
  event.currentTarget.hidden = true;
});

document.addEventListener('keydown', event => {
  const detail = document.querySelector('#collection-detail');
  if (detail.hidden) return;
  if (event.key === 'Escape') detail.hidden = true;
  if (event.key === 'ArrowLeft') moveCatalogDetail(-1);
  if (event.key === 'ArrowRight') moveCatalogDetail(1);
});

catchInfo.addEventListener('click', event => {
  if (event.target !== catchInfo) return;
  catchInfo.style.display = 'none';
  statusEl.textContent = '바다를 클릭해 다시 찌를 던져보세요';
});

menuBack.addEventListener('click', () => {
  started = false;
  cast = false;
  landed = false;
  bite = false;
  catchAnimating = false;
  pendingCatch = null;
  retrieving = false;
  bobber.visible = false;
  hookedFish.visible = false;
  line.visible = false;
  ripple.visible = false;
  catchInfo.style.display = 'none';
  menuBack.style.display = 'none';
  statusEl.style.display = 'none';
  helpEl.style.display = 'none';
  currentPlaceEl.style.display = 'none';
  catchRatesToggleEl.style.display = 'none';
  catchRatesPanelEl.hidden = true;
  gameClockEl.style.display = 'none';
  seasonWidgetEl.classList.remove('in-game');
  selectedFishingPlace = null;
  startScreen.style.display = 'flex';
});

renderSeasonWidget();
renderCollection();

canvas.addEventListener('click', castRod);
document.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    reelIn();
  }
});

let frame = 0;
let previousFrameTime = 0;
function loop(time) {
  requestAnimationFrame(loop);
  frame += 1;
  const frameDelta = Math.min(0.034, Math.max(0.001, (time - previousFrameTime) / 1000));
  previousFrameTime = time;
  const seconds = time * 0.001;
  updateTimeOfDay(frameDelta);

  const positions = waterGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getY(i);
    const height =
      Math.sin(x * 0.105 + seconds * 0.5) * 0.045 +
      Math.sin(z * 0.15 - seconds * 0.38) * 0.026 +
      Math.cos((x + z) * 0.072 + seconds * 0.3) * 0.016;
    positions.setZ(i, height);
  }
  positions.needsUpdate = true;
  if (frame % 5 === 0) waterGeometry.computeVertexNormals();
  updateSplashes(frameDelta);

  let elapsed = (time - castTime) / 1000;
  let castingPose = 0;
  let catchLiftPose = 0;
  let retrievePose = 0;

  if (cast) {
    if (elapsed < 0.34) {
      const backSwing = easeInOut(elapsed / 0.34);
      castingPose = backSwing * 0.48;
      bobPosition.copy(getRodTip());
      bobber.position.copy(bobPosition);
      updateLine(0);
    } else if (elapsed < 1.42) {
      const flight = Math.min(1, (elapsed - 0.34) / 1.08);
      if (!launched) {
        launched = true;
        castStart.copy(getRodTip());
        castControl.copy(castStart).lerp(target, 0.5);
        castControl.y += 6.2;
      }
      const forwardSwing = easeInOut(Math.min(1, flight * 2.2));
      castingPose = 0.48 - forwardSwing * 1.05;
      setBezierPoint(bobPosition, castStart, castControl, target, flight);
      bobber.position.copy(bobPosition);
      bobber.rotation.x += 0.18;
      bobber.rotation.z += 0.12;
      updateLine(flight);
    } else {
      if (!landed) {
        landed = true;
        bobPosition.copy(target);
        ripple.position.set(target.x, 0.13, target.z);
        ripple.scale.setScalar(0.25);
        rippleMaterial.opacity = 0.85;
        ripple.visible = true;
        splashAt(target, 1.25);
        statusEl.textContent = '첨벙! 찌를 바라보며 입질을 기다리세요';
      }
      const settle = Math.min(1, (elapsed - 1.42) / 0.65);
      castingPose = -0.57 * (1 - easeInOut(settle));
      bobPosition.y = 0.13 + Math.sin(seconds * 2.8) * 0.045;
      if (bite) bobPosition.y = 0.04 + Math.abs(Math.sin(seconds * 11)) * 0.24;
      bobber.position.copy(bobPosition);
      updateLine(1);

      const rippleAge = elapsed - 1.42;
      ripple.scale.setScalar(0.25 + rippleAge * 1.45);
      rippleMaterial.opacity = Math.max(0, 0.82 - rippleAge * 0.55);

      if (!bite && elapsed > biteAt) {
        bite = true;
        biteStartedAt = time;
      }

      if (bite) {
        const biteRemaining = Math.max(0, 2 - (time - biteStartedAt) / 1000);
        statusEl.textContent = `입질이다! ${biteRemaining.toFixed(1)}초 안에 SPACE를 누르세요!`;
        if (biteRemaining <= 0) {
          startEmptyRetrieval('놓쳤습니다! 물고기가 도망가 찌를 회수하는 중...', '물고기가 도망갔습니다! 바다를 클릭해 다시 던져보세요');
        }
      }
    }
  }

  if (catchAnimating) {
    const catchElapsed = (time - catchAnimationStart) / 1000;
    const liftProgress = Math.min(1, catchElapsed / 1.55);
    const smoothLift = easeInOut(liftProgress);
    setBezierPoint(bobPosition, catchStartPosition, catchControlPosition, catchEndPosition, smoothLift);
    bobber.position.copy(bobPosition);
    bobber.rotation.x += 0.24;
    hookedFish.position.copy(bobPosition);
    hookedFish.position.y -= 0.36;
    hookedFish.rotation.z = Math.sin(seconds * 18) * 0.22;
    hookedFish.rotation.y = Math.sin(seconds * 11) * 0.38;
    updateLine(liftProgress);
    catchLiftPose = liftProgress < 0.55
      ? easeInOut(liftProgress / 0.55)
      : 1 - easeInOut((liftProgress - 0.55) / 0.45) * 0.32;

    if (liftProgress >= 1) {
      const result = pendingCatch;
      catchAnimating = false;
      pendingCatch = null;
      bobber.visible = false;
      hookedFish.visible = false;
      line.visible = false;
      statusEl.textContent = result.fish.isTrash ? `꽝! ${result.fish.name}을(를) 건졌습니다.` : `${result.fish.name}을(를) 낚았습니다!`;
      showCatchInformation(result.fish, result.isNew, result.count);
    }
  }

  if (retrieving) {
    const retrieveElapsed = (time - retrievalStart) / 1000;
    const retrieveProgress = Math.min(1, retrieveElapsed / 1.05);
    const settleProgress = THREE.MathUtils.clamp((retrieveElapsed - 1.05) / 0.35, 0, 1);
    const smoothRetrieve = easeInOut(retrieveProgress);
    setBezierPoint(bobPosition, retrieveStartPosition, retrieveControlPosition, retrieveEndPosition, smoothRetrieve);
    bobber.position.copy(bobPosition);
    bobber.rotation.x += 0.2;
    updateLine(retrieveProgress);
    retrievePose = retrieveElapsed <= 1.05
      ? easeInOut(retrieveProgress) * 0.55
      : 0.55 * (1 - easeInOut(settleProgress));

    if (retrieveElapsed >= 1.4) {
      retrieving = false;
      bobber.visible = false;
      line.visible = false;
      statusEl.textContent = retrievalCompleteMessage;
    }
  }

  handRig.rotation.z = castingPose + catchLiftPose * 0.72 + retrievePose * 0.22 + (bite ? Math.sin(seconds * 25) * 0.025 : 0);
  handRig.rotation.x = 0.08 - Math.abs(castingPose) * 0.12 - catchLiftPose * 0.38 - retrievePose * 0.12;
  handRig.position.y = -0.72 + catchLiftPose * 0.24 + retrievePose * 0.045;
  if (bite) reelHandle.rotation.z -= 0.08;
  if (catchAnimating) reelHandle.rotation.z -= 0.22;
  if (retrieving) reelHandle.rotation.z -= 0.3;

  renderer.render(scene, camera);
}

loop(0);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
