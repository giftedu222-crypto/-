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
const seasonPrevEl = document.querySelector('#season-prev');
const seasonNextEl = document.querySelector('#season-next');
const collectionBackButton = document.querySelector('#collection-back');
const collectionBackAnchor = document.querySelector('#collection-back-anchor');
const collectionCard = document.querySelector('#collection .collection-card');

function positionFloatingCollectionBack() {
  const cardRect = collectionCard.getBoundingClientRect();
  if (!cardRect.width) return;
  const cardStyle = getComputedStyle(collectionCard);
  const left = cardRect.left + parseFloat(cardStyle.borderLeftWidth) + parseFloat(cardStyle.paddingLeft);
  const bottom = innerHeight - cardRect.bottom + parseFloat(cardStyle.borderBottomWidth) + parseFloat(cardStyle.paddingBottom);
  collectionBackButton.style.setProperty('--collection-back-left', `${left}px`);
  collectionBackButton.style.setProperty('--collection-back-bottom', `${bottom}px`);
}

new IntersectionObserver(entries => {
  positionFloatingCollectionBack();
  collectionBackButton.classList.toggle('is-floating', !entries[0].isIntersecting);
}, {
  root: collectionCard,
  threshold: 0.2
}).observe(collectionBackAnchor);

window.addEventListener('resize', positionFloatingCollectionBack);

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
  amnam: { id: 'amnam', name: '암남공원 방파제', startMinutes: 720, sky: 0x68abc1, fog: 0x719ba8, fogDensity: 0.0048, water: [0x083b62, 0x062b4d, 0x041b34], shore: 0x293536, edge: 0xe3b83f, sun: 0xffd281, light: 0xffdfad, catchRates: [{ name: '고등어', rate: 18 }, { name: '전갱이', rate: 15 }, { name: '감성돔', rate: 10 }, { name: '삼치', rate: 9 }, { name: '갈치', rate: 8 }, { name: '학꽁치', rate: 7 }, { name: '갑오징어', rate: 5 }], otherRate: 18, trashRate: 10 },
  yeongdo: { id: 'yeongdo', name: '영도 신방파제', startMinutes: 1320, sky: 0x647f94, fog: 0x687f8b, fogDensity: 0.0045, water: [0x072f50, 0x05233c, 0x031729], shore: 0x4c5352, edge: 0xe7d66a, sun: 0xffe0a8, light: 0xd9e7ed, catchRates: [{ name: '전갱이', rate: 17 }, { name: '갈치', rate: 14 }, { name: '붕장어', rate: 12 }, { name: '학꽁치', rate: 9 }, { name: '고등어', rate: 8 }, { name: '감성돔', rate: 6 }], otherRate: 24, trashRate: 10 },
  dadaepo: { id: 'dadaepo', name: '다대포 · 몰운대', startMinutes: 1070, sky: 0x73a1b3, fog: 0x7f9698, fogDensity: 0.0042, water: [0x0a3c5d, 0x072c49, 0x041c31], shore: 0x766a50, edge: 0xc7aa70, sun: 0xffb657, light: 0xffc88b, catchRates: [{ name: '도다리', rate: 16 }, { name: '감성돔', rate: 15 }, { name: '숭어', rate: 11 }, { name: '농어', rate: 9 }, { name: '참돔', rate: 7 }, { name: '벵에돔', rate: 5 }], otherRate: 27, trashRate: 10 }
};
let selectedFishingPlace = null;
const initialClock = new Date();
let gameMinutes = initialClock.getHours() * 60 + initialClock.getMinutes();
let seasonViewMonth = initialClock.getMonth() + 1;

function seasonIncludesMonth(season, month) {
  if (season === '연중') return true;
  const range = season.match(/(\d{1,2})\s*[~–-]\s*(\d{1,2})월/);
  if (!range) return false;
  const start = Number(range[1]);
  const end = Number(range[2]);
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

function renderSeasonWidget() {
  const month = seasonViewMonth;
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
  const rows = place.catchRates.map(item => {
    const catalogItem = fishCatalog.find(fish => fish.name === item.name);
    return { ...item, tier: catalogItem?.tier };
  });
  rows.push(
    { name: '기타 해산물', rate: place.otherRate, label: '혼합' },
    { name: '바다 쓰레기', rate: place.trashRate, label: '꽝', isTrash: true }
  );
  catchRatesListEl.innerHTML = rows.map(item => {
    const tierClass = item.tier ? `tier-${item.tier}` : item.isTrash ? 'is-trash' : 'is-mixed';
    const rarityLabel = item.tier ? rarityNames[item.tier] : item.label;
    return `<li><div><span class="rate-species-name ${tierClass}">${item.name}<small class="rate-rarity ${tierClass}">${rarityLabel}</small></span><b>${item.rate}%</b></div><i><span style="width:${item.rate}%"></span></i></li>`;
  }).join('');
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

seasonPrevEl.addEventListener('click', () => {
  seasonViewMonth = seasonViewMonth === 1 ? 12 : seasonViewMonth - 1;
  renderSeasonWidget();
});

seasonNextEl.addEventListener('click', () => {
  seasonViewMonth = seasonViewMonth === 12 ? 1 : seasonViewMonth + 1;
  renderSeasonWidget();
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
scene.fog = new THREE.FogExp2(0x719ba8, 0.0048);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 800);
camera.position.set(0, 2.35, 11);
camera.lookAt(0, 0.2, -16);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x91cfe0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const hemisphereLight = new THREE.HemisphereLight(0xe9fbff, 0x183b48, 1.3);
scene.add(hemisphereLight);
const sunLight = new THREE.DirectionalLight(0xffdfad, 1.85);
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

const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xeaf4f2, transparent: true, opacity: 0.2, depthWrite: false, fog: false });
const clouds = new THREE.Group();
for (let i = 0; i < 11; i++) {
  const cloud = new THREE.Group();
  for (let puff = 0; puff < 5; puff++) {
    const puffMesh = new THREE.Mesh(new THREE.SphereGeometry(2.8 + (puff % 2) * 1.2, 16, 10), cloudMaterial);
    puffMesh.position.set((puff - 2) * 3.1, Math.sin(puff * 1.8) * 1.1, (puff % 2) * 0.7);
    puffMesh.scale.y = 0.48;
    cloud.add(puffMesh);
  }
  cloud.position.set(-95 + i * 20, 29 + (i % 4) * 7, -105 - (i % 3) * 30);
  cloud.scale.setScalar(0.75 + (i % 3) * 0.18);
  cloud.userData.speed = 0.22 + (i % 4) * 0.04;
  clouds.add(cloud);
}
scene.add(clouds);

const seabirds = new THREE.Group();
for (let i = 0; i < 9; i++) {
  const bird = new THREE.Group();
  addLine(bird, new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0, 0.22, 0), 0x27383c, 0.75);
  addLine(bird, new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(0.7, 0, 0), 0x27383c, 0.75);
  bird.position.set(-34 + i * 8.5, 12 + (i % 3) * 2.4, -61 - (i % 4) * 7);
  bird.scale.setScalar(0.45 + (i % 3) * 0.12);
  seabirds.add(bird);
}
scene.add(seabirds);

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
const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  vertexColors: true,
  transparent: true,
  opacity: 0.98,
  roughness: 0.42,
  metalness: 0.025,
  flatShading: false
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
scene.add(water);

function applyFishingPlace(place) {
  selectedFishingPlace = place;
  gameMinutes = place.startMinutes;
  renderCatchRates(place);
  catchRatesToggleEl.style.display = 'block';
  catchRatesToggleEl.setAttribute('aria-expanded', 'false');
  catchRatesPanelEl.hidden = true;
  applyWaterGradient(place.water);
  shore.material.color.set(place.shore);
  shoreWall.material.color.set(place.shore);
  shoreEdge.material.color.set(place.edge);
  scene.fog.density = place.fogDensity;
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

  const sunHorizontalRadius = selectedFishingPlace.id === 'dadaepo' ? 38 : 105;
  const sunHeight = altitude * 72 + (selectedFishingPlace.id === 'dadaepo' ? 12 : 0);
  sun.position.set(Math.cos(solarAngle) * sunHorizontalRadius, sunHeight, -145);
  sun.visible = altitude > (selectedFishingPlace.id === 'dadaepo' ? -0.17 : -0.08);
  moon.position.set(-Math.cos(solarAngle) * 100, -altitude * 62, -150);
  moon.visible = altitude < 0.12;
  starMaterial.opacity = THREE.MathUtils.clamp((-altitude + 0.02) / 0.42, 0, 0.92);
  cloudMaterial.opacity = 0.018 + daylight * 0.09;
  sunLight.intensity = 0.1 + daylight * 1.75;
  hemisphereLight.intensity = 0.22 + daylight * 1.08;
  waterMaterial.color.setScalar(0.3 + daylight * 0.34);

  const lanternTarget = THREE.MathUtils.clamp((0.22 - altitude) / 0.35, 0, 1);
  const lanternBlend = delta > 0 ? 1 - Math.exp(-delta * 2.2) : 1;
  lanternLevel = THREE.MathUtils.lerp(lanternLevel, lanternTarget, lanternBlend);
  lanternLight.intensity = lanternLevel * 2.25;
  lanternGlassMaterial.emissiveIntensity = lanternLevel * 0.38;
  lanternBulbMaterial.color.copy(lanternBulbOffColor).lerp(lanternBulbOnColor, lanternLevel);
  lanternBulbMaterial.emissiveIntensity = lanternLevel * 4.2;
  lanternCoreMaterial.opacity = lanternLevel * 0.76;
  lanternHaloMaterial.opacity = lanternLevel * 0.32;
  lanternGlowMaterial.opacity = lanternLevel * 0.22;

  const lighthouseTarget = selectedFishingPlace.id === 'yeongdo'
    ? THREE.MathUtils.clamp((0.18 - altitude) / 0.32, 0, 1)
    : 0;
  lighthouseLevel = THREE.MathUtils.lerp(lighthouseLevel, lighthouseTarget, lanternBlend);
  lighthouseWindowMaterial.emissiveIntensity = 0.08 + lighthouseLevel * 4.8;
  lighthouseBeaconMaterial.opacity = 0.18 + lighthouseLevel * 0.82;
  lighthousePointLight.intensity = lighthouseLevel * 3.6;
  lighthouseSpotLight.intensity = lighthouseLevel * 1.8;
  lighthouseSeaBeamMaterial.opacity = lighthouseLevel * 0.22;
  bridgeLightMaterial.emissiveIntensity = 0.08 + lighthouseLevel * 5;
  bridgeLampLights.forEach(light => { light.intensity = lighthouseLevel; });

  clockTimeEl.textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  clockIconEl.textContent = altitude > 0.18 ? '☀' : altitude > -0.08 ? '◐' : '☾';
}

const shoreTextureCanvas = document.createElement('canvas');
shoreTextureCanvas.width = shoreTextureCanvas.height = 256;
const shoreTextureContext = shoreTextureCanvas.getContext('2d');
shoreTextureContext.fillStyle = '#bfc2bd';
shoreTextureContext.fillRect(0, 0, 256, 256);
for (let i = 0; i < 2600; i++) {
  const shade = 95 + Math.floor(Math.random() * 95);
  shoreTextureContext.fillStyle = `rgba(${shade},${shade},${shade},${0.08 + Math.random() * 0.12})`;
  const size = 1 + Math.random() * 2.2;
  shoreTextureContext.fillRect(Math.random() * 256, Math.random() * 256, size, size);
}
const shoreTexture = new THREE.CanvasTexture(shoreTextureCanvas);
shoreTexture.wrapS = shoreTexture.wrapT = THREE.RepeatWrapping;
shoreTexture.repeat.set(5, 3);
shoreTexture.encoding = THREE.sRGBEncoding;

const shore = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 24),
  new THREE.MeshStandardMaterial({ color: 0x303b3d, map: shoreTexture, roughness: 0.94, metalness: 0.025 })
);
shore.rotation.x = -Math.PI / 2;
shore.position.set(0, 0.27, 16);
shore.receiveShadow = true;
scene.add(shore);

const shoreWall = new THREE.Mesh(
  new THREE.BoxGeometry(38, 0.64, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x303b3d, map: shoreTexture, roughness: 0.96, metalness: 0.02 })
);
shoreWall.position.set(0, -0.015, 4.16);
shoreWall.receiveShadow = true;
scene.add(shoreWall);

const shoreEdge = new THREE.Mesh(
  new THREE.BoxGeometry(38, 0.18, 0.34),
  new THREE.MeshStandardMaterial({ color: 0xe3b83f, roughness: 0.72 })
);
shoreEdge.position.set(0, 0.38, 4.08);
shoreEdge.receiveShadow = true;
scene.add(shoreEdge);

const fishingGear = new THREE.Group();
fishingGear.position.set(-4.2, 0.29, 6.4);
fishingGear.rotation.y = 0.16;
fishingGear.scale.setScalar(0.62);

const basketMaterial = new THREE.MeshStandardMaterial({ color: 0x80603c, roughness: 0.92 });
const basketDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.95 });
const basketFloor = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 1.15), basketDarkMaterial);
basketFloor.position.y = 0.08;
fishingGear.add(basketFloor);
for (let i = 0; i < 5; i++) {
  const slatFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.09), basketMaterial);
  slatFront.position.set(-0.72 + i * 0.36, 0.43, 0.53);
  const slatBack = slatFront.clone();
  slatBack.position.z = -0.53;
  fishingGear.add(slatFront, slatBack);
}
[-0.82, 0.82].forEach(x => {
  const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.72, 1.08), basketMaterial);
  sideRail.position.set(x, 0.43, 0);
  fishingGear.add(sideRail);
});
for (const y of [0.2, 0.68]) {
  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.11), basketDarkMaterial);
  frontRail.position.set(0, y, 0.55);
  const backRail = frontRail.clone();
  backRail.position.z = -0.55;
  fishingGear.add(frontRail, backRail);
}

const tackleBox = new THREE.Group();
const tackleBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.48, 0.82), new THREE.MeshStandardMaterial({ color: 0x254d59, roughness: 0.68, metalness: 0.08 }));
tackleBase.position.y = 0.25;
const tackleLid = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.14, 0.88), new THREE.MeshStandardMaterial({ color: 0xd08332, roughness: 0.62 }));
tackleLid.position.y = 0.56;
const tackleHandle = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 7, 18, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1c292d, roughness: 0.42, metalness: 0.45 }));
tackleHandle.position.y = 0.68;
tackleHandle.rotation.z = Math.PI;
tackleBox.add(tackleBase, tackleLid, tackleHandle);
tackleBox.position.set(1.65, 0.02, -0.14);
tackleBox.rotation.y = -0.12;
fishingGear.add(tackleBox);

const baitBucket = new THREE.Group();
const bucketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.36, 0.72, 18), new THREE.MeshStandardMaterial({ color: 0xd6d0bd, roughness: 0.78, metalness: 0.08 }));
bucketBody.position.y = 0.37;
const bucketRim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 8, 20), basketDarkMaterial);
bucketRim.rotation.x = Math.PI / 2;
bucketRim.position.y = 0.74;
const bucketHandle = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 7, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0x555b5a, roughness: 0.5, metalness: 0.55 }));
bucketHandle.rotation.z = Math.PI;
bucketHandle.position.y = 0.7;
baitBucket.add(bucketBody, bucketRim, bucketHandle);
baitBucket.position.set(-1.45, 0, -0.12);
fishingGear.add(baitBucket);
fishingGear.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
scene.add(fishingGear);

const lantern = new THREE.Group();
lantern.position.set(-2.15, 0.29, 6.45);
lantern.scale.setScalar(0.68);
const lanternMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x273238, roughness: 0.38, metalness: 0.7 });
const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.24, 18), lanternMetalMaterial);
lanternBase.position.y = 0.12;
const lanternLower = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.36, 0.14, 18), lanternMetalMaterial);
lanternLower.position.y = 0.31;
const lanternGlassMaterial = new THREE.MeshStandardMaterial({ color: 0xffd596, emissive: 0xff8f35, emissiveIntensity: 0.06, roughness: 0.14, metalness: 0.02, transparent: true, opacity: 0.42 });
const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.72, 18), lanternGlassMaterial);
lanternGlass.position.y = 0.72;
const lanternBulbOffColor = new THREE.Color(0xd9ddd5);
const lanternBulbOnColor = new THREE.Color(0xfff1bd);
const lanternBulbMaterial = new THREE.MeshStandardMaterial({ color: lanternBulbOffColor, emissive: 0xffa94f, emissiveIntensity: 0, roughness: 0.22, metalness: 0, transparent: true, opacity: 0.94 });
const lanternBulb = new THREE.Group();
const lanternBulbTube = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.4, 16), lanternBulbMaterial);
lanternBulbTube.position.y = 0.72;
const lanternBulbBottom = new THREE.Mesh(new THREE.SphereGeometry(0.069, 16, 10), lanternBulbMaterial);
lanternBulbBottom.position.y = 0.52;
const lanternBulbTop = lanternBulbBottom.clone();
lanternBulbTop.position.y = 0.92;
const lanternBulbSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.1, 14), lanternMetalMaterial);
lanternBulbSocket.position.y = 0.46;
lanternBulb.add(lanternBulbTube, lanternBulbBottom, lanternBulbTop, lanternBulbSocket);
const lanternCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0.04, depthWrite: false, blending: THREE.AdditiveBlending });
const lanternCore = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), lanternCoreMaterial);
lanternCore.position.y = 0.72;
const lanternHaloMaterial = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const lanternHalo = new THREE.Mesh(new THREE.SphereGeometry(0.235, 18, 12), lanternHaloMaterial);
lanternHalo.position.y = 0.71;
const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.39, 0.18, 18), lanternMetalMaterial);
lanternCap.position.y = 1.17;
const lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.26, 18), lanternMetalMaterial);
lanternRoof.position.y = 1.38;
const lanternHandleCurve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-0.37, 1.18, 0),
  new THREE.Vector3(0, 2.1, 0),
  new THREE.Vector3(0.37, 1.18, 0)
);
const lanternHandle = new THREE.Mesh(new THREE.TubeGeometry(lanternHandleCurve, 28, 0.038, 8, false), lanternMetalMaterial);
const lanternHandleMounts = [-0.39, 0.39].map(x => {
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12), lanternMetalMaterial);
  mount.rotation.x = Math.PI / 2;
  mount.position.set(x, 1.17, 0);
  return mount;
});
lantern.add(lanternBase, lanternLower, lanternGlass, lanternHalo, lanternBulb, lanternCore, lanternCap, lanternRoof, lanternHandle, ...lanternHandleMounts);
lantern.traverse(object => { if (object.isMesh) object.castShadow = true; });
scene.add(lantern);

const lanternLight = new THREE.PointLight(0xffb45f, 0, 10, 2);
lanternLight.position.set(-2.15, 0.95, 6.45);
scene.add(lanternLight);
const lanternGlowCanvas = document.createElement('canvas');
lanternGlowCanvas.width = lanternGlowCanvas.height = 128;
const lanternGlowContext = lanternGlowCanvas.getContext('2d');
const lanternGradient = lanternGlowContext.createRadialGradient(64, 64, 2, 64, 64, 64);
lanternGradient.addColorStop(0, 'rgba(255,191,100,1)');
lanternGradient.addColorStop(0.38, 'rgba(255,166,72,.55)');
lanternGradient.addColorStop(1, 'rgba(255,137,45,0)');
lanternGlowContext.fillStyle = lanternGradient;
lanternGlowContext.fillRect(0, 0, 128, 128);
const lanternGlowTexture = new THREE.CanvasTexture(lanternGlowCanvas);
const lanternGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xffb264, map: lanternGlowTexture, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const lanternGroundGlow = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), lanternGlowMaterial);
lanternGroundGlow.rotation.x = -Math.PI / 2;
lanternGroundGlow.position.set(-2.15, 0.295, 6.45);
scene.add(lanternGroundGlow);
let lanternLevel = 0;

const bollardMaterial = new THREE.MeshStandardMaterial({ color: 0x273338, roughness: 0.42, metalness: 0.58 });
[-9.2, 9.2].forEach(x => {
  const bollard = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.31, 0.72, 16), bollardMaterial);
  stem.position.y = 0.36;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.34, 0.16, 16), bollardMaterial);
  cap.position.y = 0.76;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.1, 18), bollardMaterial);
  base.position.y = 0.05;
  bollard.add(stem, cap, base);
  bollard.position.set(x, 0.31, 6.2);
  bollard.castShadow = true;
  scene.add(bollard);
});

for (let i = 0; i < 18; i++) {
  const radius = 0.3 + Math.random() * 0.75;
  const rockColor = new THREE.Color().setHSL(0.52 + Math.random() * 0.035, 0.1, 0.12 + Math.random() * 0.09);
  const rock = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 2),
    new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.88, metalness: 0.03, flatShading: true })
  );
  const side = i % 2 ? 1 : -1;
  const x = side * (15 + Math.random() * 12);
  const z = -1 - Math.random() * 8;
  rock.position.set(x, radius * 0.2, z);
  rock.scale.set(0.75 + Math.random() * 0.8, 0.45 + Math.random() * 0.55, 0.7 + Math.random() * 0.8);
  rock.rotation.set(Math.random() * 0.45, Math.random() * Math.PI, Math.random() * 0.35);
  rock.receiveShadow = true;
  scene.add(rock);

  if (i % 4 === 0) {
    const moss = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.54, 14, 9),
      new THREE.MeshStandardMaterial({ color: 0x263e35, roughness: 1 })
    );
    moss.position.set(x, radius * 0.58, z);
    moss.scale.set(0.85, 0.16, 0.65);
    moss.rotation.y = Math.random() * Math.PI;
    scene.add(moss);
  }
}

// Layered coastal silhouettes and recognizable Busan landmarks.
const placeScenery = { amnam: new THREE.Group(), yeongdo: new THREE.Group(), dadaepo: new THREE.Group() };

function coastalMaterial(color, roughness = 0.9, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: false });
}

function createCoastalRidge(width, height, color, seed = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -2);
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const envelope = Math.sin(progress * Math.PI);
    const detail = Math.sin(i * 1.73 + seed) * 0.12 + Math.sin(i * 3.11 + seed * 2) * 0.055;
    const y = 0.25 + height * Math.max(0.08, envelope * (0.72 + detail));
    shape.lineTo(-width / 2 + width * progress, y);
  }
  shape.lineTo(width / 2, -2);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: true, bevelSize: 0.32, bevelThickness: 0.45, bevelSegments: 2 });
  geometry.translate(0, 0, -2.5);
  return new THREE.Mesh(geometry, coastalMaterial(color, 1));
}

function addRidge(group, width, height, color, position, seed) {
  const ridge = createCoastalRidge(width, height, color, seed);
  ridge.position.set(...position);
  group.add(ridge);
  return ridge;
}

function ridgeSurfaceHeight(width, height, centerX, x, seed) {
  const steps = 18;
  const progress = THREE.MathUtils.clamp((x - (centerX - width / 2)) / width, 0, 1);
  const stepPosition = progress * steps;
  const sampleHeight = step => {
    const sampleProgress = step / steps;
    const envelope = Math.sin(sampleProgress * Math.PI);
    const detail = Math.sin(step * 1.73 + seed) * 0.12 + Math.sin(step * 3.11 + seed * 2) * 0.055;
    return 0.25 + height * Math.max(0.08, envelope * (0.72 + detail));
  };
  const leftStep = Math.floor(stepPosition);
  const rightStep = Math.min(steps, leftStep + 1);
  return THREE.MathUtils.lerp(sampleHeight(leftStep), sampleHeight(rightStep), stepPosition - leftStep);
}

function addPinesAlongRidge(group, ridge, placements) {
  placements.forEach(([x, scale, depthOffset = 0], index) => {
    const pine = createPine(scale);
    pine.position.set(
      x,
      ridge.position[1] + ridgeSurfaceHeight(ridge.width, ridge.height, ridge.position[0], x, ridge.seed) - 0.08,
      ridge.position[2] + 0.9 + depthOffset
    );
    pine.rotation.y = index * 0.91 + ridge.seed;
    group.add(pine);
  });
}

function createPine(scale = 1) {
  const pine = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.5, 8), coastalMaterial(0x372d24, 1));
  trunk.position.y = 1.1;
  pine.add(trunk);
  const foliageMaterial = coastalMaterial(0x173f32, 1);
  [[0, 2.2, 0, 1.05], [-0.58, 2, 0.08, 0.78], [0.55, 2.1, -0.1, 0.82], [0.08, 2.75, 0, 0.72]].forEach(([x, y, z, size]) => {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), foliageMaterial);
    crown.position.set(x, y, z);
    crown.scale.set(1.25, 0.75, 0.86);
    pine.add(crown);
  });
  pine.scale.setScalar(scale);
  return pine;
}

function addLine(group, from, to, color = 0x252b2d, opacity = 1) {
  const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), material);
  group.add(line);
  return line;
}

function createCauseway(start, end, width = 4.4) {
  const causeway = new THREE.Group();
  const direction = end.clone().sub(start);
  const length = Math.hypot(direction.x, direction.z);
  const angle = -Math.atan2(direction.z, direction.x);
  const midpoint = start.clone().lerp(end, 0.5);
  const base = new THREE.Mesh(new THREE.BoxGeometry(length, 0.7, width), coastalMaterial(0x5f6868, 0.94));
  base.position.copy(midpoint);
  base.rotation.y = angle;
  const road = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, width - 0.75), coastalMaterial(0x343d3f, 0.88, 0.05));
  road.position.copy(midpoint);
  road.position.y += 0.39;
  road.rotation.y = angle;
  causeway.add(base, road);

  const normal = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
  [-1, 1].forEach(side => {
    const offset = normal.clone().multiplyScalar((width / 2 - 0.22) * side);
    const railStart = start.clone().add(offset).add(new THREE.Vector3(0, 1.18, 0));
    const railEnd = end.clone().add(offset).add(new THREE.Vector3(0, 1.18, 0));
    addLine(causeway, railStart, railEnd, 0xc2c9c7, 0.92);
    for (let i = 0; i <= 10; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.82, 8), coastalMaterial(0xaeb8b7, 0.5, 0.42));
      post.position.copy(start).lerp(end, i / 10).add(offset);
      post.position.y += 0.8;
      causeway.add(post);
    }
  });
  return causeway;
}

function createCableTower(height = 9) {
  const tower = new THREE.Group();
  const steel = coastalMaterial(0x59666b, 0.42, 0.62);
  const concrete = coastalMaterial(0x6e7778, 0.94, 0.04);
  [-0.95, 0.95].forEach(x => {
    const footing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 1.25), concrete);
    footing.position.set(x, 0.28, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, height, 10), steel);
    leg.position.set(x, height / 2, 0);
    leg.rotation.z = x * -0.025;
    tower.add(footing, leg);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.28, 0.42), steel);
  beam.position.y = height;
  tower.add(beam);
  for (let y = 1.5; y < height - 1; y += 2) {
    addLine(tower, new THREE.Vector3(-0.84, y, 0.04), new THREE.Vector3(0.84, y + 1.15, 0.04), 0x3e494e);
    addLine(tower, new THREE.Vector3(0.84, y, 0.04), new THREE.Vector3(-0.84, y + 1.15, 0.04), 0x3e494e);
  }
  [-1.25, 1.25].forEach(x => {
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 8, 18), coastalMaterial(0x283237, 0.34, 0.72));
    pulley.position.set(x, height + 0.12, 0.28);
    tower.add(pulley);
  });
  return tower;
}

function createGondola(color) {
  const gondola = new THREE.Group();
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.78, -0.36);
  cabinShape.lineTo(-0.68, 0.34);
  cabinShape.quadraticCurveTo(-0.62, 0.52, -0.42, 0.57);
  cabinShape.lineTo(0.42, 0.57);
  cabinShape.quadraticCurveTo(0.62, 0.52, 0.68, 0.34);
  cabinShape.lineTo(0.78, -0.36);
  cabinShape.quadraticCurveTo(0.72, -0.55, 0.5, -0.58);
  cabinShape.lineTo(-0.5, -0.58);
  cabinShape.quadraticCurveTo(-0.72, -0.55, -0.78, -0.36);
  const bodyGeometry = new THREE.ExtrudeGeometry(cabinShape, { depth: 0.92, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  bodyGeometry.translate(0, 0, -0.46);
  const body = new THREE.Mesh(bodyGeometry, coastalMaterial(color, 0.38, 0.12));
  body.position.y = -1.15;
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x5f98aa, emissive: 0x0b2933, emissiveIntensity: 0.22, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.88 });
  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.54), glassMaterial);
  frontGlass.position.set(0, -1.04, 0.526);
  const rearGlass = frontGlass.clone();
  rearGlass.position.z = -0.526;
  rearGlass.rotation.y = Math.PI;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.1, 1.02), coastalMaterial(0x273337, 0.4, 0.5));
  roof.position.y = -0.54;
  const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 9), coastalMaterial(0x232a2d, 0.4, 0.68));
  hanger.position.y = -0.25;
  const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 7, 16), coastalMaterial(0x20292d, 0.35, 0.72));
  clamp.rotation.y = Math.PI / 2;
  clamp.position.y = 0.03;
  gondola.add(body, frontGlass, rearGlass, roof, hanger, clamp);
  return gondola;
}

function createSuspendedCable(group, start, end, sag, zOffset = 0) {
  const points = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const point = start.clone().lerp(end, t);
    point.y -= Math.sin(Math.PI * t) * sag;
    point.z += zOffset;
    points.push(point);
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.035, 6, false),
    coastalMaterial(0x202a2e, 0.34, 0.72)
  );
  group.add(cable);
  return curve;
}

function createBuilding(width, height, depth, color, windowColor = 0x9ccad2) {
  const building = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), coastalMaterial(color, 0.72, 0.06));
  body.position.y = height / 2;
  building.add(body);
  const rows = Math.max(2, Math.floor(height / 1.8));
  for (let row = 0; row < rows; row++) {
    for (const side of [-1, 1]) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.18, 0.35), new THREE.MeshBasicMaterial({ color: windowColor, transparent: true, opacity: 0.7 }));
      window.position.set(side * width * 0.25, 0.9 + row * 1.45, depth / 2 + 0.006);
      building.add(window);
    }
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.18, depth * 1.04), coastalMaterial(0x343d40, 0.8));
  roof.position.y = height + 0.09;
  building.add(roof);
  return building;
}

function createLighthouse() {
  const lighthouse = new THREE.Group();
  const white = coastalMaterial(0xf1efe4, 0.58, 0.05);
  const red = coastalMaterial(0xd6493f, 0.45, 0.08);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.08, 6.4, 24), white);
  tower.position.y = 3.2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.9, 1.05, 24), red);
  band.position.y = 3.9;
  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.16, 28), coastalMaterial(0x313a3e, 0.42, 0.5));
  balcony.position.y = 6.4;
  const lanternMaterial = new THREE.MeshStandardMaterial({ color: 0xffd26a, emissive: 0xffa22f, emissiveIntensity: 0.08, transparent: true, opacity: 0.9 });
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.68, 0.82, 20), lanternMaterial);
  lantern.position.y = 6.9;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.65, 20), red);
  cap.position.y = 7.63;
  lighthouse.add(tower, band, balcony, lantern, cap);
  lighthouse.userData.lanternMaterial = lanternMaterial;
  return lighthouse;
}

function createTetrapod(scale = 1) {
  const pod = new THREE.Group();
  const concrete = coastalMaterial(0x687174, 0.96);
  [[0, 0, 0], [0, 0, Math.PI / 2], [Math.PI / 2, 0, 0]].forEach(rotation => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 2.15, 8), concrete);
    arm.rotation.set(...rotation);
    pod.add(arm);
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), concrete);
  pod.add(core);
  pod.scale.setScalar(scale);
  return pod;
}

function addCoastalSkirt(group, centerX, width, z, color, count = 12, seed = 0) {
  const material = new THREE.MeshBasicMaterial({ color, fog: true });
  for (let i = 0; i < count; i++) {
    const progress = count === 1 ? 0.5 : i / (count - 1);
    const radius = 1.05 + (Math.sin(i * 2.17 + seed) + 1) * 0.42;
    const shelf = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 11), material);
    shelf.scale.set(1.8 + (i % 3) * 0.32, 0.16 + (i % 2) * 0.035, 0.72 + (i % 4) * 0.08);
    shelf.position.set(
      centerX - width / 2 + width * progress,
      -0.03 + (i % 3) * 0.025,
      z + Math.sin(i * 1.71 + seed) * 2.2
    );
    shelf.rotation.y = i * 0.61 + seed;
    group.add(shelf);
  }
}

function createFishingBoat(hullColor = 0x244b5c) {
  const boat = new THREE.Group();
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-4, 0.8);
  hullShape.lineTo(3.4, 0.8);
  hullShape.lineTo(4.4, 1.55);
  hullShape.lineTo(-3.2, 1.5);
  hullShape.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 2.2, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.12, bevelSegments: 2 }), coastalMaterial(hullColor, 0.7, 0.12));
  hull.position.z = -1.1;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.45, 1.7), coastalMaterial(0xe7e7db, 0.6));
  cabin.position.set(0.8, 2.2, 0);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.55), new THREE.MeshStandardMaterial({ color: 0x74a8b5, roughness: 0.14, metalness: 0.32 }));
  windshield.position.set(-0.41, 2.35, 0.856);
  windshield.rotation.y = Math.PI;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.2, 8), coastalMaterial(0x333b3d, 0.5, 0.55));
  mast.position.set(0.8, 4.15, 0);
  boat.add(hull, cabin, windshield, mast);
  return boat;
}

function createCrane(color = 0xe58a2e) {
  const crane = new THREE.Group();
  const metal = coastalMaterial(color, 0.46, 0.5);
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.45, 10, 0.45), metal);
  mast.position.y = 5;
  const boom = new THREE.Mesh(new THREE.BoxGeometry(9, 0.34, 0.34), metal);
  boom.position.set(-2.8, 9.3, 0);
  boom.rotation.z = -0.12;
  const rear = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 1.1), coastalMaterial(0x4b5659, 0.6, 0.35));
  rear.position.set(1.15, 8.65, 0);
  crane.add(mast, boom, rear);
  addLine(crane, new THREE.Vector3(1.1, 9.5, 0), new THREE.Vector3(-7.1, 8.3, 0), 0x32393b);
  addLine(crane, new THREE.Vector3(-7.1, 8.3, 0), new THREE.Vector3(-7.1, 2.3, 0), 0x32393b);
  return crane;
}

// AMNAM PARK / SONGDO: pine cliffs, cable cars, rocky coves and the Songdo skyline.
const amnam = placeScenery.amnam;
addRidge(amnam, 165, 18, 0x315d52, [-62, 0, -110], 0.4);
addRidge(amnam, 78, 12, 0x294d47, [50, 0, -118], 1.9);
for (let i = 0; i < 5; i++) {
  const cliffRadius = 5.6 + (i % 3) * 1.15;
  const cliff = new THREE.Mesh(new THREE.IcosahedronGeometry(cliffRadius, 2), coastalMaterial(i % 2 ? 0x314641 : 0x263b39, 0.98));
  cliff.position.set(-58 + i * 5.2, 3.4 + (i % 2) * 0.7, -39 - i * 1.8);
  cliff.scale.set(1.55, 1.3, 0.78);
  cliff.rotation.set(0.08 * i, 0.41 * i, 0.05 * i);
  amnam.add(cliff);
  if (i % 2 === 0) {
    const pineScale = 0.88 + i * 0.035;
    const pine = createPine(pineScale);
    pine.position.set(cliff.position.x + (i === 2 ? 0.7 : -0.45), cliff.position.y + cliffRadius * cliff.scale.y * 0.82, cliff.position.z - 0.2);
    pine.rotation.y = i * 1.13;
    amnam.add(pine);
  }
}
for (let i = 0; i < 7; i++) {
  const cliffRadius = 5 + (i % 3) * 1.3;
  const cliff = new THREE.Mesh(new THREE.IcosahedronGeometry(cliffRadius, 2), coastalMaterial(i % 2 ? 0x314641 : 0x263b39, 0.98));
  cliff.position.set(-32 + i * 4.2, 3.2 + (i % 2), -38 - i * 2.5);
  cliff.scale.set(1.45, 1.25, 0.72);
  cliff.rotation.set(0.1 * i, 0.35 * i, 0.06 * i);
  amnam.add(cliff);
  if (i % 2 === 0) {
    const pineScale = 1.02 - i * 0.035;
    const pine = createPine(pineScale);
    pine.position.set(cliff.position.x + (i % 4 ? 0.55 : -0.55), cliff.position.y + cliffRadius * cliff.scale.y * 0.82, cliff.position.z - 0.25);
    pine.rotation.y = 0.55 + i * 0.92;
    amnam.add(pine);
  }
}
addPinesAlongRidge(amnam, { width: 165, height: 18, position: [-62, 0, -110], seed: 0.4 }, [
  [-116, 0.82, 0.3], [-99, 0.96, -0.2], [-82, 0.88, 0.35], [-64, 1.08, -0.25],
  [-46, 0.98, 0.2], [-28, 0.9, -0.35], [-10, 0.8, 0.15]
]);
addPinesAlongRidge(amnam, { width: 78, height: 12, position: [50, 0, -118], seed: 1.9 }, [
  [23, 0.72, 0.2], [37, 0.82, -0.2], [52, 0.9, 0.25], [67, 0.8, -0.3], [80, 0.7, 0.15]
]);
addCoastalSkirt(amnam, -48, 118, -38, 0x2a403b, 15, 0.7);
const towerA = createCableTower(8.4);
towerA.position.set(-19, 8.7, -49);

const songdoStation = new THREE.Group();
const stationBase = new THREE.Mesh(new THREE.BoxGeometry(15, 1.35, 8.5), coastalMaterial(0x657174, 0.78, 0.12));
stationBase.position.y = 0.68;
const stationHall = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.25, 6.4), coastalMaterial(0xd5d5c9, 0.62, 0.06));
stationHall.position.y = 2.28;
const stationGlass = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.65), new THREE.MeshStandardMaterial({ color: 0x5d98aa, roughness: 0.13, metalness: 0.28, transparent: true, opacity: 0.82 }));
stationGlass.position.set(0, 2.5, 3.21);
const stationRoof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.3, 7.2), coastalMaterial(0x354247, 0.5, 0.42));
stationRoof.position.y = 4.02;
songdoStation.add(stationBase, stationHall, stationGlass, stationRoof);
songdoStation.position.set(24, 0, -57);
amnam.add(songdoStation);

const towerB = createCableTower(9.2);
towerB.position.set(23, 4.12, -57);
amnam.add(towerA, towerB);
const cableStart = new THREE.Vector3(-20.2, 17.35, -49);
const cableEnd = new THREE.Vector3(24.2, 13.45, -57);
const outboundCable = createSuspendedCable(amnam, cableStart, cableEnd, 1.65, -0.42);
const inboundCable = createSuspendedCable(amnam, cableStart.clone().add(new THREE.Vector3(0, -0.24, 0)), cableEnd.clone().add(new THREE.Vector3(0, -0.24, 0)), 1.65, 0.42);
const cableCars = [];
for (let i = 0; i < 4; i++) {
  const gondola = createGondola(i % 2 ? 0xf2aa32 : 0xc9473c);
  gondola.userData.cableCurve = i % 2 ? inboundCable : outboundCable;
  gondola.userData.phase = 0.08 + i * 0.47;
  gondola.userData.direction = i % 2 ? -1 : 1;
  cableCars.push(gondola);
  amnam.add(gondola);
}
addRidge(amnam, 72, 6.8, 0x3a554d, [51, -0.15, -76], 3.3);
addCoastalSkirt(amnam, 51, 76, -72, 0x354d47, 16, 2.4);
for (let i = 0; i < 8; i++) {
  const building = createBuilding(2.5 + (i % 3) * 0.5, 6.5 + (i % 4) * 2.25, 2.4, i % 2 ? 0xb9b8aa : 0x819499);
  building.position.set(38 + i * 3.3, 1.15 + (i % 2) * 0.32, -78 - (i % 3) * 3.5);
  building.scale.setScalar(0.88);
  amnam.add(building);
}
// YEONGDO: Busan Port bridge, working harbor, cranes, breakwater and red lighthouse.
const yeongdo = placeScenery.yeongdo;
addRidge(yeongdo, 145, 17, 0x344c55, [22, 0, -112], 2.5);
addRidge(yeongdo, 80, 22, 0x263e48, [50, 0, -88], 4.2);
addCoastalSkirt(yeongdo, 18, 138, -84, 0x30464d, 22, 1.5);
const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(190, 0.55, 1.25), coastalMaterial(0xaeb9bc, 0.55, 0.35));
bridgeDeck.position.set(0, 9.6, -82);
yeongdo.add(bridgeDeck);
const bridgeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xffd991, emissive: 0xffa62d, emissiveIntensity: 0.08, roughness: 0.28, metalness: 0.08 });
const bridgeLampLights = [];
for (let x = -75, index = 0; x <= 75; x += 15, index++) {
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.72, 8), coastalMaterial(0x4b5558, 0.48, 0.5));
  lampPost.position.set(x, 10.22, -81.65);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 9), bridgeLightMaterial);
  lampBulb.position.set(x, 10.62, -81.65);
  yeongdo.add(lampPost, lampBulb);
  if (index % 3 === 0) {
    const lampLight = new THREE.PointLight(0xffc873, 0, 15, 2);
    lampLight.position.set(x, 10.5, -81.2);
    bridgeLampLights.push(lampLight);
    yeongdo.add(lampLight);
  }
}
[-76, -58, 57, 75].forEach(x => {
  const approachPier = new THREE.Mesh(new THREE.BoxGeometry(1.1, 9.4, 1.1), coastalMaterial(0x879496, 0.78, 0.18));
  approachPier.position.set(x, 4.7, -82);
  yeongdo.add(approachPier);
});
[-26, 24].forEach(x => {
  const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.05, 23, 1.2), coastalMaterial(0xd4dcdd, 0.5, 0.25));
  pylon.position.set(x, 12.2, -82);
  yeongdo.add(pylon);
  for (let offset = -20; offset <= 20; offset += 5) {
    addLine(yeongdo, new THREE.Vector3(x, 22.5, -81.7), new THREE.Vector3(x + offset, 9.9, -81.7), 0xb9c7ca, 0.75);
  }
});
const breakwater = new THREE.Mesh(new THREE.BoxGeometry(38, 1.1, 4.2), coastalMaterial(0x4e595c, 0.94));
breakwater.position.set(-2, 0.35, -28);
breakwater.rotation.y = -0.055;
yeongdo.add(breakwater);
for (let i = 0; i < 25; i++) {
  const row = i % 3;
  const progress = Math.floor(i / 3) / 8;
  const stacked = i % 6 === 0 || i % 9 === 0;
  const pod = createTetrapod(0.7 + (Math.sin(i * 1.87) + 1) * 0.14);
  pod.position.set(
    -19 + progress * 39 + Math.sin(i * 2.43) * 1.15,
    0.04 + row * 0.08 + Math.max(0, Math.sin(i * 1.31)) * 0.22 + (stacked ? 0.62 : 0),
    -26.2 + row * 1.55 + Math.sin(i * 1.67) * 0.68 + (stacked ? 0.35 : 0)
  );
  pod.rotation.set(Math.sin(i * 0.93) * 0.34, i * 0.81, Math.cos(i * 1.17) * 0.3);
  pod.scale.set(0.92 + (i % 4) * 0.035, 0.9 + (i % 3) * 0.055, 0.94 + (i % 5) * 0.025);
  yeongdo.add(pod);
}
const lighthouse = createLighthouse();
lighthouse.position.set(-18.5, 0.8, -30.4);
yeongdo.add(lighthouse);
const lighthouseWindowMaterial = lighthouse.userData.lanternMaterial;
const lighthouseBeaconMaterial = new THREE.MeshBasicMaterial({ color: 0xffe5a3, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending });
const lighthouseBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 12), lighthouseBeaconMaterial);
lighthouseBeacon.position.y = 6.95;
lighthouse.add(lighthouseBeacon);
const lighthousePointLight = new THREE.PointLight(0xffcf72, 0, 24, 1.7);
lighthousePointLight.position.y = 6.95;
lighthouse.add(lighthousePointLight);
const lighthouseSpotLight = new THREE.SpotLight(0xffc77a, 0, 58, Math.PI / 10, 0.88, 1.55);
lighthouseSpotLight.position.set(-18.5, 7.75, -30.4);
const lighthouseSpotTarget = new THREE.Object3D();
lighthouseSpotTarget.position.set(-18.5, 0.05, -10);
lighthouseSpotLight.target = lighthouseSpotTarget;
yeongdo.add(lighthouseSpotLight, lighthouseSpotTarget);

const lighthouseBeamCanvas = document.createElement('canvas');
lighthouseBeamCanvas.width = lighthouseBeamCanvas.height = 256;
const lighthouseBeamContext = lighthouseBeamCanvas.getContext('2d');
for (let y = 0; y < 256; y++) {
  const progress = y / 255;
  const lengthFade = Math.pow(1 - progress, 0.38);
  const rowGradient = lighthouseBeamContext.createLinearGradient(0, 0, 256, 0);
  rowGradient.addColorStop(0, 'rgba(255,221,145,0)');
  rowGradient.addColorStop(0.24, `rgba(255,221,145,${lengthFade * 0.18})`);
  rowGradient.addColorStop(0.5, `rgba(255,238,187,${lengthFade * 0.82})`);
  rowGradient.addColorStop(0.76, `rgba(255,221,145,${lengthFade * 0.18})`);
  rowGradient.addColorStop(1, 'rgba(255,221,145,0)');
  lighthouseBeamContext.fillStyle = rowGradient;
  lighthouseBeamContext.fillRect(0, y, 256, 1);
}
const lighthouseBeamTexture = new THREE.CanvasTexture(lighthouseBeamCanvas);
const lighthouseSeaBeamGeometry = new THREE.BufferGeometry();
lighthouseSeaBeamGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
  -0.45, 0, 0, 0.45, 0, 0, -11, 0, 33, 11, 0, 33
], 3));
lighthouseSeaBeamGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([
  0, 1, 1, 1, 0, 0, 1, 0
], 2));
lighthouseSeaBeamGeometry.setIndex([0, 2, 1, 2, 3, 1]);
const lighthouseSeaBeamMaterial = new THREE.MeshBasicMaterial({ color: 0xffd98a, map: lighthouseBeamTexture, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
const lighthouseSeaBeam = new THREE.Mesh(lighthouseSeaBeamGeometry, lighthouseSeaBeamMaterial);
lighthouseSeaBeam.position.set(-18.5, 0.34, -29.2);
lighthouseSeaBeam.rotation.y = -0.08;
yeongdo.add(lighthouseSeaBeam);
let lighthouseLevel = 0;
const lighthouseCauseway = createCauseway(
  new THREE.Vector3(-15.7, 0.35, -31.4),
  new THREE.Vector3(45, 0.35, -91),
  4.6
);
yeongdo.add(lighthouseCauseway);
for (let i = 0; i < 3; i++) {
  const crane = createCrane(i === 1 ? 0xd96832 : 0xe8a03d);
  crane.position.set(17 + i * 10, 0, -53 - i * 2.5);
  crane.scale.setScalar(0.72 + i * 0.06);
  yeongdo.add(crane);
}
for (let i = 0; i < 10; i++) {
  const container = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.45, 1.65), coastalMaterial([0x315e72, 0xbd523c, 0xc89234][i % 3], 0.72, 0.12));
  container.position.set(12 + (i % 5) * 4, 0.75 + Math.floor(i / 5) * 1.5, -58);
  yeongdo.add(container);
}
const portBoat = createFishingBoat(0x214d60);
portBoat.position.set(19, -0.15, -38);
portBoat.scale.setScalar(0.72);
portBoat.rotation.y = -0.16;
yeongdo.add(portBoat);
// DADAEPO / MOLUNDAE: broad tidal flats, estuary bridge, reeds and sunset boats.
const dadaepo = placeScenery.dadaepo;
addRidge(dadaepo, 82, 14, 0x3b5144, [-48, 0, -94], 0.8);
addRidge(dadaepo, 72, 11, 0x33483f, [53, 0, -103], 3.4);
addCoastalSkirt(dadaepo, -48, 82, -88, 0x465841, 15, 0.4);
addCoastalSkirt(dadaepo, 53, 74, -96, 0x3c5140, 14, 2.1);
const sandMaterial = new THREE.MeshBasicMaterial({ color: 0x8c7654, fog: true });
for (let i = 0; i < 6; i++) {
  const sandbar = new THREE.Mesh(new THREE.SphereGeometry(5 + i * 0.75, 28, 14), sandMaterial);
  sandbar.scale.set(1.9, 0.055, 0.5);
  sandbar.position.set(-28 + i * 11, -0.02, -26 - (i % 3) * 8);
  dadaepo.add(sandbar);
}
addRidge(dadaepo, 58, 7.2, 0x3a5043, [72, 0, -79], 5.8);
addCoastalSkirt(dadaepo, 72, 60, -75, 0x415642, 12, 3.7);
const estuaryBridge = new THREE.Mesh(new THREE.BoxGeometry(132, 0.42, 0.9), coastalMaterial(0x8f9997, 0.62, 0.28));
estuaryBridge.position.set(10, 5.2, -72);
dadaepo.add(estuaryBridge);
for (let x = -45; x <= 75; x += 15) {
  const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 5.2, 10), coastalMaterial(0x656f6d, 0.9));
  pier.position.set(x, 2.55, -72);
  dadaepo.add(pier);
}
const marshMaterial = coastalMaterial(0x465936, 1);
for (let i = 0; i < 8; i++) {
  const side = i % 2 ? 1 : -1;
  const marshPatch = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + (i % 3) * 0.3, 2), marshMaterial);
  marshPatch.scale.set(2.1, 0.18, 0.72);
  marshPatch.position.set(side * (20 + (i % 4) * 3.2), 0.12, -25 - (i % 3) * 5.5);
  marshPatch.rotation.y = i * 0.74;
  dadaepo.add(marshPatch);
}
for (let i = 0; i < 3; i++) {
  const boat = createFishingBoat(i % 2 ? 0x7f4338 : 0x315969);
  boat.position.set(-25 + i * 24, 0, -43 - i * 6);
  boat.scale.setScalar(0.42 + i * 0.04);
  boat.rotation.y = i % 2 ? 0.22 : -0.18;
  dadaepo.add(boat);
}
addRidge(dadaepo, 58, 6.2, 0x3d5546, [-29, 0, -53], 4.8);
addCoastalSkirt(dadaepo, -29, 62, -49, 0x475a42, 14, 4.2);
addPinesAlongRidge(dadaepo, { width: 82, height: 14, position: [-48, 0, -94], seed: 0.8 }, [
  [-82, 0.72, 0.35], [-73, 0.82, -0.25], [-63, 0.9, 0.2], [-52, 1.02, -0.3],
  [-41, 0.94, 0.25], [-30, 0.86, -0.2], [-19, 0.76, 0.3]
]);
addPinesAlongRidge(dadaepo, { width: 72, height: 11, position: [53, 0, -103], seed: 3.4 }, [
  [23, 0.7, 0.25], [33, 0.8, -0.25], [44, 0.9, 0.2], [55, 0.96, -0.3],
  [66, 0.88, 0.25], [77, 0.78, -0.2]
]);
addPinesAlongRidge(dadaepo, { width: 58, height: 6.2, position: [-29, 0, -53], seed: 4.8 }, [
  [-50, 0.9, 0.2], [-42, 1.02, -0.25], [-33, 1.14, 0.2], [-24, 1.08, -0.3],
  [-15, 0.98, 0.25], [-7, 0.86, -0.2]
]);
Object.values(placeScenery).forEach(group => {
  group.visible = false;
  scene.add(group);
});

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

const guidePoints = [];
for (const amount of [0.1, 0.24, 0.4, 0.58, 0.77, 0.975]) {
  const polePoint = rodCurve.getPointAt(amount);
  const guideRadius = THREE.MathUtils.lerp(0.038, 0.019, amount);
  const guideCenter = polePoint.clone();
  guideCenter.y -= guideRadius + 0.021;
  const guide = new THREE.Mesh(new THREE.TorusGeometry(guideRadius, 0.006, 8, 18), goldMaterial);
  guide.rotation.y = Math.PI / 2;
  guide.position.copy(guideCenter);
  rod.add(guide);

  const supportHeight = polePoint.y - guideCenter.y;
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, supportHeight, 6), goldMaterial);
  support.position.copy(polePoint).lerp(guideCenter, 0.5);
  rod.add(support);
  guidePoints.push(guideCenter);
}

const rodLineExit = guidePoints[guidePoints.length - 1].clone();
const threadedRodLine = new THREE.Mesh(
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.25, -0.14, 0.015),
      new THREE.Vector3(0.43, -0.08, 0.008),
      ...guidePoints
    ]),
    64,
    0.0045,
    5,
    false
  ),
  new THREE.MeshBasicMaterial({ color: 0xdff7ff, transparent: true, opacity: 0.88 })
);
rod.add(threadedRodLine);

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
  rodTip.copy(rodLineExit).applyMatrix4(rod.matrixWorld);
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
  requestAnimationFrame(positionFloatingCollectionBack);
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
  requestAnimationFrame(positionFloatingCollectionBack);
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
  const lanternFlicker = 0.985 + Math.sin(seconds * 7.1) * 0.012 + Math.sin(seconds * 13.7) * 0.006;
  lanternCore.scale.setScalar(lanternFlicker);
  lanternLight.intensity *= lanternFlicker;
  clouds.children.forEach((cloud, index) => {
    cloud.position.x += frameDelta * cloud.userData.speed;
    if (cloud.position.x > 115) cloud.position.x = -115;
    cloud.position.y += Math.sin(seconds * 0.15 + index) * frameDelta * 0.025;
  });
  seabirds.children.forEach((bird, index) => {
    bird.position.x += frameDelta * (0.34 + index * 0.015);
    bird.position.y += Math.sin(seconds * 0.8 + index) * frameDelta * 0.08;
    if (bird.position.x > 50) bird.position.x = -48;
  });
  lighthouseSeaBeam.rotation.y = -0.08 + Math.sin(seconds * 0.34) * 0.2;
  lighthouseSpotTarget.position.x = -18.5 + Math.sin(seconds * 0.34) * 8.5;
  cableCars.forEach((gondola, index) => {
    const rawTravel = ((gondola.userData.phase + seconds * 0.018 * gondola.userData.direction) % 2 + 2) % 2;
    const travel = rawTravel <= 1 ? rawTravel : 2 - rawTravel;
    const curve = gondola.userData.cableCurve;
    const point = curve.getPointAt(travel);
    const tangent = curve.getTangentAt(travel).normalize();
    gondola.position.copy(point);
    gondola.rotation.y = -Math.atan2(tangent.z, tangent.x);
    gondola.rotation.z = Math.sin(seconds * 0.55 + index) * 0.012;
  });

  const positions = waterGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getY(i);
    const height =
      Math.sin(x * 0.105 + seconds * 0.5) * 0.085 +
      Math.sin(z * 0.15 - seconds * 0.38) * 0.048 +
      Math.cos((x + z) * 0.072 + seconds * 0.3) * 0.028;
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
