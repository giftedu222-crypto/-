import fs from 'node:fs/promises';
import path from 'node:path';

globalThis.window = {};
await import('../catalog-data.js');
await import('../recipe-photo-data.js').catch(() => {});

const catalog = window.SEAFOOD_CATALOG;
const previousPhotos = { ...(window.RECIPE_PHOTOS || {}) };
const verifiedRecipeOverrides = {
  '\uace0\ub4f1\uc5b4|\ubb34\uc870\ub9bc': {
    thumbnail: 'https://api.openverse.org/v1/images/10e9ca7d-1e5b-4309-a593-41c4482a67f6/thumb/',
    source: 'https://www.flickr.com/photos/32539604@N00/16764618295',
    title: 'Stewed Mackerel and Japanese radish'
  },
  '\uace0\ub4f1\uc5b4|\ud280\uae40': {
    thumbnail: 'https://api.openverse.org/v1/images/c46691bc-163f-4b7f-b018-1ff6cd427562/thumb/',
    source: 'https://www.flickr.com/photos/40295335@N00/3228327661',
    title: 'Saba tatsuta-age (deep-fried mackerel fillets)'
  },
  '\uc0bc\uce58|\ud280\uae40': {
    thumbnail: 'https://api.openverse.org/v1/images/04ceeb21-91d2-47b3-9e60-4dac31ddd37e/thumb/',
    source: 'https://www.flickr.com/photos/10559879@N00/6079010037',
    title: 'Fried Spanish Mackerel Cutlets'
  }
};
const speciesTerms = {
  '고등어':'mackerel','삼치':'Spanish mackerel','꽁치':'Pacific saury','멸치':'anchovy','정어리':'sardine','전갱이':'horse mackerel','방어':'yellowtail fish','부시리':'amberjack fish','참다랑어':'bluefin tuna','눈다랑어':'bigeye tuna','황다랑어':'yellowfin tuna','가다랑어':'skipjack tuna','연어':'salmon','송어':'trout','대구':'cod fish','명태':'pollock fish','가자미':'flounder fish','도다리':'marbled sole fish','넙치':'halibut fish','서대':'tongue sole fish','참돔':'red sea bream','감성돔':'black sea bream','돌돔':'striped beakfish','벵에돔':'largescale blackfish','농어':'sea bass','민어':'croaker fish','조기':'yellow croaker','갈치':'cutlassfish','뱀장어':'freshwater eel','붕장어':'conger eel','갯장어':'pike conger eel','아귀':'monkfish','쥐치':'filefish','말쥐치':'black scraper fish','병어':'pomfret fish','숭어':'mullet fish','보리멸':'sillago fish','양미리':'sand eel','임연수어':'Atka mackerel','청어':'herring fish','홍어':'skate fish','가오리':'stingray fish','망둥어':'goby fish','도루묵':'sailfin sandfish','꼼치':'snailfish','학꽁치':'halfbeak fish','날치':'flying fish','능성어':'grouper fish','자바리':'longtooth grouper','옥돔':'tilefish','오징어':'squid','갑오징어':'cuttlefish','한치':'spear squid','꼴뚜기':'baby squid','문어':'octopus','낙지':'long arm octopus','주꾸미':'webfoot octopus','피문어':'giant Pacific octopus','전복':'abalone','소라':'turban shell seafood','골뱅이':'whelk seafood','바지락':'Manila clam','모시조개':'clam seafood','꼬막':'cockle seafood','새꼬막':'blood cockle','홍합':'mussel seafood','굴':'oyster seafood','가리비':'scallop seafood','키조개':'pen shell seafood','맛조개':'razor clam','백합':'hard clam seafood','동죽':'surf clam seafood','재첩':'freshwater clam dish','개조개':'hen clam seafood','꽃게':'blue crab','대게':'snow crab','홍게':'red snow crab','킹크랩':'king crab','참게':'mitten crab','민물가재':'crayfish','닭새우':'spiny lobster','보리새우':'tiger prawn','흰다리새우':'whiteleg shrimp','대하':'jumbo shrimp','단새우':'sweet shrimp','갯가재':'mantis shrimp','성게':'sea urchin','해삼':'sea cucumber','멍게':'sea squirt seafood','미더덕':'warty sea squirt seafood'
};

const foodWords = ['food','dish','grill','grilled','fried','fry','soup','stew','sashimi','sushi','rice','cooked','braised','steamed','roast','cuisine','meal','restaurant','recipe','pancake','donburi'];
const dishTerms = {
  '소금구이':'salt grilled','무조림':'braised radish','튀김':'fried','볶음':'stir fried','구이':'grilled','조림':'braised','회':'sashimi','맑은탕':'clear soup','찜':'steamed','전':'pancake','숯불구이':'charcoal grilled','덮밥':'rice bowl','숙회':'blanched boiled','해물탕':'seafood stew','성게알밥':'sea urchin rice bowl','비빔밥':'bibimbap','초밥':'sushi','해삼탕':'sea cucumber soup','된장찌개':'soybean paste stew'
};
const manualResults = {
  '참돔': [
    ['https://api.openverse.org/v1/images/9213a24b-fad6-4e26-8d06-895a61ef35fb/thumb/','https://www.flickr.com/photos/89060048@N03/19297824696','Red sea bream sashimi'],
    ['https://api.openverse.org/v1/images/1ff2a42a-5718-4a99-870e-b5167b7a32b6/thumb/','https://www.flickr.com/photos/89060048@N03/19298774996','Tai sashimi'],
    ['https://api.openverse.org/v1/images/5703f61f-7a25-410a-bf51-341185cbe1c3/thumb/','https://www.flickr.com/photos/47604303@N00/6254096724','Madai dish'],
    ['https://api.openverse.org/v1/images/3cac9334-f3ca-41dc-93a6-00e07ba4cab3/thumb/','https://www.flickr.com/photos/68147320@N02/10723918573','Madai carpaccio']
  ],
  '말쥐치': [
    ['https://api.openverse.org/v1/images/423844f4-e5d2-4478-90bd-5811b3daf0cb/thumb/','https://commons.wikimedia.org/w/index.php?curid=112474644','Kawahagi sashimi with liver sauce'],
    ['https://api.openverse.org/v1/images/2b526ec9-2e95-4b99-bf33-5b4992cb8751/thumb/','https://www.flickr.com/photos/89060048@N03/14154905302','Kawahagi sashimi plate'],
    ['https://api.openverse.org/v1/images/6300b02a-b00c-4703-af49-cea33a9f20ea/thumb/','https://www.flickr.com/photos/85936780@N00/10771438943','Threadsail filefish sashimi'],
    ['https://api.openverse.org/v1/images/df5176f8-b2a1-4de0-a733-fcdfe7931a81/thumb/','https://www.flickr.com/photos/68147320@N02/15297249518','Kawahagi filefish dish'],
    ['https://api.openverse.org/v1/images/f47e4891-f7ad-4e93-8ceb-f68e16be005e/thumb/','https://www.flickr.com/photos/89965849@N00/2533678862','Kawahagi dish']
  ],
  '임연수어': [
    ['https://api.openverse.org/v1/images/5b86be7e-8130-4ef6-b1e9-84a765635463/thumb/','https://www.flickr.com/photos/12832970@N00/8563974938','Grilled Atka mackerel'],
    ['https://api.openverse.org/v1/images/40221bb4-0908-4890-9f34-0989f6612791/thumb/','https://www.flickr.com/photos/16521641@N04/5273341391','Atka mackerel meal'],
    ['https://api.openverse.org/v1/images/b53f42a1-e341-494b-8095-622463fbedaf/thumb/','https://www.flickr.com/photos/40295335@N00/7937990218','Grilled hokke'],
    ['https://api.openverse.org/v1/images/c256d34d-3596-421c-8f6e-58af0af79cd1/thumb/','https://www.flickr.com/photos/29702210@N00/6228742810','Hokke dish']
  ],
  '가오리': [
    ['https://api.openverse.org/v1/images/df1ab396-94f6-4291-9c9f-7c0d4bcf4c5c/thumb/','https://www.flickr.com/photos/73207483@N00/2090841619','Sambal stingray dish'],
    ['https://api.openverse.org/v1/images/c02d70ac-c434-4202-9a97-20855e298963/thumb/','https://www.flickr.com/photos/25802865@N08/2463906496','BBQ stingray'],
    ['https://api.openverse.org/v1/images/ec75e6a2-057c-473f-81f3-e45d5bc7966f/thumb/','https://www.flickr.com/photos/89056504@N00/1359507221','Ray fish dish'],
    ['https://api.openverse.org/v1/images/e334ac91-01a3-4a31-b9a4-94bfb14311e4/thumb/','https://www.flickr.com/photos/49215102@N00/118532171','Cooked stingray']
  ],
  '한치': [
    ['https://api.openverse.org/v1/images/2f226259-2eb7-47ad-96c9-4658c2346542/thumb/','https://www.flickr.com/photos/40295335@N00/20768752658','Spear squid sashimi'],
    ['https://api.openverse.org/v1/images/a1aa9d62-efe9-4637-acfc-0657806e5e48/thumb/','https://www.flickr.com/photos/10559879@N00/3118156830','Cooked squid dish'],
    ['https://api.openverse.org/v1/images/b3f316e9-aa1d-4ea2-b711-10d099ac778e/thumb/','https://www.flickr.com/photos/66801522@N00/8707903310','Squid dish'],
    ['https://api.openverse.org/v1/images/afd55d80-23cd-4d70-9c00-9f02b3d6db8a/thumb/','https://www.flickr.com/photos/10559879@N00/4340669590','Squid seafood rice']
  ],
  '참게': [
    ['https://api.openverse.org/v1/images/daad6beb-178f-4f27-b246-596c7ebc2941/thumb/','https://www.flickr.com/photos/97403714@N02/35487673281','Shanghai hairy crab'],
    ['https://api.openverse.org/v1/images/0d71568a-98bf-465a-abbb-efdbe8567d93/thumb/','https://www.flickr.com/photos/16828710@N00/1471098518','Steamed mitten crab'],
    ['https://api.openverse.org/v1/images/62702be3-9344-4889-b8eb-6940f7580a15/thumb/','https://www.flickr.com/photos/91049143@N00/30377656591','Chinese mitten crab dish'],
    ['https://api.openverse.org/v1/images/2029c62a-7aa7-43f0-8170-196112399ecc/thumb/','https://www.flickr.com/photos/91049143@N00/30166190390','Mitten crab meal']
  ],
  '학꽁치': [
    ['https://api.openverse.org/v1/images/d0d7d514-5c8f-47fa-9f5f-8bf795c940d1/thumb/','https://www.flickr.com/photos/68147320@N02/16776176969','Sayori sashimi'],
    ['https://api.openverse.org/v1/images/0512a83f-63f5-4a54-a2d8-fd170635857e/thumb/','https://www.flickr.com/photos/89965849@N00/8150027778','Sayori sashimi selection'],
    ['https://api.openverse.org/v1/images/ebea34ab-0786-45ef-a9a2-e47c39aa9787/thumb/','https://www.flickr.com/photos/10705048@N00/2097628473','Halfbeak sashimi']
  ],
  '재첩': [
    ['https://api.openverse.org/v1/images/fa322cb9-979b-4044-8798-1e725b786f9a/thumb/','https://www.flickr.com/photos/52133016@N08/8030428537','Corbicula clam dish'],
    ['https://api.openverse.org/v1/images/54f2ef51-aa2d-4ebe-a68d-ba887856c6a6/thumb/','https://www.flickr.com/photos/7656600@N06/14207166822','Shijimi clams'],
    ['https://api.openverse.org/v1/images/1ed4c937-b937-4efd-80a4-6b20dc207e05/thumb/','https://www.flickr.com/photos/36205971@N05/15466614360','Cooked clams']
  ],
  '개조개': [
    ['https://api.openverse.org/v1/images/3da13719-e204-4807-94d2-ed898e733107/thumb/','https://www.flickr.com/photos/26815309@N06/3279107463','Baby clam rice'],
    ['https://api.openverse.org/v1/images/a5108d64-43e5-462f-b1ef-23577383c718/thumb/','https://www.flickr.com/photos/61431010@N00/2424275366','Hen clam dishes'],
    ['https://api.openverse.org/v1/images/c6b46e3e-ba73-4f5a-b901-fef7162dc384/thumb/','https://www.flickr.com/photos/68147320@N02/15802610974','Manila clam dish']
  ],
  '미더덕': [
    ['https://api.openverse.org/v1/images/9994bd3c-96da-45d2-9bf0-d83041d702dc/thumb/','https://www.flickr.com/photos/48099890@N08/16706133859','Korean sea squirt dish'],
    ['https://api.openverse.org/v1/images/d338103b-e470-4fc0-ba0e-158c7b64eb55/thumb/','https://www.flickr.com/photos/68147320@N02/26907752663','Sea squirt seafood platter'],
    ['https://api.openverse.org/v1/images/8b949f35-482a-4662-9d74-790606fc2ab5/thumb/','https://www.flickr.com/photos/32400437@N07/4440139110','Sea squirt dish']
  ]
};
Object.keys(manualResults).forEach(name => {
  manualResults[name] = manualResults[name].map(([thumbnail, foreign_landing_url, title]) => ({ thumbnail, foreign_landing_url, title, creator: '', license: '' }));
});
const outputDir = path.resolve('assets/recipe-species');
await fs.mkdir(outputDir, { recursive: true });

const missingTerms = catalog.filter(item => !speciesTerms[item.name]).map(item => item.name);
if (missingTerms.length) throw new Error(`Missing English search terms: ${missingTerms.join(', ')}`);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': 'NakkaMuraGame/1.0 (educational seafood catalog)' } });
    if (response.ok) return response;
    if (response.status >= 400 && response.status < 500 && response.status !== 429) throw new Error(`${response.status} ${url}`);
    if (attempt === attempts) throw new Error(`${response.status} ${url}`);
    await sleep(response.status === 429 ? attempt * 4000 : attempt * 1000);
  }
}

async function searchImages(term) {
  const queries = [`${term} cooked food dish`, `${term} seafood meal`, `${term} recipe`, `${term} restaurant food`, term];
  const combined = [];
  for (const query of queries) {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20`;
    const response = await fetchWithRetry(url);
    const data = await response.json();
    combined.push(...(data.results || []));
    const usable = combined.filter(item => item.thumbnail && item.foreign_landing_url);
    if (usable.length >= 3) break;
    await sleep(250);
  }
  const seen = new Set();
  return combined
    .filter(item => item.thumbnail && item.foreign_landing_url && !seen.has(item.id) && seen.add(item.id))
    .sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      const score = title => foodWords.reduce((total, word) => total + (title.includes(word) ? 1 : 0), 0);
      return score(bTitle) - score(aTitle);
    });
}

async function searchExactRecipe(term, recipeName) {
  const query = `${term} ${dishTerms[recipeName]} dish`;
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20`;
  const response = await fetchWithRetry(url);
  const data = await response.json();
  const generic = new Set(['fish','seafood','food','dish']);
  const speciesTokens = term.toLowerCase().split(/\s+/).filter(token => token.length > 2 && !generic.has(token));
  const methodTokens = dishTerms[recipeName].toLowerCase().split(/\s+/).filter(token => token.length > 2);
  return (data.results || []).filter(item => {
    if (!item.thumbnail || !item.foreign_landing_url) return false;
    const title = (item.title || '').toLowerCase();
    return speciesTokens.some(token => title.includes(token)) && methodTokens.some(token => title.includes(token));
  });
}

async function applyVerifiedRecipeOverrides() {
  const updated = { ...previousPhotos };
  for (const [key, override] of Object.entries(verifiedRecipeOverrides)) {
    const [speciesName, recipeName] = key.split('|');
    const fishIndex = catalog.findIndex(item => item.name === speciesName);
    const recipeIndex = catalog[fishIndex]?.recipe.split(' · ').indexOf(recipeName) ?? -1;
    if (fishIndex < 0 || recipeIndex < 0) throw new Error(`Unknown verified recipe: ${key}`);
    const filename = `${String(fishIndex + 1).padStart(3, '0')}-${recipeIndex + 1}.jpg`;
    const imageResponse = await fetchWithRetry(override.thumbnail);
    const contentType = imageResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) throw new Error(`Invalid verified image: ${key}`);
    await fs.writeFile(path.join(outputDir, filename), Buffer.from(await imageResponse.arrayBuffer()));
    updated[key] = {
      image: `assets/recipe-species/${filename}`,
      source: override.source,
      title: override.title,
      creator: '',
      license: ''
    };
  }
  await fs.writeFile('recipe-photo-data.js', `window.RECIPE_PHOTOS=${JSON.stringify(updated)};\n`);
  console.log(`Applied ${Object.keys(verifiedRecipeOverrides).length} manually verified recipe photos.`);
}

async function refineExistingPhotos() {
  const refined = {};
  let replaced = 0;
  for (let fishIndex = 0; fishIndex < catalog.length; fishIndex += 1) {
    const fish = catalog[fishIndex];
    const recipes = fish.recipe.split(' · ');
    const usedSources = new Set();
    const searches = await Promise.all(recipes.map(recipeName => searchExactRecipe(speciesTerms[fish.name], recipeName)));
    for (let recipeIndex = 0; recipeIndex < recipes.length; recipeIndex += 1) {
      const recipeName = recipes[recipeIndex];
      const key = `${fish.name}|${recipeName}`;
      const current = previousPhotos[key];
      const candidate = searches[recipeIndex].find(item => !usedSources.has(item.foreign_landing_url));
      if (!candidate) {
        if (!current) throw new Error(`No photo for ${key}`);
        refined[key] = current;
        usedSources.add(current.source);
        continue;
      }
      const filename = `${String(fishIndex + 1).padStart(3, '0')}-${recipeIndex + 1}.jpg`;
      try {
        const imageResponse = await fetchWithRetry(candidate.thumbnail);
        const contentType = imageResponse.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) throw new Error('Invalid image');
        await fs.writeFile(path.join(outputDir, filename), Buffer.from(await imageResponse.arrayBuffer()));
        refined[key] = { image: `assets/recipe-species/${filename}`, source: candidate.foreign_landing_url, title: candidate.title || key, creator: candidate.creator || '', license: candidate.license || '' };
        usedSources.add(candidate.foreign_landing_url);
        replaced += 1;
      } catch {
        refined[key] = current;
        usedSources.add(current.source);
      }
    }
    process.stdout.write(`[${fishIndex + 1}/${catalog.length}] ${fish.name} 정밀 검수\n`);
    await sleep(120);
  }
  await fs.writeFile('recipe-photo-data.js', `window.RECIPE_PHOTOS=${JSON.stringify(refined)};\n`);
  console.log(`Refined ${replaced} exact species-and-method photos.`);
}

if (process.argv.includes('--refine')) {
  await refineExistingPhotos();
  process.exit(0);
}

if (process.argv.includes('--verified')) {
  await applyVerifiedRecipeOverrides();
  process.exit(0);
}

const photoData = {};
const unresolved = [];

for (let fishIndex = 0; fishIndex < catalog.length; fishIndex += 1) {
  const fish = catalog[fishIndex];
  const recipes = fish.recipe.split(' · ');
  const forceDownload = Boolean(manualResults[fish.name]);
  const results = manualResults[fish.name] || await searchImages(speciesTerms[fish.name]);
  if (results.length < recipes.length) {
    unresolved.push({ name: fish.name, found: results.length, needed: recipes.length });
    continue;
  }

  let resultIndex = 0;
  let completed = 0;
  for (let recipeIndex = 0; recipeIndex < recipes.length; recipeIndex += 1) {
    const recipeName = recipes[recipeIndex];
    const filename = `${String(fishIndex + 1).padStart(3, '0')}-${recipeIndex + 1}.jpg`;
    let saved = false;
    while (!saved && resultIndex < results.length) {
      const result = results[resultIndex++];
      try {
        const outputPath = path.join(outputDir, filename);
        const existing = await fs.stat(outputPath).catch(() => null);
        if (!existing || !existing.size || forceDownload) {
          const imageResponse = await fetchWithRetry(result.thumbnail);
          const contentType = imageResponse.headers.get('content-type') || '';
          if (!contentType.startsWith('image/')) continue;
          await fs.writeFile(outputPath, Buffer.from(await imageResponse.arrayBuffer()));
        }
        photoData[`${fish.name}|${recipeName}`] = {
          image: `assets/recipe-species/${filename}`,
          source: result.foreign_landing_url,
          title: result.title || `${fish.name} ${recipeName}`,
          creator: result.creator || '',
          license: result.license || ''
        };
        saved = true;
        completed += 1;
      } catch {}
    }
  }

  if (completed < recipes.length) unresolved.push({ name: fish.name, found: completed, needed: recipes.length });
  else process.stdout.write(`[${fishIndex + 1}/${catalog.length}] ${fish.name} ${recipes.length}장\n`);
  await sleep(180);
}

if (unresolved.length) {
  await fs.writeFile('scripts/unresolved-recipe-photos.json', JSON.stringify(unresolved, null, 2));
  throw new Error(`Unresolved species: ${unresolved.map(item => `${item.name}(${item.found}/${item.needed})`).join(', ')}`);
}

const output = `window.RECIPE_PHOTOS=${JSON.stringify(photoData)};\n`;
await fs.writeFile('recipe-photo-data.js', output);
await fs.rm('scripts/unresolved-recipe-photos.json', { force: true });
console.log(`Completed ${Object.keys(photoData).length} species-specific recipe photos.`);
