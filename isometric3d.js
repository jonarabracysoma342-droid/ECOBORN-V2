// Ecoborn V2 — High-Performance 3D Isometric Floating Island Diorama (60 FPS Optimized & Clean Visuals)
// Optimizations:
// - Pre-sorted tile arrays per camera rotation (zero per-frame tile sorting!)
// - Frustum / viewport culling for tiles, trees, and animals
// - Zero ctx.shadowBlur (fast dual-stroke glowing splines instead of expensive CPU Gaussian blur)
// - Clean world visuals: No floating text clutter on every animal/arrow! Only show clean HP/Hunger bars,
//   compact eating/combat progress bars, and show name tooltip ONLY for the hovered/inspected animal.
(function (global) {
  'use strict';

  const MAP_SIZE = 46; // 46x46 = 2,116 tiles (vast WorldBox-scale 5-biome island, baked for 60 FPS!)
  const BASE_TW = 42;
  const BASE_TH = 21;
  const MAX_3D_ANIMALS = 56;
  const MAX_HUMANS = 24;
  const YEAR_SECONDS = 14;
  const SIM_TIME_SCALE = 0.42; // Calm 0.42x simulation speed at silky-smooth 60 FPS!
  const ISO_FRAME_STEP = 0; // Kept as no-op compatibility flag
  let fpsAccum = 0;

  let canvas = null;
  let ctx = null;
  let active = false;
  let showFoodWeb = false; // Off by default for ultra-clean look; toggleable anytime via "🕸️ Mode Jaring" button!
  let simMoving = true;
  let paused = false;
  let mapMode = 'multi';

  const cam = {
    x: 0,
    y: 22,
    targetX: 0,
    targetY: 22,
    zoom: 0.56,
    targetZoom: 0.56,
    rot: 0,
    trauma: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    moved: false
  };

  let hoverTile = null;
  let hoveredAnimal = null;
  let selectedAnimal = null;
  let draggingDockCard = null;
  let selectedDockCard = null;
  let guidedCardIds = [];
  let guidedHintText = '';
  let isoCoinDebt = 0;
  let activeRecoveryKey = null;
  let gestureHintTimer = null;
  let isPaintingWorld = false;
  let lastPaintTime = 0;
  let lastPaintedTile = null;
  let pointerOnCanvas = false;
  let rightClickPanMoved = false;
  let cardDragStart = { x: 0, y: 0 };
  let pointerScreen = { x: 0, y: 0 };

  let viewW = 0;
  let viewH = 0;
  let terrainCache = null;
  let mapGeneration = 0;
  let pointerDirty = false;

  let grid = [];
  let sortedTilesByRot = [[], [], [], []];
  let waterTilesByRot = [[], [], [], []];
  let landTilesByRot = [[], [], [], []];
  let treeTiles = []; // Pre-computed back-to-front tile draw order for rotations 0..3
  let animals = [];
  let humans = [];
  let hoveredHuman = null;
  let selectedHuman = null;
  let saplingTiles = [];
  let sawitTiles = [];
  let sekatKanalTiles = [];
  let peatMoisture = 86;
  let peatSmogAlpha = 0;
  let peatBadgeEl = null;
  let tutPlacements = 0;
  let tutZoomed = false;
  let tutOpenedInfo = false;
  let tutSawConseq = false;
  let buildingTiles = [];
  let farmTiles = [];
  let floodTiles = [];
  let fireTiles = [];
  let shoreOutlinePts = [];
  let seaReefs = [];
  let riverFish = [];
  let ambientShadows = [];
  let femaleSheets = null;
  let missionRewarded = [false, false, false, false, false, false];
  let lightningBolts = [];
  let lightningQueue = [];
  let skyFlashAlpha = 0;
  let pollutedTiles = [];
  let terrainRebakeTimer = 0;
  let hasAnyTerraEdits = false;
  let displacedCounter = 0;
  let displacedAnimalEvacCount = 0;
  let displacedCooldown = 0;
  let lastDisplacedReason = 'terra_erase';
  let initialBiomeCounts = {};
  let liveBiomeCounts = {};
  let habitatCountTimer = 0;
  let pendingConsequence = null;
  let consequenceTimer = 0;
  let conseqModalEl = null;
  let conseqBadgeEl = null;
  let conseqTitleEl = null;
  let conseqBodyEl = null;
  let conseqNextEl = null;
  let conseqFixBtn = null;
  let conseqWatchBtn = null;
  let pendingAlertEvent = null;
  let autoAlertTimer = 6;
  let autoAlertCycle = 0;
  let eventPopupEl = null;
  let eventPopupIconEl = null;
  let eventPopupTextEl = null;
  let eventPopupGoBtn = null;
  let eventPopupCloseBtn = null;
  let zoomInfoBtn = null;
  let eduModalEl = null;
  let eduBadgeEl = null;
  let eduTitleEl = null;
  let eduSubEl = null;
  let eduBodyEl = null;
  let eduTipEl = null;
  let naturalSeedTimer = 0;
  let worldYear = 1;
  let yearTimer = 0;
  let civ = { wood: 0, stone: 0, food: 12, sawitYears: 0 };
  let yearLabelEl = null;
  let civSummaryEl = null;
  let clouds3d = [];
  let fxParticles = [];
  let spawnRings = [];
  let activeSymbioses = [];
  let ecoCheckTimer = 0;

  let statusLogEl = null;
  let balancePctEl = null;
  let balanceFillEl = null;
  let popSummaryEl = null;
  let biomeTitleEl = null;
  let cardDockEl = null;
  let advisorPctEl = null;
  let advisorTipEl = null;
  let coinValEl = null;
  let debtBadgeEl = null;
  let loanBtnEl = null;
  let pyrStatusEl = null;
  let pyrRows = null;
  let reflectModalEl = null;
  let reflectBodyEl = null;
  let reflectTipEl = null;
  let gestureHintEl = null;
  let symSummaryEl = null;
  let symCntEls = { mutual: null, commensal: null, parasite: null, amensal: null };
  let symResetZoomBtn = null;
  let eventFocus = null;
  let symCycleIdx = { mutual: 0, commensal: 0, parasite: 0, amensal: 0 };
  let dockCategory = 'all';
  let isoCoins = 1200;
  let isoCoinFrac = 0;
  let symStats = { mutual: 0, commensal: 0, parasite: 0, amensal: 0 };

  const BIOME_PALETTES = {
    grassland: {
      id: 'grassland',
      name: '🌾 SAWAH & PADANG RUMPUT',
      shortName: 'Sawah & Rumput',
      grass1: '#7cb328',
      grass2: '#6ea320',
      grass3: '#619319',
      paddyWater1: '#56c8d8',
      paddyWater2: '#48b8c8',
      sand1: '#dec05a',
      sand2: '#cfb04a',
      water1: '#29b6f6',
      water2: '#039be5',
      treeVariants: [
        { light: '#56c75a', mid: '#389c44', dark: '#1e6b2a' },
        { light: '#76d246', mid: '#4e9e28', dark: '#2e6b14' },
        { light: '#42b868', mid: '#288a4b', dark: '#16592e' }
      ],
      prodTop: '#52ff38',
      prodLeft: '#2fd61a',
      prodRight: '#1ea30d',
      treeStyle: 'pine',
      defaultHerbivore: 'hopper'
    },
    hills: {
      id: 'hills',
      name: '⛰️ PERBUKITAN BATU',
      shortName: 'Perbukitan Batu',
      grass1: '#689f38',
      grass2: '#558b2f',
      grass3: '#78909c',
      sand1: '#90a4ae',
      sand2: '#78909c',
      water1: '#26c6da',
      water2: '#00acc1',
      treeVariants: [
        { light: '#4db6ac', mid: '#00796b', dark: '#004d40' },
        { light: '#66bb6a', mid: '#2e7d32', dark: '#1b5e20' },
        { light: '#81c784', mid: '#388e3c', dark: '#1e4620' }
      ],
      prodTop: '#69f0ae',
      prodLeft: '#00c853',
      prodRight: '#009624',
      treeStyle: 'pine',
      defaultHerbivore: 'rabbit'
    },
    tropical: {
      id: 'tropical',
      name: '🌴 HUTAN TROPIS',
      shortName: 'Hutan Tropis',
      grass1: '#2e8b3c',
      grass2: '#247a32',
      grass3: '#1b6928',
      sand1: '#d4b459',
      sand2: '#c4a248',
      water1: '#26a69a',
      water2: '#00897b',
      treeVariants: [
        { light: '#66bb6a', mid: '#2e7d32', dark: '#144d18' },
        { light: '#4caf50', mid: '#1b5e20', dark: '#0d3b10' },
        { light: '#8bc34a', mid: '#558b2f', dark: '#33691e' }
      ],
      prodTop: '#76ff03',
      prodLeft: '#54cc00',
      prodRight: '#3d9900',
      treeStyle: 'tropical',
      defaultHerbivore: 'rabbit'
    },
    swamp: {
      id: 'swamp',
      name: '🌿 RAWA BAKAU',
      shortName: 'Rawa Bakau',
      grass1: '#467d54',
      grass2: '#3b6e48',
      grass3: '#305c3b',
      sand1: '#8c7d56',
      sand2: '#786a46',
      water1: '#2e857e',
      water2: '#226e68',
      treeVariants: [
        { light: '#4db6ac', mid: '#00695c', dark: '#003d33' },
        { light: '#64c1a4', mid: '#287a62', dark: '#144d3c' },
        { light: '#55a868', mid: '#2d733e', dark: '#194725' }
      ],
      prodTop: '#18ffff',
      prodLeft: '#00bfa5',
      prodRight: '#008e76',
      treeStyle: 'mangrove',
      defaultHerbivore: 'water_bug'
    },
    desert: {
      id: 'desert',
      name: '🏜️ GURUN OASIS',
      shortName: 'Gurun Oasis',
      grass1: '#dba948',
      grass2: '#cf9c3c',
      grass3: '#c28e30',
      sand1: '#edd074',
      sand2: '#e0c163',
      water1: '#00e5ff',
      water2: '#00b8d4',
      treeVariants: [
        { light: '#66bb6a', mid: '#388e3c', dark: '#1b5e20' },
        { light: '#81c784', mid: '#43a047', dark: '#2e7d32' },
        { light: '#9ccc65', mid: '#689f38', dark: '#33691e' }
      ],
      prodTop: '#69f0ae',
      prodLeft: '#00c853',
      prodRight: '#009624',
      treeStyle: 'cactus',
      defaultHerbivore: 'sand_mouse'
    },
    peatland: {
      id: 'peatland',
      name: '🪵 GAMBUT KALIMANTAN',
      shortName: 'Gambut Kalimantan',
      grass1: '#56643a',
      grass2: '#485430',
      grass3: '#3c4527',
      sand1: '#7d6342',
      sand2: '#685134',
      water1: '#4c2f1b',
      water2: '#372112',
      treeVariants: [
        { light: '#5c9c4a', mid: '#2f6b29', dark: '#183d16' },
        { light: '#70ab52', mid: '#3a7a32', dark: '#204a1c' },
        { light: '#4e8a42', mid: '#275922', dark: '#143612' }
      ],
      prodTop: '#9ccc65',
      prodLeft: '#689f38',
      prodRight: '#33691e',
      treeStyle: 'peat',
      defaultHerbivore: 'orangutan'
    }
  };

  const BIOME_KEYS = ['grassland', 'hills', 'tropical', 'swamp', 'desert', 'peatland'];

  const SPECIES_DEFS = {
    hopper: {
      id: 'hopper',
      name: 'BELALANG',
      guild: 'herbivore',
      sprite: 'hopper',
      maxHp: 75,
      atk: 6,
      evade: 0.25,
      speed: 1.75,
      eatDuration: 2.0,
      fullDuration: 20,
      prey: ['producer'],
      colTop: '#76ff03',
      colLeft: '#55c400',
      colRight: '#3d8c00',
      colAccent: '#c6ff00'
    },
    water_bug: {
      id: 'water_bug',
      name: 'SERANGGA AIR',
      guild: 'herbivore',
      sprite: 'water_bug',
      maxHp: 75,
      atk: 6,
      evade: 0.26,
      speed: 1.75,
      eatDuration: 2.0,
      fullDuration: 20,
      prey: ['producer'],
      colTop: '#26c6da',
      colLeft: '#0097a7',
      colRight: '#006064',
      colAccent: '#84ffff'
    },
    rabbit: {
      id: 'rabbit',
      name: 'KELINCI',
      guild: 'herbivore',
      sprite: 'rabbit',
      maxHp: 95,
      atk: 10,
      evade: 0.36,
      speed: 2.05,
      eatDuration: 2.2,
      fullDuration: 22,
      prey: ['producer'],
      colTop: '#fff8e1',
      colLeft: '#e0d3b8',
      colRight: '#bfaF92',
      colAccent: '#ff80ab'
    },
    sand_mouse: {
      id: 'sand_mouse',
      name: 'TIKUS PASIR',
      guild: 'herbivore',
      sprite: 'sand_mouse',
      maxHp: 85,
      atk: 9,
      evade: 0.38,
      speed: 2.1,
      eatDuration: 2.0,
      fullDuration: 21,
      prey: ['producer'],
      colTop: '#ffcc80',
      colLeft: '#e6a145',
      colRight: '#b87720',
      colAccent: '#ffe0b2'
    },
    frog: {
      id: 'frog',
      name: 'KATAK',
      guild: 'carnivore_small',
      sprite: 'frog',
      maxHp: 100,
      atk: 18,
      evade: 0.28,
      speed: 1.85,
      eatDuration: 2.1,
      fullDuration: 24,
      prey: ['hopper', 'water_bug'],
      colTop: '#4caf50',
      colLeft: '#2e7d32',
      colRight: '#1b5e20',
      colAccent: '#ffee58'
    },
    snake: {
      id: 'snake',
      name: 'ULAR KOBRA',
      guild: 'carnivore_mid',
      sprite: 'snake',
      maxHp: 125,
      atk: 26,
      evade: 0.24,
      speed: 2.05,
      eatDuration: 2.6,
      fullDuration: 27,
      prey: ['frog', 'rabbit', 'sand_mouse'],
      colTop: '#ff9800',
      colLeft: '#e65100',
      colRight: '#b53d00',
      colAccent: '#fff176'
    },
    tropical_snake: {
      id: 'tropical_snake',
      name: 'ULAR PITON',
      guild: 'carnivore_mid',
      sprite: 'tropical_snake',
      maxHp: 145,
      atk: 31,
      evade: 0.22,
      speed: 1.95,
      eatDuration: 2.8,
      fullDuration: 28,
      prey: ['rabbit', 'frog', 'sand_mouse'],
      colTop: '#8bc34a',
      colLeft: '#558b2f',
      colRight: '#33691e',
      colAccent: '#ffd54f'
    },
    desert_snake: {
      id: 'desert_snake',
      name: 'ULAR DERIK',
      guild: 'carnivore_mid',
      sprite: 'desert_snake',
      maxHp: 130,
      atk: 29,
      evade: 0.26,
      speed: 2.15,
      eatDuration: 2.5,
      fullDuration: 27,
      prey: ['sand_mouse', 'frog', 'rabbit'],
      colTop: '#d4a359',
      colLeft: '#a67632',
      colRight: '#785018',
      colAccent: '#ffe082'
    },
    eagle: {
      id: 'eagle',
      name: 'ELANG EMAS',
      guild: 'apex',
      sprite: 'eagle',
      isFly: true,
      maxHp: 150,
      atk: 34,
      evade: 0.25,
      speed: 2.65,
      eatDuration: 2.7,
      fullDuration: 30,
      prey: ['snake', 'tropical_snake', 'desert_snake', 'rabbit', 'sand_mouse'],
      colTop: '#6d4c41',
      colLeft: '#4e342e',
      colRight: '#3e2723',
      colAccent: '#ffffff'
    },
    harpy_eagle: {
      id: 'harpy_eagle',
      name: 'ELANG HARPY',
      guild: 'apex',
      sprite: 'eagle',
      isFly: true,
      maxHp: 165,
      atk: 37,
      evade: 0.22,
      speed: 2.55,
      eatDuration: 2.8,
      fullDuration: 30,
      prey: ['tropical_snake', 'snake', 'rabbit', 'frog'],
      colTop: '#455a64',
      colLeft: '#263238',
      colRight: '#1c262b',
      colAccent: '#eceff1'
    },
    heron: {
      id: 'heron',
      name: 'BANGAU RAJA',
      guild: 'apex',
      sprite: 'heron',
      isFly: true,
      maxHp: 145,
      atk: 32,
      evade: 0.26,
      speed: 2.5,
      eatDuration: 2.5,
      fullDuration: 28,
      prey: ['snake', 'frog', 'tropical_snake'],
      colTop: '#ffffff',
      colLeft: '#cfd8dc',
      colRight: '#90a4ae',
      colAccent: '#ffb300'
    },
    desert_eagle: {
      id: 'desert_eagle',
      name: 'ELANG GURUN',
      guild: 'apex',
      sprite: 'desert_eagle',
      isFly: true,
      maxHp: 145,
      atk: 35,
      evade: 0.30,
      speed: 2.8,
      eatDuration: 2.6,
      fullDuration: 29,
      prey: ['desert_snake', 'snake', 'sand_mouse', 'rabbit'],
      colTop: '#8d6e63',
      colLeft: '#5d4037',
      colRight: '#4e342e',
      colAccent: '#ffe082'
    },
    orangutan: {
      id: 'orangutan',
      name: 'ORANGUTAN KALIMANTAN',
      guild: 'herbivore',
      sprite: 'orangutan',
      maxHp: 115,
      atk: 11,
      evade: 0.28,
      speed: 1.65,
      eatDuration: 2.3,
      fullDuration: 26,
      prey: ['producer'],
      colTop: '#c65d24',
      colLeft: '#8c3511',
      colRight: '#5e230c',
      colAccent: '#df9467'
    },
    hornbill: {
      id: 'hornbill',
      name: 'ENGGANG KALIMANTAN',
      guild: 'apex',
      sprite: 'hornbill',
      isFly: true,
      maxHp: 145,
      atk: 34,
      evade: 0.34,
      speed: 2.75,
      eatDuration: 2.5,
      fullDuration: 28,
      prey: ['frog', 'hopper', 'tropical_snake', 'snake'],
      colTop: '#262834',
      colLeft: '#16161c',
      colRight: '#0f1016',
      colAccent: '#f5b027'
    }
  };

  const HERBIVORES = ['hopper', 'water_bug', 'rabbit', 'sand_mouse', 'orangutan'];
  const CARNIVORES = ['frog', 'snake', 'tropical_snake', 'desert_snake'];
  const APEXES = ['eagle', 'harpy_eagle', 'heron', 'desert_eagle', 'hornbill'];

  // Native home biomes per species — used when habitat is erased/changed so displaced animals must Adapt (🧬) or get Outcompeted (💀)!
  const SPECIES_NATIVE_BIOMES = {
    hopper: ['grassland', 'hills'],
    water_bug: ['swamp', 'grassland'],
    rabbit: ['hills', 'tropical', 'grassland'],
    sand_mouse: ['desert'],
    orangutan: ['peatland', 'tropical'],
    frog: ['swamp', 'grassland', 'tropical', 'peatland'],
    snake: ['grassland', 'hills', 'swamp'],
    tropical_snake: ['tropical', 'swamp', 'peatland'],
    desert_snake: ['desert'],
    heron: ['swamp', 'grassland'],
    eagle: ['hills', 'grassland'],
    harpy_eagle: ['tropical', 'hills'],
    desert_eagle: ['desert', 'hills'],
    hornbill: ['peatland', 'tropical', 'hills']
  };

  const DOCK_CARDS = [
    // 🌍 TANAH & PETA (Terraforming: Perluas Daerah & Hapus Daerah!)
    { id: 'terra_grass', name: 'Tanah Rumput', group: 'TANAH', sprite: 'grass', iconKind: 'terra_grass', cost: 80, tierClass: 'tier-terra', isTerra: true, terraKind: 'grassland', cat: 'land', role: 'Perluas atau ubah area di dalam pulau menjadi Sawah & Padang Rumput subur!' },
    { id: 'terra_sand', name: 'Pasir Gurun', group: 'PASIR', sprite: 'cactus', iconKind: 'terra_sand', cost: 80, tierClass: 'tier-terra', isTerra: true, terraKind: 'desert', cat: 'land', role: 'Perluas daerah Gurun Pasir kering — tanaman basah hilang & satwa lain harus beradaptasi!' },
    { id: 'terra_rock', name: 'Bukit Batu', group: 'BATU', sprite: 'cloud', iconKind: 'terra_rock', cost: 100, tierClass: 'tier-terra', isTerra: true, terraKind: 'hills', cat: 'land', role: 'Angkat tanah menjadi Bukit Batu tinggi lengkap dengan bongkahan batu mineral!' },
    { id: 'terra_peat', name: 'Lahan Gambut', group: 'GAMBUT', sprite: 'grass', iconKind: 'terra_peat', cost: 90, tierClass: 'tier-terra', isTerra: true, terraKind: 'peatland', cat: 'land', role: 'Bentuk rawa gambut Kalimantan kaya karbon — harus tetap lembab agar tidak terbakar!' },
    { id: 'terra_water', name: 'Sungai / Air', group: 'AIR', sprite: 'water_moss', iconKind: 'terra_water', cost: 80, tierClass: 'tier-apex', isTerra: true, terraKind: 'water', cat: 'land', role: 'Gali kolam atau aliran sungai baru di daratan pulau' },
    { id: 'terra_erase', name: 'Hapus Daerah', group: 'HAPUS', sprite: 'storm', iconKind: 'terra_erase', cost: 60, tierClass: 'tier-erase', isTerra: true, terraKind: 'erase', cat: 'land', role: 'Hapus daratan menjadi perairan jernih seperti sungai tengah! Hewan setempat akan mengungsi ke bioma lain!' },

    // ☁️ AWAN & CUACA
    { id: 'cloud', name: 'Awan Hujan', group: 'AWAN', sprite: 'cloud', iconKind: 'rain', cloudKind: 'rain', cost: 140, tierClass: 'tier-apex', isCloud: true, cat: 'cloud', role: 'Menurunkan hujan segar, memadamkan api & menumbuhkan rumput' },
    { id: 'cloud_lightning', name: 'Awan Petir', group: 'AWAN', sprite: 'storm', iconKind: 'lightning', cloudKind: 'lightning', cost: 170, tierClass: 'tier-snake', isCloud: true, cat: 'cloud', role: 'Awan badai yang menyambarkan petir ke pohon & tanah di bawahnya!' },
    { id: 'grass', name: 'Awan Rumput', group: 'AWAN', sprite: 'cloud', iconKind: 'seed_grass', cloudKind: 'seed_grass', cost: 120, tierClass: 'tier-prod', isSeedCloud: true, cat: 'cloud', role: 'Awan penabur benih rumput & bunga liar dari udara' },
    { id: 'tree', name: 'Awan Pohon', group: 'AWAN', sprite: 'cloud', iconKind: 'seed_tree', cloudKind: 'seed_tree', cost: 160, tierClass: 'tier-prod', isSeedCloud: true, cat: 'cloud', role: 'Awan penabur tunas pohon hutan yang tumbuh dewasa seiring waktu' },
    { id: 'nature_rock', name: 'Awan Mineral', group: 'AWAN', sprite: 'cloud', iconKind: 'seed_nature', cloudKind: 'seed_nature', cost: 150, tierClass: 'tier-mid', isSeedCloud: true, isNatureSeed: true, cat: 'cloud', role: 'Awan mineral alam: menjatuhkan batu berlumut, jamur akar & biji liar' },
    { id: 'cloud_harmony', name: 'Awan Damai', group: 'AWAN', sprite: 'cloud', iconKind: 'emotion_harmony', cloudKind: 'emotion_harmony', cost: 170, tierClass: 'tier-apex', isEmotionCloud: true, cat: 'cloud', role: 'Menyadarkan manusia perusak kembali menjaga alam & menenangkan satwa' },
    { id: 'cloud_anger', name: 'Awan Amarah', group: 'AWAN', sprite: 'cloud', iconKind: 'emotion_anger', cloudKind: 'emotion_anger', cost: 170, tierClass: 'tier-snake', isEmotionCloud: true, cat: 'cloud', role: 'Memicu manusia menjadi serakah merusak hutan & membuat satwa gelisah' },

    // 🌱 PRODUSEN & TUMBUHAN
    { id: 'plant_grass', name: 'Rumpun Rumput', group: 'PRODUSEN', sprite: 'grass', cost: 60, tierClass: 'tier-prod', isDirectGrass: true, isProducer: true, cat: 'prod', role: 'Tanam langsung rumpun rumput segar pakan serangga & kelinci' },
    { id: 'plant_tree', name: 'Pohon Alami', group: 'PRODUSEN', sprite: 'sprout', iconKind: 'direct_tree', cost: 110, tierClass: 'tier-prod', isDirectTree: true, isTree: true, cat: 'prod', role: 'Tanam langsung pohon dewasa peneduh satwa & penahan banjir' },
    { id: 'mushroom', name: 'Jamur Mikoriza', group: 'PRODUSEN', sprite: 'mushroom', cost: 160, tierClass: 'tier-prod', isMutualFungi: true, cat: 'prod', role: 'Jamur akar penyubur tanah (+/+), mempercepat tunas & menyembuhkan hama' },
    { id: 'sekat_kanal', name: 'Sekat Kanal', group: 'KONSERVASI', sprite: 'cloud', iconKind: 'sekat_kanal', cost: 120, tierClass: 'tier-apex', isSekatKanal: true, cat: 'prod', role: 'Inovasi Kalimantan: menahan air di kanal agar gambut tetap basah & bebas kabut asap!' },
    { id: 'bibit_gambut', name: 'Purun & Jelutung', group: 'PALUDIKULTUR', sprite: 'sprout', iconKind: 'bibit_gambut', cost: 110, tierClass: 'tier-prod', isPeatFlora: true, isProducer: true, cat: 'prod', role: 'Tanaman asli gambut Kalimantan: memulihkan gambut lembab tanpa mengeringkan air!' },
    { id: 'sawit', name: 'Pohon Sawit', group: 'KEBUN', sprite: 'cactus', iconKind: 'sawit', cost: 140, tierClass: 'tier-snake', isSawit: true, cat: 'prod', role: 'Kebun Sawit: koin cepat, tapi menggusur hutan, mengeringkan gambut & memicu BANJIR!' },
    { id: 'parasite', name: 'Benalu / Hama', group: 'PARASIT', sprite: 'spore', cost: 140, tierClass: 'tier-snake', isParasite: true, cat: 'prod', role: 'Parasitisme (+/-): Menyerap sari makanan pohon & melemahkan hewan' },

    // 🐾 SATWA (Herbivora, Karnivora & Predator Puncak)
    { id: 'hopper', name: 'Belalang', group: 'HERBIVORA', sprite: 'hopper', cost: 220, tierClass: 'tier-herb', cat: 'fauna', role: 'Pemakan rumput di Sawah & Padang Rumput' },
    { id: 'water_bug', name: 'Serangga Air', group: 'HERBIVORA', sprite: 'water_bug', cost: 220, tierClass: 'tier-herb', cat: 'fauna', role: 'Pemakan lumut & tanaman tepi Rawa/Sungai' },
    { id: 'rabbit', name: 'Kelinci', group: 'HERBIVORA', sprite: 'rabbit', cost: 280, tierClass: 'tier-mid', cat: 'fauna', role: 'Pemakan rumput di Bukit & Hutan' },
    { id: 'sand_mouse', name: 'Tikus Pasir', group: 'HERBIVORA', sprite: 'sand_mouse', cost: 280, tierClass: 'tier-mid', cat: 'fauna', role: 'Satwa asli Gurun Pasir — sensitif bila dipindah ke bioma basah!' },
    { id: 'frog', name: 'Katak', group: 'KARNIVORA', sprite: 'frog', cost: 360, tierClass: 'tier-herb', cat: 'fauna', role: 'Pemangsa Belalang & Serangga Air' },
    { id: 'snake', name: 'Ular Kobra', group: 'KARNIVORA', sprite: 'snake', cost: 460, tierClass: 'tier-snake', cat: 'fauna', role: 'Memangsa Katak, Kelinci & Tikus' },
    { id: 'tropical_snake', name: 'Ular Piton', group: 'KARNIVORA', sprite: 'tropical_snake', cost: 500, tierClass: 'tier-snake', cat: 'fauna', role: 'Ular besar penghuni Hutan Tropis' },
    { id: 'heron', name: 'Burung Bangau', group: 'PUNCAK', sprite: 'heron', cost: 560, tierClass: 'tier-apex', cat: 'fauna', role: 'Pemangsa Rawa & pembersih kutu/parasit satwa' },
    { id: 'eagle', name: 'Elang Emas', group: 'PUNCAK', sprite: 'eagle', cost: 600, tierClass: 'tier-apex', cat: 'fauna', role: 'Raja langit Bukit & Padang Rumput' },
    { id: 'harpy_eagle', name: 'Elang Hutan', group: 'PUNCAK', sprite: 'eagle', cost: 630, tierClass: 'tier-apex', cat: 'fauna', role: 'Predator puncak kanopi Hutan Tropis' },
    { id: 'desert_eagle', name: 'Elang Gurun', group: 'PUNCAK', sprite: 'desert_eagle', cost: 620, tierClass: 'tier-apex', cat: 'fauna', role: 'Predator puncak asli langit Gurun Pasir' },
    { id: 'orangutan', name: 'Orangutan', group: 'HERBIVORA', sprite: 'orangutan', cost: 320, tierClass: 'tier-mid', cat: 'fauna', role: 'Satwa khas hutan rawa gambut Kalimantan — pemakan buah & penyebar biji Jelutung!' },
    { id: 'hornbill', name: 'Enggang', group: 'PUNCAK', sprite: 'hornbill', cost: 610, tierClass: 'tier-apex', cat: 'fauna', role: 'Burung Enggang Rangkong penjaga tajuk hutan gambut Kalimantan' },

    // 🏡 MANUSIA
    { id: 'human', name: 'Laki-laki', group: 'MANUSIA', sprite: 'human', iconKind: 'human_male', cost: 200, tierClass: 'tier-mid', isHuman: true, gender: 'male', cat: 'human', role: 'Penduduk Laki-laki: mencari kayu/batu, membangun Rumah & menjaga hutan!' },
    { id: 'human_female', name: 'Perempuan', group: 'MANUSIA', sprite: 'human', iconKind: 'human_female', cost: 200, tierClass: 'tier-mid', isHuman: true, gender: 'female', cat: 'human', role: 'Penduduk Perempuan: merawat kebun, ikut membangun Rumah & melahirkan anak bersama Laki-laki!' }
  ];

  // Native animals & cards allowed per 3D Mode
  const MODE_ALLOWED_SPECIES = {
    multi: ['hopper', 'water_bug', 'rabbit', 'sand_mouse', 'orangutan', 'frog', 'snake', 'tropical_snake', 'desert_snake', 'heron', 'eagle', 'harpy_eagle', 'desert_eagle', 'hornbill'],
    grassland: ['hopper', 'frog', 'snake', 'eagle'],
    hills: ['rabbit', 'hopper', 'snake', 'eagle'],
    tropical: ['rabbit', 'frog', 'tropical_snake', 'harpy_eagle'],
    swamp: ['water_bug', 'frog', 'snake', 'heron'],
    desert: ['sand_mouse', 'desert_snake', 'desert_eagle'],
    peatland: ['orangutan', 'water_bug', 'frog', 'tropical_snake', 'hornbill']
  };

  function getTileBiomeKey(gx, gz) {
    if (mapMode !== 'multi') return mapMode;
    const mid = MAP_SIZE / 2;
    const dx = gx - mid;
    if (gz < mid + 1 && Math.abs(dx) < 5.5 + Math.sin(gz * 0.45) * 1.3) {
      return 'hills';
    }
    const waveX = Math.sin(gz * 0.3) * 1.2;
    const waveZ = Math.cos(gx * 0.3) * 1.2;
    const isEast = gx + waveX >= mid;
    const isSouth = gz + waveZ >= mid;
    if (!isEast && !isSouth) return 'grassland';
    if (isEast && !isSouth) return 'tropical';
    if (!isEast && isSouth) return 'swamp';
    return 'desert';
  }

  // ===========================================================================
  // ORGANIZED WORLD BLUEPRINT — seluruh tata letak deterministik (TANPA sebaran acak)
  //   Utara       : Perbukitan Batu bertingkat (cincin batu makin tinggi ke puncak)
  //   Barat Laut  : Padang Rumput + Jalan Setapak lurus + Sawah berpetak (baris bajak/baris lumpur) + kebun pohon
  //   Timur Laut  : Hutan Tropis (pohon berbaris rapat, lantai semanggi) + kolam
  //   Barat Daya  : Rawa Bakau (laguna, cincin lumpur, bakau melingkar)
  //   Tenggara    : Gurun (bukit pasir berpita) + Oasis + kaktus berpola kisi
  //   Tengah      : Danau + sungai utara/selatan (ada penyeberangan pasir)
  // ===========================================================================
  const SAWAH = { gx0: 4, gx1: 15, gz0: 16, gz1: 21 };
  const PATH_GX = 9;
  const PATH_GZ0 = 5;
  const CENTER_LAKE = { cx: 23, cz: 23, rx: 5.2, rz: 4.4 };
  const LAGOON = { cx: 11.5, cz: 34.5, rx: 5.0, rz: 4.0 };
  const OASIS = { cx: 34.5, cz: 34.5, rx: 3.6, rz: 3.0 };
  const POND = { cx: 37.0, cz: 10.0, rx: 3.8, rz: 3.0 };
  const HILL_PEAK = { x: 23, z: 8.5 };
  const GROVES = [
    { x: 7.0, z: 7.0, r: 3.0 },
    { x: 13.0, z: 11.5, r: 2.4 }
  ];
  const FLOWER_PATCHES = {
    grassland: [{ x: 5.5, z: 13.0 }, { x: 13.0, z: 7.0 }, { x: 7.0, z: 10.0 }],
    tropical: [{ x: 28.5, z: 19.0 }, { x: 38.5, z: 19.0 }]
  };
  const WATER_ANIM = [[0, 1], [0, 2], [0, 3], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]];

  function ellipseNorm(gx, gz, e) {
    const dx = (gx + 0.5 - e.cx) / e.rx;
    const dz = (gz + 0.5 - e.cz) / e.rz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function smoothstep01(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function hash2(x, z) {
    let h = (Math.imul((x * 1024) | 0, 374761393) + Math.imul((z * 1024) | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) * 2.3283064365386963e-10;
  }

  function vnoise(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz);
    const b = hash2(ix + 1, iz);
    const c = hash2(ix, iz + 1);
    const d = hash2(ix + 1, iz + 1);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  }

  function fbm2(x, z) {
    return vnoise(x, z) * 0.65 + vnoise(x * 2.1, z * 2.1) * 0.35;
  }

  // Organic domain-warped coordinates so NO biome boundary ever looks like a straight line!
  function warpedBiomeCoords(gx, gz) {
    const warpX = (fbm2(gx * 0.13 + 1.7, gz * 0.13 + 6.3) - 0.5) * 8.6 + Math.sin(gz * 0.24) * 2.3;
    const warpZ = (fbm2(gx * 0.13 + 8.9, gz * 0.13 + 2.4) - 0.5) * 8.6 + Math.cos(gx * 0.21) * 2.3;
    return { wx: gx + warpX, wz: gz + warpZ };
  }

  function getTileBiomeKey(gx, gz) {
    if (mapMode !== 'multi') return mapMode;
    const mid = MAP_SIZE * 0.5;
    const hillDist = Math.hypot((gx - HILL_PEAK.x) * 0.85, (gz - HILL_PEAK.z) * 1.05) + (fbm2(gx * 0.22, gz * 0.22) - 0.5) * 3.8;
    if (hillDist <= 8.2) return 'hills';
    const { wx, wz } = warpedBiomeCoords(gx, gz);
    // Kalimantan Peatland Dome nestled along the humid western mid-basin
    const peatDist = Math.hypot((wx - MAP_SIZE * 0.24) * 1.1, (wz - MAP_SIZE * 0.56) * 1.25);
    if (peatDist <= 7.2) return 'peatland';
    const isEast = wx >= mid;
    const isSouth = wz >= mid;
    if (!isEast && !isSouth) return 'grassland';
    if (isEast && !isSouth) return 'tropical';
    if (!isEast && isSouth) return 'swamp';
    return 'desert';
  }

  // Continuous organic biome weights (with fine dither noise) for seamless pixel-blended transitions!
  function getOrganicBiomeWeights(gx, gz) {
    if (mapMode !== 'multi') {
      return {
        grassland: mapMode === 'grassland' || mapMode === 'hills' ? 1 : 0,
        tropical: mapMode === 'tropical' ? 1 : 0,
        swamp: mapMode === 'swamp' ? 1 : 0,
        desert: mapMode === 'desert' ? 1 : 0,
        peatland: mapMode === 'peatland' ? 1 : 0,
        desertEdge: 0
      };
    }
    const mid = MAP_SIZE * 0.5;
    const { wx, wz } = warpedBiomeCoords(gx, gz);
    const micro = (fbm2(gx * 0.85 + 3.4, gz * 0.85 + 7.1) - 0.5) * 2.4;
    const peatDist = Math.hypot((wx - MAP_SIZE * 0.24) * 1.1, (wz - MAP_SIZE * 0.56) * 1.25) + micro * 0.55;
    const wPeat = 1 - smoothstep01(5.4, 8.6, peatDist);
    const eastT = smoothstep01(mid - 3.6, mid + 3.6, wx + micro);
    const southT = smoothstep01(mid - 3.6, mid + 3.6, wz + micro);
    const rem = 1 - wPeat;
    const wGrass = (1 - eastT) * (1 - southT) * rem;
    const wTrop = eastT * (1 - southT) * rem;
    const wSwamp = (1 - eastT) * southT * rem;
    const wDesert = eastT * southT * rem;
    // Transition belt intensity (peaks right where desert meets green biomes)
    const desertEdge = wDesert * (1 - wDesert) * 4;
    return { grassland: wGrass, tropical: wTrop, swamp: wSwamp, desert: wDesert, peatland: wPeat, desertEdge };
  }

  function islandCoastScore(gx, gz) {
    const nx = (gx / (MAP_SIZE - 1)) * 2 - 1;
    const nz = (gz / (MAP_SIZE - 1)) * 2 - 1;
    const d = Math.pow(Math.abs(nx), 3.0) + Math.pow(Math.abs(nz), 3.0);
    const cove = (vnoise(gx * 0.18 + 3.1, gz * 0.18 + 1.7) - 0.5) * 0.26 + (vnoise(gx * 0.42, gz * 0.42) - 0.5) * 0.08;
    return d + cove;
  }

  // Smooth winding S-curve river helpers (shared by terrain, reeds/lotus/rocks, and swimming fish!)
  function riverCenterZ(gx) {
    const t = (gx - 2) / (MAP_SIZE - 4);
    return MAP_SIZE * 0.34 + t * (MAP_SIZE * 0.38) + Math.sin(t * Math.PI * 2.2) * (MAP_SIZE * 0.08) + Math.cos(t * Math.PI * 1.1) * 1.6;
  }

  function riverHalfWidth(gx) {
    const t = Math.max(0, Math.min(1, (gx - 2) / (MAP_SIZE - 4)));
    return 1.48 + Math.sin(t * Math.PI) * 0.68;
  }

  function riverDistance(gx, gz) {
    return Math.abs(gz - riverCenterZ(gx)) - riverHalfWidth(gx);
  }

  function isOutsideIslandCoast(gx, gz) {
    return islandCoastScore(gx, gz) > 1.04;
  }

  // Maximum allowed island area = exact natural island coastline from screenshot (prevents protruding blocks in the sea!)
  function isInsideMaxIslandBounds(ix, iz) {
    if (ix < 1 || iz < 1 || ix >= MAP_SIZE - 1 || iz >= MAP_SIZE - 1) return false;
    return islandCoastScore(ix + 0.5, iz + 0.5) <= 1.04;
  }

  // Smoothly sample effective distance to inland water (combines natural river + erased/dug turquoise water + filled land!)
  function effectiveRiverDistance(gx, gz) {
    const baseDist = riverDistance(gx, gz);
    const x0 = Math.floor(gx - 0.5);
    const z0 = Math.floor(gz - 0.5);
    const fx = (gx - 0.5) - x0;
    const fz = (gz - 0.5) - z0;
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);

    if (!hasAnyTerraEdits) return baseDist;
    let anyEdited = false;
    const sampleTileWater = (ix, iz) => {
      if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE || !grid[iz]) return 0;
      const t = grid[iz][ix];
      if (!t || !t.terraEdited) return 0;
      anyEdited = true;
      return (!t.isOceanMargin && t.type === 'water') ? 1 : -1;
    };
    const v00 = sampleTileWater(x0, z0);
    const v10 = sampleTileWater(x0 + 1, z0);
    const v01 = sampleTileWater(x0, z0 + 1);
    const v11 = sampleTileWater(x0 + 1, z0 + 1);
    if (!anyEdited) return baseDist;

    const blend = (v00 * (1 - ux) + v10 * ux) * (1 - uz) + (v01 * (1 - ux) + v11 * ux) * uz;
    const edgeRipple = (vnoise(gx * 1.85 + 4.1, gz * 1.85 + 2.7) - 0.5) * 0.22;
    if (blend > 0.02) {
      // Smoothly carve bright turquoise central-river style water channel/lake!
      const customDist = 0.48 - blend * 1.55 + edgeRipple;
      return Math.min(baseDist, customDist);
    }
    if (blend < -0.15) {
      // Player filled water back in with land!
      return Math.max(baseDist, (-blend) * 1.65);
    }
    return baseDist;
  }

  // Smoothly blend custom terraformed biome colors with neighboring biomes (eliminates jagged tile diamonds!)
  function getEffectiveBiomeWeights(gx, gz) {
    const base = getOrganicBiomeWeights(gx, gz);
    const x0 = Math.floor(gx - 0.5);
    const z0 = Math.floor(gz - 0.5);
    const fx = (gx - 0.5) - x0;
    const fz = (gz - 0.5) - z0;
    const jitter = (vnoise(gx * 2.2 + 5.3, gz * 2.2 + 1.9) - 0.5) * 0.28;
    const ux = Math.max(0, Math.min(1, fx * fx * (3 - 2 * fx) + jitter));
    const uz = Math.max(0, Math.min(1, fz * fz * (3 - 2 * fz) - jitter));

    if (!hasAnyTerraEdits) return base;
    let anyLandEdit = false;
    const getB = (ix, iz) => {
      if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE || !grid[iz]) return null;
      const t = grid[iz][ix];
      if (!t || !t.terraEdited || t.isOceanMargin || t.type === 'water') return null;
      anyLandEdit = true;
      return t.biome;
    };
    const b00 = getB(x0, z0);
    const b10 = getB(x0 + 1, z0);
    const b01 = getB(x0, z0 + 1);
    const b11 = getB(x0 + 1, z0 + 1);
    if (!anyLandEdit) return base;

    const corners = [
      { b: b00, w: (1 - ux) * (1 - uz) },
      { b: b10, w: ux * (1 - uz) },
      { b: b01, w: (1 - ux) * uz },
      { b: b11, w: ux * uz }
    ];
    let gr = 0, tr = 0, sw = 0, de = 0, pe = 0;
    for (let i = 0; i < 4; i++) {
      const c = corners[i];
      if (!c.b) {
        gr += base.grassland * c.w;
        tr += base.tropical * c.w;
        sw += base.swamp * c.w;
        de += base.desert * c.w;
        pe += (base.peatland || 0) * c.w;
      } else if (c.b === 'desert') de += c.w;
      else if (c.b === 'tropical') tr += c.w;
      else if (c.b === 'swamp') sw += c.w;
      else if (c.b === 'peatland') pe += c.w;
      else gr += c.w;
    }
    return { grassland: gr, tropical: tr, swamp: sw, desert: de, peatland: pe, desertEdge: de * (1 - de) * 3.5 };
  }

  function isWaterBlueprint(gx, gz) {
    if (riverDistance(gx + 0.5, gz + 0.5) <= 0) return true;
    if (mapMode === 'swamp' || mapMode === 'multi') {
      const dx = (gx + 0.5 - LAGOON.cx) / LAGOON.rx;
      const dz = (gz + 0.5 - LAGOON.cz) / LAGOON.rz;
      if (dx * dx + dz * dz <= 1) return true;
    }
    if (mapMode === 'desert' || mapMode === 'multi') {
      const dx = (gx + 0.5 - OASIS.cx) / OASIS.rx;
      const dz = (gz + 0.5 - OASIS.cz) / OASIS.rz;
      if (dx * dx + dz * dz <= 1) return true;
    }
    return false;
  }

  function continuousElev(gx, gz) {
    const coast = islandCoastScore(gx, gz);
    if (coast > 1.04) return 0;
    const rDist = riverDistance(gx, gz);
    if (rDist <= 0) return 1.5;
    const bankFade = Math.min(1, rDist / 2.6);
    const S = MAP_SIZE / 30;
    const hill1 = Math.max(0, 1 - Math.hypot(gx - 15.0 * S, gz - 5.8 * S) / (6.2 * S));
    const hill2 = Math.max(0, 1 - Math.hypot(gx - 6.0 * S, gz - 21.0 * S) / (4.4 * S));
    const hill3 = Math.max(0, 1 - Math.hypot(gx - 24.0 * S, gz - 11.5 * S) / (4.8 * S));
    const mound = (hill1 * hill1 * 24 + hill2 * hill2 * 11 + hill3 * hill3 * 13) * bankFade;
    const roll = (fbm2(gx * 0.13, gz * 0.13) - 0.4) * 8 * bankFade;
    const shoreFade = Math.min(1, (1.04 - coast) * 5.0);
    return Math.max(2, (6 + mound + roll) * shoreFade);
  }

  function computeBiomeElevation(gx, gz, bKey, isWater) {
    if (isWater) return 2;
    if (bKey === 'hills') {
      const d = Math.hypot(gx + 0.5 - HILL_PEAK.x, gz + 0.5 - HILL_PEAK.z);
      if (d < 4.0) return 30;
      if (d < 7.0) return 25;
      return 19;
    }
    if (bKey === 'grassland') return gz <= 8 ? 17 : gz <= 15 ? 13.5 : 10;
    if (bKey === 'tropical') return gz <= 9 ? 14 : 12;
    if (bKey === 'swamp') return 6;
    if (bKey === 'peatland') return 7.5;
    const band = [0, 1, 2, 3, 2, 1][Math.floor((gx + gz) / 2) % 6];
    return 9 + band * 1.5;
  }

  function rotateCoordsForRot(gx, gz, rotIdx) {
    const c = MAP_SIZE / 2;
    const dx = gx - c;
    const dz = gz - c;
    if (rotIdx === 0) return { rx: dx + c, rz: dz + c };
    if (rotIdx === 1) return { rx: -dz + c, rz: dx + c };
    if (rotIdx === 2) return { rx: -dx + c, rz: -dz + c };
    return { rx: dz + c, rz: -dx + c };
  }

  function unrotateCoordsForRot(rx, rz, rotIdx) {
    const c = MAP_SIZE / 2;
    const dx = rx - c;
    const dz = rz - c;
    if (rotIdx === 0) return { gx: dx + c, gz: dz + c };
    if (rotIdx === 1) return { gx: dz + c, gz: -dx + c };
    if (rotIdx === 2) return { gx: -dx + c, gz: -dz + c };
    return { gx: -dz + c, gz: dx + c };
  }

  function rotateCoords(gx, gz) {
    return rotateCoordsForRot(gx, gz, cam.rot);
  }

  function unrotateCoords(rx, rz) {
    return unrotateCoordsForRot(rx, rz, cam.rot);
  }

  // Tetangga di sumbu LAYAR (UL=kiri-atas, UR=kanan-atas, LR=kanan-bawah, LL=kiri-bawah) untuk rotasi tertentu
  function neighborAtScreen(t, rot, dRx, dRz) {
    const c = rotateCoordsForRot(t.gx + 0.5, t.gz + 0.5, rot);
    const g = unrotateCoordsForRot(c.rx + dRx, c.rz + dRz, rot);
    const ix = Math.floor(g.gx);
    const iz = Math.floor(g.gz);
    if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return null;
    return grid[iz][ix];
  }

  function isWaterLike(n) {
    return !n || n.type === 'water';
  }

  function isGreenLand(n) {
    return !!n && n.type === 'grass' && n.biome !== 'desert' && n.biome !== 'hills' && !n.isRicePaddy && !n.isPath;
  }

  // Memilih tile (sheet,row,col) secara TERATUR berdasarkan blueprint & tetangga (auto-tiling), per rotasi kamera
  function pickTerrain(t, rot) {
    const ul = neighborAtScreen(t, rot, -1, 0);
    const ur = neighborAtScreen(t, rot, 0, -1);
    const lr = neighborAtScreen(t, rot, 1, 0);
    const ll = neighborAtScreen(t, rot, 0, 1);
    const par = (t.gx + t.gz) % 2;

    if (t.type === 'water') {
      const ulL = !isWaterLike(ul);
      const urL = !isWaterLike(ur);
      const frontL = !isWaterLike(lr) || !isWaterLike(ll);
      if (ulL && urL) return { sheet: 'water', row: 1, col: 3, anim: false }; // kolam diapit tepian
      if (ulL) return { sheet: 'water', row: 1, col: par ? 2 : 0, anim: false }; // daratan di kiri-atas
      if (urL) return { sheet: 'water', row: 1, col: par ? 6 : 5, anim: false }; // daratan di kanan-atas
      if (frontL) return { sheet: 'water', row: 0, col: 4 + ((t.gx + t.gz) % 3), anim: false }; // perairan dangkal
      return { sheet: 'water', row: 0, col: 1, anim: true }; // tengah danau/sungai: animasi riak
    }

    const b = t.biome;
    if (t.isRicePaddy) {
      // Sawah: baris genap = tanah bajakan, baris ganjil = lumpur basah (ditanami padi)
      return t.sawahRow % 2 === 0
        ? { sheet: 'ground', row: 1, col: 2 + (t.gx % 2) }
        : { sheet: 'ground', row: 1, col: 4 + (t.gx % 3) };
    }
    if (t.isPath) return { sheet: 'ground', row: 1, col: t.gz % 2 }; // jalan setapak tanah padat

    if (b === 'hills') {
      const d = Math.hypot(t.gx + 0.5 - HILL_PEAK.x, t.gz + 0.5 - HILL_PEAK.z);
      return { sheet: 'ground', row: 3, col: d < 2.6 ? 3 : d < 4.6 ? 2 : par };
    }

    if (t.type === 'sand' || b === 'desert') {
      const greenUR = isGreenLand(ur);
      const greenUL = isGreenLand(ul);
      if (greenUR && greenUL) return { sheet: 'ground', row: 2, col: 6 };
      if (greenUR) return { sheet: 'ground', row: 2, col: par ? 5 : 6 };
      const band = b === 'desert' ? Math.floor((t.gx + t.gz) / 2) % 4 : (t.gx + t.gz) % 4;
      return { sheet: 'ground', row: 2, col: band };
    }

    if (b === 'swamp') {
      const n = ellipseNorm(t.gx, t.gz, LAGOON);
      if (n < 1.62) return { sheet: 'ground', row: 1, col: 6 };
      if (n < 1.82) return { sheet: 'ground', row: 1, col: 5 };
      if (n < 2.02) return { sheet: 'ground', row: 1, col: 4 };
    }

    const patches = FLOWER_PATCHES[b];
    if (patches) {
      for (let i = 0; i < patches.length; i++) {
        const d = Math.hypot(t.gx + 0.5 - patches[i].x, t.gz + 0.5 - patches[i].z);
        if (d <= 0.9) return { sheet: 'ground', row: 0, col: 2 };
        if (d <= 1.7) return { sheet: 'ground', row: 0, col: par ? 1 : 0 };
      }
    }
    if (t.nearTree) {
      const k = ((t.gx >> 1) + t.gz) % 3;
      if (k === 0) return { sheet: 'ground', row: 0, col: 3 };
      if (k === 1) return { sheet: 'ground', row: 0, col: 6 };
    }
    return { sheet: 'ground', row: 0, col: 4 + par };
  }

  function generateMap() {
    mapGeneration++;
    terrainCache = null;
    grid = [];
    animals = [];
    humans = [];
    hoveredHuman = null;
    selectedHuman = null;
    saplingTiles = [];
    sawitTiles = [];
    sekatKanalTiles = [];
    peatMoisture = 86;
    peatSmogAlpha = 0;
    buildingTiles = [];
    farmTiles = [];
    floodTiles = [];
    fireTiles = [];
    pollutedTiles = [];
    lightningBolts = [];
    lightningQueue = [];
    skyFlashAlpha = 0;
    terrainRebakeTimer = 0;
    hasAnyTerraEdits = false;
    displacedCounter = 0;
    displacedAnimalEvacCount = 0;
    displacedCooldown = 0;
    lastDisplacedReason = 'terra_erase';
    pendingConsequence = null;
    consequenceTimer = 0;
    pendingAlertEvent = null;
    autoAlertTimer = 2.2;
    naturalSeedTimer = 0;
    worldYear = 1;
    yearTimer = 0;
    civ = { wood: 8, stone: 4, food: 18, sawitYears: 0 };
    missionRewarded = [false, false, false, false, false, false];
    clouds3d = [];
    fxParticles = [];
    spawnRings = [];
    activeSymbioses = [];
    eventFocus = null;
    ecoCheckTimer = 0;
    isoCoins = 1200;
    isoCoinFrac = 0;
    treeTiles = [];

    // 1) Blueprint medan
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      const row = [];
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        const bKey = getTileBiomeKey(gx, gz);
        const outsideCoast = isOutsideIslandCoast(gx, gz);
        const isWater = outsideCoast || isWaterBlueprint(gx, gz);
        const elev = computeBiomeElevation(gx, gz, bKey, isWater);
        const inSawah =
          !isWater && bKey === 'grassland' && gx >= SAWAH.gx0 && gx <= SAWAH.gx1 && gz >= SAWAH.gz0 && gz <= SAWAH.gz1;
        const isPath = !isWater && bKey === 'grassland' && gx === PATH_GX && gz >= PATH_GZ0 && gz < SAWAH.gz0;
        const sawahRow = inSawah ? gz - SAWAH.gz0 : -1;

        row.push({
          gx,
          gz,
          biome: bKey,
          isOceanMargin: outsideCoast,
          isRicePaddy: inSawah,
          sawahRow,
          isPath,
          noGrow: isPath || (inSawah && sawahRow % 2 === 0),
          type: isWater ? 'water' : 'grass',
          elev,
          hasTree: false,
          nearTree: false,
          treeScale: 0.9 + ((gx * 17 + gz * 31) % 5) * 0.05,
          treeLean: 0,
          treeTiers: 3,
          colorVar: (gx * 3 + gz * 7) % 3,
          producerStage: 0,
          propType: 'none',
          hasMycorrhiza: false,
          hasParasiteVine: false,
          saplingStage: 0,
          saplingTimer: 0,
          hasStump: false,
          hasSawit: false,
          hasSekatKanal: false,
          building: null,
          isFarm: false,
          floodTimer: 0,
          fireTimer: 0,
          pollutedTimer: 0,
          terraEdited: false,
          microDecor: null,
          riverProp: null,
          isPine: false,
          tr: [null, null, null, null]
        });
      }
      grid.push(row);
    }

    // 2) Pantai pasir: semua daratan yang menyentuh air (termasuk laut) menjadi pasir, kecuali perbukitan
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        const t = grid[gz][gx];
        if (t.type === 'water' || t.biome === 'hills') continue;
        let nearWater = false;
        for (let dz = -1; dz <= 1 && !nearWater; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nz = gz + dz;
            const nx = gx + dx;
            if (nz >= 0 && nz < MAP_SIZE && nx >= 0 && nx < MAP_SIZE && grid[nz][nx].type === 'water') {
              nearWater = true;
              break;
            }
          }
        }
        if (nearWater) {
          t.type = 'sand';
          t.isRicePaddy = false;
          t.isPath = false;
          t.noGrow = false;
          t.elev = Math.min(t.elev, 6);
        }
      }
    }

    // 3) Flora, Pohon Pinus Bukit, Semak Transisi Gurun, Dekorasi Mikro & Ekosistem Sungai
    const S = MAP_SIZE / 30;
    const clusterCenters = [
      { x: 5.5 * S, z: 5.5 * S, r: 3.6 * S },
      { x: 11.5 * S, z: 7.5 * S, r: 2.9 * S },
      { x: 21.5 * S, z: 6.5 * S, r: 4.2 * S },
      { x: 25.0 * S, z: 12.5 * S, r: 3.7 * S },
      { x: 19.5 * S, z: 14.5 * S, r: 3.0 * S },
      { x: 8.5 * S, z: 18.5 * S, r: 3.4 * S },
      { x: 14.0 * S, z: 24.0 * S, r: 3.2 * S },
      { x: 22.5 * S, z: 21.5 * S, r: 3.3 * S }
    ];
    for (let gz = 1; gz < MAP_SIZE - 1; gz++) {
      for (let gx = 1; gx < MAP_SIZE - 1; gx++) {
        const t = grid[gz][gx];
        const h = hash2(gx, gz);
        const h2 = hash2(gx * 5.7 + 3.1, gz * 4.3 + 8.2);
        const rDist = riverDistance(gx + 0.5, gz + 0.5);

        // River & Lagoon aquatic props (river rocks, lotus clusters, shoreline reeds)
        if (t.type === 'water' && !t.isOceanMargin) {
          if (rDist <= 0 && rDist > -0.58) {
            if (h > 0.78) t.riverProp = 'river_reeds';
            else if (h > 0.67) t.riverProp = 'river_rock';
          } else if (h > 0.84) {
            t.riverProp = 'lotus_cluster';
          } else if (rDist <= -0.58 && h > 0.91) {
            t.riverProp = 'river_rock';
          }
          continue;
        }
        if (t.type === 'water') continue;

        t.elev = continuousElev(gx + 0.5, gz + 0.5);
        t.treeOffX = (hash2(gx * 1.3, gz * 2.1) - 0.5) * 0.65;
        t.treeOffZ = (hash2(gx * 2.7, gz * 1.7) - 0.5) * 0.65;
        t.treeScale = 0.74 + hash2(gx * 3.1, gz * 4.3) * 0.56;

        // Riverbank cattails / reeds right on wet sandy banks
        if (rDist > 0 && rDist < 0.95 && h2 > 0.66 && !t.isRicePaddy && !t.isPath) {
          t.microDecor = h2 > 0.88 ? 'pebbles' : 'river_reeds';
        }

        if (t.isRicePaddy) {
          if (t.sawahRow % 2 === 1) t.producerStage = 2;
          continue;
        }

        const lift = getTileLift(t);
        const bw = getOrganicBiomeWeights(gx + 0.5, gz + 0.5);

        // A) Beautify Rocky Hills & Mountain Terraces: Pine trees + green mountain shrubs + boulders!
        if (lift > 0 || t.biome === 'hills') {
          if (lift >= 18 && h > 0.44 && h <= 0.74) {
            t.hasTree = true;
            t.isPine = true;
            t.treeScale = lift >= 50 ? 0.88 + h2 * 0.25 : 0.92 + h2 * 0.32;
            treeTiles.push(t);
          } else if (lift === 0 && t.biome === 'hills' && h > 0.52 && h <= 0.76) {
            t.hasTree = true;
            t.isPine = true;
            treeTiles.push(t);
          } else if (h > 0.76 && h <= 0.90) {
            t.microDecor = 'hill_shrub';
          } else if (h > 0.90) {
            t.propType = 'mossy_rock';
          } else if (h2 > 0.62) {
            t.microDecor = h2 > 0.82 ? 'pebbles' : 'flower_white';
          }
          continue;
        }

        // B) Organic Desert Transition Zone: scatter dry scrub bushes & weathered desert stones!
        if (bw.desertEdge > 0.32 && t.type !== 'sand') {
          if (h > 0.74) {
            t.microDecor = h > 0.88 ? 'desert_rock' : 'dry_shrub';
          } else if (h > 0.56) {
            t.producerStage = 1;
          }
        }

        if (t.type !== 'grass') {
          if (t.type === 'sand' && h2 > 0.83 && !t.microDecor) {
            t.microDecor = h2 > 0.92 ? 'pebbles' : 'dry_shrub';
          }
          continue;
        }

        let inCluster = false;
        for (let c = 0; c < clusterCenters.length; c++) {
          const cc = clusterCenters[c];
          if (Math.hypot(gx + 0.5 - cc.x, gz + 0.5 - cc.z) <= cc.r) {
            inCluster = true;
            break;
          }
        }
        const nVal = fbm2(gx * 0.35 + 4.2, gz * 0.35 + 1.9);
        if (!inCluster && h > 0.94) {
          t.propType = bw.desert > 0.4 ? 'desert_rock' : 'mossy_rock';
        } else if ((inCluster && h > 0.48) || (t.biome === 'tropical' && nVal > 0.45 && h > 0.42) || (bw.desert > 0.55 && h > 0.87)) {
          t.hasTree = true;
          if (h > 0.85 && bw.desert < 0.4) t.hasMycorrhiza = true;
          treeTiles.push(t);
        } else if (h > 0.66) {
          t.producerStage = (Math.floor(h * 10) % 3) + 1;
        }

        if (!t.hasTree && t.biome === 'peatland' && h > 0.62 && t.type === 'grass') {
          t.hasTree = true;
          if (h > 0.80) t.hasMycorrhiza = true;
          treeTiles.push(t);
        }

        // C) Rich RTS Micro-Decorations across meadows, groves, swamps, peatlands & desert scrubland
        if (!t.hasTree && !t.microDecor && !t.isPath) {
          if (bw.desert > 0.5) {
            if (h2 > 0.82) t.microDecor = h2 > 0.92 ? 'desert_rock' : 'dry_shrub';
            else if (h2 > 0.75) t.microDecor = 'pebbles';
          } else if (t.biome === 'peatland' || (bw.peatland || 0) > 0.45) {
            if (h2 > 0.72) t.microDecor = 'kelakai_fern';
            else if (h2 > 0.60) t.microDecor = 'wild_mushroom';
            else if (h2 > 0.50) t.microDecor = 'fallen_branch';
          } else if (bw.swamp > 0.5) {
            if (h2 > 0.80) t.microDecor = h2 > 0.90 ? 'wild_mushroom' : 'fallen_branch';
            else if (h2 > 0.72) t.microDecor = 'river_reeds';
          } else {
            if (h2 > 0.91) t.microDecor = 'fallen_branch';
            else if (h2 > 0.85) t.microDecor = 'wild_mushroom';
            else if (h2 > 0.79) t.microDecor = 'flower_yellow';
            else if (h2 > 0.73) t.microDecor = 'flower_white';
            else if (h2 > 0.68) t.microDecor = 'flower_purple';
            else if (h2 > 0.62) t.microDecor = 'pebbles';
          }
        }
      }
    }

    // 4) Lantai hutan (semanggi) di sekitar pohon
    const hasTreeAt = (x, z) => x >= 0 && z >= 0 && x < MAP_SIZE && z < MAP_SIZE && grid[z][x].hasTree;
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        grid[gz][gx].nearTree =
          hasTreeAt(gx, gz) || hasTreeAt(gx - 1, gz) || hasTreeAt(gx + 1, gz) || hasTreeAt(gx, gz - 1) || hasTreeAt(gx, gz + 1);
      }
    }

    // Add extra woodland mushrooms & fallen twigs right under/around tree canopies
    for (let gz = 1; gz < MAP_SIZE - 1; gz++) {
      for (let gx = 1; gx < MAP_SIZE - 1; gx++) {
        const t = grid[gz][gx];
        if (t.nearTree && !t.hasTree && !t.microDecor && t.type === 'grass' && !t.isRicePaddy && !t.isPath) {
          const hm = hash2(gx * 9.1, gz * 7.3);
          if (hm > 0.72) t.microDecor = hm > 0.86 ? 'fallen_branch' : 'wild_mushroom';
          else if (hm > 0.62) t.microDecor = 'pebbles';
        }
      }
    }

    // Build Shoreline Surf Ring Points around the island perimeter (coast ~ 1.05)
    shoreOutlinePts = [];
    const cHalf = (MAP_SIZE - 1) * 0.5;
    const NUM_SHORE_RAYS = 88;
    for (let k = 0; k < NUM_SHORE_RAYS; k++) {
      const ang = (k / NUM_SHORE_RAYS) * Math.PI * 2;
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      let lo = 6;
      let hi = MAP_SIZE * 0.72;
      for (let it = 0; it < 12; it++) {
        const midR = (lo + hi) * 0.5;
        if (islandCoastScore(cHalf + dx * midR, cHalf + dz * midR) < 1.045) lo = midR;
        else hi = midR;
      }
      const rShore = (lo + hi) * 0.5;
      shoreOutlinePts.push({
        gx: cHalf + dx * rShore,
        gz: cHalf + dz * rShore,
        nx: dx,
        nz: dz,
        phase: k * 0.35
      });
    }

    // Build Sea Rock & Coral Reef Clusters in the surrounding ocean corners/shallows
    seaReefs = [];
    const reefAngles = [0.22, 0.68, 1.18, 1.72, 2.28, 2.75, 3.35, 3.88, 4.42, 4.96, 5.48, 5.95];
    for (let i = 0; i < reefAngles.length; i++) {
      const ang = reefAngles[i];
      const basePt = shoreOutlinePts[Math.floor((ang / (Math.PI * 2)) * NUM_SHORE_RAYS) % NUM_SHORE_RAYS];
      const distOut = 3.4 + (i % 3) * 2.3 + hash2(i * 3.7, 9.1) * 1.8;
      seaReefs.push({
        gx: basePt.gx + basePt.nx * distOut,
        gz: basePt.gz + basePt.nz * distOut,
        large: i % 2 === 0,
        scale: 0.85 + hash2(i, 4.2) * 0.45,
        phase: i * 0.9
      });
    }

    // Initialize Swimming River Fish silhouettes following the winding river channel
    riverFish = [];
    for (let f = 0; f < 16; f++) {
      const u = 0.06 + (f / 16) * 0.88;
      riverFish.push({
        u,
        lat: (hash2(f * 2.3, 5.7) - 0.5) * 1.1,
        dir: f % 2 === 0 ? 1 : -1,
        speed: 0.022 + hash2(f, 8.4) * 0.016,
        phase: f * 1.3,
        size: 0.82 + hash2(f * 4.1, 1.9) * 0.38
      });
    }

    // Initialize Slowly Drifting Semi-Transparent Cloud Shadows across Ocean & Island
    ambientShadows = [];
    for (let s = 0; s < 7; s++) {
      ambientShadows.push({
        gx: -4 + hash2(s * 7.1, 2.3) * (MAP_SIZE + 8),
        gz: -4 + hash2(s * 3.9, 8.7) * (MAP_SIZE + 8),
        vx: 0.55 + hash2(s, 1.1) * 0.28,
        vz: 0.32 + hash2(s, 5.5) * 0.20,
        scale: 1.15 + hash2(s * 2.2, 6.4) * 0.75,
        alpha: 0.14 + hash2(s, 9.3) * 0.08
      });
    }

    initialBiomeCounts = recountLiveBiomes();

    // 5) Urutan gambar & pilihan tile per rotasi kamera (dihitung SEKALI)
    const nonOceanTiles = [];
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        if (!grid[gz][gx].isOceanMargin) nonOceanTiles.push(grid[gz][gx]);
      }
    }
    for (let r = 0; r < 4; r++) {
      for (let i = 0; i < nonOceanTiles.length; i++) nonOceanTiles[i].tr[r] = pickTerrain(nonOceanTiles[i], r);
      sortedTilesByRot[r] = nonOceanTiles.slice().sort((a, b) => {
        const ra = rotateCoordsForRot(a.gx + 0.5, a.gz + 0.5, r);
        const rb = rotateCoordsForRot(b.gx + 0.5, b.gz + 0.5, r);
        return ra.rx + ra.rz - (rb.rx + rb.rz) || ra.rx - rb.rx;
      });
      waterTilesByRot[r] = sortedTilesByRot[r].filter((t) => t.type === 'water');
      landTilesByRot[r] = sortedTilesByRot[r].filter((t) => t.type !== 'water');
    }

    // Spawn Native Animals matching the selected mapMode!
    const regionSpawns = {
      grassland: ['hopper', 'hopper', 'hopper', 'hopper', 'frog', 'frog', 'snake', 'eagle'],
      hills: ['rabbit', 'rabbit', 'hopper', 'hopper', 'snake', 'eagle', 'eagle'],
      tropical: ['rabbit', 'rabbit', 'rabbit', 'frog', 'frog', 'tropical_snake', 'harpy_eagle'],
      swamp: ['water_bug', 'water_bug', 'water_bug', 'water_bug', 'frog', 'frog', 'snake', 'heron'],
      desert: ['sand_mouse', 'sand_mouse', 'sand_mouse', 'sand_mouse', 'desert_snake', 'desert_snake', 'desert_eagle'],
      peatland: ['orangutan', 'orangutan', 'orangutan', 'water_bug', 'frog', 'tropical_snake', 'hornbill', 'hornbill']
    };

    if (mapMode === 'multi') {
      Object.keys(regionSpawns).forEach((bKey) => {
        regionSpawns[bKey].forEach((sp) => {
          const spot = findLandSpotInBiome(bKey);
          spawnAnimalAt(sp, spot.gx, spot.gz);
        });
      });
    } else {
      const nativeList = regionSpawns[mapMode] || regionSpawns.grassland;
      for (let copy = 0; copy < 2; copy++) {
        nativeList.forEach((sp) => {
          const spot = findLandSpotInBiome(mapMode);
          spawnAnimalAt(sp, spot.gx, spot.gz);
        });
      }
    }

    // Seed initial natural Parasitisme & Amensalisme spots so all 4 symbioses exist organically on the island!
    for (let i = 0; i < treeTiles.length; i++) {
      if (i % 19 === 3) {
        treeTiles[i].hasParasiteVine = true;
        treeTiles[i].hasMycorrhiza = false;
      } else if (i % 13 === 5 && !treeTiles[i].hasMycorrhiza) {
        treeTiles[i].producerStage = 1; // shaded underbrush -> Amensalisme (-/0)
      }
    }
    if (animals.length > 3) {
      animals[2].hasParasite = true;
    }

    // Spawn 1 Pioneer Human at the start of every game to manage the island!
    const pioneerSpot = findLandSpotInBiome(mapMode === 'multi' ? 'grassland' : mapMode);
    spawnHumanAt(pioneerSpot.gx, pioneerSpot.gz, 'steward', 'male');

    // Populate initial symStats immediately so HUD buttons show counts right on open!
    symStats = { mutual: 0, commensal: 0, parasite: 0, amensal: 0 };
    for (let i = 0; i < treeTiles.length; i++) {
      const tt = treeTiles[i];
      if (tt.hasMycorrhiza) symStats.mutual++;
      if (tt.hasParasiteVine) symStats.parasite++;
      if (!tt.hasMycorrhiza && tt.producerStage > 0) symStats.amensal++;
    }
    for (let i = 0; i < animals.length; i++) {
      if (animals[i].hasParasite) symStats.parasite++;
      if (findNearestTile(animals[i].gx, animals[i].gz, 2.5, (t) => t.hasTree)) symStats.commensal++;
    }

    updateBalanceHUD();
    renderDock();
    const modeLabel = mapMode === 'multi' ? '6 Bioma Nusantara' : BIOME_PALETTES[mapMode].shortName;
    logEvent(`🌍 Mode ${modeLabel} aktif! Hewan & kartu menyesuaikan ekosistem ${modeLabel}.`);
  }

  // Ringkasan tata letak (untuk pengujian): satu karakter per petak
  function debugLayout() {
    const rows = [];
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      let s = '';
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        const t = grid[gz][gx];
        let ch = '.';
        if (t.isOceanMargin) ch = '~';
        else if (t.type === 'water') ch = 'W';
        else if (t.hasTree) ch = 'T';
        else if (t.isPath) ch = '=';
        else if (t.isRicePaddy) ch = t.sawahRow % 2 === 1 ? 'r' : 'R';
        else if (t.producerStage > 0) ch = 'p';
        else if (t.type === 'sand') ch = 's';
        else if (t.biome === 'hills') ch = '^';
        else ch = 'g';
        s += ch;
      }
      rows.push(s);
    }
    return rows;
  }


  function recountLiveBiomes() {
    const counts = {};
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      const row = grid[gz];
      if (!row) continue;
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        const t = row[gx];
        if (!t || t.isOceanMargin || t.type === 'water') continue;
        // Destroyed/monocultured/burning tiles no longer count as healthy intact native habitat
        if (t.hasSawit || t.fireTimer > 0 || t.floodTimer > 0) continue;
        counts[t.biome] = (counts[t.biome] || 0) + 1;
      }
    }
    liveBiomeCounts = counts;
    return counts;
  }

  function getBiomeDamageRatio(biomeKey) {
    const initCnt = initialBiomeCounts[biomeKey] || 0;
    if (initCnt <= 0) return 0;
    const liveCnt = liveBiomeCounts[biomeKey] !== undefined ? liveBiomeCounts[biomeKey] : initCnt;
    return Math.max(0, Math.min(1, 1 - liveCnt / initCnt));
  }

  function canSpeciesMigrate(a) {
    if (!a) return false;
    if (a.isAdapted) return true;
    const origin = a.originBiome || (SPECIES_NATIVE_BIOMES[a.type] && SPECIES_NATIVE_BIOMES[a.type][0]) || 'grassland';
    return getBiomeDamageRatio(origin) >= 0.75;
  }

  function findLandSpotInBiome(biomeKey) {
    for (let tries = 0; tries < 80; tries++) {
      const gx = 2 + Math.floor(Math.random() * (MAP_SIZE - 4));
      const gz = 2 + Math.floor(Math.random() * (MAP_SIZE - 4));
      const t = grid[gz][gx];
      if (!t.isOceanMargin && t.type !== 'water' && !t.hasTree && (t.biome === biomeKey || tries > 60)) {
        return { gx: gx + 0.5, gz: gz + 0.5 };
      }
    }
    return { gx: MAP_SIZE / 2, gz: MAP_SIZE / 2 };
  }

  function spawnAnimalAt(type, gx, gz) {
    const def = SPECIES_DEFS[type] || SPECIES_DEFS.hopper;
    const isFly = Boolean(def.isFly);
    const a = {
      id: Math.random(),
      type,
      def,
      gx: Math.min(Math.max(gx, 2.2), MAP_SIZE - 2.2),
      gz: Math.min(Math.max(gz, 2.2), MAP_SIZE - 2.2),
      vx: (Math.random() - 0.5) * 1.5,
      vz: (Math.random() - 0.5) * 1.5,
      facing: 1,
      isFly,
      flyElev: isFly ? 64 : 0,
      maxHp: def.maxHp,
      hp: def.maxHp,
      hunger: 28 + Math.random() * 25,
      thirst: 15 + Math.random() * 25,
      fullTimer: 0,
      mealsEaten: 0,
      stateLabel: 'BERKELANA',
      symbiosisBadge: '',
      hasParasite: false,
      originBiome: (SPECIES_NATIVE_BIOMES[type] && SPECIES_NATIVE_BIOMES[type][0]) || 'grassland',
      isAdapted: false,
      adaptedBiome: null,
      foreignTimer: 0,
      isSheltered: false,
      pollinationCooldown: 3 + Math.random() * 4,
      targetEntity: null,
      targetTile: null,
      combatPartner: null,
      combatRole: '',
      combatProgress: 0,
      combatDuration: 2.2,
      combatCooldown: 0,
      lungePhase: 0,
      eatingActive: false,
      eatingLabel: '',
      eatingProgress: 0,
      eatingDuration: def.eatDuration || 2.2,
      eatingTile: null,
      interactTimer: 0,
      animTime: Math.random() * 6,
      screenX: 0,
      screenY: 0
    };
    animals.push(a);
    return a;
  }

  function spawnCloudAt(gx, gz, kind = 'rain') {
    clouds3d.push({
      gx,
      gz,
      kind,
      vx: (Math.random() - 0.5) * 0.45 + 0.22,
      vz: (Math.random() - 0.5) * 0.35 + 0.08,
      life: kind.startsWith('emotion_') ? 11 : 10,
      maxLife: kind.startsWith('emotion_') ? 11 : 10,
      rainTick: 0
    });
  }

  function plantSaplingOnTile(t) {
    if (!t || t.isOceanMargin || t.type === 'water' || t.hasTree) return false;
    if (t.hasSawit) {
      t.hasSawit = false;
      const si = sawitTiles.indexOf(t);
      if (si >= 0) sawitTiles.splice(si, 1);
    }
    if (t.saplingStage > 0) return false;
    t.type = 'grass';
    t.hasStump = false;
    t.saplingStage = 1;
    t.saplingTimer = 0;
    if (!saplingTiles.includes(t)) saplingTiles.push(t);
    return true;
  }

  function plantSawitOnTile(t) {
    if (!t || t.isOceanMargin || t.type === 'water' || t.building) return false;
    if (t.hasTree) {
      t.hasTree = false;
      const idx = treeTiles.indexOf(t);
      if (idx >= 0) treeTiles.splice(idx, 1);
    }
    t.type = 'grass';
    t.hasStump = false;
    t.isFarm = false;
    t.saplingStage = 0;
    t.producerStage = 0; // Monoculture kills native underbrush!
    t.hasMycorrhiza = false; // Kills native root fungi!
    if (!t.hasSawit) {
      t.hasSawit = true;
      sawitTiles.push(t);
    }
    addIsoCoins(35);
    return true;
  }

  function triggerSawitFlood() {
    cam.trauma = 0.7;
    if (window.EcoAudio && typeof window.EcoAudio.playError === 'function') window.EcoAudio.playError();
    let flooded = 0;
    const land = landTilesByRot[0] || [];
    for (let i = 0; i < land.length; i++) {
      const t = land[i];
      if (getTileLift(t) > 0) continue;
      const nearRiver = riverDistance(t.gx + 0.5, t.gz + 0.5) < 4.2;
      const nearSawit = t.hasSawit;
      if ((nearRiver || nearSawit) && hash2(t.gx + worldYear, t.gz) > 0.35) {
        t.floodTimer = 13 + Math.random() * 5;
        if (!floodTiles.includes(t)) floodTiles.push(t);
        if (t.isFarm) {
          t.isFarm = false;
          const fi = farmTiles.indexOf(t);
          if (fi >= 0) farmTiles.splice(fi, 1);
        }
        if (t.building === 'hut' && Math.random() < 0.35) {
          t.building = null;
          const bi = buildingTiles.indexOf(t);
          if (bi >= 0) buildingTiles.splice(bi, 1);
        }
        flooded++;
      }
    }
    // Flood harms lowland animals
    for (let i = 0; i < animals.length; i++) {
      const a = animals[i];
      if (!a.isFly && riverDistance(a.gx, a.gz) < 4.5) a.hp -= 22;
    }
    const floodCenter = sawitTiles[0] || { gx: MAP_SIZE * 0.45, gz: MAP_SIZE * 0.48 };
    showEventAlertPopup({
      type: 'custom',
      icon: '🌊',
      alertText: `Sedang terjadi Banjir Bandang (Tahun ${worldYear}) akibat Kebun Sawit! Ayo lihat!`,
      focusOpts: {
        kind: 'flood',
        gx: floodCenter.gx + 0.5,
        gz: floodCenter.gz + 0.5,
        title: '🌊 BENCANA BANJIR BANDANG',
        desc: 'Sungai meluap karena akar Kebun Sawit tak mampu menahan air hujan',
        color: '#29b6f6',
        fill: 'rgba(41, 182, 246, 0.24)'
      }
    });
    logEvent(`🌊⚠️ TAHUN ${worldYear}: BANJIR BANDANG merendam ${flooded} lahan! Kebun Sawit (${sawitTiles.length}) tak mampu menyerap hujan — tanam pohon alami!`);
    updateBalanceHUD();
  }

  function spawnHumanAt(gx, gz, mood = 'steward', gender = null) {
    const resolvedGender = gender || (humans.filter((x) => x.gender === 'male').length > humans.filter((x) => x.gender === 'female').length ? 'female' : 'male');
    const h = {
      id: Math.random(),
      gx: Math.min(Math.max(gx, 2.2), MAP_SIZE - 2.2),
      gz: Math.min(Math.max(gz, 2.2), MAP_SIZE - 2.2),
      vx: (Math.random() - 0.5) * 1.1,
      vz: (Math.random() - 0.5) * 1.1,
      facing: 1,
      gender: resolvedGender, // 'male' | 'female'
      mood, // 'steward' (pengelola) | 'destroyer' (perusak)
      greed: mood === 'destroyer' ? 100 : 10 + Math.random() * 18,
      actionCooldown: 0.9 + Math.random() * 1.2,
      reproCooldown: 8 + Math.random() * 5,
      buildTimer: 0,
      buildMax: 1.8,
      buildTile: null,
      stateLabel: mood === 'destroyer' ? 'MEMICU KERUSAKAN!' : (resolvedGender === 'female' ? 'MERAWAT DESA & ALAM' : 'MENGELOLA ALAM'),
      animTime: Math.random() * 6,
      screenX: 0,
      screenY: 0
    };
    humans.push(h);
    return h;
  }

    // Keep floating particles minimal & short (icon-only!) so the screen stays clean and fast
  function addParticle(gx, gz, elev, text, color = '#ffffff') {
    if (fxParticles.length > 14) return;
    fxParticles.push({ gx, gz, elev, ve: 18, text, color, life: 1.1 });
  }

  function logEvent(msg) {
    if (statusLogEl) statusLogEl.textContent = msg;
  }

  function projectIso(gx, gz, elev = 0) {
    const c = MAP_SIZE / 2;
    const dx = gx - c;
    const dz = gz - c;
    let rx;
    let rz;
    switch (cam.rot) {
      case 0: rx = dx + c; rz = dz + c; break;
      case 1: rx = -dz + c; rz = dx + c; break;
      case 2: rx = -dx + c; rz = -dz + c; break;
      default: rx = dz + c; rz = -dx + c;
    }
    const sx = (rx - rz) * (BASE_TW / 2);
    const sy = (rx + rz) * (BASE_TH / 2) - elev;
    return {
      x: viewW / 2 + cam.x + sx * cam.zoom,
      y: viewH * 0.14 + cam.y + sy * cam.zoom
    };
  }

  // Kunci kedalaman (tanpa alokasi objek) untuk mengurutkan pohon & hewan
  function depthKey(gx, gz) {
    const c = MAP_SIZE / 2;
    const dx = gx - c;
    const dz = gz - c;
    switch (cam.rot) {
      case 0: return dx + dz + 2 * c;
      case 1: return dx - dz + 2 * c;
      case 2: return -dx - dz + 2 * c;
      default: return dz - dx + 2 * c;
    }
  }

  // Picking petak murni aritmatika (tanpa alokasi): uji berlian atas tiap petak dari depan ke belakang,
  // sehingga bukit/teras tinggi dan rawa rendah sama-sama akurat.
  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const rw = Math.max(1, rect.width);
    const rh = Math.max(1, rect.height);
    const cw = viewW || canvas.clientWidth || rw;
    const ch = viewH || canvas.clientHeight || rh;
    return {
      x: ((e.clientX - rect.left) / rw) * cw,
      y: ((e.clientY - rect.top) / rh) * ch
    };
  }

  function screenToGrid(screenX, screenY) {
    if (!canvas) return null;
    const tiles = sortedTilesByRot[cam.rot] || sortedTilesByRot[0];
    const z = cam.zoom;
    const cw = viewW || canvas.clientWidth;
    const ch = viewH || canvas.clientHeight;
    const ox = cw / 2 + cam.x;
    const oy = ch * 0.14 + cam.y;
    const hw = (BASE_TW / 2) * z * 1.03;
    const hh = (BASE_TH / 2) * z * 1.03;
    const c = MAP_SIZE / 2;
    const rot = cam.rot;
    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i];
      const dx = t.gx + 0.5 - c;
      const dz = t.gz + 0.5 - c;
      let rx;
      let rz;
      if (rot === 0) { rx = dx + c; rz = dz + c; }
      else if (rot === 1) { rx = -dz + c; rz = dx + c; }
      else if (rot === 2) { rx = -dx + c; rz = -dz + c; }
      else { rx = dz + c; rz = -dx + c; }
      const cx = ox + (rx - rz) * (BASE_TW / 2) * z;
      const cy = oy + ((rx + rz) * (BASE_TH / 2) - getTileLift(t)) * z;
      if (Math.abs(screenX - cx) / hw + Math.abs(screenY - cy) / hh <= 1) return t;
    }
    return null;
  }

  // WorldBox Canvas Picker: selalu menemukan petak tepat di bawah kursor (bukit tinggi maupun dataran/pantai)
  function screenToWorldTile(screenX, screenY) {
    const exact = screenToGrid(screenX, screenY);
    if (exact) return exact;
    if (!canvas || grid.length === 0) return null;
    const z = cam.zoom;
    const cw = viewW || canvas.clientWidth;
    const ch = viewH || canvas.clientHeight;
    const sx = (screenX - (cw / 2 + cam.x)) / z;
    const sy = (screenY - (ch * 0.14 + cam.y)) / z;
    const halfW = BASE_TW * 0.5;
    const halfH = BASE_TH * 0.5;
    const rx = (sx / halfW + sy / halfH) * 0.5;
    const rz = (sy / halfH - sx / halfW) * 0.5;
    const g = unrotateCoords(rx, rz);
    const ix = Math.floor(g.gx);
    const iz = Math.floor(g.gz);
    if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return null;
    return grid[iz][ix];
  }

  // Hover dihitung SEKALI per frame (bukan tiap event pointermove)
  function updateHoverPick() {
    if (!pointerDirty) return;
    pointerDirty = false;
    hoverTile = pointerOnCanvas ? screenToWorldTile(pointerScreen.x, pointerScreen.y) : null;
    hoveredAnimal = null;
    hoveredHuman = null;
    let bestH = 24;
    for (let i = 0; i < humans.length; i++) {
      const h = humans[i];
      const d = Math.hypot(h.screenX - pointerScreen.x, h.screenY - pointerScreen.y);
      if (d < bestH) {
        bestH = d;
        hoveredHuman = h;
      }
    }
    let bestDist = 28;
    for (let i = 0; i < animals.length; i++) {
      const a = animals[i];
      const d = Math.hypot(a.screenX - pointerScreen.x, a.screenY - pointerScreen.y);
      if (d < bestDist) {
        bestDist = d;
        hoveredAnimal = a;
      }
    }
  }


  function startCombat(attacker, defender, isRivalWar) {
    attacker.combatPartner = defender;
    attacker.combatRole = isRivalWar ? 'rival' : 'hunter';
    attacker.combatProgress = 0;
    attacker.combatDuration = isRivalWar ? 2.5 : 2.0;
    attacker.lungePhase = 0;
    attacker.targetEntity = defender;

    defender.combatPartner = attacker;
    defender.combatRole = isRivalWar ? 'rival' : 'prey';
    defender.combatProgress = 0;
    defender.combatDuration = attacker.combatDuration;
    defender.lungePhase = Math.PI;
    defender.eatingActive = false;

    const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(attacker.gx)));
    const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(attacker.gz)));
    const elev = grid[iz][ix].elev + 18;

    attacker.stateLabel = isRivalWar ? `PERANG VS ${defender.def.name}` : `MENYERANG ${defender.def.name}`;
    defender.stateLabel = isRivalWar ? `PERANG VS ${attacker.def.name}` : `MELAWAN ${attacker.def.name}`;
    addParticle((attacker.gx + defender.gx) / 2, (attacker.gz + defender.gz) / 2, elev, '⚔️', '#ff5252');
  }

  function resolveCombat(a, partner) {
    const isRivalWar = a.combatRole === 'rival' || partner.combatRole === 'rival';
    const hunter = a.combatRole === 'prey' ? partner : a;
    const prey = a.combatRole === 'prey' ? a : partner;

    a.combatPartner = null;
    a.combatRole = '';
    a.combatProgress = 0;
    a.combatCooldown = 3.5;

    partner.combatPartner = null;
    partner.combatRole = '';
    partner.combatProgress = 0;
    partner.combatCooldown = 3.5;

    if (!animals.includes(hunter) || !animals.includes(prey)) return;

    const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(prey.gx)));
    const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(prey.gz)));
    const elev = grid[iz][ix].elev + 20;

    if (isRivalWar) {
      const scoreA = hunter.hp * (0.8 + Math.random() * 0.5) + hunter.def.atk * 1.4;
      const scoreB = prey.hp * (0.8 + Math.random() * 0.5) + prey.def.atk * 1.4;
      const winner = scoreA >= scoreB ? hunter : prey;
      const loser = winner === hunter ? prey : hunter;

      winner.hp = Math.min(winner.maxHp, winner.hp + 15);
      winner.stateLabel = 'MENANG TERITORI';
      addParticle(winner.gx, winner.gz, elev + 12, '👑', '#ffd740');

      if (loser.hp <= 22 && animals.length > 10) {
        const lIdx = animals.indexOf(loser);
        if (lIdx !== -1) animals.splice(lIdx, 1);
      } else {
        const ang = Math.atan2(loser.gz - winner.gz, loser.gx - winner.gx);
        loser.vx = Math.cos(ang) * loser.def.speed * 1.7;
        loser.vz = Math.sin(ang) * loser.def.speed * 1.7;
        loser.stateLabel = 'MUNDUR';
        loser.interactTimer = 1.6;
        addParticle(loser.gx, loser.gz, elev, '💨', '#90caf9');
      }
      updateBalanceHUD();
      return;
    }

    let escapeChance = prey.def.evade || 0.25;
    if (prey.isSheltered) escapeChance += 0.25;
    if (hunter.hasParasite) escapeChance += 0.16;
    if (prey.def.guild === 'carnivore_mid') escapeChance += 0.14;
    escapeChance = Math.min(0.70, Math.max(0.15, escapeChance));

    if (Math.random() < escapeChance) {
      const ang = Math.atan2(prey.gz - hunter.gz, prey.gx - hunter.gx);
      prey.vx = Math.cos(ang) * prey.def.speed * 1.85;
      prey.vz = Math.sin(ang) * prey.def.speed * 1.85;
      prey.gx = Math.min(MAP_SIZE - 2.2, Math.max(2.2, prey.gx + prey.vx * 0.45));
      prey.gz = Math.min(MAP_SIZE - 2.2, Math.max(2.2, prey.gz + prey.vz * 0.45));
      prey.stateLabel = 'LOLOS!';
      hunter.stateLabel = 'GAGAL BURU';
      hunter.interactTimer = 1.5;
      addParticle(prey.gx, prey.gz, elev, '💨 Lolos!', '#40c4ff');
    } else {
      const pIdx = animals.indexOf(prey);
      if (pIdx !== -1) animals.splice(pIdx, 1);

      hunter.gx = prey.gx;
      hunter.gz = prey.gz;
      hunter.eatingActive = true;
      hunter.eatingProgress = 0;
      hunter.eatingDuration = hunter.def.eatDuration || 2.4;
      hunter.eatingLabel = `MAKAN ${prey.def.name}`;
      hunter.stateLabel = hunter.eatingLabel;
      addParticle(hunter.gx, hunter.gz, elev, '🍖', '#ffd740');
      if (window.EcoAudio) window.EcoAudio.playEat(hunter.type);
      updateBalanceHUD();
    }
  }

  function runEcosystemDynamics() {
    if (animals.length >= MAX_3D_ANIMALS) return;

    for (const bKey of BIOME_KEYS) {
      if (mapMode !== 'multi' && mapMode !== bKey) continue;

      let prodTiles = [];
      for (let gz = 2; gz < MAP_SIZE - 2; gz++) {
        for (let gx = 2; gx < MAP_SIZE - 2; gx++) {
          const t = grid[gz][gx];
          if (t.biome === bKey && t.producerStage >= 1) prodTiles.push(t);
        }
      }

      const zoneAnimals = animals.filter((a) => {
        const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gx)));
        const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gz)));
        return grid[iz][ix].biome === bKey;
      });

      const zoneHerbs = zoneAnimals.filter((a) => HERBIVORES.includes(a.type));
      const zoneCarns = zoneAnimals.filter((a) => CARNIVORES.includes(a.type));
      const zoneApex = zoneAnimals.filter((a) => APEXES.includes(a.type));

      if (prodTiles.length >= 4 && zoneHerbs.length < Math.min(6, Math.ceil(prodTiles.length / 2.5))) {
        const spotTile = prodTiles[Math.floor(Math.random() * prodTiles.length)];
        const herbType = BIOME_PALETTES[bKey].defaultHerbivore || 'hopper';
        const newborn = spawnAnimalAt(herbType, spotTile.gx + 0.5, spotTile.gz + 0.5);
        newborn.hunger = 60;
        addParticle(newborn.gx, newborn.gz, spotTile.elev + 16, '🐣+1', '#76ff03');
        updateBalanceHUD();
        break;
      }

      const hungryCarns = zoneCarns.filter((c) => c.fullTimer <= 0 && !c.combatPartner);
      const hungryApex = zoneApex.filter((ap) => ap.fullTimer <= 0 && !ap.combatPartner);

      if (hungryCarns.length === 0 && prodTiles.length >= 3 && zoneHerbs.length >= 1 && zoneHerbs.length < 7) {
        const parent = zoneHerbs[Math.floor(Math.random() * zoneHerbs.length)];
        const child = spawnAnimalAt(parent.type, parent.gx + (Math.random() - 0.5), parent.gz + (Math.random() - 0.5));
        child.hunger = 55;
        addParticle(child.gx, child.gz, 18, '📈+1', '#69f0ae');
        updateBalanceHUD();
        break;
      }

      if (hungryApex.length === 0 && zoneHerbs.length >= 3 && zoneCarns.length < 4) {
        const carnType = bKey === 'desert' ? 'desert_snake' : bKey === 'tropical' ? 'tropical_snake' : Math.random() < 0.55 ? 'frog' : 'snake';
        const spot = findLandSpotInBiome(bKey);
        const child = spawnAnimalAt(carnType, spot.gx, spot.gz);
        child.hunger = 58;
        addParticle(child.gx, child.gz, 20, '🐍+1', '#ffd740');
        updateBalanceHUD();
        break;
      }
    }
  }

  function updateIso(dt) {
    if (!active || paused) return;

    cam.zoom += (cam.targetZoom - cam.zoom) * Math.min(1, dt * 9);
    if (eventFocus) {
      eventFocus.timer -= dt;
      if (eventFocus.animal && animals.includes(eventFocus.animal)) {
        eventFocus.gx = eventFocus.animal.gx;
        eventFocus.gz = eventFocus.animal.gz;
      }
      if (eventFocus.timer <= 0) {
        clearEventFocus(false);
      } else if (!cam.dragging && canvas) {
        const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gx)));
        const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gz)));
        const lift = getTileLift(grid[iz] && grid[iz][ix]);
        const r = rotateCoords(eventFocus.gx, eventFocus.gz);
        const sx = (r.rx - r.rz) * (BASE_TW / 2);
        const sy = (r.rx + r.rz) * (BASE_TH / 2) - lift;
        const cw = viewW || canvas.clientWidth;
        const ch = viewH || canvas.clientHeight;
        cam.targetX = -sx * cam.targetZoom;
        cam.targetY = ch * 0.31 - sy * cam.targetZoom;
      }
    }

    if (!cam.dragging) {
      cam.x += (cam.targetX - cam.x) * Math.min(1, dt * 8);
      cam.y += (cam.targetY - cam.y) * Math.min(1, dt * 8);
    } else {
      cam.targetX = cam.x;
      cam.targetY = cam.y;
    }
    if (cam.trauma > 0) cam.trauma = Math.max(0, cam.trauma - dt * 1.8);
    if (hudDirty) {
      hudTimer += dt;
      if (hudTimer >= 0.35) {
        hudDirty = false;
        hudTimer = 0;
        updateBalanceHUD();
      }
    }

    // Typed Clouds: Rain, Seed Grass, Seed Tree, Nature Rocks/Seeds, Emotion Anger, Emotion Harmony
    for (let i = clouds3d.length - 1; i >= 0; i--) {
      const c = clouds3d[i];
      c.gx = Math.min(MAP_SIZE - 2, Math.max(2, c.gx + c.vx * dt));
      c.gz = Math.min(MAP_SIZE - 2, Math.max(2, c.gz + c.vz * dt));
      c.life -= dt;
      c.rainTick += dt;
      if (c.rainTick > 0.55) {
        c.rainTick = 0;
        const cx = Math.floor(c.gx);
        const cz = Math.floor(c.gz);
        const rx = cx + Math.floor(Math.random() * 3) - 1;
        const rz = cz + Math.floor(Math.random() * 3) - 1;
        const tile = grid[rz] && grid[rz][rx];

        if (c.kind === 'seed_grass' && tile && !tile.isOceanMargin && tile.type !== 'water' && !tile.hasTree) {
          tile.type = 'grass';
          tile.hasStump = false;
          if (tile.producerStage < 3) tile.producerStage = Math.min(3, tile.producerStage + 2);
          addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 14, '🌱', '#69f0ae');
          updateBalanceHUD();
        } else if (c.kind === 'seed_tree' && tile && !tile.isOceanMargin && tile.type !== 'water' && !tile.hasTree) {
          if (plantSaplingOnTile(tile)) {
            addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 14, '🌿', '#81c784');
            updateBalanceHUD();
          } else if (tile.saplingStage > 0) {
            tile.saplingTimer += 4.5; // Extra seed cloud energy accelerates sapling
          }
        } else if (c.kind === 'seed_nature' && tile && !tile.isOceanMargin && tile.type !== 'water') {
          const roll = Math.random();
          if (roll < 0.45 && !tile.hasTree && tile.propType !== 'mossy_rock') {
            tile.propType = 'mossy_rock';
            addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 14, '🪨', '#d7ccc8');
          } else if (roll < 0.78) {
            tile.hasMycorrhiza = true;
            tile.hasParasiteVine = false;
            addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 14, '🍄', '#ffab40');
          } else {
            plantSaplingOnTile(tile);
            addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 14, '🌰', '#a5d6a7');
          }
          updateBalanceHUD();
        } else if (c.kind === 'lightning') {
          if (Math.random() < 0.65) {
            spawnLightningBolt(c.gx + (Math.random() - 0.5) * 3.2, c.gz + (Math.random() - 0.5) * 3.2);
          }
          if (tile && !tile.isOceanMargin && tile.type === 'grass' && !tile.hasTree && tile.producerStage < 3) {
            tile.producerStage++;
          }
          updateBalanceHUD();
        } else if (c.kind === 'rain' && tile && !tile.isOceanMargin && tile.type !== 'water') {
          if (!tile.hasTree && tile.producerStage < 3) tile.producerStage++;
          if (tile.saplingStage > 0) tile.saplingTimer += 5.5;
          if (tile.fireTimer > 0) {
            tile.fireTimer = 0;
            addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 16, '💨💧', '#b0bec5');
          }
          if (tile.hasStump) tile.hasStump = false;
          addParticle(rx + 0.5, rz + 0.5, getTileLift(tile) + 14, '💧', '#4fc3f7');
          updateBalanceHUD();
        } else if (c.kind === 'emotion_anger') {
          // Triggers humans beneath cloud into Destroyers & agitates nearby animals!
          let affected = false;
          for (let hi = 0; hi < humans.length; hi++) {
            const h = humans[hi];
            if (Math.hypot(h.gx - c.gx, h.gz - c.gz) < 4.5) {
              h.greed = 100;
              if (h.mood !== 'destroyer') {
                h.mood = 'destroyer';
                h.stateLabel = 'TERPICU AMARAH! MERUSAK ALAM';
                addParticle(h.gx, h.gz, 22, '💢🔥', '#ff5252');
                logEvent('💢 Awan Amarah memicu Manusia menjadi Perusak Alam!');
                affected = true;
              }
            }
          }
          for (let ai = 0; ai < animals.length; ai++) {
            const a = animals[ai];
            if (Math.hypot(a.gx - c.gx, a.gz - c.gz) < 4.2) {
              a.hunger = Math.min(100, a.hunger + 12);
              a.fullTimer = 0;
            }
          }
          if (affected) updateBalanceHUD();
        } else if (c.kind === 'emotion_harmony') {
          // Calms Destroyers back into Stewards & heals animals!
          let calmed = false;
          for (let hi = 0; hi < humans.length; hi++) {
            const h = humans[hi];
            if (Math.hypot(h.gx - c.gx, h.gz - c.gz) < 4.8) {
              h.greed = 0;
              if (h.mood === 'destroyer') {
                h.mood = 'steward';
                h.stateLabel = 'SADAR • MENGELOLA ALAM';
                addParticle(h.gx, h.gz, 22, '🕊️✨', '#80d8ff');
                logEvent('🕊️ Awan Damai menyadarkan Manusia kembali menjaga alam!');
                calmed = true;
              }
            }
          }
          for (let ai = 0; ai < animals.length; ai++) {
            const a = animals[ai];
            if (Math.hypot(a.gx - c.gx, a.gz - c.gz) < 4.5) {
              a.hp = Math.min(a.maxHp, a.hp + 14);
              a.hasParasite = false;
              if (a.combatPartner) {
                a.combatPartner.combatPartner = null;
                a.combatPartner = null;
              }
            }
          }
          if (calmed) updateBalanceHUD();
        }
      }
      if (c.life <= 0) clouds3d.splice(i, 1);
    }

    // Autonomous Natural Forest Growth: saplings mature over time & adult trees drop natural seeds!
    if (simMoving) {
      for (let i = saplingTiles.length - 1; i >= 0; i--) {
        const st = saplingTiles[i];
        if (!st || st.hasTree || st.saplingStage <= 0) {
          saplingTiles.splice(i, 1);
          continue;
        }
        const rate = st.hasMycorrhiza ? 1.85 : 1.0;
        st.saplingTimer += dt * rate;
        if (st.saplingStage === 1 && st.saplingTimer >= 8) {
          st.saplingStage = 2;
          st.saplingTimer = 0;
          addParticle(st.gx + 0.5, st.gz + 0.5, getTileLift(st) + 12, '🌿', '#a5d6a7');
        } else if (st.saplingStage === 2 && st.saplingTimer >= 10) {
          st.saplingStage = 0;
          st.saplingTimer = 0;
          st.hasTree = true;
          st.producerStage = 0;
          st.treeOffX = (hash2(st.gx * 1.9, st.gz * 2.3) - 0.5) * 0.45;
          st.treeOffZ = (hash2(st.gx * 2.5, st.gz * 1.3) - 0.5) * 0.45;
          st.treeScale = 0.85 + hash2(st.gx, st.gz) * 0.35;
          if (!treeTiles.includes(st)) treeTiles.push(st);
          saplingTiles.splice(i, 1);
          addParticle(st.gx + 0.5, st.gz + 0.5, getTileLift(st) + 20, '🌳', '#69f0ae');
          updateBalanceHUD();
        }
      }

      // Natural seed dispersal from existing adult trees over time
      naturalSeedTimer += dt;
      if (naturalSeedTimer >= 5.5) {
        naturalSeedTimer = 0;
        if (treeTiles.length > 0 && treeTiles.length < 135 && saplingTiles.length < 28) {
          const parent = treeTiles[Math.floor(Math.random() * treeTiles.length)];
          const nx = parent.gx + Math.floor(Math.random() * 5) - 2;
          const nz = parent.gz + Math.floor(Math.random() * 5) - 2;
          const nt = grid[nz] && grid[nz][nx];
          if (nt && !nt.isOceanMargin && nt.type === 'grass' && !nt.hasTree && nt.saplingStage === 0 && !nt.isRicePaddy && !nt.isPath) {
            plantSaplingOnTile(nt);
          }
        }
      }

      // WorldBox Calendar: Years, Seasons (Hujan / Kemarau) & Multi-Year Ecological Consequences!
      yearTimer += dt;
      if (yearTimer >= YEAR_SECONDS) {
        yearTimer -= YEAR_SECONDS;
        worldYear++;
        const isRainSeason = worldYear % 2 === 1;
        // Farm harvest feeds civilization each year
        civ.food = Math.min(200, civ.food + farmTiles.length * 4 + Math.min(10, Math.floor(treeTiles.length / 15)));
        // Sawit monoculture passive coins vs flood hazard accumulation!
        if (sawitTiles.length > 0) {
          addIsoCoins(sawitTiles.length * 12);
        }
        if (sawitTiles.length >= 8) {
          civ.sawitYears++;
          if (civ.sawitYears >= 2 && isRainSeason) {
            triggerSawitFlood();
          } else if (!isRainSeason && civ.sawitYears >= 1) {
            logEvent(`☀️⚠️ TAHUN ${worldYear}: Tanah sekitar Kebun Sawit (${sawitTiles.length} pohon) mengering di musim kemarau! Risiko banjir & gambut terbakar meningkat.`);
          }
        } else {
          civ.sawitYears = Math.max(0, civ.sawitYears - 1);
        }

        // Kalimantan Peatland Hydrology Balance:
        // Dry season & Sawit monoculture drain groundwater; Sekat Kanal + Rain + Native Trees keep peat wet!
        let peatSawitCount = 0;
        for (let si = 0; si < sawitTiles.length; si++) {
          if (sawitTiles[si].biome === 'peatland') peatSawitCount++;
        }
        const rainGain = isRainSeason ? 6 : -5;
        const canalBonus = Math.min(18, sekatKanalTiles.length * 6);
        const sawitDrain = peatSawitCount * 4 + Math.max(0, sawitTiles.length - 4) * 1.2;
        peatMoisture = Math.max(5, Math.min(100, Math.round(peatMoisture + rainGain + canalBonus - sawitDrain)));
        if (peatMoisture <= 36 && fireTiles.length === 0) {
          triggerDisaster('peat_fire');
        } else if (peatMoisture <= 48 && !isRainSeason) {
          logEvent(`🪵⚠️ TAHUN ${worldYear}: Lahan Gambut Kalimantan mulai mengering (${peatMoisture}%)! Pasang Sekat Kanal agar tak muncul kabut asap!`);
        }
        // Resource depletion crisis if forest is wiped out!
        // Natural seasonal phenomena every 4 years so the world feels dynamically alive!
        if (worldYear >= 4 && worldYear % 4 === 0 && floodTiles.length === 0 && fireTiles.length === 0) {
          triggerDisaster(isRainSeason ? 'thunderstorm' : 'wildfire');
        }
        if (treeTiles.length < 18) {
          logEvent(`🏜️⚠️ TAHUN ${worldYear}: KRISIS SDA! Hutan habis ditebang tanpa ditanam kembali — ekosistem & negeri terancam runtuh!`);
          if ((treeTiles.length < 12 || sawitTiles.length >= 12) && displacedCooldown <= 0 && !pendingConsequence && Math.random() < 0.55) {
            maybeTriggerBiomeDisplaced('deforestation');
          }
        }
        hudDirty = true;
      }

      // Update swimming river fish & drifting ambient cloud shadows
      for (let i = 0; i < riverFish.length; i++) {
        const rf = riverFish[i];
        rf.u += rf.dir * rf.speed * dt;
        rf.phase += dt * 7.5;
        if (rf.u > 0.95) { rf.u = 0.95; rf.dir = -1; }
        else if (rf.u < 0.05) { rf.u = 0.05; rf.dir = 1; }
      }
      for (let i = 0; i < ambientShadows.length; i++) {
        const sh = ambientShadows[i];
        sh.gx += sh.vx * dt;
        sh.gz += sh.vz * dt;
        if (sh.gx > MAP_SIZE + 12) sh.gx = -12;
        if (sh.gz > MAP_SIZE + 12) sh.gz = -12;
      }

      // Real-world timers (unscaled by SIM_TIME_SCALE = 0.42 so 3.0s consequence popup & lightning bolts feel snappy!)
      const dtReal = dt / SIM_TIME_SCALE;
      if (displacedCooldown > 0) displacedCooldown = Math.max(0, displacedCooldown - dtReal);
      if (displacedCounter > 0) displacedCounter = Math.max(0, displacedCounter - dtReal * 0.35);
      const targetSmog = fireTiles.length > 0 && peatMoisture < 55 ? Math.min(0.42, 0.14 + (55 - peatMoisture) * 0.008) : 0;
      peatSmogAlpha += (targetSmog - peatSmogAlpha) * Math.min(1, dtReal * 1.5);
      if (skyFlashAlpha > 0) skyFlashAlpha = Math.max(0, skyFlashAlpha - dtReal * 2.2);
      for (let i = lightningBolts.length - 1; i >= 0; i--) {
        lightningBolts[i].life -= dtReal;
        if (lightningBolts[i].life <= 0) lightningBolts.splice(i, 1);
      }
      for (let i = lightningQueue.length - 1; i >= 0; i--) {
        lightningQueue[i].delay -= dtReal;
        if (lightningQueue[i].delay <= 0) {
          spawnLightningBolt(lightningQueue[i].gx, lightningQueue[i].gz);
          lightningQueue.splice(i, 1);
        }
      }
      // Zero-stutter terraforming: localized sub-rect rebake runs in ~1.5ms directly on click/drag (never invalidates full terrainCache!)
      if (pendingConsequence && consequenceTimer > 0) {
        consequenceTimer -= dtReal;
        if (consequenceTimer <= 0) {
          openConsequenceModal(pendingConsequence);
        }
      }
      for (let i = pollutedTiles.length - 1; i >= 0; i--) {
        pollutedTiles[i].pollutedTimer -= dt;
        if (pollutedTiles[i].pollutedTimer <= 0) {
          pollutedTiles[i].pollutedTimer = 0;
          pollutedTiles.splice(i, 1);
        }
      }

      // Update active fire tiles
      for (let i = fireTiles.length - 1; i >= 0; i--) {
        const ft = fireTiles[i];
        ft.fireTimer -= dt;
        if (ft.fireTimer <= 0) {
          ft.fireTimer = 0;
          fireTiles.splice(i, 1);
        }
      }

      // Live Event Pop-Up Notifier: invites player ("Sedang terjadi ... — Ayo Lihat!") to zoom & inspect!
      if (!eventFocus && (!eduModalEl || eduModalEl.classList.contains('hidden'))) {
        autoAlertTimer -= dt;
        if (autoAlertTimer <= 0) {
          autoAlertTimer = 9.5;
          const kinds = ['mutual', 'commensal', 'parasite', 'amensal'];
          const pick = kinds[autoAlertCycle % kinds.length];
          autoAlertCycle++;
          const labelMap = {
            mutual: { icon: '🤝', text: 'Sedang terjadi Simbiosis Mutualisme (+/+)! Ayo lihat!' },
            commensal: { icon: '🛡️', text: 'Sedang terjadi Simbiosis Komensalisme (+/0)! Ayo lihat!' },
            parasite: { icon: '🦠', text: 'Sedang terjadi Simbiosis Parasitisme (+/-)! Ayo lihat!' },
            amensal: { icon: '🌑', text: 'Sedang terjadi Simbiosis Amensalisme (-/0)! Ayo lihat!' }
          };
          const lb = labelMap[pick];
          showEventAlertPopup({ type: 'symbiosis', symKind: pick, icon: lb.icon, alertText: lb.text });
        }
      }

      // Update active flood tiles
      for (let i = floodTiles.length - 1; i >= 0; i--) {
        const ft = floodTiles[i];
        ft.floodTimer -= dt;
        if (ft.floodTimer <= 0) {
          ft.floodTimer = 0;
          floodTiles.splice(i, 1);
        }
      }

      // Human Civilization AI: Male & Female Families, Active House Construction (Pondok, Rumah Panggung, Balai Joglo), Farming & Reboisasi!
      const desiredHouses = Math.min(MAX_HUMANS, Math.max(1, Math.ceil(humans.length / 1.5)));
      const needWoodForVillage = civ.wood < 18 && buildingTiles.length < desiredHouses + 1;
      const needStoneForVillage = civ.stone < 12 && buildingTiles.length < desiredHouses + 1;
      const needFarms = farmTiles.length < Math.max(2, humans.length * 2);

      for (let i = humans.length - 1; i >= 0; i--) {
        const h = humans[i];
        h.animTime += dt;
        h.actionCooldown = Math.max(0, h.actionCooldown - dt);
        h.reproCooldown = Math.max(0, (h.reproCooldown || 0) - dt);

        // 0) Active House Construction in progress!
        if (h.buildTile && h.buildTimer > 0) {
          if (h.buildTile.building || h.buildTile.type === 'water') {
            h.buildTile = null;
            h.buildTimer = 0;
          } else {
            h.vx = 0;
            h.vz = 0;
            h.buildTimer -= dt;
            const pct = Math.min(99, Math.round((1 - h.buildTimer / (h.buildMax || 1.8)) * 100));
            h.stateLabel = `MEMBANGUN RUMAH ${pct}% 🔨`;
            if (Math.random() < dt * 2.4) {
              addParticle(h.buildTile.gx + 0.5, h.buildTile.gz + 0.5, getTileLift(h.buildTile) + 16, '🔨🪵', '#ffd54f');
            }
            if (h.buildTimer <= 0) {
              const bt = h.buildTile;
              h.buildTile = null;
              h.buildTimer = 0;
              const isHall = buildingTiles.length >= 2 && civ.wood >= 6 && civ.stone >= 4 && buildingTiles.filter((b) => b.building === 'hall').length < Math.floor((buildingTiles.length + 1) / 3);
              if (isHall) {
                civ.wood = Math.max(0, civ.wood - 6);
                civ.stone = Math.max(0, civ.stone - 4);
                bt.building = 'hall';
              } else {
                bt.building = buildingTiles.length % 2 === 1 ? 'hut_lumbung' : 'hut';
              }
              bt.producerStage = 0;
              bt.hasStump = false;
              bt.microDecor = null;
              if (!buildingTiles.includes(bt)) buildingTiles.push(bt);
              const bName = bt.building === 'hall' ? '🏛️ Balai Joglo Negeri' : bt.building === 'hut_lumbung' ? '🏡 Rumah Panggung' : '🏠 Pondok Keluarga';
              h.stateLabel = `SELESAI: ${bName}!`;
              h.actionCooldown = 3.0;
              addParticle(bt.gx + 0.5, bt.gz + 0.5, getTileLift(bt) + 24, bt.building === 'hall' ? '🏛️✨' : '🏡✨', '#ffd54f');
              logEvent(`${bName} selesai dibangun oleh ${h.gender === 'female' ? 'Perempuan' : 'Laki-laki'} di Tahun ${worldYear}! (Total Rumah: ${buildingTiles.length})`);
              hudDirty = true;
            }
            continue;
          }
        }

        // 1) Family & Reproduction: Laki-laki + Perempuan pair up (💑) to create new villagers!
        if (humans.length >= 2 && humans.length < MAX_HUMANS && h.reproCooldown <= 0 && civ.food >= 5) {
          let partner = null;
          let nearestOpposite = null;
          let bestOppDist = 14;
          for (let j = 0; j < humans.length; j++) {
            const mate = humans[j];
            if (mate === h || (mate.reproCooldown || 0) > 0) continue;
            const d = Math.hypot(mate.gx - h.gx, mate.gz - h.gz);
            const opposite = mate.gender !== h.gender;
            if (opposite && d < bestOppDist) {
              bestOppDist = d;
              nearestOpposite = mate;
            }
            if (d < 3.6 && (opposite || !humans.some((x) => x.gender !== h.gender))) {
              partner = mate;
              break;
            }
          }
          if (partner) {
            h.reproCooldown = 19;
            partner.reproCooldown = 19;
            civ.food = Math.max(0, civ.food - 4);
            const babyGender = Math.random() < 0.5 ? 'female' : 'male';
            const baby = spawnHumanAt((h.gx + partner.gx) * 0.5 + 0.25, (h.gz + partner.gz) * 0.5 + 0.25, 'steward', babyGender);
            baby.reproCooldown = 22;
            addParticle(baby.gx, baby.gz, 20, '💑👶', '#ff80ab');
            logEvent(`💑👶 Tahun ${worldYear}: Pasangan desa dikaruniai anak ${babyGender === 'female' ? 'Perempuan 👩' : 'Laki-laki 👨'}! Populasi: ${humans.length} jiwa.`);
            hudDirty = true;
          } else if (nearestOpposite && bestOppDist >= 3.6 && Math.random() < dt * 1.5) {
            // Gently walk toward opposite-gender partner so they meet & build a family!
            const ang = Math.atan2(nearestOpposite.gz - h.gz, nearestOpposite.gx - h.gx);
            h.vx = Math.cos(ang) * 1.3;
            h.vz = Math.sin(ang) * 1.3;
          }
        }

        // 2) Natural greed trigger (rapid population or scarcity can tempt humans into over-exploitation / Sawit!)
        if (h.mood === 'steward') {
          const crowdStress = humans.length >= 8 ? (humans.length - 7) * 1.0 : 0.10;
          const forestStress = treeTiles.length < 26 ? 0.60 : 0;
          h.greed = Math.min(100, h.greed + dt * (crowdStress + forestStress));
          if (h.greed >= 100 && Math.random() < dt * 0.28) {
            h.mood = 'destroyer';
            h.stateLabel = 'SERAKAH • EKSPLOITASI SDA!';
            addParticle(h.gx, h.gz, 20, '🔥💢', '#ff5252');
            logEvent(`⚠️ Tahun ${worldYear}: Keserakahan muncul! Penduduk mengeksploitasi hutan & membuka Sawit.`);
            hudDirty = true;
          }
        }

        const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(h.gx)));
        const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(h.gz)));
        const curTile = grid[iz] && grid[iz][ix];

        const isBuildablePlot = (t) =>
          t &&
          !t.isOceanMargin &&
          t.type === 'grass' &&
          !t.hasTree &&
          !t.hasSawit &&
          !t.building &&
          !t.isFarm &&
          !t.isRicePaddy &&
          getTileLift(t) <= 18;

        // 3) Start Building a House (Pondok / Rumah Panggung / Balai Negeri) whenever wood >= 6!
        if (
          h.mood === 'steward' &&
          h.actionCooldown <= 0 &&
          civ.wood >= 6 &&
          buildingTiles.length < desiredHouses &&
          buildingTiles.length < MAX_HUMANS
        ) {
          if (isBuildablePlot(curTile)) {
            civ.wood -= 6;
            if (civ.stone >= 2) civ.stone -= 2;
            h.buildTile = curTile;
            h.buildMax = 1.8;
            h.buildTimer = 1.8;
            h.stateLabel = 'MEMBANGUN RUMAH 0% 🔨';
            addParticle(curTile.gx + 0.5, curTile.gz + 0.5, getTileLift(curTile) + 18, '🔨🏠', '#ffe082');
            hudDirty = true;
            continue;
          } else {
            const plot = findNearestTile(h.gx, h.gz, 9, isBuildablePlot);
            if (plot) {
              const ang = Math.atan2(plot.gz + 0.5 - h.gz, plot.gx + 0.5 - h.gx);
              h.vx = Math.cos(ang) * 1.45;
              h.vz = Math.sin(ang) * 1.45;
            }
          }
        }

        if (h.mood === 'steward') {
          if (h.actionCooldown <= 0 && curTile && !curTile.isOceanMargin && curTile.type !== 'water') {
            // A) Mine stone rock if village needs stone -> rock disappears!
            if ((curTile.propType === 'mossy_rock' || curTile.propType === 'desert_rock') && needStoneForVillage) {
              curTile.propType = 'none';
              civ.stone += 8;
              h.stateLabel = 'MENAMBANG BATU (+8🪨)';
              h.actionCooldown = 3.2;
              addParticle(h.gx, h.gz, getTileLift(curTile) + 18, '⛏️🪨', '#cfd8dc');
              hudDirty = true;
            } else if (curTile.hasTree && needWoodForVillage && treeTiles.length > 22) {
              // B) Harvest wood for village houses -> tree disappears & steward replants nearby!
              curTile.hasTree = false;
              curTile.hasStump = true;
              const ti = treeTiles.indexOf(curTile);
              if (ti >= 0) treeTiles.splice(ti, 1);
              civ.wood += 10;
              h.stateLabel = 'MENEBANG KAYU RUMAH (+10🪵)';
              h.actionCooldown = 3.2;
              addParticle(h.gx, h.gz, getTileLift(curTile) + 18, '🪓🪵', '#ffcc80');
              const adj = grid[iz + 1] && grid[iz + 1][ix];
              if (adj && Math.random() < 0.78) plantSaplingOnTile(adj);
              hudDirty = true;
            } else if (!curTile.hasTree && !curTile.hasSawit && !curTile.building && !curTile.isFarm && needFarms && getTileLift(curTile) === 0 && (h.gender === 'female' ? Math.random() < 0.48 : Math.random() < 0.28)) {
              // C) Till Farmland (Perempuan excels at tending gardens & food plots!)
              curTile.isFarm = true;
              curTile.hasStump = false;
              curTile.producerStage = 2;
              farmTiles.push(curTile);
              civ.food += 5;
              h.stateLabel = 'MENANAM KEBUN DESA 🌾';
              h.actionCooldown = 3.5;
              addParticle(h.gx, h.gz, 16, '🌾', '#dce775');
              hudDirty = true;
            } else if (curTile.producerStage >= 2 && civ.food < 22) {
              curTile.producerStage--;
              civ.food += 3;
              h.stateLabel = 'MEMANEN BENIH ALAM';
              h.actionCooldown = 2.8;
              addParticle(h.gx, h.gz, getTileLift(curTile) + 14, '🌾+3', '#fff59d');
              hudDirty = true;
            } else if (curTile.hasParasiteVine) {
              curTile.hasParasiteVine = false;
              curTile.hasMycorrhiza = true;
              h.stateLabel = 'MEMBERSIHKAN BENALU';
              h.actionCooldown = 3.0;
              addParticle(h.gx, h.gz, getTileLift(curTile) + 18, '✨🧹', '#69f0ae');
              hudDirty = true;
            } else if (curTile.hasStump || (!curTile.hasTree && !curTile.isFarm && !curTile.building && curTile.saplingStage === 0 && treeTiles.length < 98 && Math.random() < 0.38)) {
              curTile.hasStump = false;
              plantSaplingOnTile(curTile);
              h.stateLabel = 'MENYEMAI TUNAS POHON 🌱';
              h.actionCooldown = 3.6;
              addParticle(h.gx, h.gz, getTileLift(curTile) + 18, '🌱', '#69f0ae');
              hudDirty = true;
            }
          }
          // Stewards steer toward trees/rocks when village needs materials for more houses!
          if (civ.wood < 6 && buildingTiles.length < desiredHouses && Math.random() < dt * 1.8) {
            const goal = findNearestTile(h.gx, h.gz, 11, (t) => t.hasTree);
            if (goal) {
              const ang = Math.atan2(goal.gz + 0.5 - h.gz, goal.gx + 0.5 - h.gx);
              h.vx = Math.cos(ang) * 1.4;
              h.vz = Math.sin(ang) * 1.4;
            }
          } else if (needStoneForVillage && Math.random() < dt * 1.1) {
            const goal = findNearestTile(h.gx, h.gz, 9, (t) => t.propType === 'mossy_rock' || t.propType === 'desert_rock');
            if (goal) {
              const ang = Math.atan2(goal.gz + 0.5 - h.gz, goal.gx + 0.5 - h.gx);
              h.vx = Math.cos(ang) * 1.35;
              h.vz = Math.sin(ang) * 1.35;
            }
          }
        } else {
          // Destroyer / Greedy Exploiter: chops forest without replanting, mines all rocks, & converts forest into SAWIT!
          let targetTree = null;
          let bestDist = 9;
          for (let ti = 0; ti < treeTiles.length; ti++) {
            const tt = treeTiles[ti];
            const d = Math.hypot(tt.gx + 0.5 - h.gx, tt.gz + 0.5 - h.gz);
            if (d < bestDist) {
              bestDist = d;
              targetTree = tt;
            }
          }
          if (targetTree) {
            const ang = Math.atan2(targetTree.gz + 0.5 - h.gz, targetTree.gx + 0.5 - h.gx);
            h.vx = Math.cos(ang) * 1.55;
            h.vz = Math.sin(ang) * 1.55;
            if (bestDist < 1.2 && h.actionCooldown <= 0) {
              civ.wood += 12;
              if (getTileLift(targetTree) === 0 && Math.random() < 0.55) {
                plantSawitOnTile(targetTree);
                h.stateLabel = 'MENANAM KEBUN SAWIT! 🌴';
                addParticle(targetTree.gx + 0.5, targetTree.gz + 0.5, 18, '🌴🪙', '#ffb74d');
                logEvent(`🌴 Hutan alami ditebang & diubah jadi Kebun Sawit (${sawitTiles.length})! Waspada banjir beberapa tahun lagi!`);
              } else {
                targetTree.hasTree = false;
                targetTree.hasStump = true;
                targetTree.producerStage = 0;
                const idxT = treeTiles.indexOf(targetTree);
                if (idxT >= 0) treeTiles.splice(idxT, 1);
                h.stateLabel = 'MENEBANG HUTAN TANPA REBOISASI!';
                addParticle(targetTree.gx + 0.5, targetTree.gz + 0.5, getTileLift(targetTree) + 18, '🪓🔥', '#ff7043');
              }
              h.actionCooldown = 2.5;
              hudDirty = true;
            }
          } else if (curTile && curTile.propType === 'mossy_rock' && h.actionCooldown <= 0) {
            curTile.propType = 'none';
            civ.stone += 12;
            h.stateLabel = 'MENGERUK BATU ALAM!';
            h.actionCooldown = 2.4;
            addParticle(h.gx, h.gz, getTileLift(curTile) + 16, '⛏️💥', '#ff8a65');
            hudDirty = true;
          } else if (curTile && curTile.producerStage > 0 && h.actionCooldown <= 0) {
            curTile.producerStage = 0;
            if (getTileLift(curTile) === 0 && Math.random() < 0.45) {
              plantSawitOnTile(curTile);
              h.stateLabel = 'EKSPANSI SAWIT!';
            } else {
              curTile.hasParasiteVine = true;
              h.stateLabel = 'MEMBAKAR LAHAN!';
            }
            h.actionCooldown = 2.5;
            addParticle(h.gx, h.gz, getTileLift(curTile) + 16, '🔥', '#ff5252');
            hudDirty = true;
          }
        }

                // Wander movement constrained to island land
        if (Math.random() < dt * 0.65) {
          h.vx = (Math.random() - 0.5) * 1.5;
          h.vz = (Math.random() - 0.5) * 1.5;
        }
        const ngx = h.gx + h.vx * dt;
        const ngz = h.gz + h.vz * dt;
        const nix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(ngx)));
        const niz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(ngz)));
        if (grid[niz] && grid[niz][nix] && !grid[niz][nix].isOceanMargin && grid[niz][nix].type !== 'water') {
          h.gx = ngx;
          h.gz = ngz;
          if (Math.abs(h.vx) > 0.05) h.facing = h.vx >= 0 ? 1 : -1;
        } else {
          h.vx *= -1;
          h.vz *= -1;
        }
      }
    }

    if (simMoving) {
      if (Math.random() < dt * 1.2) {
        const rx = 2 + Math.floor(Math.random() * (MAP_SIZE - 4));
        const rz = 2 + Math.floor(Math.random() * (MAP_SIZE - 4));
        const t = grid[rz][rx];
        if (!t.isOceanMargin && t.type === 'grass' && !t.hasTree && t.producerStage < 3) {
          t.producerStage++;
          if (t.hasMycorrhiza && t.producerStage < 3) t.producerStage++;
          updateBalanceHUD();
        }
      }

      habitatCountTimer += dt;
      if (habitatCountTimer >= 1.5) {
        habitatCountTimer = 0;
        recountLiveBiomes();
      }
      ecoCheckTimer += dt;
      if (ecoCheckTimer >= 3.2) {
        ecoCheckTimer = 0;
        runEcosystemDynamics();
      }
    }

    activeSymbioses = [];
    symStats.mutual = 0;
    symStats.commensal = 0;
    symStats.parasite = 0;
    symStats.amensal = 0;
    for (let i = 0; i < treeTiles.length; i++) {
      const tt = treeTiles[i];
      if (tt.hasMycorrhiza) symStats.mutual++;
      if (tt.hasParasiteVine) symStats.parasite++;
      if (!tt.hasMycorrhiza && tt.producerStage > 0) symStats.amensal++;
    }
    // Passive Eco-Coin income from healthy producers & mutualism
    isoCoinFrac += dt * (1.8 + symStats.mutual * 0.12);
    if (isoCoinFrac >= 1) {
      const gain = Math.floor(isoCoinFrac);
      addIsoCoins(gain);
      isoCoinFrac -= gain;
    if (yearLabelEl) {
      const season = worldYear % 2 === 1 ? 'Hujan' : 'Kemarau';
      yearLabelEl.textContent = `📅 Thn ${worldYear} • ${season}`;
    }
    if (civSummaryEl) {
      const mCnt = humans.filter((x) => x.gender !== 'female').length;
      const fCnt = humans.length - mCnt;
      civSummaryEl.textContent = `👨${mCnt} 👩${fCnt} 🏠${buildingTiles.length} 🌾${farmTiles.length} 🪵${civ.wood} 🪨${civ.stone} 🌴${sawitTiles.length}`;
    }
    }

    for (let i = animals.length - 1; i >= 0; i--) {
      const a = animals[i];
      if (!a) continue;
      a.animTime += dt;
      if (a.isFly && a.flyElev < 64) a.flyElev = Math.min(64, a.flyElev + dt * 28);
      a.pollinationCooldown = Math.max(0, a.pollinationCooldown - dt);
      a.combatCooldown = Math.max(0, a.combatCooldown - dt);
      a.symbiosisBadge = '';
      a.isSheltered = false;

      if (!simMoving) continue;

      const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gx)));
      const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gz)));
      const currentTile = grid[iz][ix];

      // A) Active Combat Struggle
      if (a.combatPartner) {
        if (!animals.includes(a.combatPartner)) {
          a.combatPartner = null;
          a.combatRole = '';
          a.combatProgress = 0;
          continue;
        }
        const partner = a.combatPartner;
        a.lungePhase += dt * 14;
        a.facing = partner.gx >= a.gx ? 1 : -1;
        if (a.isFly) {
          const targetElev = partner.isFly ? 48 : 8;
          a.flyElev += (targetElev - a.flyElev) * Math.min(1, dt * 8);
        }

        if (a.combatRole === 'hunter' || (a.combatRole === 'rival' && a.id < partner.id)) {
          a.combatProgress += dt / a.combatDuration;
          partner.combatProgress = a.combatProgress;

          const dmgToPartner = (a.def.atk || 15) * dt * (a.hasParasite ? 0.72 : 1.0) * 0.45;
          const dmgToSelf = (partner.def.atk || 8) * dt * (partner.hasParasite ? 0.72 : 1.0) * 0.38;
          partner.hp = Math.max(8, partner.hp - dmgToPartner);
          a.hp = Math.max(12, a.hp - dmgToSelf);

          if (a.combatProgress >= 1) {
            resolveCombat(a, partner);
          }
        }
        continue;
      }

      if (a.isFly && !a.eatingActive) {
        const hoverTarget = 64 + Math.sin(a.animTime * 2.8 + a.id * 10) * 9;
        a.flyElev += (hoverTarget - a.flyElev) * Math.min(1, dt * 5);
      }

      // B) Active Eating Progress Bar
      if (a.eatingActive) {
        if (a.isFly && a.flyElev > 8) {
          a.flyElev = Math.max(6, a.flyElev - dt * 32);
        }
        a.eatingProgress += dt / a.eatingDuration;

        if (a.eatingProgress >= 1) {
          if (a.eatingTile && a.eatingTile.producerStage > 0) {
            a.eatingTile.producerStage = Math.max(0, a.eatingTile.producerStage - 1);
          }
          a.eatingActive = false;
          a.eatingProgress = 0;
          a.eatingTile = null;
          a.hunger = 0;
          a.hp = Math.min(a.maxHp, a.hp + 28);
          a.mealsEaten++;
          a.fullTimer = a.def.fullDuration || 24;
          a.stateLabel = 'KENYANG 😋';
          addParticle(a.gx, a.gz, currentTile.elev + a.flyElev + 16, '😋', '#00e676');

          if (HERBIVORES.includes(a.type) && a.mealsEaten >= 2 && animals.length < MAX_3D_ANIMALS) {
            a.mealsEaten = 0;
            const baby = spawnAnimalAt(a.type, a.gx + 0.5, a.gz + 0.5);
            baby.hunger = 45;
          }
          updateBalanceHUD();
        }
        continue;
      }

      // C) Symbiosis Checks (4 Symbioses: Mutualisme, Komensalisme, Parasitisme, Amensalisme)
      let shelterTreeTile = null;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nt = grid[iz + dz] && grid[iz + dz][ix + dx];
          if (nt && nt.hasTree) {
            shelterTreeTile = nt;
            break;
          }
        }
        if (shelterTreeTile) break;
      }

      // 1. Komensalisme (+/0): Berteduh di bawah pohon (hemat air & aman) atau burung bertengger
      if (shelterTreeTile) {
        symStats.commensal++;
        if (!a.isFly) {
          a.isSheltered = true;
          a.thirst = Math.max(0, a.thirst - dt * 0.45);
          a.symbiosisBadge = '🛡️ KOMENSALISME (+/0)';
          if (showFoodWeb) {
            activeSymbioses.push({
              color: '#29b6f6',
              dashed: false,
              fromGx: a.gx,
              fromGz: a.gz,
              fromElev: 0 + 6,
              toGx: shelterTreeTile.gx + 0.5,
              toGz: shelterTreeTile.gz + 0.5,
              toElev: 0 + 16
            });
          }
        } else {
          a.symbiosisBadge = '🛡️ BERTENGGER (+/0)';
        }
      }

      // 2. Amensalisme (-/0): Pohon rindang meneduhi rumput muda di bawahnya / jejak hewan besar menginjak tunas
      if (shelterTreeTile && currentTile.hasTree && currentTile.producerStage > 0 && !currentTile.hasMycorrhiza) {
        symStats.amensal++;
        if (Math.random() < dt * 0.08) currentTile.producerStage = Math.max(0, currentTile.producerStage - 1);
      } else if (!a.isFly && currentTile.producerStage === 1 && !HERBIVORES.includes(a.type) && Math.random() < dt * 0.06) {
        currentTile.producerStage = 0;
        symStats.amensal++;
        a.symbiosisBadge = '🌑 AMENSALISME (-/0)';
      }

      // 3. Parasitisme (+/-): Benalu / parasit melemahkan inang sampai disembuhkan
      if (currentTile.hasParasiteVine && !a.hasParasite && Math.random() < dt * 0.2) {
        a.hasParasite = true;
      }
      if (a.hasParasite) {
        symStats.parasite++;
        a.hp = Math.max(10, a.hp - dt * 1.8);
        a.hunger = Math.min(100, a.hunger + dt * 1.0);
        a.symbiosisBadge = '🦠 PARASITISME (+/-)';
      }
      if (a.hasParasite && currentTile.hasMycorrhiza) {
        a.hasParasite = false;
        a.hp = Math.min(a.maxHp, a.hp + 25);
        addParticle(a.gx, a.gz, 0 + 14, '🍄✨', '#00e676');
      }

      // 4. Mutualisme (+/+): Polinasi / penyebar biji oleh herbivora & pembersih parasit oleh bangau/katak
      if (HERBIVORES.includes(a.type) && (a.fullTimer > 0 || a.hunger < 45) && a.pollinationCooldown <= 0) {
        const prodTile = findNearestTile(a.gx, a.gz, 2.2, (t) => t.producerStage >= 2);
        if (prodTile) {
          symStats.mutual++;
          a.symbiosisBadge = '🤝 MUTUALISME (+/+)';
          if (showFoodWeb) {
            activeSymbioses.push({
              color: '#00e676',
              dashed: false,
              fromGx: a.gx,
              fromGz: a.gz,
              fromElev: 0 + 6,
              toGx: prodTile.gx + 0.5,
              toGz: prodTile.gz + 0.5,
              toElev: 0 + 5
            });
          }
          a.pollinationCooldown = 7.0;
          a.hp = Math.min(a.maxHp, a.hp + 8);
          const nx = Math.min(MAP_SIZE - 3, Math.max(2, prodTile.gx + (Math.random() < 0.5 ? 1 : -1)));
          const nz = Math.min(MAP_SIZE - 3, Math.max(2, prodTile.gz + (Math.random() < 0.5 ? 1 : -1)));
          if (!grid[nz][nx].isOceanMargin && grid[nz][nx].type === 'grass' && !grid[nz][nx].hasTree && grid[nz][nx].producerStage < 3) {
            grid[nz][nx].producerStage++;
          }
        }
      }

      if ((a.type === 'heron' || a.type === 'frog') && (a.fullTimer > 0 || a.hunger < 55)) {
        for (const other of animals) {
          if (other === a || !other.hasParasite) continue;
          if (Math.hypot(other.gx - a.gx, other.gz - a.gz) < 3.0) {
            symStats.mutual++;
            other.hasParasite = false;
            other.hp = Math.min(other.maxHp, other.hp + 20);
            a.hp = Math.min(a.maxHp, a.hp + 12);
            a.symbiosisBadge = '🤝 PEMBERSIH (+/+)';
            addParticle(other.gx, other.gz, 0 + 14, '🤝', '#00e676');
            break;
          }
        }
      }

            if (showFoodWeb) {
        for (const other of animals) {
          if (other === a || other.type === a.type) continue;
          const sameGuild =
            (HERBIVORES.includes(a.type) && HERBIVORES.includes(other.type)) ||
            (CARNIVORES.includes(a.type) && CARNIVORES.includes(other.type)) ||
            (APEXES.includes(a.type) && APEXES.includes(other.type));
          if (sameGuild && Math.hypot(other.gx - a.gx, other.gz - a.gz) < 4.2 && a.id < other.id) {
            const ox = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(other.gx)));
            const oz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(other.gz)));
            activeSymbioses.push({
              color: '#ffd740',
              dashed: true,
              fromGx: a.gx,
              fromGz: a.gz,
              fromElev: currentTile.elev + a.flyElev + 8,
              toGx: other.gx,
              toGz: other.gz,
              toElev: grid[oz][ox].elev + other.flyElev + 8
            });
            break;
          }
        }
      }

      // C2) Migration, Habitat Mismatch, Competition & Natural Selection (🧬 Beradaptasi vs 💀 Kalah Saing)!
      if (!a.isFly && (currentTile.isOceanMargin || currentTile.type === 'water')) {
        evacuateEntitiesFromTile(currentTile);
      }
      const nativeList = SPECIES_NATIVE_BIOMES[a.type] || ['grassland'];
      const allowMigrate = canSpeciesMigrate(a);
      const inForeignBiome = allowMigrate && !a.isAdapted && a.adaptedBiome !== currentTile.biome && !nativeList.includes(currentTile.biome);
      if (inForeignBiome) {
        // Count local native competitors of the same trophic level nearby!
        let localRivals = 0;
        for (let rIdx = 0; rIdx < animals.length; rIdx++) {
          const other = animals[rIdx];
          if (other === a || other.type === a.type) continue;
          const otherNative = (SPECIES_NATIVE_BIOMES[other.type] || []).includes(currentTile.biome) || other.isAdapted;
          const sameGuild =
            (HERBIVORES.includes(a.type) && HERBIVORES.includes(other.type)) ||
            (CARNIVORES.includes(a.type) && CARNIVORES.includes(other.type)) ||
            (APEXES.includes(a.type) && APEXES.includes(other.type));
          if (otherNative && sameGuild && Math.hypot(other.gx - a.gx, other.gz - a.gz) < 6.5) {
            localRivals++;
          }
        }
        a.foreignTimer = (a.foreignTimer || 0) + dt * (1.0 + localRivals * 0.45);
        a.symbiosisBadge = localRivals > 0 ? '😰 KALAH SAING DI BIOMA ASING' : '😰 STRES IKLIM ASING';
        a.stateLabel = 'BERJUANG DI BIOMA BARU...';
        if (a.foreignTimer >= 4.8) {
          const adaptChance = Math.max(0.20, 0.46 - localRivals * 0.10);
          const biomeLabel = (BIOME_PALETTES[currentTile.biome] && BIOME_PALETTES[currentTile.biome].shortName) || currentTile.biome;
          if (Math.random() < adaptChance) {
            a.isAdapted = true;
            a.adaptedBiome = currentTile.biome;
            a.foreignTimer = 0;
            a.hp = a.maxHp;
            a.symbiosisBadge = '🧬 BERADAPTASI!';
            a.stateLabel = `BERADAPTASI DI ${biomeLabel.toUpperCase()}!`;
            spawnRings.push({ gx: a.gx, gz: a.gz, elev: getTileLift(currentTile), color: '#00e676', life: 1.1, maxLife: 1.1 });
            addParticle(a.gx, a.gz, getTileLift(currentTile) + 18, '🧬✨ Adaptasi!', '#69f0ae');
            logEvent(`🧬 Hebat! ${a.def.name} yang pindah berhasil BERADAPTASI dengan lingkungan ${biomeLabel}!`);
          } else {
            addParticle(a.gx, a.gz, getTileLift(currentTile) + 16, '💀🥀 Kalah Saing', '#ff5252');
            logEvent(`💀 ${a.def.name} asal ${(BIOME_PALETTES[a.originBiome] && BIOME_PALETTES[a.originBiome].shortName) || 'bioma lain'} mati karena tak kuat iklim & kalah bersaing di ${biomeLabel}!`);
            animals.splice(i, 1);
            updateBalanceHUD();
            continue;
          }
        }
      } else {
        a.foreignTimer = Math.max(0, (a.foreignTimer || 0) - dt * 0.5);
        if (a.isAdapted && !a.symbiosisBadge) a.symbiosisBadge = '🧬 ADAPTASI';
      }

      // D) Rival Predator Territory Wars
      if ((APEXES.includes(a.type) || a.def.guild === 'carnivore_mid') && a.combatCooldown <= 0) {
        for (const other of animals) {
          if (other === a || other.type === a.type || other.combatPartner || other.eatingActive || other.combatCooldown > 0) continue;
          const bothApex = APEXES.includes(a.type) && APEXES.includes(other.type);
          const bothSnakes = a.def.guild === 'carnivore_mid' && other.def.guild === 'carnivore_mid';
          if ((bothApex || bothSnakes) && Math.hypot(other.gx - a.gx, other.gz - a.gz) < 2.4) {
            startCombat(a, other, true);
            break;
          }
        }
        if (a.combatPartner) continue;
      }

      // E) Satiety, Hunger & Thirst
      if (a.fullTimer > 0) {
        a.fullTimer = Math.max(0, a.fullTimer - dt);
        a.hunger = Math.max(0, a.hunger - dt * 0.5);
      } else {
        const drainScale = shelterTreeTile && a.isFly ? 0.65 : 1.0;
        a.hunger = Math.min(100, a.hunger + dt * 2.1 * drainScale);
      }
      a.thirst = Math.min(100, a.thirst + dt * 1.6);

      if (a.hunger >= 98 || a.thirst >= 98) {
        a.hp -= dt * 6.5;
      } else if (a.hunger < 55 && a.thirst < 55 && !a.hasParasite && a.hp < a.maxHp) {
        a.hp = Math.min(a.maxHp, a.hp + dt * 4);
      }

      if (a.hp <= 0) {
        if (currentTile.type === 'grass') {
          currentTile.hasMycorrhiza = true;
          if (currentTile.producerStage < 3) currentTile.producerStage++;
        }
        addParticle(a.gx, a.gz, 0 + 10, '♻️', '#a5d6a7');
        animals.splice(i, 1);
        updateBalanceHUD();
        continue;
      }

      if (a.interactTimer > 0) {
        a.interactTimer -= dt;
        continue;
      }

      a.targetEntity = null;
      a.targetTile = null;

      if (a.thirst > 54 && a.thirst >= a.hunger) {
        const shore = findNearestTile(a.gx, a.gz, 11, (t) => t.type === 'sand' || t.isRicePaddy);
        if (shore) {
          a.targetTile = shore;
          a.stateLabel = 'MINUM AIR';
          const dx = shore.gx + 0.5 - a.gx;
          const dz = shore.gz + 0.5 - a.gz;
          const d = Math.hypot(dx, dz);
          if (d < 0.78) {
            a.thirst = Math.max(0, a.thirst - 62);
            a.interactTimer = 0.9;
            addParticle(a.gx, a.gz, currentTile.elev + 14, '💧', '#4fc3f7');
            continue;
          } else {
            const spd = a.def.speed;
            a.vx = (dx / d) * spd;
            a.vz = (dz / d) * spd;
          }
        }
      } else if (a.fullTimer <= 0 && a.hunger > 34) {
        const preyList = a.def.prey || [];
        if (preyList.includes('producer')) {
          const grassTile = findNearestTile(a.gx, a.gz, 11, (t) => t.producerStage > 0);
          if (grassTile) {
            a.targetTile = grassTile;
            a.stateLabel = 'CARI RUMPUT';
            const dx = grassTile.gx + 0.5 - a.gx;
            const dz = grassTile.gz + 0.5 - a.gz;
            const d = Math.hypot(dx, dz);
            if (d < 0.72) {
              a.eatingActive = true;
              a.eatingProgress = 0;
              a.eatingDuration = a.def.eatDuration || 2.0;
              a.eatingTile = grassTile;
              a.eatingLabel = 'MAKAN RUMPUT';
              a.stateLabel = 'MAKAN RUMPUT';
              if (window.EcoAudio) window.EcoAudio.playEat(a.type);
              continue;
            } else {
              const spd = a.def.speed;
              a.vx = (dx / d) * spd;
              a.vz = (dz / d) * spd;
            }
          }
        } else if (a.combatCooldown <= 0) {
          const prey = findNearestPrey(a, preyList);
          if (prey) {
            a.targetEntity = prey;
            a.stateLabel = `MEMBURU ${prey.def.name}`;
            const dx = prey.gx - a.gx;
            const dz = prey.gz - a.gz;
            const d = Math.hypot(dx, dz);
            if (d < 1.05) {
              startCombat(a, prey, false);
              continue;
            } else {
              const spd = a.def.speed * 1.12;
              a.vx = (dx / d) * spd;
              a.vz = (dz / d) * spd;
            }
          }
        }
      } else {
        a.stateLabel = a.fullTimer > 0 ? 'KENYANG 😋' : 'BERKELANA';
        if (Math.random() < dt * 0.9) {
          const ang = Math.random() * Math.PI * 2;
          const spd = a.def.speed * 0.65;
          a.vx = Math.cos(ang) * spd;
          a.vz = Math.sin(ang) * spd;
        }
      }

      const nextX = a.gx + a.vx * dt;
      const nextZ = a.gz + a.vz * dt;
      const tx = Math.floor(nextX);
      const tz = Math.floor(nextZ);

      if (tx >= 2 && tx < MAP_SIZE - 2 && tz >= 2 && tz < MAP_SIZE - 2) {
        const nextTile = grid[tz][tx];
        const canEnterWater = a.isFly || a.type === 'water_bug' || a.type === 'frog';
        const isNativeTarget = nativeList.includes(nextTile.biome) || (a.isAdapted && a.adaptedBiome === nextTile.biome);
        const blockedByHabitatWall = !allowMigrate && !isNativeTarget && nativeList.includes(currentTile.biome);
        if ((nextTile.isOceanMargin && !a.isFly) || (!canEnterWater && nextTile.type === 'water') || blockedByHabitatWall) {
          a.vx = -a.vx;
          a.vz = -a.vz;
          if (blockedByHabitatWall) {
            const homeTile = findNearestTile(a.gx, a.gz, 8, (t) => !t.isOceanMargin && t.type !== 'water' && nativeList.includes(t.biome));
            if (homeTile) {
              const hx = homeTile.gx + 0.5 - a.gx;
              const hz = homeTile.gz + 0.5 - a.gz;
              const hd = Math.hypot(hx, hz) || 1;
              a.vx = (hx / hd) * a.def.speed * 0.7;
              a.vz = (hz / hd) * a.def.speed * 0.7;
            }
          }
        } else {
          a.gx = nextX;
          a.gz = nextZ;
        }
      } else {
        a.vx = -a.vx;
        a.vz = -a.vz;
      }

      const screenVelX = a.vx - a.vz;
      if (Math.abs(screenVelX) > 0.05) {
        a.facing = screenVelX >= 0 ? 1 : -1;
      }
    }

    for (let i = spawnRings.length - 1; i >= 0; i--) {
      spawnRings[i].life -= dt;
      if (spawnRings[i].life <= 0) spawnRings.splice(i, 1);
    }
    for (let i = fxParticles.length - 1; i >= 0; i--) {
      const p = fxParticles[i];
      p.elev += p.ve * dt;
      p.life -= dt;
      if (p.life <= 0) fxParticles.splice(i, 1);
    }
  }

  function findNearestTile(gx, gz, maxRadius, predicate) {
    let best = null;
    let bestD = Infinity;
    const minX = Math.max(0, Math.floor(gx - maxRadius));
    const maxX = Math.min(MAP_SIZE - 1, Math.ceil(gx + maxRadius));
    const minZ = Math.max(0, Math.floor(gz - maxRadius));
    const maxZ = Math.min(MAP_SIZE - 1, Math.ceil(gz + maxRadius));

    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const t = grid[z][x];
        if (!predicate(t)) continue;
        const d = Math.hypot(x + 0.5 - gx, z + 0.5 - gz);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
    }
    return best;
  }

  function findNearestPrey(hunter, preyTypes) {
    let best = null;
    let bestD = Infinity;
    for (const other of animals) {
      if (other === hunter || other.combatPartner || !preyTypes.includes(other.type)) continue;
      const d = Math.hypot(other.gx - hunter.gx, other.gz - hunter.gz);
      const effectiveDist = other.isSheltered ? d * 1.85 : d;
      if (effectiveDist < bestD && d < 12) {
        bestD = effectiveDist;
        best = other;
      }
    }
    return best;
  }

  function drawIsoBox3D(gx, gz, baseElev, rx, rz, h, topCol, leftCol, rightCol) {
    const p0 = projectIso(gx - rx, gz - rz, baseElev + h);
    const p1 = projectIso(gx + rx, gz - rz, baseElev + h);
    const p2 = projectIso(gx + rx, gz + rz, baseElev + h);
    const p3 = projectIso(gx - rx, gz + rz, baseElev + h);
    const drop = h * cam.zoom;

    ctx.fillStyle = leftCol;
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x, p2.y + drop);
    ctx.lineTo(p3.x, p3.y + drop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rightCol;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x, p2.y + drop);
    ctx.lineTo(p1.x, p1.y + drop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = topCol;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
  }

  // ===========================================================================
  // PERFORMA: lapisan daratan di-BAKE sekali ke kanvas offscreen (bukan digambar ulang tiap frame),
  // hanya air (animasi riak) + flora + pohon + hewan yang digambar dinamis, dan tint warna
  // di-cache (tanpa ctx.filter per frame).
  // ===========================================================================
  const TILE_DRAW_W = BASE_TW * 1.07;
  const BAKE_SCALE = 2;
  const tintCache = new WeakMap();
  let bgGradient = null;
  let bgGradientH = 0;
  let bakedProps = null;
  let hudDirty = false;
  let hudTimer = 0;
  const drawablesBuf = [];

  function tintedImage(img, filter) {
    if (!filter || !img) return img;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return img;
    let perImg = tintCache.get(img);
    if (!perImg) {
      perImg = new Map();
      tintCache.set(img, perImg);
    }
    let c = perImg.get(filter);
    if (!c) {
      c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cx = c.getContext('2d');
      cx.filter = filter;
      cx.drawImage(img, 0, 0);
      perImg.set(filter, c);
    }
    return c;
  }

  // Stepped 3-tier volumetric rocky hills so mountains look genuinely tall and monumental!
  function getTileLift(t) {
    if (!t || t.type === 'water' || t.elev <= 11.5) return 0;
    if (t.elev >= 21.5) return 56;
    if (t.elev >= 16.5) return 36;
    return 18;
  }

  function terrainReady() {
    return true;
  }

  function isoDiamondPath(cx, cy, hw, hh) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
  }

  function getPainterlyLandColor(t) {
    const n = Math.sin(t.gx * 0.42 + t.gz * 0.31) * 0.5 + Math.cos(t.gx * 0.19 - t.gz * 0.27) * 0.5;
    if (t.isRicePaddy) {
      return t.sawahRow % 2 === 0 ? '#6e5e3b' : '#73943f';
    }
    if (t.isPath) return '#b69760';
    if (t.type === 'sand') return n > 0 ? '#dfc58a' : '#d5b97d';
    if (t.biome === 'hills') return t.elev >= 25 ? '#96866d' : '#85775f';
    if (t.biome === 'desert') return n > 0.1 ? '#d4b372' : '#c6a25f';
    if (t.biome === 'swamp') return n > 0 ? '#5c6b3b' : '#535d37';
    if (t.biome === 'tropical') return n > 0.15 ? '#5f8b3c' : '#6c9844';
    // Grassland: organic blend of lush meadow green & warm Nusantara savanna tan
    return n > 0.18 ? '#c7a464' : n > -0.15 ? '#85ab4f' : '#739b43';
  }

  // Evaluates smooth macro biome/lighting once per 2x2 block while keeping shoreline & micro-grain 1x1 pixel-crisp (5x faster, <10ms brush rebake!)
  function evalMacroLandRGB(gx, gz) {
    const el = continuousElev(gx, gz);
    const shade = (continuousElev(gx - 0.55, gz - 0.55) - el) * 11.5;
    const n = fbm2(gx * 0.26 + 2.5, gz * 0.26 + 5.1);
    const turfClump = vnoise(gx * 2.9 + 1.1, gz * 2.9 + 3.7);
    const bw = getEffectiveBiomeWeights(gx, gz);

    const grR = 104 + n * 52 + (turfClump - 0.5) * 26;
    const grG = 154 + n * 24 + (turfClump - 0.5) * 28;
    const grB = 64 + n * 20 + (turfClump - 0.5) * 14;

    const trR = 76 + n * 28 + (turfClump - 0.5) * 22;
    const trG = 132 + n * 28 + (turfClump - 0.5) * 26;
    const trB = 52 + n * 16 + (turfClump - 0.5) * 12;

    const swR = 82 + n * 24 + (turfClump - 0.5) * 22;
    const swG = 104 + n * 22 + (turfClump - 0.5) * 20;
    const swB = 54 + n * 14 + (turfClump - 0.5) * 12;

    const duneRipple = Math.sin((gx * 1.55 + gz * 0.85) * 3.1 + n * 3.4) * 9;
    const deR = 208 + n * 18 + duneRipple + (turfClump - 0.5) * 14;
    const deG = 175 + n * 16 + duneRipple * 0.8 + (turfClump - 0.5) * 12;
    const deB = 112 + n * 14 + duneRipple * 0.5 + (turfClump - 0.5) * 10;

    const peR = 86 + n * 24 + (turfClump - 0.5) * 18;
    const peG = 92 + n * 18 + (turfClump - 0.5) * 16;
    const peB = 46 + n * 12 + (turfClump - 0.5) * 10;
    const peW = bw.peatland || 0;

    let r = grR * bw.grassland + trR * bw.tropical + swR * bw.swamp + deR * bw.desert + peR * peW;
    let g = grG * bw.grassland + trG * bw.tropical + swG * bw.swamp + deG * bw.desert + peG * peW;
    let b = grB * bw.grassland + trB * bw.tropical + swB * bw.swamp + deB * bw.desert + peB * peW;

    if (bw.desertEdge > 0.05) {
      const scrubPatch = smoothstep01(0.35, 0.75, turfClump) * Math.min(1, bw.desertEdge * 0.65);
      r = r * (1 - scrubPatch) + 158 * scrubPatch;
      g = g * (1 - scrubPatch) + 142 * scrubPatch;
      b = b * (1 - scrubPatch) + 84 * scrubPatch;
    }

    if (el > 12.5) {
      const rockT = Math.min(1, (el - 12.5) / 10.5);
      const mossMix = turfClump > 0.58 ? 0.35 : 0;
      const rkR = 142 * (1 - mossMix) + 98 * mossMix;
      const rkG = 132 * (1 - mossMix) + 128 * mossMix;
      const rkB = 108 * (1 - mossMix) + 72 * mossMix;
      r = r * (1 - rockT) + rkR * rockT;
      g = g * (1 - rockT) + rkG * rockT;
      b = b * (1 - rockT) + rkB * rockT;
    }

    // Key light: warm sun from top-left lights slopes facing it; Fill: cool sky bounce lifts shadowed slopes toward blue
    if (shade >= 0) {
      return { r: r * 1.04 + shade * 1.15, g: g * 1.01 + shade * 0.95, b: b * 0.95 + shade * 0.5 };
    }
    const sh = -shade;
    return { r: r * 1.0 - sh * 1.0, g: g - sh * 0.82, b: b - sh * 0.38 + sh * 0.22 };
  }

  function renderTerrainRegionPixels(data, bufW, pxStart, pyStart, regW, regH, minX, minY, S, rot) {
    const halfW = BASE_TW * 0.5 * S;
    const halfH = BASE_TH * 0.5 * S;
    const invHW = 0.5 / halfW;
    const invHH = 0.5 / halfH;
    const c = MAP_SIZE * 0.5;

    for (let by = 0; by < regH; by += 2) {
      const maxDy = by + 1 < regH ? 2 : 1;
      for (let bx = 0; bx < regW; bx += 2) {
        const maxDx = bx + 1 < regW ? 2 : 1;
        const pxM = pxStart + bx + 0.5;
        const pyM = pyStart + by + 0.5;
        const sxM = pxM + minX;
        const syM = pyM + minY;
        const rxM = sxM * invHW + syM * invHH;
        const rzM = syM * invHH - sxM * invHW;
        const dxM = rxM - c;
        const dzM = rzM - c;
        let gxM, gzM;
        if (rot === 0) { gxM = dxM + c; gzM = dzM + c; }
        else if (rot === 1) { gxM = dzM + c; gzM = -dxM + c; }
        else if (rot === 2) { gxM = -dxM + c; gzM = -dzM + c; }
        else { gxM = -dzM + c; gzM = dxM + c; }

        if (gxM < -6 || gzM < -6 || gxM > MAP_SIZE + 6 || gzM > MAP_SIZE + 6) continue;
        const coastM = islandCoastScore(gxM, gzM);
        if (coastM > 1.46) continue;

        let macro = null;
        const bedNoiseM = (vnoise(gxM * 2.8, gzM * 2.8) - 0.5) * 18;
        const rDistM = coastM <= 1.05 ? effectiveRiverDistance(gxM, gzM) : 3.0;
        const nearWaterEdge = rDistM > -0.35 && rDistM < 0.35;

        for (let dy = 0; dy < maxDy; dy++) {
          const ly = by + dy;
          const py = pyStart + ly;
          const sy = py + minY;
          for (let dx = 0; dx < maxDx; dx++) {
            const lx = bx + dx;
            const px = pxStart + lx;
            const sx = px + minX;
            const rx = sx * invHW + sy * invHH;
            const rz = sy * invHH - sx * invHW;
            const ddx = rx - c;
            const ddz = rz - c;
            let gx, gz;
            if (rot === 0) { gx = ddx + c; gz = ddz + c; }
            else if (rot === 1) { gx = ddz + c; gz = -ddx + c; }
            else if (rot === 2) { gx = -ddx + c; gz = -ddz + c; }
            else { gx = -ddz + c; gz = ddx + c; }

            const coast = (coastM > 0.84 && coastM < 1.45) ? islandCoastScore(gx, gz) : coastM;
            if (coast > 1.44) continue;

            const idx = (ly * bufW + lx) * 4;
            const fineGrain = (hash2(px * 0.91, py * 0.87) - 0.5) * 14;
            const bladeFleck = hash2(px * 1.7, (py >> 1) * 2.3) > 0.86 ? 12 : hash2(px * 2.1, py * 1.9) < 0.12 ? -10 : 0;
            const grain = fineGrain + bladeFleck;

            if (coast > 1.04) {
              const norm = (coast - 1.04) / 0.40;
              const tShallow = Math.pow(1 - norm, 1.35);
              const surfRim = norm < 0.09 ? (1 - norm / 0.09) * 85 : 0;
              data[idx] = Math.max(0, Math.min(255, (28 + tShallow * 58 + surfRim + bedNoiseM * 0.4) | 0));
              data[idx + 1] = Math.max(0, Math.min(255, (92 + tShallow * 122 + surfRim + bedNoiseM * 0.8) | 0));
              data[idx + 2] = Math.max(0, Math.min(255, (108 + tShallow * 114 + surfRim + bedNoiseM * 0.6) | 0));
              data[idx + 3] = Math.min(255, (tShallow * 255) | 0);
              continue;
            }

            const rDist = nearWaterEdge ? effectiveRiverDistance(gx, gz) : rDistM;
            if (rDist <= 0) {
              const depth = Math.min(1, -rDist / 1.35);
              const foam = rDist > -0.18 ? (1 - -rDist / 0.18) * 64 : 0;
              data[idx] = Math.max(0, Math.min(255, (88 - depth * 46 + foam + bedNoiseM * 0.5 + fineGrain * 0.3) | 0));
              data[idx + 1] = Math.max(0, Math.min(255, (192 - depth * 52 + foam + bedNoiseM * 0.7 + fineGrain * 0.3) | 0));
              data[idx + 2] = Math.max(0, Math.min(255, (198 - depth * 40 + foam + bedNoiseM * 0.6 + fineGrain * 0.3) | 0));
              data[idx + 3] = 255;
              continue;
            }

            if (!macro) macro = evalMacroLandRGB(gxM, gzM);
            let r = macro.r;
            let g = macro.g;
            let b = macro.b;

            const igx = Math.min(MAP_SIZE - 1, Math.max(0, gx | 0));
            const igz = Math.min(MAP_SIZE - 1, Math.max(0, gz | 0));
            const tileRef = grid[igz] && grid[igz][igx];
            if (tileRef && tileRef.isRicePaddy) {
              const muddy = tileRef.sawahRow % 2 === 0;
              r = muddy ? 114 : 112;
              g = muddy ? 96 : 150;
              b = muddy ? 64 : 68;
            } else if (tileRef && tileRef.isPath) {
              r = 176; g = 148; b = 98;
            }

            if (rDist < 1.55) {
              const bankT = 1 - rDist / 1.55;
              const pebble = fineGrain > 4.5 ? 16 : 0;
              r = r * (1 - bankT) + (156 + pebble) * bankT;
              g = g * (1 - bankT) + (144 + pebble) * bankT;
              b = b * (1 - bankT) + (96 + pebble) * bankT;
            }
            if (coast > 0.86) {
              const sandT = smoothstep01(0.86, 1.03, coast);
              const wetSand = coast > 0.99 ? (coast - 0.99) / 0.05 : 0;
              r = r * (1 - sandT) + (228 - wetSand * 34) * sandT;
              g = g * (1 - sandT) + (204 - wetSand * 30) * sandT;
              b = b * (1 - sandT) + (146 - wetSand * 22) * sandT;
            }

            data[idx] = Math.max(0, Math.min(255, (r + grain) | 0));
            data[idx + 1] = Math.max(0, Math.min(255, (g + grain) | 0));
            data[idx + 2] = Math.max(0, Math.min(255, (b + grain * 0.78) | 0));
            data[idx + 3] = 255;
          }
        }
      }
    }
  }

    function drawBakedHillCliffs(bctx, land, S, minX, minY, filterFn) {
    bctx.save();
    bctx.setTransform(1, 0, 0, 1, -minX, -minY);
    for (let i = 0; i < land.length; i++) {
      const t = land[i];
      if (filterFn && !filterFn(t)) continue;
      const lift = getTileLift(t);
      if (lift <= 0) continue;
      const p0 = projectIso(t.gx, t.gz, lift);
      const p1 = projectIso(t.gx + 1, t.gz, lift);
      const p2 = projectIso(t.gx + 1, t.gz + 1, lift);
      const p3 = projectIso(t.gx, t.gz + 1, lift);
      const dropY = (lift + 6) * S;

      bctx.fillStyle = lift >= 50 ? '#7c6e5b' : lift >= 30 ? '#706250' : '#655947';
      bctx.beginPath();
      bctx.moveTo(p3.x - 2, p3.y);
      bctx.lineTo(p2.x, p2.y + 1);
      bctx.lineTo(p2.x, p2.y + dropY);
      bctx.lineTo(p3.x - 2, p3.y + dropY);
      bctx.closePath();
      bctx.fill();

      bctx.fillStyle = lift >= 50 ? '#4e4437' : lift >= 30 ? '#453c30' : '#3c3429';
      bctx.beginPath();
      bctx.moveTo(p2.x, p2.y + 1);
      bctx.lineTo(p1.x + 2, p1.y);
      bctx.lineTo(p1.x + 2, p1.y + dropY);
      bctx.lineTo(p2.x, p2.y + dropY);
      bctx.closePath();
      bctx.fill();

      bctx.strokeStyle = 'rgba(28, 22, 16, 0.34)';
      bctx.lineWidth = 1.1;
      for (let step = 11 * S; step < dropY - 4 * S; step += 11 * S) {
        bctx.beginPath();
        bctx.moveTo(p3.x - 1, p3.y + step);
        bctx.lineTo(p2.x, p2.y + step);
        bctx.lineTo(p1.x + 1, p1.y + step);
        bctx.stroke();
      }
      bctx.strokeStyle = 'rgba(22, 18, 14, 0.28)';
      bctx.beginPath();
      const crX1 = (p3.x + p2.x) * 0.5;
      const crY1 = (p3.y + p2.y) * 0.5;
      bctx.moveTo(crX1, crY1 + 2);
      bctx.lineTo(crX1 + 1.5, crY1 + dropY * 0.72);
      const crX2 = (p2.x + p1.x) * 0.5;
      const crY2 = (p2.y + p1.y) * 0.5;
      bctx.moveTo(crX2, crY2 + 3);
      bctx.lineTo(crX2 - 1.5, crY2 + dropY * 0.78);
      bctx.stroke();

      const cx = (p0.x + p2.x) * 0.5;
      const cy = (p0.y + p2.y) * 0.5;
      const hw = BASE_TW * 0.56 * S;
      const hh = BASE_TH * 0.56 * S;
      const mossHint = hash2(t.gx * 1.7, t.gz * 2.3);
      bctx.fillStyle = lift >= 50
        ? (mossHint > 0.55 ? '#889468' : '#a4967e')
        : lift >= 30
          ? (mossHint > 0.42 ? '#789252' : '#8e846a')
          : '#6f9144';
      bctx.beginPath();
      bctx.moveTo(cx, cy - hh);
      bctx.lineTo(cx + hw, cy);
      bctx.lineTo(cx, cy + hh);
      bctx.lineTo(cx - hw, cy);
      bctx.closePath();
      bctx.fill();

      if (mossHint > 0.34) {
        bctx.fillStyle = lift >= 50 ? '#5c7c38' : '#4f772d';
        bctx.beginPath();
        bctx.ellipse(cx - hw * 0.38, cy + hh * 0.44, 6.5, 2.8, 0.42, 0, Math.PI * 2);
        bctx.ellipse(cx + hw * 0.32, cy + hh * 0.48, 5.5, 2.5, -0.42, 0, Math.PI * 2);
        bctx.fill();
      }

      // Key light rim on sun-facing plateau edge
      bctx.strokeStyle = 'rgba(255, 236, 190, 0.38)';
      bctx.lineWidth = 1.3;
      bctx.beginPath();
      bctx.moveTo(cx - hw, cy);
      bctx.lineTo(cx, cy - hh);
      bctx.lineTo(cx + hw, cy);
      bctx.stroke();
      // Warm key wash on sunlit (left) cliff face
      bctx.fillStyle = 'rgba(255, 196, 120, 0.12)';
      bctx.beginPath();
      bctx.moveTo(p3.x - 2, p3.y);
      bctx.lineTo(p2.x, p2.y + 1);
      bctx.lineTo(p2.x, p2.y + dropY * 0.55);
      bctx.lineTo(p3.x - 2, p3.y + dropY * 0.55);
      bctx.closePath();
      bctx.fill();
      // Cool rim light on the back edge of the shaded (right) cliff face
      bctx.strokeStyle = 'rgba(160, 214, 255, 0.36)';
      bctx.lineWidth = 1.2;
      bctx.beginPath();
      bctx.moveTo(p1.x + 1.5, p1.y + 1);
      bctx.lineTo(p1.x + 1.5, p1.y + dropY * 0.85);
      bctx.moveTo(cx + hw, cy);
      bctx.lineTo(cx, cy + hh);
      bctx.stroke();

      if (t.propType === 'mossy_rock' || (lift >= 30 && hash2(t.gx * 2.3, t.gz * 1.9) > 0.45)) {
        const bx = cx + (hash2(t.gx, t.gz) - 0.5) * 14;
        const by = cy + (hash2(t.gz, t.gx) - 0.5) * 5;
        const br = 5.5 + hash2(t.gx * 3, t.gz * 5) * 5.0;
        bctx.fillStyle = 'rgba(20, 22, 14, 0.34)';
        bctx.beginPath();
        bctx.ellipse(bx + 4.5, by + 2.5, br * 1.15, br * 0.55, 0.25, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = '#685b4a';
        bctx.beginPath();
        bctx.ellipse(bx + 1, by, br, br * 0.72, 0, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = '#aba08b';
        bctx.beginPath();
        bctx.ellipse(bx - 1.2, by - 1.6, br * 0.72, br * 0.48, 0, 0, Math.PI * 2);
        bctx.fill();
      }
    }
    bctx.restore();
  }

  function bakeTerrainLayer(rot) {
    const tiles = sortedTilesByRot[rot];
    if (!tiles || tiles.length === 0) return null;
    const S = 1.15; // Crisp terrain base (paired with 3x HD props & vector close-up detail, 2x faster & half VRAM!)
    const saved = { x: cam.x, y: cam.y, zoom: cam.zoom, rot: cam.rot, vw: viewW, vh: viewH, ctx };
    cam.x = 0; cam.y = 0; cam.zoom = S; cam.rot = rot; viewW = 0; viewH = 0;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      const lift = getTileLift(t);
      const pTop = projectIso(t.gx + 0.5, t.gz + 0.5, lift);
      const pBot = projectIso(t.gx + 0.5, t.gz + 0.5, 0);
      minX = Math.min(minX, pBot.x - BASE_TW * 2.2 * S);
      maxX = Math.max(maxX, pBot.x + BASE_TW * 2.2 * S);
      minY = Math.min(minY, pTop.y - (BASE_TH * 2.4 + 20) * S);
      maxY = Math.max(maxY, pBot.y + (BASE_TH * 2.4 + 24) * S);
    }
    const w = Math.ceil(maxX - minX);
    const h = Math.ceil(maxY - minY);
    const cv = terrainCache && terrainCache.canvas ? terrainCache.canvas : document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const bctx = cv.getContext('2d');

    const imgData = typeof bctx.createImageData === 'function' ? bctx.createImageData(w, h) : null;
    if (imgData && imgData.data) {
      renderTerrainRegionPixels(imgData.data, w, 0, 0, w, h, minX, minY, S, rot);
      bctx.putImageData(imgData, 0, 0);
      drawBakedHillCliffs(bctx, landTilesByRot[rot] || [], S, minX, minY, null);
    }

    cam.x = saved.x; cam.y = saved.y; cam.zoom = saved.zoom; cam.rot = saved.rot; viewW = saved.vw; viewH = saved.vh;
    terrainCache = { canvas: cv, rot, gen: mapGeneration, minX, minY, w, h, scale: S };
    return terrainCache;
  }

  // Ultra-fast (~3–8ms) Localized Sub-Rect Terrain Rebake: updates ONLY the edited brush neighborhood with zero lag/stutter!
  function rebakeTerrainSubRect(centerGx, centerGz, tileRadius = 1.85) {
    if (!terrainCache || !terrainCache.canvas) return;
    const S = terrainCache.scale || 1.15;
    const rot = terrainCache.rot;
    const bctx = terrainCache.canvas.getContext('2d');
    if (!bctx || typeof bctx.createImageData !== 'function') return;

    // Check if any elevated hill tile exists near this brush so flat terrain uses a tight minimal bounding box!
    let maxLift = 0;
    const g0x = Math.max(0, Math.floor(centerGx - tileRadius - 0.8));
    const g1x = Math.min(MAP_SIZE - 1, Math.ceil(centerGx + tileRadius + 0.8));
    const g0z = Math.max(0, Math.floor(centerGz - tileRadius - 0.8));
    const g1z = Math.min(MAP_SIZE - 1, Math.ceil(centerGz + tileRadius + 0.8));
    for (let zz = g0z; zz <= g1z; zz++) {
      for (let xx = g0x; xx <= g1x; xx++) {
        const l = getTileLift(grid[zz] && grid[zz][xx]);
        if (l > maxLift) maxLift = l;
      }
    }

    const saved = { x: cam.x, y: cam.y, zoom: cam.zoom, rot: cam.rot, vw: viewW, vh: viewH };
    cam.x = 0; cam.y = 0; cam.zoom = S; cam.rot = rot; viewW = 0; viewH = 0;

    const cPt = projectIso(centerGx, centerGz, 0);
    const halfSpanX = Math.ceil((tileRadius + 0.9) * BASE_TW * S);
    const halfSpanY = Math.ceil((tileRadius + 0.9) * BASE_TH * S);
    const px0 = Math.max(0, Math.floor(cPt.x - terrainCache.minX - halfSpanX));
    const py0 = Math.max(0, Math.floor(cPt.y - terrainCache.minY - halfSpanY - maxLift * S));
    const px1 = Math.min(terrainCache.w, Math.ceil(cPt.x - terrainCache.minX + halfSpanX));
    const py1 = Math.min(terrainCache.h, Math.ceil(cPt.y - terrainCache.minY + halfSpanY + 8 * S));
    const subW = px1 - px0;
    const subH = py1 - py0;

    if (subW > 2 && subH > 2) {
      const subImg = bctx.createImageData(subW, subH);
      if (subImg && subImg.data) {
        renderTerrainRegionPixels(subImg.data, subW, px0, py0, subW, subH, terrainCache.minX, terrainCache.minY, S, rot);
        bctx.putImageData(subImg, px0, py0);
      }

      if (maxLift > 0) {
        bctx.save();
        bctx.beginPath();
        bctx.rect(px0, py0, subW, subH);
        bctx.clip();
        drawBakedHillCliffs(
          bctx,
          landTilesByRot[rot] || [],
          S,
          terrainCache.minX,
          terrainCache.minY,
          (t) => t.gx >= g0x && t.gx <= g1x && t.gz >= g0z && t.gz <= g1z
        );
        bctx.restore();
      }
    }

    cam.x = saved.x; cam.y = saved.y; cam.zoom = saved.zoom; cam.rot = saved.rot; viewW = saved.vw; viewH = saved.vh;
  }

    function ensureTerrainCache() {
    if (!terrainReady()) return null;
    if (terrainCache && terrainCache.rot === cam.rot && terrainCache.gen === mapGeneration) return terrainCache;
    return bakeTerrainLayer(cam.rot);
  }

  function drawTerrainCache(c, cw, ch) {
    const k = cam.zoom / c.scale;
    const dx = viewW / 2 + cam.x + c.minX * k;
    const dy = viewH * 0.14 + cam.y + c.minY * k;
    const sx0 = Math.max(0, Math.floor(-dx / k));
    const sy0 = Math.max(0, Math.floor(-dy / k));
    const sx1 = Math.min(c.w, Math.ceil((cw - dx) / k));
    const sy1 = Math.min(c.h, Math.ceil((ch - dy) / k));
    if (sx1 <= sx0 || sy1 <= sy0) return;
    ctx.drawImage(c.canvas, sx0, sy0, sx1 - sx0, sy1 - sy0, dx + sx0 * k, dy + sy0 * k, (sx1 - sx0) * k, (sy1 - sy0) * k);
  }

  // Calm animated river/lake shimmer streaks (lightweight, zero sprite-sheet overhead)
  const PROP_SS = 3; // 3x Super-Sampled Vector-to-Bitmap HD Props: razor-sharp even at 2.8x max zoom!
  function makePropSprite(w, h, drawFn) {
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * PROP_SS);
    cv.height = Math.round(h * PROP_SS);
    cv.lw = w;
    cv.lh = h;
    const c = cv.getContext('2d');
    if (c) {
      c.save();
      c.scale(PROP_SS, PROP_SS);
      drawFn(c, w, h);
      c.restore();
    }
    return cv;
  }

  // High-Detail 4-Frame Animated Nusantara Female Sprite Sheets (Steward in Kebaya & Batik + Bakul, Destroyer in Crimson)
  function ensureFemaleSheets() {
    if (femaleSheets) return femaleSheets;
    const makeSheet = (isDest) => {
      const fw = 128;
      const fh = 128;
      const cv = document.createElement('canvas');
      cv.width = fw * 4;
      cv.height = fh;
      const c = cv.getContext('2d');
      if (!c) return cv;
      for (let f = 0; f < 4; f++) {
        const ox = f * fw + 64;
        const oy = 108;
        const stride = [0, 1, 0, -1][f];
        const bob = f % 2 === 1 ? -3 : 0;

        // Hair back (long dark Nusantara hair + sanggul bun)
        c.fillStyle = '#1b120c';
        c.beginPath();
        c.arc(ox, oy - 74 + bob, 16, 0, Math.PI * 2);
        c.arc(ox - 13, oy - 68 + bob, 9, 0, Math.PI * 2);
        c.fill();
        // Jasmine / gold tusuk konde hair ornament
        c.fillStyle = isDest ? '#ff5252' : '#ffd54f';
        c.beginPath();
        c.arc(ox - 14, oy - 74 + bob, 4, 0, Math.PI * 2);
        c.fill();
        if (!isDest) {
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(ox - 11, oy - 67 + bob, 3, 0, Math.PI * 2);
          c.fill();
        }

        // Legs / feet stepping beneath batik sarong
        c.fillStyle = '#d9a17c';
        c.fillRect(ox - 9 + stride * 5, oy - 12, 6, 11);
        c.fillRect(ox + 3 - stride * 5, oy - 12, 6, 11);
        c.fillStyle = '#3e2723';
        c.fillRect(ox - 10 + stride * 5, oy - 3, 8, 4);
        c.fillRect(ox + 2 - stride * 5, oy - 3, 8, 4);

        // Kain Batik Sarong Skirt (rich warm brown with gold parang dots)
        c.fillStyle = isDest ? '#4a1414' : '#6d4124';
        c.beginPath();
        c.moveTo(ox - 13, oy - 36 + bob);
        c.lineTo(ox + 13, oy - 36 + bob);
        c.lineTo(ox + 16, oy - 10);
        c.lineTo(ox - 16, oy - 10);
        c.closePath();
        c.fill();
        c.fillStyle = isDest ? '#ff8a65' : '#e6be74';
        for (let py = -32; py <= -15; py += 6) {
          for (let px = -10; px <= 10; px += 7) {
            c.fillRect(ox + px + ((py % 12 === 0) ? 2 : 0), oy + py + bob, 2.5, 2.5);
          }
        }

        // Kebaya Tunic Top (emerald-teal for Steward, crimson for Destroyer)
        c.fillStyle = isDest ? '#b71c1c' : '#1f7a5c';
        c.beginPath();
        c.moveTo(ox - 14, oy - 56 + bob);
        c.lineTo(ox + 14, oy - 56 + bob);
        c.lineTo(ox + 13, oy - 33 + bob);
        c.lineTo(ox - 13, oy - 33 + bob);
        c.closePath();
        c.fill();

        // Diagonal Selendang Sash (golden-amber / rose)
        c.strokeStyle = isDest ? '#ff5252' : '#f4b400';
        c.lineWidth = 4.5;
        c.beginPath();
        c.moveTo(ox - 11, oy - 55 + bob);
        c.lineTo(ox + 11, oy - 34 + bob);
        c.stroke();

        // Head & warm face with gentle eyes
        c.fillStyle = '#ebB48e';
        c.beginPath();
        c.arc(ox + 1, oy - 71 + bob, 13.5, 0, Math.PI * 2);
        c.fill();
        // Front bangs
        c.fillStyle = '#24160e';
        c.beginPath();
        c.arc(ox + 1, oy - 75 + bob, 13.5, Math.PI * 1.05, Math.PI * 1.98);
        c.fill();
        // Eyes & smile
        c.fillStyle = '#1f130c';
        c.fillRect(ox + 3, oy - 73 + bob, 2.8, 3.2);
        c.fillRect(ox + 9, oy - 73 + bob, 2.6, 3.2);
        c.fillStyle = isDest ? '#ff1744' : '#e57373';
        c.fillRect(ox + 5, oy - 66 + bob, 4.5, 2);

        // Swinging Arms + Woven Seed Basket (Bakul) or Torch
        c.strokeStyle = isDest ? '#8e0000' : '#268c6b';
        c.lineWidth = 5.5;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(ox - 11, oy - 52 + bob);
        c.lineTo(ox - 15 - stride * 4, oy - 36 + bob);
        c.moveTo(ox + 11, oy - 52 + bob);
        c.lineTo(ox + 16 + stride * 4, oy - 37 + bob);
        c.stroke();

        if (!isDest) {
          // Woven bamboo seed basket with flowers/sprouts
          const bx = ox + 17 + stride * 3;
          const by = oy - 35 + bob;
          c.fillStyle = '#a87438';
          c.beginPath();
          c.arc(bx, by, 8, 0, Math.PI);
          c.fill();
          c.fillStyle = '#66bb6a';
          c.beginPath();
          c.arc(bx - 2, by - 2, 3.5, 0, Math.PI * 2);
          c.arc(bx + 3, by - 2, 3.2, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ffd54f';
          c.fillRect(bx, by - 4, 2.5, 2.5);
        } else {
          // Fiery torch in hand
          const tx = ox + 18 + stride * 3;
          const ty = oy - 44 + bob;
          c.fillStyle = '#4e342e';
          c.fillRect(tx - 1.5, ty, 3, 13);
          c.fillStyle = '#ff6d00';
          c.beginPath();
          c.arc(tx, ty - 3, 5.5, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#fff59d';
          c.beginPath();
          c.arc(tx, ty - 3, 2.6, 0, Math.PI * 2);
          c.fill();
        }
      }
      return cv;
    };
    femaleSheets = {
      steward: makeSheet(false),
      destroyer: makeSheet(true)
    };
    return femaleSheets;
  }

  function ensureBakedProps() {
    if (bakedProps) return bakedProps;
    const drawCanopyTree = (c, w, h, tropical, mangrove) => {
      const bx = w * 0.5;
      const by = h - 10;
      // Angled soft shadow
      c.fillStyle = 'rgba(18, 22, 10, 0.28)';
      c.beginPath();
      c.ellipse(bx + 9, by + 2.5, 14, 5.8, 0.28, 0, Math.PI * 2);
      c.fill();
      if (mangrove) {
        c.strokeStyle = '#4a331d';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(bx - 5, by + 1);
        c.quadraticCurveTo(bx - 2, by - 5, bx, by - 8);
        c.moveTo(bx + 5, by + 1);
        c.quadraticCurveTo(bx + 2, by - 5, bx, by - 8);
        c.stroke();
      }
      // Textured trunk
      c.fillStyle = '#4a301a';
      c.beginPath();
      c.moveTo(bx - 3, by);
      c.lineTo(bx - 1.8, by - 14);
      c.lineTo(bx + 1.8, by - 14);
      c.lineTo(bx + 3, by);
      c.closePath();
      c.fill();
      c.fillStyle = '#6d4c30';
      c.fillRect(bx - 1.6, by - 13, 1.4, 12);
      const cx = bx;
      const cy = by - 17;
      // Deep shadow canopy
      c.fillStyle = '#1b3d15';
      c.beginPath();
      c.arc(cx + 3.5, cy + 2.5, 8, 0, Math.PI * 2);
      c.arc(cx - 4.5, cy + 2.8, 7.2, 0, Math.PI * 2);
      c.arc(cx + 0.5, cy + 3.2, 7.6, 0, Math.PI * 2);
      c.fill();
      // Mid foliage lobes
      c.fillStyle = tropical ? '#2e6620' : '#3a7328';
      c.beginPath();
      c.arc(cx, cy - 0.5, 7.6, 0, Math.PI * 2);
      c.arc(cx - 5.6, cy + 0.8, 6.2, 0, Math.PI * 2);
      c.arc(cx + 5.4, cy + 0.5, 6.0, 0, Math.PI * 2);
      c.arc(cx + 1.5, cy - 4.5, 5.8, 0, Math.PI * 2);
      c.fill();
      // Sunlit leaf dapple
      c.fillStyle = tropical ? '#4c8e32' : '#5b9b3a';
      c.beginPath();
      c.arc(cx - 2.6, cy - 4.2, 5.4, 0, Math.PI * 2);
      c.arc(cx - 5.2, cy - 1, 4.0, 0, Math.PI * 2);
      c.arc(cx + 2, cy - 2.8, 3.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#7bb84e';
      c.beginPath();
      c.arc(cx - 3.4, cy - 5.4, 2.8, 0, Math.PI * 2);
      c.arc(cx - 5.6, cy - 2, 2.0, 0, Math.PI * 2);
      c.fill();
    };

    bakedProps = {
      tree_grass: makePropSprite(56, 52, (c, w, h) => drawCanopyTree(c, w, h, false, false)),
      tree_tropical: makePropSprite(56, 52, (c, w, h) => drawCanopyTree(c, w, h, true, false)),
      tree_mangrove: makePropSprite(56, 52, (c, w, h) => drawCanopyTree(c, w, h, true, true)),
      tree_peat: makePropSprite(56, 54, (c, w, h) => drawCanopyTree(c, w, h, true, true)),
      tree_palm: makePropSprite(56, 54, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 10;
        c.fillStyle = 'rgba(18, 22, 10, 0.26)';
        c.beginPath();
        c.ellipse(bx + 9, by + 2.5, 13, 5, 0.28, 0, Math.PI * 2);
        c.fill();
        const topX = bx + 2.5;
        const topY = by - 26;
        c.strokeStyle = '#5a3d24';
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(bx, by);
        c.quadraticCurveTo(bx + 4, by - 13, topX, topY);
        c.stroke();
        c.strokeStyle = '#85603e';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(bx - 0.8, by - 1);
        c.quadraticCurveTo(bx + 3, by - 13, topX - 0.6, topY);
        c.stroke();
        c.fillStyle = '#4a301c';
        c.beginPath();
        c.arc(topX - 1.5, topY + 1.5, 1.8, 0, Math.PI * 2);
        c.arc(topX + 1.5, topY + 1.5, 1.7, 0, Math.PI * 2);
        c.fill();
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * Math.PI * 2 + 0.2;
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const mx = topX + cosA * 7.5;
          const my = topY + sinA * 3.5 - 3.2;
          const ex = topX + cosA * 14.5;
          const ey = topY + sinA * 6.5 + 4.5;
          const px = -sinA * 2.5;
          const py = cosA * 1.4;
          c.fillStyle = k % 2 === 0 ? '#31641e' : '#457e2c';
          c.beginPath();
          c.moveTo(topX, topY);
          c.quadraticCurveTo(mx + px, my + py - 1.5, ex, ey);
          c.quadraticCurveTo(mx - px, my - py + 1.5, topX, topY);
          c.fill();
        }
      }),
      tree_pine: makePropSprite(54, 64, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 10;
        // Crisp mountain pine drop shadow
        c.fillStyle = 'rgba(14, 20, 10, 0.32)';
        c.beginPath();
        c.ellipse(bx + 8, by + 2.5, 13, 5.5, 0.26, 0, Math.PI * 2);
        c.fill();
        // Rugged conifer trunk
        c.fillStyle = '#4a2e18';
        c.fillRect(bx - 2.6, by - 13, 5.2, 13);
        c.fillStyle = '#6d4728';
        c.fillRect(bx - 2.0, by - 12, 1.8, 11);
        // 4 layered conical pine needle tiers (deep spruce shadow + sunlit alpine emerald)
        const tiers = [
          { y: by - 10, rW: 16, rH: 13 },
          { y: by - 19, rW: 13.5, rH: 12.5 },
          { y: by - 28, rW: 10.5, rH: 11.5 },
          { y: by - 36, rW: 7.2, rH: 11 }
        ];
        for (let tIdx = 0; tIdx < tiers.length; tIdx++) {
          const tr = tiers[tIdx];
          c.fillStyle = '#1b3f20';
          c.beginPath();
          c.moveTo(bx, tr.y - tr.rH);
          c.lineTo(bx + tr.rW, tr.y + 2);
          c.lineTo(bx, tr.y + 4.5);
          c.lineTo(bx - tr.rW, tr.y + 2);
          c.closePath();
          c.fill();
          // Sunlit left boughs
          c.fillStyle = tIdx % 2 === 0 ? '#2f6a31' : '#387838';
          c.beginPath();
          c.moveTo(bx, tr.y - tr.rH);
          c.lineTo(bx + tr.rW * 0.25, tr.y + 3);
          c.lineTo(bx - tr.rW * 0.92, tr.y + 1.5);
          c.closePath();
          c.fill();
          c.fillStyle = '#559c49';
          c.beginPath();
          c.moveTo(bx, tr.y - tr.rH);
          c.lineTo(bx - tr.rW * 0.25, tr.y + 0.5);
          c.lineTo(bx - tr.rW * 0.72, tr.y + 0.5);
          c.closePath();
          c.fill();
        }
      }),
      tree_cactus: makePropSprite(36, 42, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 8;
        c.fillStyle = 'rgba(18, 22, 10, 0.25)';
        c.beginPath();
        c.ellipse(bx + 6, by + 2, 9, 4, 0.28, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#3c6b27';
        c.fillRect(bx - 2.6, by - 20, 5.2, 20);
        c.fillStyle = '#5c9340';
        c.fillRect(bx - 2, by - 19, 2, 18);
        c.fillStyle = '#477a30';
        c.fillRect(bx - 7, by - 15, 4.5, 3);
        c.fillRect(bx - 7, by - 18, 2.8, 5);
        c.fillRect(bx + 2.5, by - 12, 4.5, 3);
        c.fillRect(bx + 4.2, by - 15, 2.8, 5);
      }),
      grass_1: makePropSprite(24, 22, (c) => {
        c.strokeStyle = '#3d7a24'; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(8, 18); c.lineTo(6, 10);
        c.moveTo(12, 18); c.lineTo(12, 8);
        c.moveTo(16, 18); c.lineTo(18, 11);
        c.stroke();
      }),
      grass_2: makePropSprite(24, 24, (c) => {
        c.fillStyle = 'rgba(20, 32, 10, 0.2)';
        c.beginPath(); c.ellipse(13, 19, 7, 3, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#3d7a24'; c.lineWidth = 2.1;
        c.beginPath();
        c.moveTo(7, 19); c.lineTo(5, 8);
        c.moveTo(10, 19); c.lineTo(9, 6);
        c.moveTo(14, 19); c.lineTo(15, 6);
        c.moveTo(17, 19); c.lineTo(19, 9);
        c.stroke();
      }),
      grass_3: makePropSprite(24, 26, (c) => {
        c.fillStyle = 'rgba(20, 32, 10, 0.22)';
        c.beginPath(); c.ellipse(13, 21, 8, 3.5, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#387520'; c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(6, 21); c.lineTo(4, 9);
        c.moveTo(10, 21); c.lineTo(9, 5);
        c.moveTo(14, 21); c.lineTo(15, 6);
        c.moveTo(18, 21); c.lineTo(20, 9);
        c.stroke();
        c.fillStyle = '#fff176';
        c.beginPath(); c.arc(12, 7, 2, 0, Math.PI * 2); c.fill();
      }),
      mushroom: makePropSprite(20, 20, (c) => {
        c.fillStyle = '#f5e6c8'; c.fillRect(8.5, 11, 3, 6);
        c.fillStyle = '#e65100'; c.beginPath(); c.arc(10, 11, 5.2, Math.PI, 0); c.closePath(); c.fill();
        c.fillStyle = '#fff8e1'; c.beginPath(); c.arc(8.5, 9, 1.2, 0, Math.PI * 2); c.arc(11.8, 9.8, 1, 0, Math.PI * 2); c.fill();
      }),
      rock: makePropSprite(24, 20, (c) => {
        c.fillStyle = 'rgba(20, 24, 14, 0.25)';
        c.beginPath(); c.ellipse(14, 14, 7.5, 3.8, 0.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6f6556';
        c.beginPath(); c.ellipse(11, 12, 6.5, 4.4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#9e927f';
        c.beginPath(); c.ellipse(10, 10.6, 4.5, 2.8, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#5c913b';
        c.beginPath(); c.arc(9.5, 9.8, 1.8, 0, Math.PI * 2); c.fill();
      }),
      sapling_1: makePropSprite(22, 24, (c) => {
        c.fillStyle = '#5c3c22'; c.fillRect(10, 14, 2, 6);
        c.fillStyle = '#387624'; c.beginPath(); c.arc(11, 13, 3.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6eb544'; c.beginPath(); c.arc(10, 12, 2.2, 0, Math.PI * 2); c.fill();
      }),
      sapling_2: makePropSprite(26, 28, (c) => {
        c.fillStyle = '#5c3c22'; c.fillRect(11.5, 13, 3, 10);
        c.fillStyle = '#387624'; c.beginPath(); c.arc(13, 12, 5.8, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6eb544'; c.beginPath(); c.arc(11.5, 10.5, 3.4, 0, Math.PI * 2); c.fill();
      }),
      stump: makePropSprite(18, 16, (c) => {
        c.fillStyle = '#5d4037'; c.fillRect(6, 7, 6, 6);
        c.fillStyle = '#d7b899'; c.beginPath(); c.ellipse(9, 7, 3.2, 1.6, 0, 0, Math.PI * 2); c.fill();
      }),
      sawit: makePropSprite(54, 52, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 9;
        c.fillStyle = 'rgba(28, 22, 12, 0.28)';
        c.beginPath(); c.ellipse(bx + 7, by + 2, 13, 5.5, 0.25, 0, Math.PI * 2); c.fill();
        // Thick patterned Oil-Palm trunk
        c.fillStyle = '#5d4037';
        c.fillRect(bx - 3.5, by - 16, 7, 16);
        c.fillStyle = '#8d6e63';
        for (let ty = 3; ty < 15; ty += 4) c.fillRect(bx - 3, by - ty, 6, 1.6);
        // Red-orange palm fruit bunches
        c.fillStyle = '#e65100';
        c.beginPath();
        c.arc(bx - 2.5, by - 15.5, 2.5, 0, Math.PI * 2);
        c.arc(bx + 2.5, by - 15.5, 2.5, 0, Math.PI * 2);
        c.fill();
        // Stiff olive-yellow monoculture fronds
        const topY = by - 17;
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const ex = bx + cosA * 18;
          const ey = topY + sinA * 7 + 1.5;
          c.strokeStyle = k % 2 === 0 ? '#558b2f' : '#7cb342';
          c.lineWidth = 2.6;
          c.beginPath();
          c.moveTo(bx, topY);
          c.quadraticCurveTo(bx + cosA * 10, topY + sinA * 3 - 4, ex, ey);
          c.stroke();
        }
      }),
      hut: makePropSprite(52, 52, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 9;
        c.fillStyle = 'rgba(18, 16, 10, 0.34)';
        c.beginPath(); c.ellipse(bx + 5, by + 2.5, 16, 6.5, 0.2, 0, Math.PI * 2); c.fill();
        // Stone plinth + wooden steps
        c.fillStyle = '#6e6355';
        c.fillRect(bx - 12, by - 4, 24, 4);
        // Warm carved timber walls + plank lines
        c.fillStyle = '#966136';
        c.fillRect(bx - 11, by - 16, 22, 12);
        c.fillStyle = '#663e1f';
        c.fillRect(bx + 1, by - 16, 10, 12);
        c.strokeStyle = 'rgba(42, 24, 11, 0.38)';
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(bx - 11, by - 12); c.lineTo(bx + 11, by - 12);
        c.moveTo(bx - 11, by - 8); c.lineTo(bx + 11, by - 8);
        c.stroke();
        // Door + warm glowing lantern window!
        c.fillStyle = '#2b180b';
        c.fillRect(bx - 3.5, by - 11, 5, 7);
        c.fillStyle = '#ffe082';
        c.fillRect(bx - 9, by - 13, 3.6, 3.6);
        c.fillRect(bx + 4.5, by - 13, 3.6, 3.6);
        c.strokeStyle = '#3e2412'; c.lineWidth = 0.7;
        c.strokeRect(bx - 9, by - 13, 3.6, 3.6);
        // Nusantara pitched terracotta/ijuk roof + ridge ornaments
        c.fillStyle = '#9c3b1e';
        c.beginPath();
        c.moveTo(bx, by - 30);
        c.lineTo(bx + 16.5, by - 15);
        c.lineTo(bx - 16.5, by - 15);
        c.closePath();
        c.fill();
        c.fillStyle = '#c75630';
        c.beginPath();
        c.moveTo(bx, by - 30);
        c.lineTo(bx + 1, by - 15);
        c.lineTo(bx - 16.5, by - 15);
        c.closePath();
        c.fill();
        c.strokeStyle = '#f4d38c';
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(bx - 16.5, by - 15); c.lineTo(bx + 16.5, by - 15);
        c.moveTo(bx - 3, by - 30); c.lineTo(bx + 3, by - 30);
        c.stroke();
      }),
      hut_lumbung: makePropSprite(54, 56, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 9;
        c.fillStyle = 'rgba(18, 16, 10, 0.34)';
        c.beginPath(); c.ellipse(bx + 5, by + 2.5, 16, 6.5, 0.2, 0, Math.PI * 2); c.fill();
        // Wooden stilts (Rumah Panggung Nusantara)
        c.fillStyle = '#4e321b';
        c.fillRect(bx - 9, by - 7, 2.4, 7);
        c.fillRect(bx - 2, by - 7, 2.4, 7);
        c.fillRect(bx + 6.5, by - 7, 2.4, 7);
        // Bamboo ladder
        c.strokeStyle = '#b88b4a'; c.lineWidth = 1.0;
        c.beginPath(); c.moveTo(bx - 5, by); c.lineTo(bx - 3, by - 8); c.moveTo(bx - 2.5, by); c.lineTo(bx - 0.5, by - 8); c.stroke();
        // Raised timber cabin + warm window
        c.fillStyle = '#8d5b32';
        c.fillRect(bx - 11, by - 19, 22, 12);
        c.fillStyle = '#5d391c';
        c.fillRect(bx + 1, by - 19, 10, 12);
        c.fillStyle = '#ffd54f';
        c.fillRect(bx - 7.5, by - 16, 4, 4);
        c.fillStyle = '#2b180b';
        c.fillRect(bx - 2, by - 15, 4.5, 8);
        // Curved Nusantara saddle roof
        c.fillStyle = '#6d4122';
        c.beginPath();
        c.moveTo(bx - 16, by - 34);
        c.quadraticCurveTo(bx, by - 26, bx + 16, by - 34);
        c.lineTo(bx + 15, by - 18);
        c.lineTo(bx - 15, by - 18);
        c.closePath();
        c.fill();
        c.strokeStyle = '#f4d38c';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(bx - 16, by - 34);
        c.quadraticCurveTo(bx, by - 26, bx + 16, by - 34);
        c.moveTo(bx - 15, by - 18);
        c.lineTo(bx + 15, by - 18);
        c.stroke();
      }),
      hall: makePropSprite(66, 64, (c, w, h) => {
        const bx = w * 0.5;
        const by = h - 9;
        c.fillStyle = 'rgba(18, 16, 10, 0.38)';
        c.beginPath(); c.ellipse(bx + 6, by + 2.5, 21, 8.5, 0.2, 0, Math.PI * 2); c.fill();
        // Stepped stone pendopo terrace
        c.fillStyle = '#786c5e';
        c.fillRect(bx - 18, by - 5, 36, 5);
        c.fillStyle = '#9e9282';
        c.fillRect(bx - 6, by - 5, 12, 5);
        // Grand Joglo/Keraton walls + carved pillars + warm lantern windows
        c.fillStyle = '#9c6638';
        c.fillRect(bx - 14, by - 18, 28, 13);
        c.fillStyle = '#633d1e';
        c.fillRect(bx + 1, by - 18, 13, 13);
        c.fillStyle = '#2b190d';
        c.fillRect(bx - 3.5, by - 13, 7, 8);
        c.fillStyle = '#ffe082';
        c.fillRect(bx - 11, by - 14, 4.2, 4.2);
        c.fillRect(bx + 6.5, by - 14, 4.2, 4.2);
        c.fillStyle = '#d4a353';
        c.fillRect(bx - 13, by - 18, 1.5, 13);
        c.fillRect(bx + 11.5, by - 18, 1.5, 13);
        // Lower Joglo roof tier
        c.fillStyle = '#9e381e';
        c.beginPath();
        c.moveTo(bx - 9, by - 27);
        c.lineTo(bx + 9, by - 27);
        c.lineTo(bx + 22, by - 17);
        c.lineTo(bx - 22, by - 17);
        c.closePath();
        c.fill();
        // Upper Joglo peak + gold mustaka finial
        c.fillStyle = '#c24d2c';
        c.beginPath();
        c.moveTo(bx, by - 40);
        c.lineTo(bx + 12, by - 26);
        c.lineTo(bx - 12, by - 26);
        c.closePath();
        c.fill();
        c.strokeStyle = '#ffd54f';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(bx - 22, by - 17); c.lineTo(bx + 22, by - 17);
        c.moveTo(bx, by - 45); c.lineTo(bx, by - 39);
        c.stroke();
      }),
            farm: makePropSprite(40, 22, (c, w, h) => {
        c.fillStyle = 'rgba(93, 64, 55, 0.82)';
        c.beginPath();
        c.moveTo(20, 2); c.lineTo(38, 11); c.lineTo(20, 20); c.lineTo(2, 11); c.closePath();
        c.fill();
        c.strokeStyle = '#aed581';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(11, 9); c.lineTo(20, 5);
        c.moveTo(15, 13); c.lineTo(25, 8);
        c.moveTo(19, 16); c.lineTo(29, 11);
        c.stroke();
      }),
      fire: makePropSprite(32, 36, (c) => {
        c.fillStyle = 'rgba(255, 87, 34, 0.32)';
        c.beginPath(); c.ellipse(16, 30, 11, 5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e64a19';
        c.beginPath();
        c.moveTo(16, 4); c.quadraticCurveTo(28, 18, 24, 30); c.quadraticCurveTo(16, 34, 8, 30); c.quadraticCurveTo(4, 18, 16, 4);
        c.fill();
        c.fillStyle = '#ffb300';
        c.beginPath();
        c.moveTo(16, 11); c.quadraticCurveTo(23, 21, 20, 29); c.quadraticCurveTo(16, 32, 12, 29); c.quadraticCurveTo(9, 21, 16, 11);
        c.fill();
        c.fillStyle = '#fff59d';
        c.beginPath(); c.arc(16, 25, 3.5, 0, Math.PI * 2); c.fill();
      }),
      flood: makePropSprite(46, 24, (c) => {
        c.fillStyle = 'rgba(78, 148, 152, 0.68)';
        c.beginPath();
        c.moveTo(23, 1); c.lineTo(45, 12); c.lineTo(23, 23); c.lineTo(1, 12); c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(224, 247, 250, 0.55)';
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(14, 12); c.lineTo(32, 12); c.stroke();
      }),
      hill_shrub: makePropSprite(28, 22, (c) => {
        c.fillStyle = 'rgba(16, 22, 10, 0.26)';
        c.beginPath(); c.ellipse(15, 16, 9.5, 4, 0.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#255422';
        c.beginPath(); c.arc(10, 13, 5.2, 0, Math.PI * 2); c.arc(17, 13.5, 5.0, 0, Math.PI * 2); c.arc(13.5, 10.5, 5.8, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#478536';
        c.beginPath(); c.arc(12, 9.8, 4.2, 0, Math.PI * 2); c.arc(9, 12, 3.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#70b34c';
        c.beginPath(); c.arc(11.5, 8.8, 2.2, 0, Math.PI * 2); c.fill();
      }),
      dry_shrub: makePropSprite(24, 20, (c) => {
        c.fillStyle = 'rgba(30, 22, 10, 0.22)';
        c.beginPath(); c.ellipse(13, 15, 7, 3, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#7d5c34'; c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(12, 15); c.lineTo(7, 8);
        c.moveTo(12, 15); c.lineTo(10, 6);
        c.moveTo(12, 15); c.lineTo(14, 6.5);
        c.moveTo(12, 15); c.lineTo(18, 9);
        c.stroke();
        c.fillStyle = '#a68b4b';
        c.beginPath(); c.arc(8, 8.5, 2.2, 0, Math.PI * 2); c.arc(13.5, 7.5, 2.4, 0, Math.PI * 2); c.arc(17, 9.5, 2, 0, Math.PI * 2); c.fill();
      }),
      desert_rock: makePropSprite(26, 20, (c) => {
        c.fillStyle = 'rgba(38, 26, 12, 0.26)';
        c.beginPath(); c.ellipse(14.5, 14.5, 8.5, 3.8, 0.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#8d6e4c';
        c.beginPath(); c.moveTo(5, 14); c.lineTo(8, 7); c.lineTo(16, 6); c.lineTo(21, 13.5); c.closePath(); c.fill();
        c.fillStyle = '#bda076';
        c.beginPath(); c.moveTo(6, 13.5); c.lineTo(8.5, 7.5); c.lineTo(14.5, 6.8); c.lineTo(13, 13.5); c.closePath(); c.fill();
      }),
      flower_yellow: makePropSprite(18, 16, (c) => {
        c.fillStyle = '#387522';
        c.beginPath(); c.arc(7, 11, 2.2, 0, Math.PI * 2); c.arc(11, 11.5, 2.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffd54f';
        c.beginPath(); c.arc(6.5, 8.5, 2.1, 0, Math.PI * 2); c.arc(11.5, 9.2, 1.9, 0, Math.PI * 2); c.arc(9.2, 11.2, 1.7, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f57f17';
        c.fillRect(6, 8, 1, 1); c.fillRect(11, 8.8, 1, 1);
      }),
      flower_white: makePropSprite(18, 16, (c) => {
        c.fillStyle = '#387522';
        c.beginPath(); c.arc(9, 11, 3.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(6.5, 9, 2.0, 0, Math.PI * 2); c.arc(11.2, 8.6, 1.9, 0, Math.PI * 2); c.arc(9.4, 11.6, 1.8, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffca28';
        c.fillRect(6.1, 8.6, 1, 1); c.fillRect(10.8, 8.2, 1, 1);
      }),
      flower_purple: makePropSprite(18, 16, (c) => {
        c.fillStyle = '#33691e';
        c.beginPath(); c.arc(9, 11.5, 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ce93d8';
        c.beginPath(); c.arc(6.8, 8.5, 2.0, 0, Math.PI * 2); c.arc(11, 9, 2.1, 0, Math.PI * 2); c.arc(9, 6.8, 1.8, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#7b1fa2';
        c.fillRect(6.4, 8.2, 1.1, 1.1); c.fillRect(10.5, 8.7, 1.1, 1.1);
      }),
      wild_mushroom: makePropSprite(18, 16, (c) => {
        c.fillStyle = '#efe5d1'; c.fillRect(6, 10, 2, 4); c.fillRect(11, 11, 1.8, 3);
        c.fillStyle = '#a15c2f'; c.beginPath(); c.arc(7, 10, 3.4, Math.PI, 0); c.fill();
        c.fillStyle = '#d87a3b'; c.beginPath(); c.arc(11.9, 11, 2.6, Math.PI, 0); c.fill();
      }),
      fallen_branch: makePropSprite(28, 16, (c) => {
        c.fillStyle = 'rgba(18, 20, 10, 0.24)';
        c.beginPath(); c.ellipse(14, 11.5, 10, 2.8, 0.22, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#5d3d22'; c.lineWidth = 3.2;
        c.beginPath(); c.moveTo(5, 8.5); c.lineTo(22, 12); c.stroke();
        c.strokeStyle = '#825936'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(5.5, 7.8); c.lineTo(21.5, 11.2); c.moveTo(13, 10); c.lineTo(16, 6.5); c.stroke();
        c.fillStyle = '#558b2f';
        c.beginPath(); c.arc(10, 9, 1.8, 0, Math.PI * 2); c.arc(17, 10.5, 1.6, 0, Math.PI * 2); c.fill();
      }),
      pebbles: makePropSprite(20, 14, (c) => {
        c.fillStyle = '#7a7264';
        c.beginPath(); c.ellipse(7, 8, 2.6, 1.8, 0, 0, Math.PI * 2); c.ellipse(12.5, 9.2, 2.1, 1.5, 0, 0, Math.PI * 2); c.ellipse(10, 6.5, 1.6, 1.2, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ada493';
        c.beginPath(); c.arc(6.5, 7.5, 1.1, 0, Math.PI * 2); c.arc(12, 8.8, 0.9, 0, Math.PI * 2); c.fill();
      }),
      river_reeds: makePropSprite(24, 26, (c) => {
        c.fillStyle = 'rgba(20, 44, 36, 0.24)';
        c.beginPath(); c.ellipse(12, 22, 7, 2.6, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#3e7a32'; c.lineWidth = 1.7;
        c.beginPath();
        c.moveTo(8, 22); c.quadraticCurveTo(6, 14, 5, 7);
        c.moveTo(11, 22); c.quadraticCurveTo(11, 13, 10.5, 5);
        c.moveTo(14, 22); c.quadraticCurveTo(15, 13, 16, 6);
        c.moveTo(16.5, 22); c.quadraticCurveTo(18, 15, 19.5, 9);
        c.stroke();
        // Classic brown cattail spikes
        c.fillStyle = '#5d3a1e';
        c.fillRect(9.5, 5.5, 2.2, 5.2);
        c.fillRect(14.8, 6.5, 2.2, 4.8);
      }),
      river_rock: makePropSprite(26, 18, (c) => {
        c.strokeStyle = 'rgba(228, 250, 252, 0.72)'; c.lineWidth = 1.3;
        c.beginPath(); c.ellipse(13, 11.5, 9.5, 4.4, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#5c6668';
        c.beginPath(); c.ellipse(12, 10.5, 6.2, 3.8, 0, 0, Math.PI * 2); c.ellipse(17, 11.8, 3.6, 2.4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#8fa0a3';
        c.beginPath(); c.ellipse(10.8, 9.2, 4.0, 2.2, 0, 0, Math.PI * 2); c.fill();
      }),
      lotus_cluster: makePropSprite(28, 18, (c) => {
        c.fillStyle = '#2e7d32';
        c.beginPath(); c.ellipse(9, 10, 5.2, 2.8, 0, 0.2, Math.PI * 1.9); c.fill();
        c.fillStyle = '#43a047';
        c.beginPath(); c.ellipse(18, 11.5, 4.8, 2.6, 0, 0.3, Math.PI * 1.9); c.ellipse(13.5, 7.2, 4.0, 2.2, 0, 0, Math.PI * 2); c.fill();
        // Pink & white lotus blossoms
        c.fillStyle = '#f48fb1';
        c.beginPath(); c.arc(10.5, 8.8, 2.3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fce4ec';
        c.beginPath(); c.arc(10.5, 8.4, 1.2, 0, Math.PI * 2); c.arc(18.2, 10.2, 1.5, 0, Math.PI * 2); c.fill();
      }),
      fish_shadow: makePropSprite(20, 10, (c) => {
        c.fillStyle = 'rgba(14, 58, 66, 0.58)';
        c.beginPath();
        c.ellipse(11, 5, 5.5, 2.3, 0, 0, Math.PI * 2);
        c.moveTo(5.8, 5); c.lineTo(1.5, 2.2); c.lineTo(3.0, 5); c.lineTo(1.5, 7.8); c.closePath();
        c.fill();
      }),
      sea_reef_lg: makePropSprite(54, 34, (c) => {
        // Turquoise shallow halo + white surf ring
        c.fillStyle = 'rgba(64, 206, 198, 0.36)';
        c.beginPath(); c.ellipse(27, 21, 24, 11, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(235, 252, 255, 0.72)'; c.lineWidth = 1.6;
        c.beginPath(); c.ellipse(27, 21, 19, 8.5, 0, 0, Math.PI * 2); c.stroke();
        // Main jagged sea stack + smaller coral rocks
        c.fillStyle = '#474f52';
        c.beginPath(); c.moveTo(14, 22); c.lineTo(19, 9); c.lineTo(28, 7); c.lineTo(35, 21); c.closePath(); c.fill();
        c.fillStyle = '#707b7e';
        c.beginPath(); c.moveTo(15, 21); c.lineTo(19.5, 9.5); c.lineTo(25, 8.5); c.lineTo(24, 21); c.closePath(); c.fill();
        c.fillStyle = '#545d61';
        c.beginPath(); c.ellipse(36, 22, 6, 3.8, 0, 0, Math.PI * 2); c.ellipse(13, 23, 4.5, 2.8, 0, 0, Math.PI * 2); c.fill();
        // Green sea-moss & coral accent
        c.fillStyle = '#4c8c4a';
        c.beginPath(); c.ellipse(22, 11, 3.5, 1.8, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ff8a65';
        c.beginPath(); c.arc(33, 21, 1.8, 0, Math.PI * 2); c.fill();
      }),
      sea_reef_sm: makePropSprite(36, 24, (c) => {
        c.fillStyle = 'rgba(64, 206, 198, 0.32)';
        c.beginPath(); c.ellipse(18, 14, 15, 7, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(235, 252, 255, 0.68)'; c.lineWidth = 1.3;
        c.beginPath(); c.ellipse(18, 14, 11.5, 5.2, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#4f585b';
        c.beginPath(); c.ellipse(16, 13, 6.5, 4.2, 0, 0, Math.PI * 2); c.ellipse(23, 14.5, 4, 2.6, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#7c888b';
        c.beginPath(); c.ellipse(14.5, 11.5, 4.0, 2.2, 0, 0, Math.PI * 2); c.fill();
      }),
      cloud_shadow: makePropSprite(180, 96, (c, w, h) => {
        const g = c.createRadialGradient(w * 0.5, h * 0.5, 8, w * 0.5, h * 0.5, w * 0.48);
        g.addColorStop(0, 'rgba(8, 22, 28, 0.42)');
        g.addColorStop(0.55, 'rgba(8, 22, 28, 0.20)');
        g.addColorStop(1, 'rgba(8, 22, 28, 0)');
        c.save();
        c.scale(1, h / w);
        c.fillStyle = g;
        c.beginPath();
        c.arc(w * 0.5, w * 0.5, w * 0.48, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }),
      glow_warm: makeGlowSprite(255, 150, 60),
      glow_gold: makeGlowSprite(255, 214, 120),
      glow_cyan: makeGlowSprite(130, 220, 255),
      glow_rose: makeGlowSprite(255, 90, 110),
      fog_wisp: makePropSprite(220, 90, (c, w, h) => {
        const g = c.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, w * 0.48);
        g.addColorStop(0, 'rgba(226, 240, 244, 0.6)');
        g.addColorStop(0.5, 'rgba(220, 236, 242, 0.28)');
        g.addColorStop(1, 'rgba(220, 236, 242, 0)');
        c.save();
        c.scale(1, h / w);
        c.fillStyle = g;
        c.beginPath();
        c.arc(w * 0.5, w * 0.5, w * 0.48, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }),
      kelakai_fern: makePropSprite(22, 18, (c) => {
        c.fillStyle = 'rgba(20, 32, 14, 0.25)';
        c.beginPath(); c.ellipse(11, 14, 7, 2.6, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#3e7328'; c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(11, 14); c.quadraticCurveTo(6, 9, 4, 6);
        c.moveTo(11, 14); c.quadraticCurveTo(11, 7, 11, 4);
        c.moveTo(11, 14); c.quadraticCurveTo(16, 9, 18, 6);
        c.stroke();
        c.fillStyle = '#c65d24';
        c.beginPath(); c.arc(4, 6, 1.5, 0, Math.PI * 2); c.arc(11, 4, 1.7, 0, Math.PI * 2); c.arc(18, 6, 1.5, 0, Math.PI * 2); c.fill();
      }),
      sekat_kanal: makePropSprite(36, 26, (c) => {
        // Wooden Kalimantan canal-blocking dam holding tea-amber peat water
        c.fillStyle = 'rgba(18, 26, 20, 0.28)';
        c.beginPath(); c.ellipse(18, 21, 14, 4.5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#3e2723';
        c.fillRect(6, 13, 24, 5);
        c.fillStyle = '#6d4c41';
        for (let px = 7; px <= 26; px += 4.5) {
          c.fillRect(px, 8, 3.2, 12);
          c.fillStyle = '#8d6e63';
          c.fillRect(px, 8, 1.4, 3);
          c.fillStyle = '#6d4c41';
        }
        c.fillStyle = '#4fc3f7';
        c.fillRect(8, 17.5, 20, 2.6);
      }),
      vine: makePropSprite(20, 16, (c) => {
        c.fillStyle = '#9c27b0'; c.beginPath(); c.ellipse(10, 10, 5.5, 3, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e040fb'; c.beginPath(); c.arc(10, 8, 2.2, 0, Math.PI * 2); c.fill();
      })
    };
    for (let i = 0; i < LIT_PROP_KEYS.length; i++) {
      const sp = bakedProps[LIT_PROP_KEYS[i]];
      if (sp) applyPropLighting(sp);
    }
    return bakedProps;
  }

  function makeGlowSprite(r, g, b) {
    return makePropSprite(48, 48, (c) => {
      const gr = c.createRadialGradient(24, 24, 0, 24, 24, 24);
      gr.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
      gr.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.42)`);
      gr.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      c.fillStyle = gr;
      c.fillRect(0, 0, 48, 48);
    });
  }

  const LIT_PROP_KEYS = [
    'tree_grass', 'tree_tropical', 'tree_mangrove', 'tree_peat', 'tree_palm', 'tree_pine', 'tree_cactus', 'sawit', 'sekat_kanal',
    'hut', 'hut_lumbung', 'hall', 'rock', 'desert_rock', 'hill_shrub', 'sapling_1', 'sapling_2', 'stump', 'mushroom'
  ];

  // One-time pixel lighting pass on baked props: warm KEY edge (top-left), cool RIM edge (back-right), cool FILL in dark areas
  function applyPropLighting(cv) {
    const c = cv.getContext && cv.getContext('2d');
    if (!c || typeof c.getImageData !== 'function') return;
    const w = cv.width;
    const h = cv.height;
    let img = null;
    try { img = c.getImageData(0, 0, w, h); } catch (e) { return; }
    if (!img || !img.data || img.data.length < w * h * 4) return;
    const d = img.data;
    const s = new Uint8ClampedArray(d);
    const kOff = Math.max(2, Math.round(PROP_SS * 1.4));
    const rOff = Math.max(2, Math.round(PROP_SS * 1.1));
    const rUp = Math.max(1, Math.round(rOff * 0.5));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (s[i + 3] < 110) continue; // skip soft drop shadows
        const kx = x - kOff;
        const ky = y - kOff;
        const keyEdge = kx < 0 || ky < 0 || s[(ky * w + kx) * 4 + 3] < 40;
        const rx = x + rOff;
        const ry = y - rUp;
        const rimEdge = rx >= w || ry < 0 || s[(ry * w + rx) * 4 + 3] < 40;
        let r = s[i];
        let g = s[i + 1];
        let b = s[i + 2];
        const lum = r * 0.3 + g * 0.59 + b * 0.11;
        if (lum < 90) {
          b += (90 - lum) * 0.3;
          g += (90 - lum) * 0.06;
        }
        if (keyEdge) {
          r += (255 - r) * 0.32;
          g += (236 - g) * 0.26;
          b += (180 - b) * 0.12;
        } else if (rimEdge) {
          r += (190 - r) * 0.42;
          g += (232 - g) * 0.46;
          b += (255 - b) * 0.56;
        }
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
    }
    c.putImageData(img, 0, 0);
  }

  // GLOW: additive bloom from fire, house windows, lightning, bioluminescent mushrooms, river sun-glints & event focus
  function drawGlowPass(nowSec, cw, ch, props) {
    const z = cam.zoom;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < fireTiles.length; i++) {
      const ft = fireTiles[i];
      const p = projectIso(ft.gx + 0.5, ft.gz + 0.5, getTileLift(ft) + 6);
      if (p.x < -80 || p.x > cw + 80 || p.y < -80 || p.y > ch + 80) continue;
      const flick = 0.78 + Math.sin(nowSec * 13 + ft.gx * 3.1 + ft.gz) * 0.2;
      const s = 78 * z * flick;
      ctx.globalAlpha = 0.62 * flick;
      ctx.drawImage(props.glow_warm, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    for (let i = 0; i < buildingTiles.length; i++) {
      const b = buildingTiles[i];
      const p = projectIso(b.gx + 0.5, b.gz + 0.5, getTileLift(b) + 10);
      if (p.x < -60 || p.x > cw + 60 || p.y < -60 || p.y > ch + 60) continue;
      const s = (b.building === 'hall' ? 68 : 48) * z;
      ctx.globalAlpha = 0.34 + Math.sin(nowSec * 2.3 + b.gx) * 0.05;
      ctx.drawImage(props.glow_gold, p.x - s * 0.5, p.y - s * 0.62, s, s);
    }
    // Soft bioluminescent glow under Mikoriza mushrooms & tropical/swamp forest clearings
    const land = landTilesByRot[cam.rot];
    for (let i = 0; i < land.length; i += 3) {
      const lt = land[i];
      if (!lt.hasMycorrhiza && !lt.hasParasiteVine) continue;
      const p = projectIso(lt.gx + 0.5, lt.gz + 0.5, getTileLift(lt) + 4);
      if (p.x < -50 || p.x > cw + 50 || p.y < -50 || p.y > ch + 50) continue;
      const s = 42 * z;
      ctx.globalAlpha = 0.16 + Math.sin(nowSec * 2.1 + lt.gx) * 0.04;
      ctx.drawImage(lt.hasParasiteVine ? props.glow_rose : props.glow_gold, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    // Sun-kissed water sparkle bloom along the river & lagoon
    const wTiles = waterTilesByRot[cam.rot];
    for (let i = 0; i < wTiles.length; i += 11) {
      const wt = wTiles[i];
      const pulse = Math.sin(nowSec * 1.9 + wt.gx * 0.7 + wt.gz * 0.5);
      if (pulse < 0.35) continue;
      const p = projectIso(wt.gx + 0.5, wt.gz + 0.5, 2);
      if (p.x < -50 || p.x > cw + 50 || p.y < -50 || p.y > ch + 50) continue;
      const s = 48 * z * (0.8 + pulse * 0.25);
      ctx.globalAlpha = (pulse - 0.35) * 0.26;
      ctx.drawImage(props.glow_cyan, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    for (let i = 0; i < lightningBolts.length; i++) {
      const lb = lightningBolts[i];
      const p = projectIso(lb.gx, lb.gz, lb.elev);
      const a = Math.max(0, lb.life / lb.maxLife);
      const s = 175 * z;
      ctx.globalAlpha = a * 0.92;
      ctx.drawImage(props.glow_cyan, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    for (let i = 0; i < clouds3d.length; i++) {
      const c = clouds3d[i];
      let sp = null;
      let a = 0;
      if (c.kind === 'lightning' && Math.sin(nowSec * 7.3 + c.gx * 2) > 0.82) { sp = props.glow_cyan; a = 0.55; }
      else if (c.kind === 'emotion_harmony') { sp = props.glow_gold; a = 0.24; }
      else if (c.kind === 'emotion_anger') { sp = props.glow_rose; a = 0.26; }
      if (!sp) continue;
      const p = projectIso(c.gx, c.gz, 72);
      const s = 120 * z;
      ctx.globalAlpha = a * Math.min(1, c.life / 1.5);
      ctx.drawImage(sp, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    if (eventFocus) {
      const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gx)));
      const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gz)));
      const p = projectIso(eventFocus.gx, eventFocus.gz, getTileLift(grid[iz] && grid[iz][ix]) + 4);
      const s = 134 * z;
      ctx.globalAlpha = 0.28 + Math.sin(nowSec * 4) * 0.06;
      ctx.drawImage(props.glow_gold, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    ctx.restore();
  }

  // FOG: soft drifting mist banks over island & sea (thins out when zoomed in so detail stays clear)
  const FOG_WISPS = [];
  for (let i = 0; i < 7; i++) {
    FOG_WISPS.push({
      gx: hash2(i * 4.7, 1.3) * (MAP_SIZE + 24),
      gz: hash2(i * 2.9, 7.1) * (MAP_SIZE + 24),
      vx: 0.28 + hash2(i, 3.3) * 0.22,
      vz: 0.12 + hash2(i, 5.9) * 0.14,
      elev: 24 + hash2(i, 9.1) * 30,
      scale: 1.2 + hash2(i * 1.7, 2.2) * 0.9,
      alpha: 0.16 + hash2(i, 6.6) * 0.1
    });
  }

  function fogStrength() {
    return Math.max(0.3, Math.min(1, 1.3 - cam.zoom * 0.55));
  }

  function drawFogWisps(nowSec, cw, ch, props) {
    const sp = props.fog_wisp;
    const fogK = fogStrength();
    const span = MAP_SIZE + 24;
    ctx.save();
    for (let i = 0; i < FOG_WISPS.length; i++) {
      const w = FOG_WISPS[i];
      const gx = (((w.gx + nowSec * w.vx) % span) + span) % span - 12;
      const gz = (((w.gz + nowSec * w.vz) % span) + span) % span - 12;
      const p = projectIso(gx, gz, w.elev);
      const sw = sp.lw * cam.zoom * w.scale;
      const sh = sp.lh * cam.zoom * w.scale;
      if (p.x + sw < 0 || p.x - sw > cw || p.y + sh < 0 || p.y - sh > ch) continue;
      ctx.globalAlpha = w.alpha * fogK;
      ctx.drawImage(sp, p.x - sw * 0.5, p.y - sh * 0.5, sw, sh);
    }
    ctx.restore();
  }

  // Screen-space lighting: warm KEY sun glow (top-left), cool FILL (bottom-right), distance FOG haze (top) & vignette
  let atmoCache = null;
  function drawAtmosphereOverlay(cw, ch) {
    if (!atmoCache || atmoCache.w !== cw || atmoCache.h !== ch) {
      const big = Math.max(cw, ch);
      const key = ctx.createRadialGradient(cw * 0.08, -ch * 0.12, 0, cw * 0.08, -ch * 0.12, big * 1.05);
      key.addColorStop(0, 'rgba(255, 214, 150, 0.6)');
      key.addColorStop(0.45, 'rgba(255, 190, 120, 0.2)');
      key.addColorStop(1, 'rgba(255, 180, 110, 0)');
      const fill = ctx.createRadialGradient(cw, ch * 1.05, 0, cw, ch * 1.05, big * 0.95);
      fill.addColorStop(0, 'rgba(40, 80, 140, 0.24)');
      fill.addColorStop(1, 'rgba(40, 80, 140, 0)');
      const fogTop = ctx.createLinearGradient(0, 0, 0, ch * 0.45);
      fogTop.addColorStop(0, 'rgba(190, 226, 232, 0.3)');
      fogTop.addColorStop(1, 'rgba(190, 226, 232, 0)');
      const vign = ctx.createRadialGradient(cw * 0.5, ch * 0.48, Math.min(cw, ch) * 0.35, cw * 0.5, ch * 0.48, big * 0.78);
      vign.addColorStop(0, 'rgba(6, 16, 24, 0)');
      vign.addColorStop(1, 'rgba(6, 16, 24, 0.38)');
      atmoCache = { w: cw, h: ch, key, fill, fogTop, vign };
    }
    const fogK = fogStrength();
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = atmoCache.key;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.22;
    ctx.fillRect(0, 0, cw, ch); // visible warm sun haze
    ctx.globalAlpha = 1;
    ctx.fillStyle = atmoCache.fill;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalAlpha = fogK;
    ctx.fillStyle = atmoCache.fogTop;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalAlpha = 1;
    ctx.fillStyle = atmoCache.vign;
    ctx.fillRect(0, 0, cw, ch);
    if (peatSmogAlpha > 0.01) {
      ctx.fillStyle = `rgba(218, 148, 72, ${peatSmogAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.restore();
  }

  function drawOceanAndShoreWaves(nowSec, cw, ch) {
    const props = ensureBakedProps();
    const z = cam.zoom;

    // 1) Subtle open-ocean wave glints so surrounding sea feels alive (single batched stroke!)
    ctx.strokeStyle = 'rgba(155, 232, 240, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const stepX = 118;
    const stepY = 68;
    const driftX = (nowSec * 9) % stepX;
    for (let sy = 24; sy < ch; sy += stepY) {
      const rowShift = ((sy / stepY) | 0) % 2 === 0 ? 0 : stepX * 0.5;
      for (let sx = -stepX; sx < cw + stepX; sx += stepX) {
        const wx = sx + rowShift + driftX;
        const bob = Math.sin(nowSec * 1.6 + sx * 0.02 + sy * 0.03) * 3;
        ctx.moveTo(wx - 11, sy + bob);
        ctx.quadraticCurveTo(wx, sy - 2.5 + bob, wx + 11, sy + bob);
      }
    }
    ctx.stroke();

    // 2) Gugusan Batu Karang Kecil di Sudut Laut (Sea Rock & Coral Reef Islets + animated foam ring!)
    for (let i = 0; i < seaReefs.length; i++) {
      const rf = seaReefs[i];
      const pt = projectIso(rf.gx, rf.gz, 0);
      if (pt.x < -70 || pt.x > cw + 70 || pt.y < -50 || pt.y > ch + 50) continue;
      const sp = rf.large ? props.sea_reef_lg : props.sea_reef_sm;
      const sc = z * rf.scale;
      const pulse = 1 + Math.sin(nowSec * 2.1 + rf.phase) * 0.08;
      ctx.drawImage(sp, pt.x - sp.lw * 0.5 * sc * pulse, pt.y - sp.lh * 0.58 * sc, sp.lw * sc * pulse, sp.lh * sc);
    }

    // 3) Animasi Garis Ombak Putih di Bibir Pantai (2 rhythmic concentric surf rings lapping onto the beach!)
    if (shoreOutlinePts.length > 4) {
      for (let band = 0; band < 2; band++) {
        const cyc = (nowSec * 0.42 + band * 0.5) % 1; // 0 = outer swell -> 1 = laps onto beach sand
        const outDist = (1 - cyc) * 1.65 + 0.12;
        const alpha = Math.sin(cyc * Math.PI) * 0.68;
        ctx.strokeStyle = `rgba(242, 253, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(1.1, (2.3 - cyc * 0.9) * z);
        ctx.beginPath();
        for (let k = 0; k <= shoreOutlinePts.length; k++) {
          const sp = shoreOutlinePts[k % shoreOutlinePts.length];
          const wob = Math.sin(nowSec * 2.2 + sp.phase) * 0.18;
          const d = outDist + wob;
          const pt = projectIso(sp.gx + sp.nx * d, sp.gz + sp.nz * d, 0);
          if (k === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
    }
  }

  function drawWaterTiles(nowSec, cw, ch) {
    const props = ensureBakedProps();
    const tiles = waterTilesByRot[cam.rot];
    const z = cam.zoom;

    // 1) Siluet Ikan Berenang di Aliran Sungai (following exact S-curve tangent!)
    const fishSp = props.fish_shadow;
    for (let i = 0; i < riverFish.length; i++) {
      const rf = riverFish[i];
      const gx = 2 + rf.u * (MAP_SIZE - 4);
      const gz = riverCenterZ(gx) + rf.lat * 0.55;
      if (islandCoastScore(gx, gz) > 1.02) continue;
      const p1 = projectIso(gx, gz, 0);
      if (p1.x < -30 || p1.x > cw + 30 || p1.y < -30 || p1.y > ch + 30) continue;
      const gxAhead = gx + rf.dir * 0.6;
      const gzAhead = riverCenterZ(gxAhead) + rf.lat * 0.55;
      const p2 = projectIso(gxAhead, gzAhead, 0);
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.sin(rf.phase) * 0.12;
      const sc = z * rf.size;
      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(ang);
      ctx.drawImage(fishSp, -fishSp.lw * 0.5 * sc, -fishSp.lh * 0.5 * sc, fishSp.lw * sc, fishSp.lh * sc);
      ctx.restore();
    }

    // 2) Shimmering river current streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.lineWidth = Math.max(1, 1.3 * z);
    ctx.beginPath();
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if ((t.gx + t.gz) % 2 !== 0) continue;
      const p = projectIso(t.gx + 0.5, t.gz + 0.5, 0);
      if (p.x < -40 || p.x > cw + 40 || p.y < -40 || p.y > ch + 40) continue;
      const drift = Math.sin(nowSec * 1.4 + t.gx * 0.6 + t.gz * 0.5) * 4 * z;
      ctx.moveTo(p.x - 6 * z + drift, p.y);
      ctx.lineTo(p.x + 6 * z + drift, p.y + 1.4 * z);
    }
    ctx.stroke();

    // 2b) Polluted River Sludge Overlay (when river_waste disaster is active!)
    if (pollutedTiles.length > 0) {
      ctx.fillStyle = 'rgba(74, 88, 36, 0.58)';
      for (let i = 0; i < pollutedTiles.length; i++) {
        const pt = pollutedTiles[i];
        const p = projectIso(pt.gx + 0.5, pt.gz + 0.5, 0);
        if (p.x < -40 || p.x > cw + 40 || p.y < -40 || p.y > ch + 40) continue;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 18 * z, 9 * z, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3) River Rocks, Floating Lotus Clusters & Shoreline Cattail Reeds
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (!t.riverProp) continue;
      const p = projectIso(t.gx + 0.5, t.gz + 0.5, 0);
      if (p.x < -40 || p.x > cw + 40 || p.y < -40 || p.y > ch + 40) continue;
      const sp = props[t.riverProp];
      if (!sp) continue;
      const sway = t.riverProp === 'river_reeds' ? Math.sin(nowSec * 1.6 + t.gx) * 1.2 * z : 0;
      const anchorY = t.riverProp === 'river_reeds' ? 0.85 : 0.55;
      ctx.drawImage(sp, p.x - sp.lw * 0.5 * z + sway, p.y - sp.lh * anchorY * z, sp.lw * z, sp.lh * z);
    }
  }

  function drawHoverOutline(t) {
    if (!t) return;
    const lift = getTileLift(t);
    const p0 = projectIso(t.gx, t.gz, lift);
    const p1 = projectIso(t.gx + 1, t.gz, lift);
    const p2 = projectIso(t.gx + 1, t.gz + 1, lift);
    const p3 = projectIso(t.gx, t.gz + 1, lift);
    const placing = Boolean(draggingDockCard || selectedDockCard);
    const outOfIsland = !isInsideMaxIslandBounds(t.gx, t.gz);
    const invalidWater =
      outOfIsland ||
      (placing && t.type === 'water' && (draggingDockCard || selectedDockCard) &&
      ((draggingDockCard || selectedDockCard).isProducer || (draggingDockCard || selectedDockCard).isTree || (draggingDockCard || selectedDockCard).isMutualFungi));
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    if (placing) {
      ctx.fillStyle = invalidWater ? 'rgba(255, 82, 82, 0.35)' : 'rgba(105, 240, 174, 0.35)';
      ctx.fill();
      ctx.strokeStyle = invalidWater ? '#ff5252' : '#00e676';
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = '#f4d38c';
      ctx.lineWidth = 2;
    }
    ctx.stroke();
  }

  function drawFloraLayer(nowSec, cw, ch) {
    const props = ensureBakedProps();
    const tiles = landTilesByRot[cam.rot];
    const z = cam.zoom;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t.producerStage <= 0 && !t.hasMycorrhiza && !t.hasParasiteVine && t.saplingStage <= 0 && !t.hasStump && t.propType === 'none' && !t.microDecor && !t.isFarm && t.floodTimer <= 0 && t.fireTimer <= 0) continue;
      const c = projectIso(t.gx + 0.5, t.gz + 0.5, getTileLift(t));
      if (c.x < -50 || c.x > cw + 50 || c.y < -50 || c.y > ch + 50) continue;

      if (t.fireTimer > 0) {
        const sp = props.fire;
        const flick = 0.92 + Math.sin(nowSec * 14 + t.gx * 2) * 0.12;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z * flick, c.y - sp.lh * 0.85 * z * flick, sp.lw * z * flick, sp.lh * z * flick);
      }
      if (t.floodTimer > 0) {
        const sp = props.flood;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z, c.y - sp.lh * 0.5 * z, sp.lw * z, sp.lh * z);
      }
      if (t.isFarm) {
        const sp = props.farm;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z, c.y - sp.lh * 0.5 * z, sp.lw * z, sp.lh * z);
      }
      if (t.producerStage > 0 && !t.isFarm) {
        const sp = t.producerStage === 1 ? props.grass_1 : t.producerStage === 2 ? props.grass_2 : props.grass_3;
        const w = sp.lw * z;
        const h = sp.lh * z;
        ctx.drawImage(sp, c.x - w * 0.5, c.y - h * 0.85, w, h);
      }
      if (t.microDecor && !t.isFarm && !t.building) {
        const msp = props[t.microDecor];
        if (msp) {
          const ox = ((t.gx * 7 + t.gz * 3) % 5 - 2) * 2.2 * z;
          const oy = ((t.gx * 3 + t.gz * 5) % 3 - 1) * 1.4 * z;
          ctx.drawImage(msp, c.x + ox - msp.lw * 0.5 * z, c.y + oy - msp.lh * 0.72 * z, msp.lw * z, msp.lh * z);
        }
      }
      if ((t.propType === 'mossy_rock' || t.propType === 'desert_rock') && getTileLift(t) <= 0) {
        const sp = t.propType === 'desert_rock' ? props.desert_rock : props.rock;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z, c.y - sp.lh * 0.65 * z, sp.lw * z, sp.lh * z);
      }
      if (t.hasStump && !t.hasTree) {
        const sp = props.stump;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z, c.y - sp.lh * 0.7 * z, sp.lw * z, sp.lh * z);
      }
      if (t.saplingStage > 0 && !t.hasTree) {
        const sp = t.saplingStage === 1 ? props.sapling_1 : props.sapling_2;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z, c.y - sp.lh * 0.85 * z, sp.lw * z, sp.lh * z);
      }
      if (t.hasSekatKanal) {
        const sp = props.sekat_kanal;
        ctx.drawImage(sp, c.x - sp.lw * 0.5 * z, c.y - sp.lh * 0.72 * z, sp.lw * z, sp.lh * z);
      }
      if (t.hasMycorrhiza) {
        const sp = props.mushroom;
        ctx.drawImage(sp, c.x - 3 * z - sp.lw * 0.5 * z, c.y - sp.lh * 0.8 * z, sp.lw * z, sp.lh * z);
      }
      if (t.hasParasiteVine && !t.hasTree) {
        const sp = props.vine;
        ctx.drawImage(sp, c.x + 2 * z - sp.lw * 0.5 * z, c.y - sp.lh * 0.65 * z, sp.lw * z, sp.lh * z);
      }
    }
  }

  // Procedural Close-Up HD Ground Detail Pass: fades in smoothly when zoomed in (cam.zoom >= 0.92)
  // Draws crisp vector grass blades, sand ripples & pebble facets ONLY for visible viewport tiles!
  function drawZoomedHDDetail(nowSec, cw, ch) {
    const z = cam.zoom;
    if (z < 0.92) return;
    const alpha = Math.min(0.85, (z - 0.92) / 0.65);
    const land = landTilesByRot[cam.rot];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, 0.95 * z);

    // Batch 1: Crisp sunlit grass blades on visible meadow/tropical/hill tiles
    ctx.strokeStyle = 'rgba(136, 198, 78, 0.72)';
    ctx.beginPath();
    for (let i = 0; i < land.length; i++) {
      const t = land[i];
      if (t.type !== 'grass' || t.biome === 'desert' || t.building) continue;
      const lift = getTileLift(t);
      const p = projectIso(t.gx + 0.5, t.gz + 0.5, lift);
      if (p.x < -36 || p.x > cw + 36 || p.y < -36 || p.y > ch + 36) continue;
      const sway = Math.sin(nowSec * 1.9 + t.gx * 0.8 + t.gz * 0.6) * 1.4 * z;
      for (let b = 0; b < 3; b++) {
        const h1 = hash2(t.gx * 3.1 + b, t.gz * 2.7 - b);
        const h2 = hash2(t.gx * 1.7 - b, t.gz * 4.3 + b);
        const bx = p.x + (h1 - 0.5) * 22 * z;
        const by = p.y + (h2 - 0.5) * 10 * z;
        const bh = (3.2 + h1 * 2.8) * z;
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + sway + (h2 - 0.5) * 2 * z, by - bh);
      }
    }
    ctx.stroke();

    // Batch 2: Crisp darker turf blades & desert/beach sand-grain facets
    ctx.strokeStyle = 'rgba(54, 94, 32, 0.55)';
    ctx.beginPath();
    for (let i = 0; i < land.length; i++) {
      const t = land[i];
      if (t.building) continue;
      const lift = getTileLift(t);
      const p = projectIso(t.gx + 0.5, t.gz + 0.5, lift);
      if (p.x < -36 || p.x > cw + 36 || p.y < -36 || p.y > ch + 36) continue;
      if (t.type === 'sand' || t.biome === 'desert') continue;
      const h1 = hash2(t.gx * 5.3, t.gz * 3.9);
      const bx = p.x + (h1 - 0.5) * 16 * z;
      const by = p.y + (hash2(t.gz, t.gx) - 0.5) * 8 * z;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - 1.2 * z, by - 3.6 * z);
      ctx.moveTo(bx + 2 * z, by + 0.5 * z);
      ctx.lineTo(bx + 3.2 * z, by - 3.2 * z);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(166, 132, 76, 0.55)';
    ctx.beginPath();
    for (let i = 0; i < land.length; i++) {
      const t = land[i];
      if (t.type !== 'sand' && t.biome !== 'desert' && !t.isPath) continue;
      const p = projectIso(t.gx + 0.5, t.gz + 0.5, getTileLift(t));
      if (p.x < -36 || p.x > cw + 36 || p.y < -36 || p.y > ch + 36) continue;
      const ox = (hash2(t.gx * 2.1, t.gz) - 0.5) * 14 * z;
      const oy = (hash2(t.gx, t.gz * 2.9) - 0.5) * 6 * z;
      ctx.moveTo(p.x + ox - 4.5 * z, p.y + oy);
      ctx.quadraticCurveTo(p.x + ox, p.y + oy - 1.5 * z, p.x + ox + 4.5 * z, p.y + oy + 0.5 * z);
    }
    ctx.stroke();
    ctx.restore();
  }

    // Ultra-fast pre-baked tree sprite blitting (1 drawImage per tree, zero per-frame vector paths!)
  function draw3DBiomeTree(t, cw, ch, nowSec) {
    const gx = t.gx + 0.5 + (t.treeOffX || 0);
    const gz = t.gz + 0.5 + (t.treeOffZ || 0);
    const base = projectIso(gx, gz, getTileLift(t));
    if (base.x < -75 || base.x > cw + 75 || base.y < -75 || base.y > ch + 95) return;

    const props = ensureBakedProps();
    const pal = BIOME_PALETTES[t.biome] || BIOME_PALETTES.grassland;
    const z = cam.zoom * (t.treeScale || 1);
    const isPalm = pal.treeStyle !== 'cactus' && (t.type === 'sand' || (t.biome !== 'tropical' && (t.gx * 3 + t.gz) % 5 === 0));
    const sp =
      (t.isPine || t.biome === 'hills' || getTileLift(t) > 0)
        ? props.tree_pine
        : pal.treeStyle === 'cactus'
          ? props.tree_cactus
          : isPalm
            ? props.tree_palm
            : t.biome === 'peatland'
              ? props.tree_peat
              : t.biome === 'swamp'
                ? props.tree_mangrove
                : t.biome === 'tropical'
                ? props.tree_tropical
                : props.tree_grass;

    const w = sp.lw * z;
    const h = sp.lh * z;
    const sway = Math.sin(nowSec * 0.78 + t.gx * 0.45 + t.gz * 0.35) * 1.1 * z;
    ctx.drawImage(sp, base.x - w * 0.5 + sway * 0.5, base.y - (sp.lh - 10) * z, w, h);

    if (t.hasParasiteVine) {
      const vp = props.vine;
      ctx.drawImage(vp, base.x, base.y - 16 * z, vp.lw * 0.7 * z, vp.lh * 0.7 * z);
    }
  }

  // Render 2D Animated Sprite Sheet on the 3D Isometric Terrain (with ground drop shadow & high-altitude hovering for Eagles!)
  function draw2DSpriteOnIso(a, pt, groundPt, z) {
    const def = a.def;
    const sprKey = def.sprite || a.type;
    const anim = window.EcoSprites.getAnimFrame(sprKey, 'move', a.animTime);
    const spr = window.EcoSprites.get(sprKey, 4);
    const baseSize = a.isFly ? 32 : def.guild === 'carnivore_mid' ? 28 : 24;
    const drawSz = baseSize * z;

    // 1. Directional Drop Shadow on the Ground Tile
    const shadowScale = a.isFly ? Math.max(0.55, 1 - a.flyElev / 160) : 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.beginPath();
    ctx.ellipse(
      groundPt.x + (a.isFly ? 7 * z : 3 * z),
      groundPt.y + (a.isFly ? 3.5 * z : 1.5 * z),
      8 * z * shadowScale,
      4 * z * shadowScale,
      0.25,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. Animated 2D Sprite Sheet (consistent with Main Menu, Study Book, and 2D Mode!)
    const hop = !a.isFly && !a.eatingActive ? Math.abs(Math.sin(a.animTime * 7)) * (a.type === 'rabbit' || a.type === 'frog' ? 4 * z : 1.5 * z) : 0;
    if (anim) {
      const srcImg = anim.filter ? tintedImage(anim.img, anim.filter) : anim.img;
      ctx.save();
      ctx.translate(pt.x, pt.y - drawSz * 0.42 - hop);
      ctx.scale(a.facing >= 0 ? 1 : -1, 1);
      ctx.drawImage(srcImg, anim.sx, anim.sy, anim.sw, anim.sh, -drawSz / 2, -drawSz / 2, drawSz, drawSz);
      ctx.restore();
    } else if (spr) {
      ctx.save();
      if (z > 1.05) ctx.imageSmoothingEnabled = false;
      ctx.translate(pt.x, pt.y - drawSz * 0.42 - hop);
      ctx.scale(a.facing >= 0 ? 1 : -1, 1);
      ctx.drawImage(spr, -drawSz / 2, -drawSz / 2, drawSz, drawSz);
      ctx.restore();
    }
  }

  // Clean Animal Renderer: ONLY draws HP/Hunger bars by default!
  // Text label appears ONLY when the player hovers over that animal (or during active Combat/Eating as a compact bar)
  function drawAnimal3D(a, cw, ch) {
    const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gx)));
    const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gz)));
    const tileElev = getTileLift(grid[iz] && grid[iz][ix]);
    const groundPt = projectIso(a.gx, a.gz, tileElev);
    if (groundPt.x < -80 || groundPt.x > cw + 80 || groundPt.y < -80 || groundPt.y > ch + 100) return;

    let lungeX = 0;
    let lungeY = 0;
    if (a.combatPartner) {
      const pPt = projectIso(a.combatPartner.gx, a.combatPartner.gz, tileElev + a.combatPartner.flyElev);
      const basePt = projectIso(a.gx, a.gz, tileElev + a.flyElev);
      const wave = Math.sin(a.lungePhase) * 0.28;
      lungeX = (pPt.x - basePt.x) * wave;
      lungeY = (pPt.y - basePt.y) * wave;
    }

    const ptBase = projectIso(a.gx, a.gz, tileElev + a.flyElev);
    const pt = { x: ptBase.x + lungeX, y: ptBase.y + lungeY };
    a.screenX = pt.x;
    a.screenY = pt.y;
    const z = cam.zoom;

    if (a.combatPartner) {
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.85)';
      ctx.lineWidth = 2 * z;
      ctx.beginPath();
      ctx.ellipse(groundPt.x, groundPt.y, 15 * z, 8 * z, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    draw2DSpriteOnIso(a, pt, groundPt, z);

    // Status bar & tooltip ONLY visible when hovered or clicked/selected (keeps RTS map clean!)
    if (hoveredAnimal === a || selectedAnimal === a) {
      const barW = Math.max(22, 26 * z);
      const barH = Math.max(3, 3.5 * z);
      const bx = pt.x - barW / 2;
      const by = pt.y - 18 * z;

      ctx.fillStyle = 'rgba(15, 18, 22, 0.85)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH * 2 + 3.5);
      ctx.fillStyle = '#e53935';
      ctx.fillRect(bx, by, barW * Math.max(0, a.hp / a.maxHp), barH);

      const needPct = a.fullTimer > 0 ? 1 : Math.max(0, 1 - Math.max(a.hunger, a.thirst) / 100);
      ctx.fillStyle = a.fullTimer > 0 ? '#00e676' : a.thirst > a.hunger && a.thirst > 45 ? '#29b6f6' : '#fb8c00';
      ctx.fillRect(bx, by + barH + 1.2, barW * needPct, barH);
    }

    // Show Name & Status Tooltip ONLY on the Hovered Animal (Zero text clutter across the map!)
    if (hoveredAnimal === a || selectedAnimal === a) {
      const by = pt.y - 18 * z;
      ctx.save();
      ctx.font = 'bold 10.5px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      const label = `${a.def.name} • ${a.stateLabel}${a.symbiosisBadge ? ' • ' + a.symbiosisBadge : ''}`;
      const tw = ctx.measureText(label).width + 14;
      ctx.fillStyle = 'rgba(16, 24, 28, 0.92)';
      ctx.fillRect(pt.x - tw / 2, by - 22, tw, 17);
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(pt.x - tw / 2, by - 22, tw, 17);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, pt.x, by - 10);
      ctx.restore();
    }
  }

  function drawHuman3D(h, cw, ch) {
    const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(h.gx)));
    const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(h.gz)));
    const lift = getTileLift(grid[iz] && grid[iz][ix]);
    const pt = projectIso(h.gx, h.gz, lift);
    if (pt.x < -60 || pt.x > cw + 60 || pt.y < -60 || pt.y > ch + 80) return;

    h.screenX = pt.x;
    h.screenY = pt.y;
    const z = cam.zoom;
    const isDest = h.mood === 'destroyer';

    // Fiery warning ring for Destroyer humans
    if (isDest) {
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.85)';
      ctx.lineWidth = 1.6 * z;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y + 1 * z, 10 * z, 5 * z, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Soft angled drop shadow
    ctx.fillStyle = 'rgba(18, 20, 12, 0.34)';
    ctx.beginPath();
    ctx.ellipse(pt.x + 3.5 * z, pt.y + 1.5 * z, 8 * z, 3.8 * z, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Richly textured animated Laki-laki & Perempuan sprite sheets (crisp HD even when zoomed way in!)
    const drawSz = 34 * z;
    if (h.gender === 'female') {
      const fSheets = ensureFemaleSheets();
      const sheet = isDest ? fSheets.destroyer : fSheets.steward;
      const frameIdx = Math.floor(h.animTime * 6) % 4;
      ctx.save();
      ctx.translate(pt.x, pt.y - drawSz * 0.44);
      ctx.scale(h.facing >= 0 ? 1 : -1, 1);
      ctx.drawImage(sheet, frameIdx * 128, 0, 128, 128, -drawSz * 0.5, -drawSz * 0.5, drawSz, drawSz);
      ctx.restore();
    } else {
      const sheetKey = isDest ? 'human_destroyer' : 'human_steward';
      const anim = window.EcoSprites.getAnimFrame(sheetKey, 'move', h.animTime);
      if (anim) {
        ctx.save();
        ctx.translate(pt.x, pt.y - drawSz * 0.44);
        ctx.scale(h.facing >= 0 ? 1 : -1, 1);
        ctx.drawImage(anim.img, anim.sx, anim.sy, anim.sw, anim.sh, -drawSz * 0.5, -drawSz * 0.5, drawSz, drawSz);
        ctx.restore();
      } else {
        const bob = Math.abs(Math.sin(h.animTime * 6)) * 2 * z;
        const y0 = pt.y - bob;
        ctx.fillStyle = isDest ? '#c62828' : '#2e7d32';
        ctx.fillRect(pt.x - 3.8 * z, y0 - 13 * z, 7.6 * z, 11 * z);
        c_head: {
          ctx.fillStyle = '#f2c29b';
          ctx.beginPath();
          ctx.arc(pt.x, y0 - 16 * z, 3.6 * z, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Live Construction Progress Bar right above a human actively building a Rumah!
    if (h.buildTile && h.buildTimer > 0) {
      const prog = Math.max(0, Math.min(1, 1 - h.buildTimer / (h.buildMax || 1.8)));
      const bw = Math.max(28, 32 * z);
      const bh = Math.max(4, 4.5 * z);
      const bx = pt.x - bw * 0.5;
      const by = pt.y - drawSz * 0.92;
      ctx.fillStyle = 'rgba(22, 14, 8, 0.9)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(bx, by, bw * prog, bh);
    }

    if (hoveredHuman === h || selectedHuman === h) {
      ctx.save();
      ctx.font = 'bold 10.5px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      const roleTag = isDest
        ? (h.gender === 'female' ? '🔥 Perempuan Perusak' : '🔥 Laki-laki Perusak')
        : (h.gender === 'female' ? '👩 Perempuan Pengelola' : '👨 Laki-laki Pengelola');
      const label = roleTag + ' • ' + h.stateLabel;
      const tw = ctx.measureText(label).width + 14;
      const by = pt.y - drawSz * 0.98;
      ctx.fillStyle = 'rgba(28, 18, 12, 0.94)';
      ctx.fillRect(pt.x - tw / 2, by - 16, tw, 17);
      ctx.strokeStyle = isDest ? '#ff5252' : (h.gender === 'female' ? '#ff80ab' : '#69f0ae');
      ctx.lineWidth = 1.2;
      ctx.strokeRect(pt.x - tw / 2, by - 16, tw, 17);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, pt.x, by - 4);
      ctx.restore();
    }
  }

    // Fast, ShadowBlur-Free 3D Glowing Splines (only drawn when "🕸️ Mode Jaring" is active, plus active combat duels)
  function drawInteractionArrows(nowSec) {
    for (const a of animals) {
      const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gx)));
      const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gz)));
      const pAnimal = projectIso(a.gx, a.gz, 0 + a.flyElev + 10);

      if (a.combatPartner && animals.includes(a.combatPartner) && a.id < a.combatPartner.id) {
        const tx = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.combatPartner.gx)));
        const tz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.combatPartner.gz)));
        const pTo = projectIso(a.combatPartner.gx, a.combatPartner.gz, grid[tz][tx].elev + a.combatPartner.flyElev + 10);
        drawCurvedArrowFast(pAnimal.x, pAnimal.y, pTo.x, pTo.y, '#ff1744', nowSec, a.combatRole === 'rival');
        continue;
      }

      if (!showFoodWeb) continue;

      if (a.targetEntity && animals.includes(a.targetEntity)) {
        const tx = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.targetEntity.gx)));
        const tz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.targetEntity.gz)));
        const pPrey = projectIso(a.targetEntity.gx, a.targetEntity.gz, 0 + a.targetEntity.flyElev + 10);
        drawCurvedArrowFast(pPrey.x, pPrey.y, pAnimal.x, pAnimal.y, '#ff5252', nowSec, false);
      } else if (a.targetTile) {
        const pTile = projectIso(a.targetTile.gx + 0.5, a.targetTile.gz + 0.5, 0 + 6);
        const isProd = a.targetTile.producerStage > 0;
        drawCurvedArrowFast(pTile.x, pTile.y, pAnimal.x, pAnimal.y, isProd ? '#00e676' : '#40c4ff', nowSec, false);
      }
    }

    if (showFoodWeb) {
      for (const sym of activeSymbioses) {
        const p1 = projectIso(sym.fromGx, sym.fromGz, sym.fromElev);
        const p2 = projectIso(sym.toGx, sym.toGz, sym.toElev);
        drawCurvedArrowFast(p1.x, p1.y, p2.x, p2.y, sym.color, nowSec, Boolean(sym.dashed));
      }
    }
  }

  // Zero shadowBlur! Uses a fast outer translucent stroke + inner core stroke for 10x faster rendering
  function drawCurvedArrowFast(x1, y1, x2, y2, glowCol, nowSec, isDashed) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 22 * cam.zoom;

    ctx.save();
    if (isDashed) ctx.setLineDash([6 * cam.zoom, 5 * cam.zoom]);

    // Outer glow stroke (fast, no shadowBlur)
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 5 * Math.min(1.2, cam.zoom);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();

    // Inner bright core
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2 * Math.min(1.2, cam.zoom);
    ctx.stroke();

    ctx.setLineDash([]);
    const t = (nowSec * 0.85) % 1;
    const ox = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const oy = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, 2.8 * Math.min(1.2, cam.zoom), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function renderIso() {
    if (!active || !canvas || !ctx) return;
    const isCompactScreen = (canvas.clientWidth || 800) <= 720;
    const maxDpr = isCompactScreen ? (cam.zoom > 1.1 ? 1.6 : 1.35) : (cam.zoom > 0.85 ? 2.15 : 1.5);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    viewW = cw;
    viewH = ch;
    if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nowSec = performance.now() * 0.001;
    updateHoverPick();

    // Sky-to-Ocean Diorama Gradient (cached per canvas height)
    if (!bgGradient || bgGradientH !== ch) {
      bgGradient = ctx.createLinearGradient(0, 0, 0, ch);
      bgGradient.addColorStop(0.0, '#1c5866');
      bgGradient.addColorStop(0.5, '#164956');
      bgGradient.addColorStop(1.0, '#0f3540');
      bgGradientH = ch;
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    if (cam.trauma > 0) {
      const sh = cam.trauma * cam.trauma * 12;
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    }

    const tCache = ensureTerrainCache();
    if (tCache) drawTerrainCache(tCache, cw, ch);
    drawZoomedHDDetail(nowSec, cw, ch);
    drawOceanAndShoreWaves(nowSec, cw, ch);
    drawWaterTiles(nowSec, cw, ch);
    drawHoverOutline(hoverTile);
    drawFloraLayer(nowSec, cw, ch);

    drawInteractionArrows(nowSec);

    // Depth-sort Trees, Animals & Humans using reusable buffer
    drawablesBuf.length = 0;
    for (let i = 0; i < treeTiles.length; i++) {
      const t = treeTiles[i];
      drawablesBuf.push({ kind: 0, depth: depthKey(t.gx + 0.5, t.gz + 0.5), ref: t });
    }
    for (let i = 0; i < sawitTiles.length; i++) {
      const t = sawitTiles[i];
      drawablesBuf.push({ kind: 3, depth: depthKey(t.gx + 0.5, t.gz + 0.5), ref: t });
    }
    for (let i = 0; i < buildingTiles.length; i++) {
      const t = buildingTiles[i];
      drawablesBuf.push({ kind: 4, depth: depthKey(t.gx + 0.5, t.gz + 0.5), ref: t });
    }
    for (let i = 0; i < animals.length; i++) {
      const a = animals[i];
      drawablesBuf.push({ kind: 1, depth: depthKey(a.gx, a.gz) + (a.isFly ? 6 : 0), ref: a });
    }
    for (let i = 0; i < humans.length; i++) {
      const h = humans[i];
      drawablesBuf.push({ kind: 2, depth: depthKey(h.gx, h.gz) + 0.1, ref: h });
    }
    drawablesBuf.sort((a, b) => a.depth - b.depth);

    const props = ensureBakedProps();
    for (let i = 0; i < drawablesBuf.length; i++) {
      const item = drawablesBuf[i];
      if (item.kind === 0) {
        draw3DBiomeTree(item.ref, cw, ch, nowSec);
      } else if (item.kind === 3) {
        const t = item.ref;
        const base = projectIso(t.gx + 0.5, t.gz + 0.5, getTileLift(t));
        if (base.x > -60 && base.x < cw + 60 && base.y > -60 && base.y < ch + 80) {
          const sp = props.sawit;
          const z = cam.zoom;
          ctx.drawImage(sp, base.x - sp.lw * 0.5 * z, base.y - (sp.lh - 9) * z, sp.lw * z, sp.lh * z);
        }
      } else if (item.kind === 4) {
        const t = item.ref;
        const base = projectIso(t.gx + 0.5, t.gz + 0.5, getTileLift(t));
        if (base.x > -70 && base.x < cw + 70 && base.y > -70 && base.y < ch + 90) {
          const sp = t.building === 'hall' ? props.hall : t.building === 'hut_lumbung' ? props.hut_lumbung : props.hut;
          const z = cam.zoom;
          ctx.drawImage(sp, base.x - sp.lw * 0.5 * z, base.y - (sp.lh - 9) * z, sp.lw * z, sp.lh * z);
        }
      } else if (item.kind === 2) {
        drawHuman3D(item.ref, cw, ch);
      } else {
        drawAnimal3D(item.ref, cw, ch);
      }
    }

    // Slowly drifting semi-transparent ambient cloud shadows across ocean & island (classic RTS atmosphere!)
    if (ambientShadows.length > 0) {
      const shSp = props.cloud_shadow;
      ctx.save();
      for (let i = 0; i < ambientShadows.length; i++) {
        const sh = ambientShadows[i];
        const spt = projectIso(sh.gx, sh.gz, 0);
        const sw = shSp.lw * cam.zoom * sh.scale;
        const shH = shSp.lh * cam.zoom * sh.scale;
        if (spt.x + sw < 0 || spt.x - sw > cw || spt.y + shH < 0 || spt.y - shH > ch) continue;
        ctx.globalAlpha = sh.alpha;
        ctx.drawImage(shSp, spt.x - sw * 0.5, spt.y - shH * 0.5, sw, shH);
      }
      ctx.restore();
    }

    drawGlowPass(nowSec, cw, ch, props);
    drawFogWisps(nowSec, cw, ch, props);

    // Painterly typed clouds (Seed Grass, Seed Tree, Nature Rocks, Rain, Anger, Harmony) + falling droplets
    const CLOUD_STYLES = {
      rain: { body: '#cfd8dc', hi: '#ffffff', drop: '#4fc3f7' },
      lightning: { body: '#37474f', hi: '#78909c', drop: '#ffd54f' },
      seed_grass: { body: '#a5d6a7', hi: '#e8f5e9', drop: '#69f0ae' },
      seed_tree: { body: '#66bb6a', hi: '#c8e6c9', drop: '#2e7d32' },
      seed_nature: { body: '#bcaaa4', hi: '#efebe9', drop: '#ffca28' },
      emotion_anger: { body: '#6a1b4d', hi: '#c62828', drop: '#ff5252' },
      emotion_harmony: { body: '#80deea', hi: '#fff9c4', drop: '#ffd54f' }
    };
    for (const c of clouds3d) {
      const st = CLOUD_STYLES[c.kind] || CLOUD_STYLES.rain;
      const pt = projectIso(c.gx, c.gz, 72);
      const z = cam.zoom;
      const fade = Math.min(1, c.life / 1.5);
      ctx.save();
      ctx.globalAlpha = 0.92 * fade;
      // Falling droplets/seeds/aura below cloud
      ctx.strokeStyle = st.drop;
      ctx.lineWidth = Math.max(1.2, 1.8 * z);
      for (let d = -2; d <= 2; d++) {
        const dropPhase = (nowSec * 3.5 + d * 0.37) % 1;
        const dx = pt.x + d * 8 * z;
        const dy = pt.y + 8 * z + dropPhase * 34 * z;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - 1.5 * z, dy + 6 * z);
        ctx.stroke();
      }
      // Cloud puffs
      ctx.fillStyle = st.body;
      ctx.beginPath();
      ctx.arc(pt.x - 14 * z, pt.y + 2 * z, 11 * z, 0, Math.PI * 2);
      ctx.arc(pt.x + 14 * z, pt.y + 2 * z, 11 * z, 0, Math.PI * 2);
      ctx.arc(pt.x, pt.y - 3 * z, 15 * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = st.hi;
      ctx.beginPath();
      ctx.arc(pt.x - 6 * z, pt.y - 6 * z, 10 * z, 0, Math.PI * 2);
      ctx.arc(pt.x + 8 * z, pt.y - 3 * z, 8 * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (eventFocus) {
      const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gx)));
      const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gz)));
      const lift = getTileLift(grid[iz] && grid[iz][ix]);
      const pMain = projectIso(eventFocus.gx, eventFocus.gz, lift);
      const pulse = 1 + Math.sin(nowSec * 5) * 0.14;
      const z = cam.zoom;

      // Glowing spotlight rings on ground
      ctx.save();
      ctx.strokeStyle = eventFocus.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(pMain.x, pMain.y, 22 * z * pulse, 11 * z * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = eventFocus.fill;
      ctx.fill();

      // Draw connecting symbiosis arc to partner tile/animal if present
      let p2 = null;
      if (eventFocus.partnerAnimal && animals.includes(eventFocus.partnerAnimal)) {
        const pax = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.partnerAnimal.gx)));
        const paz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.partnerAnimal.gz)));
        p2 = projectIso(eventFocus.partnerAnimal.gx, eventFocus.partnerAnimal.gz, getTileLift(grid[paz] && grid[paz][pax]) + 8);
      } else if (eventFocus.partnerTile) {
        p2 = projectIso(eventFocus.partnerTile.gx + 0.5, eventFocus.partnerTile.gz + 0.5, getTileLift(eventFocus.partnerTile) + 12);
      }
      if (p2) {
        drawCurvedArrowFast(pMain.x, pMain.y - 8 * z, p2.x, p2.y, eventFocus.color, nowSec, eventFocus.kind === 'amensal');
      }

      // Crisp Educational Callout Card above the zoomed symbiosis event
      ctx.font = 'bold 11.5px Georgia, serif';
      const titleW = ctx.measureText(eventFocus.title).width;
      ctx.font = '10.5px Segoe UI, sans-serif';
      const descW = ctx.measureText(eventFocus.desc).width;
      const boxW = Math.max(titleW, descW) + 24;
      const boxH = 40;
      const bx = Math.max(12, Math.min(cw - boxW - 12, pMain.x - boxW / 2));
      const by = Math.max(54, pMain.y - 54 * z - boxH);

      ctx.fillStyle = 'rgba(28, 18, 11, 0.94)';
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = eventFocus.color;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.textAlign = 'center';
      ctx.font = 'bold 11.5px Georgia, serif';
      ctx.fillStyle = eventFocus.color;
      ctx.fillText(eventFocus.title, bx + boxW / 2, by + 16);
      ctx.font = '10.5px Segoe UI, sans-serif';
      ctx.fillStyle = '#f6ead2';
      ctx.fillText(eventFocus.desc, bx + boxW / 2, by + 32);
      ctx.restore();

      if (zoomInfoBtn) {
        zoomInfoBtn.classList.remove('hidden');
        zoomInfoBtn.style.left = `${Math.round(bx + boxW / 2)}px`;
        zoomInfoBtn.style.top = `${Math.max(42, Math.round(by - 6))}px`;
      }
    } else if (zoomInfoBtn && !zoomInfoBtn.classList.contains('hidden')) {
      zoomInfoBtn.classList.add('hidden');
    }

    // Dramatic Jagged Forked Lightning Bolts striking from sky to island!
    if (lightningBolts.length > 0) {
      for (let bIdx = 0; bIdx < lightningBolts.length; bIdx++) {
        const lb = lightningBolts[bIdx];
        const hit = projectIso(lb.gx, lb.gz, lb.elev);
        const topY = hit.y - Math.max(260, 340 * cam.zoom);
        const alpha = Math.min(1, (lb.life / lb.maxLife) * 1.4);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'bevel';

        // Outer electric cyan plasma aura
        ctx.globalAlpha = alpha * 0.72;
        ctx.strokeStyle = '#40c4ff';
        ctx.lineWidth = Math.max(5, 8.5 * cam.zoom);
        ctx.beginPath();
        for (let s = 0; s < lb.segs.length; s++) {
          const sg = lb.segs[s];
          const px = hit.x + sg.dx * cam.zoom;
          const py = topY + (hit.y - topY) * sg.t;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        for (let f = 0; f < lb.forks.length; f++) {
          const fk = lb.forks[f];
          const baseSeg = lb.segs[fk.fromIdx];
          const bx0 = hit.x + baseSeg.dx * cam.zoom;
          const by0 = topY + (hit.y - topY) * baseSeg.t;
          ctx.moveTo(bx0, by0);
          ctx.lineTo(hit.x + fk.dx1 * cam.zoom, by0 + fk.dy1 * cam.zoom);
          ctx.lineTo(hit.x + fk.dx2 * cam.zoom, by0 + fk.dy2 * cam.zoom);
        }
        ctx.stroke();

        // Inner blinding white-gold lightning core
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#fffde7';
        ctx.lineWidth = Math.max(2, 3.0 * cam.zoom);
        ctx.stroke();

        // Ground impact electric starburst
        ctx.fillStyle = 'rgba(255, 249, 196, 0.9)';
        ctx.beginPath();
        ctx.ellipse(hit.x, hit.y, 16 * cam.zoom * alpha, 8 * cam.zoom * alpha, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (spawnRings.length > 0) {
      for (const r of spawnRings) {
        const tProg = 1 - r.life / r.maxLife;
        const pt = projectIso(r.gx, r.gz, r.elev);
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, (10 + tProg * 28) * cam.zoom, (5 + tProg * 14) * cam.zoom, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (fxParticles.length > 0) {
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      for (const p of fxParticles) {
        const pt = projectIso(p.gx, p.gz, p.elev);
        ctx.globalAlpha = Math.max(0, p.life / 1.1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, pt.x, pt.y);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    drawAtmosphereOverlay(cw, ch);

    if (skyFlashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(220, 246, 255, ${skyFlashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    }

    const activeBrush = selectedDockCard || draggingDockCard;
    if (activeBrush && pointerOnCanvas && hoverTile) {
      const spr = window.EcoSprites.get(activeBrush.sprite, 3);
      const tPt = projectIso(hoverTile.gx + 0.5, hoverTile.gz + 0.5, getTileLift(hoverTile));
      if (spr) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.drawImage(spr, tPt.x - 16, tPt.y - 26, 32, 32);
        ctx.restore();
      }
    }
  }

  function getCardPopulationCount(cardId) {
    if (cardId === 'grass') {
      let c = 0;
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].producerStage > 0) c++;
      }
      return c;
    }
    if (cardId === 'tree') {
      let c = 0;
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].hasTree) c++;
      }
      return c;
    }
    if (cardId === 'mushroom') {
      let c = 0;
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].hasMycorrhiza) c++;
      }
      return c;
    }
    if (cardId === 'parasite') {
      let c = animals.filter((a) => a.hasParasite).length;
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i++) if (tiles[i].hasParasiteVine) c++;
      return c;
    }
    if (cardId === 'sawit') return sawitTiles.length;
    if (cardId === 'human') return humans.filter((h) => h.gender !== 'female').length;
    if (cardId === 'human_female') return humans.filter((h) => h.gender === 'female').length;
    if (cardId === 'nature_rock') {
      let c = 0;
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i++) if (tiles[i].propType === 'mossy_rock') c++;
      return c;
    }
    if (cardId === 'cloud_anger') return clouds3d.filter((cl) => cl.kind === 'emotion_anger').length;
    if (cardId === 'cloud_harmony') return clouds3d.filter((cl) => cl.kind === 'emotion_harmony').length;
    if (cardId === 'cloud') return clouds3d.filter((cl) => cl.kind === 'rain').length;
    if (cardId === 'cloud_lightning') return clouds3d.filter((cl) => cl.kind === 'lightning').length;
    if (cardId === 'plant_grass') return getCardPopulationCount('grass');
    if (cardId === 'plant_tree') return getCardPopulationCount('tree');
    if (cardId === 'terra_grass') return (landTilesByRot[0] || []).filter((t) => t.biome === 'grassland').length;
    if (cardId === 'terra_sand') return (landTilesByRot[0] || []).filter((t) => t.biome === 'desert' || t.type === 'sand').length;
    if (cardId === 'terra_rock') return (landTilesByRot[0] || []).filter((t) => t.biome === 'hills').length;
    if (cardId === 'terra_water') return (waterTilesByRot[0] || []).length;
    if (cardId === 'terra_erase') return '3×3';
    return animals.filter((a) => a.type === cardId).length;
  }

  function updateDockPopulations() {
    if (!cardDockEl) return;
    cardDockEl.querySelectorAll('[data-pop-card]').forEach((el) => {
      const cid = el.getAttribute('data-pop-card');
      el.textContent = `Populasi: ${getCardPopulationCount(cid)}`;
    });
    cardDockEl.querySelectorAll('[data-count-badge]').forEach((el) => {
      const cid = el.getAttribute('data-count-badge');
      el.textContent = String(getCardPopulationCount(cid));
    });
    cardDockEl.querySelectorAll('[data-title-card]').forEach((el) => {
      const cid = el.getAttribute('data-title-card');
      const cname = el.getAttribute('data-base-name');
      el.textContent = cname;
    });
  }

  function updateBalanceHUD() {
    if (!balancePctEl || !balanceFillEl) return;
    let prodCount = 0;
    let mutualCount = 0;
    const tiles = sortedTilesByRot[0];
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].producerStage > 0) prodCount++;
      if (tiles[i].hasMycorrhiza) mutualCount++;
    }
    const herbCount = animals.filter((a) => HERBIVORES.includes(a.type)).length;
    const carnCount = animals.filter((a) => CARNIVORES.includes(a.type)).length;
    const apexCount = animals.filter((a) => APEXES.includes(a.type)).length;
    const stewardCount = humans.filter((h) => h.mood === 'steward').length;
    const destCount = humans.filter((h) => h.mood === 'destroyer').length;

    let score = 100;
    if (prodCount === 0) score -= 42;
    else if (prodCount < 20) score -= (20 - prodCount) * 1.2;

    if (herbCount === 0) score -= 24;
    if (carnCount === 0) score -= 18;
    if (apexCount === 0) score -= 12;
    score += Math.min(8, Math.floor(mutualCount / 6)) + Math.min(6, stewardCount * 2) - destCount * 8 - Math.floor(sawitTiles.length * 1.6) - (floodTiles.length > 0 ? 18 : 0) - (treeTiles.length < 20 ? 25 : 0);

    score = Math.max(10, Math.min(100, Math.round(score)));
    balancePctEl.textContent = `${score}%`;
    balanceFillEl.style.width = `${score}%`;
    balanceFillEl.style.background =
      score >= 70
        ? 'linear-gradient(90deg, #26c6da, #00e676)'
        : score >= 45
          ? 'linear-gradient(90deg, #ffa726, #ffee58)'
          : 'linear-gradient(90deg, #ef5350, #ff7043)';

    if (popSummaryEl) {
      popSummaryEl.textContent = `🌱${prodCount} • 🦗${herbCount} • 🐍${carnCount} • 🦅${apexCount}` + (humans.length > 0 ? ` • 🧑${stewardCount}/🔥${destCount}` : '');
    }
    if (pyrRows) {
      const maxPop = Math.max(1, prodCount, herbCount, carnCount, apexCount);
      const tiers = [
        { key: 'prod', val: prodCount, warn: prodCount === 0 && herbCount > 0 },
        { key: 'herb', val: herbCount, warn: herbCount > prodCount },
        { key: 'carn', val: carnCount, warn: carnCount > herbCount },
        { key: 'apex', val: apexCount, warn: apexCount > carnCount }
      ];
      let anyWarn = false;
      for (const tr of tiers) {
        if (tr.warn) anyWarn = true;
        const r = pyrRows[tr.key];
        if (!r) continue;
        if (r.cnt) r.cnt.textContent = String(tr.val);
        if (r.fill) r.fill.style.width = `${Math.max(tr.val > 0 ? 10 : 3, Math.round((tr.val / maxPop) * 100))}%`;
        if (r.row) r.row.classList.toggle('pyramid-warn', tr.warn);
      }
      if (pyrStatusEl) {
        pyrStatusEl.textContent = anyWarn ? '⚠️ Piramida Terbalik!' : '⚖️ Seimbang';
        pyrStatusEl.classList.toggle('warn', anyWarn);
      }
    }
    if (coinValEl) coinValEl.textContent = String(isoCoins);
    if (symCntEls.mutual) symCntEls.mutual.textContent = String(symStats.mutual);
    if (symCntEls.commensal) symCntEls.commensal.textContent = String(symStats.commensal);
    if (symCntEls.parasite) symCntEls.parasite.textContent = String(symStats.parasite);
    if (symCntEls.amensal) symCntEls.amensal.textContent = String(symStats.amensal);
    if (advisorPctEl) advisorPctEl.textContent = String(score);
    if (advisorTipEl) {
      advisorTipEl.textContent =
        score >= 80
          ? 'Ekosistem harmonis! Jaring makanan berjalan seimbang.'
          : prodCount < 15
            ? 'Tanam lebih banyak rumput & pohon agar herbivora bertahan.'
            : apexCount === 0
              ? 'Tambahkan Elang atau Bangau untuk menjaga puncak rantai.'
              : 'Seimbangkan populasi mangsa dan predator di pulau.';
    }

    const maleCount = humans.filter((h) => h.gender !== 'female').length;
    const femaleCount = humans.length - maleCount;
    if (civSummaryEl) {
      civSummaryEl.textContent = `👨${maleCount} 👩${femaleCount} 🏠${buildingTiles.length} 🌾${farmTiles.length} 🪵${civ.wood} 🪨${civ.stone} 🌴${sawitTiles.length}`;
    }
    if (peatBadgeEl) {
      const pm = Math.round(peatMoisture);
      peatBadgeEl.textContent = `🪵 Gambut ${pm}%`;
      peatBadgeEl.classList.toggle('warn', pm < 60 && pm >= 40);
      peatBadgeEl.classList.toggle('danger', pm < 40);
    }

    const missions = [
      prodCount >= 8 && herbCount >= 4 && carnCount >= 2 && apexCount >= 1,
      apexCount >= 3,
      (symStats.mutual + symStats.commensal) >= 6,
      maleCount >= 1 && femaleCount >= 1 && buildingTiles.length >= 2,
      treeTiles.length >= 45 && sawitTiles.length <= 5,
      score >= 85
    ];
    let doneTotal = 0;
    for (let mIdx = 0; mIdx < missions.length; mIdx++) {
      const done = missions[mIdx];
      if (done) {
        doneTotal++;
        if (!missionRewarded[mIdx]) {
          missionRewarded[mIdx] = true;
          addIsoCoins(80);
        }
      }
      const num = mIdx + 1;
      const item = document.getElementById(`iso-mission-${num}`);
      const dot = document.getElementById(`iso-m${num}-dot`);
      if (item) item.classList.toggle('done', done);
      if (dot) {
        dot.textContent = done ? '✔' : '○';
        dot.style.color = done ? '#00e676' : '#f4d38c';
      }
    }
    const mHdr = document.getElementById('iso-mission-header-title');
    if (mHdr) mHdr.textContent = `📜 Misi Ekosistem & Negeri (${doneTotal}/6)`;

    updateDockPopulations();
  }

  // Draw 2D Sprite Icon inside each Dock Card canvas so it matches the 2D Mode & Main Menu assets!
  function draw3DCardIcon(cctx, card) {
    cctx.clearRect(0, 0, 54, 46);
    if (card.iconKind) {
      const k = card.iconKind;
      if (k === 'direct_tree') {
        const sp = ensureBakedProps().tree_grass;
        cctx.drawImage(sp, 3, 0, 48, 46);
        return;
      }
      if (k && k.startsWith('terra_')) {
        // Crisp Isometric 3D Terrain Block Icon for Tanah Rumput, Pasir Gurun, Bukit Batu, Air & Hapus Daerah!
        const styles = {
          terra_grass: { top: '#7cb342', left: '#558b2f', right: '#33691e', sym: '🌱' },
          terra_peat:  { top: '#5c6e3b', left: '#4a3520', right: '#2f2012', sym: '🪵' },
          terra_sand:  { top: '#e6c17a', left: '#c69c53', right: '#9c7534', sym: '🏜️' },
          terra_rock:  { top: '#8d9965', left: '#756856', right: '#4a4033', sym: '⛰️' },
          terra_water: { top: '#4dd0e1', left: '#0097a7', right: '#006064', sym: '💧' },
          terra_erase: { top: '#ef5350', left: '#b71c1c', right: '#7f0000', sym: '⛏️' }
        };
        const ts = styles[k] || styles.terra_grass;
        const cx = 27, cy = k === 'terra_rock' ? 17 : 21, hw = 19, hh = 9.5, drop = k === 'terra_rock' ? 16 : 10;
        cctx.fillStyle = ts.left;
        cctx.beginPath(); cctx.moveTo(cx - hw, cy); cctx.lineTo(cx, cy + hh); cctx.lineTo(cx, cy + hh + drop); cctx.lineTo(cx - hw, cy + drop); cctx.closePath(); cctx.fill();
        cctx.fillStyle = ts.right;
        cctx.beginPath(); cctx.moveTo(cx + hw, cy); cctx.lineTo(cx, cy + hh); cctx.lineTo(cx, cy + hh + drop); cctx.lineTo(cx + hw, cy + drop); cctx.closePath(); cctx.fill();
        cctx.fillStyle = ts.top;
        cctx.beginPath(); cctx.moveTo(cx, cy - hh); cctx.lineTo(cx + hw, cy); cctx.lineTo(cx, cy + hh); cctx.lineTo(cx - hw, cy); cctx.closePath(); cctx.fill();
        cctx.font = '13px Segoe UI Emoji, sans-serif';
        cctx.textAlign = 'center';
        cctx.fillText(ts.sym, cx, cy + 4);
        return;
      }
      if (k === 'sekat_kanal') {
        const sp = ensureBakedProps().sekat_kanal;
        cctx.drawImage(sp, 5, 6, 44, 34);
        return;
      }
      if (k === 'bibit_gambut') {
        const sp = ensureBakedProps().kelakai_fern;
        cctx.drawImage(sp, 7, 5, 40, 36);
        return;
      }
      if (k === 'sawit') {
        const sp = ensureBakedProps().sawit;
        cctx.drawImage(sp, 3, 0, 48, 46);
        return;
      }
      if (k === 'human_female') {
        const sheet = ensureFemaleSheets().steward;
        cctx.imageSmoothingEnabled = true;
        cctx.imageSmoothingQuality = 'high';
        cctx.drawImage(sheet, 0, 0, 128, 128, 5, 1, 44, 44);
        return;
      }
      if (k === 'human' || k === 'human_male') {
        const anim = window.EcoSprites.getAnimFrame('human_steward', 'move', 0);
        if (anim) {
          cctx.imageSmoothingEnabled = true;
          cctx.imageSmoothingQuality = 'high';
          cctx.drawImage(anim.img, anim.sx, anim.sy, anim.sw, anim.sh, 5, 1, 44, 44);
          return;
        }
        // Fallback miniature Nusantara Guardian/Human icon
        cctx.fillStyle = '#2e7d32';
        cctx.fillRect(21, 24, 12, 13);
        cctx.fillStyle = '#3e2723';
        cctx.fillRect(22, 37, 4, 7);
        cctx.fillRect(28, 37, 4, 7);
        cctx.fillStyle = '#f2c29b';
        cctx.beginPath();
        cctx.arc(27, 19, 6, 0, Math.PI * 2);
        cctx.fill();
        cctx.fillStyle = '#e0b86b';
        cctx.beginPath();
        cctx.moveTo(27, 6);
        cctx.lineTo(39, 17);
        cctx.lineTo(15, 17);
        cctx.closePath();
        cctx.fill();
        return;
      }
      // Styled cloud icons (seed_grass, seed_tree, seed_nature, rain, emotion_anger, emotion_harmony)
      const map = {
        seed_grass: { c: '#81c784', h: '#e8f5e9', d: '#2e7d32', sym: '🌱' },
        seed_tree: { c: '#4caf50', h: '#c8e6c9', d: '#1b5e20', sym: '🌳' },
        seed_nature: { c: '#a1887f', h: '#efebe9', d: '#6d4c41', sym: '🪨' },
        rain: { c: '#90caf9', h: '#ffffff', d: '#0288d1', sym: '💧' },
        lightning: { c: '#455a64', h: '#90a4ae', d: '#ffd54f', sym: '⚡' },
        emotion_anger: { c: '#880e4f', h: '#e53935', d: '#ff5252', sym: '💢' },
        emotion_harmony: { c: '#4dd0e1', h: '#fff9c4', d: '#ffb300', sym: '🕊️' }
      };
      const st = map[k] || map.rain;
      cctx.fillStyle = st.c;
      cctx.beginPath();
      cctx.arc(17, 20, 9, 0, Math.PI * 2);
      cctx.arc(37, 20, 9, 0, Math.PI * 2);
      cctx.arc(27, 15, 11, 0, Math.PI * 2);
      cctx.fill();
      cctx.fillStyle = st.h;
      cctx.beginPath();
      cctx.arc(23, 13, 7, 0, Math.PI * 2);
      cctx.fill();
      cctx.font = '15px Segoe UI Emoji, sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText(st.sym, 27, 42);
      return;
    }
    const spr = window.EcoSprites.get(card.sprite, 3);
    if (spr) {
      cctx.imageSmoothingEnabled = true;
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(spr, 5, 1, 44, 44);
    }
  }

  function renderDock() {
    if (!cardDockEl) return;
    cardDockEl.innerHTML = '';

    const allowedAnimals = MODE_ALLOWED_SPECIES[mapMode] || MODE_ALLOWED_SPECIES.multi;
    const visibleCards = DOCK_CARDS.filter((c) => {
      const modeOk = c.isTerra || c.cat === 'cloud' || c.cat === 'prod' || c.cat === 'human' || allowedAnimals.includes(c.id);
      if (!modeOk) return false;
      if (dockCategory === 'all') return true;
      return c.cat === dockCategory;
    });
        if (selectedDockCard && !visibleCards.some((vc) => vc.id === selectedDockCard.id)) {
      selectedDockCard = null;
    }

    // WorldBox Pan/Inspect Hand Tool (first slot)
    const handEl = document.createElement('div');
    handEl.className = 'iso-ref-card tier-mid' + (!selectedDockCard ? ' selected-iso-card' : '');
    handEl.title = 'Mode Geser & Inspeksi Peta (klik hewan untuk lihat status)';
    handEl.innerHTML = `
      <span class="iso-card-top-i">KAMERA</span>
      <div class="iso-card-art" style="font-size:20px;">🖐️</div>
      <div class="iso-card-title">Geser Peta</div>
      <div class="iso-card-footer"><span class="iso-card-cost-pill">BEBAS</span><span class="iso-card-act-pill">${!selectedDockCard ? '✓ AKTIF' : 'GESER'}</span></div>
    `;
    handEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      e.stopPropagation();
      selectedDockCard = null;
      if (canvas) canvas.classList.remove('placing-mode');
      renderDock();
      logEvent('🖐️ Mode Geser Peta aktif — seret untuk menggeser kamera atau klik hewan.');
    });
    cardDockEl.appendChild(handEl);

    visibleCards.forEach((c) => {
      const cnt = getCardPopulationCount(c.id);
      const isSelTop = Boolean(selectedDockCard && selectedDockCard.id === c.id);
      const isGuided = !isSelTop && guidedCardIds.includes(c.id);
      const cardEl = document.createElement('div');
      cardEl.className = 'iso-ref-card ' + c.tierClass + (isSelTop ? ' selected-iso-card' : '') + (isGuided ? ' guided-card-pulse' : '');
      cardEl.title = `[${c.group}] ${c.name}: ${c.role}`;

      const countBadge = document.createElement('span');
      countBadge.className = 'iso-card-count-badge';
      countBadge.setAttribute('data-count-badge', c.id);
      countBadge.textContent = String(cnt);
      cardEl.appendChild(countBadge);

      const infoBadge = document.createElement('span');
      infoBadge.className = 'iso-card-top-i';
      infoBadge.textContent = c.group;
      cardEl.appendChild(infoBadge);

      const artWrap = document.createElement('div');
      artWrap.className = 'iso-card-art';
      const cv = document.createElement('canvas');
      cv.width = 54;
      cv.height = 46;
      const cctx = cv.getContext('2d');
      draw3DCardIcon(cctx, c);
      artWrap.appendChild(cv);
      cardEl.appendChild(artWrap);

      const nameEl = document.createElement('div');
      nameEl.className = 'iso-card-title';
      nameEl.setAttribute('data-title-card', c.id);
      nameEl.setAttribute('data-base-name', c.name);
      nameEl.textContent = c.name;
      cardEl.appendChild(nameEl);

      const isSel = Boolean(selectedDockCard && selectedDockCard.id === c.id);
      const footer = document.createElement('div');
      footer.className = 'iso-card-footer';
      footer.innerHTML = `<span class="iso-card-cost-pill">🪙 ${c.cost}</span><span class="iso-card-act-pill">${isSel ? '✓ AKTIF' : isGuided ? '👈 PILIH INI' : '✦ PILIH'}</span>`;
      cardEl.appendChild(footer);

      cardEl.draggable = false;
      cardEl.addEventListener('dragstart', (e) => e.preventDefault());
      cardEl.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        e.stopPropagation();
        selectedDockCard = selectedDockCard && selectedDockCard.id === c.id ? null : c;
        if (canvas) canvas.classList.toggle('placing-mode', Boolean(selectedDockCard));
        renderDock();
        if (selectedDockCard) {
          logEvent(`✨ [${selectedDockCard.name}] dipilih! Klik kiri atau tahan-geser di peta (klik kanan untuk geser/batal).`);
        } else {
          logEvent('🖐️ Mode Geser Peta aktif.');
        }
      });

      cardDockEl.appendChild(cardEl);
    });
  }

  function placeCardOnTile(card, tile) {
    if (!tile) {
      logEvent('🌍 Klik langsung di area peta pulau untuk meletakkan!');
      return false;
    }
    if (!isInsideMaxIslandBounds(tile.gx, tile.gz)) {
      logEvent('🌊 Batas maksimal luas pulau sudah tercapai — kelola atau ubah daerah di dalam batas pulau!');
      return false;
    }

    if (card.isTerra) {
      if (window.EcoAudio && typeof window.EcoAudio.playDrop === 'function') window.EcoAudio.playDrop();
      const changed = applyTerraformBrush(card.terraKind, tile);
      if (changed <= 0) return false;
      if (guidedCardIds.includes(card.id)) {
        guidedCardIds = [];
        guidedHintText = '';
        renderDock();
        if (activeRecoveryKey) {
          const rk = activeRecoveryKey;
          activeRecoveryKey = null;
          showReflectionModal(rk);
        }
      }
      tutPlacements++;
      const pElev = getTileLift(tile);
      spawnRings.push({ gx: tile.gx + 0.5, gz: tile.gz + 0.5, elev: pElev, color: card.terraKind === 'erase' ? '#4dd0e1' : '#ffd54f', life: 0.9, maxLife: 0.9 });
      const msgMap = {
        grassland: `🟩 +${changed} petak diubah menjadi Tanah Rumput subur!`,
        peatland: `🪵 +${changed} petak diubah menjadi Lahan Gambut Kalimantan kaya air & karbon!`,
        desert: `🟨 +${changed} petak diubah menjadi Pasir Gurun — perhatikan adaptasi satwa di sekitarnya!`,
        hills: `⛰️ +${changed} petak diangkat menjadi Bukit Batu & mineral!`,
        water: `💧 +${changed} petak digali menjadi aliran Air jernih!`,
        erase: `🌊 ${changed} petak daerah dihapus menjadi perairan jernih — satwa setempat mengungsi ke ekosistem lain!`
      };
      logEvent(msgMap[card.terraKind] || '🌍 Peta diperbarui!');
      updateBalanceHUD();
      return true;
    } else if ((card.isProducer || card.isTree || card.isMutualFungi) && tile.type === 'water') {
      tile.type = 'grass';
      for (let r = 0; r < 4; r++) {
        if (!landTilesByRot[r].includes(tile)) landTilesByRot[r].push(tile);
      }
    }
    if (window.EcoAudio && typeof window.EcoAudio.playDrop === 'function') window.EcoAudio.playDrop();

    const pElev = getTileLift(tile);
    const emitRing = (gx, gz, elev, col) => spawnRings.push({ gx, gz, elev, color: col, life: 1.1, maxLife: 1.1 });

    if (card.isCloud || card.isSeedCloud || card.isEmotionCloud) {
      const kind = card.cloudKind || 'rain';
      spawnCloudAt(tile.gx + 0.5, tile.gz + 0.5, kind);
      const colMap = {
        rain: '#4fc3f7',
        seed_grass: '#69f0ae',
        seed_tree: '#4caf50',
        seed_nature: '#ffca28',
        emotion_anger: '#ff5252',
        emotion_harmony: '#80d8ff'
      };
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, colMap[kind] || '#4fc3f7');
      // Immediate first burst right where clicked so feedback is instant!
      if (kind === 'seed_grass') {
        tile.type = 'grass';
        tile.hasStump = false;
        tile.producerStage = 3;
        addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 16, '🌱', '#69f0ae');
        logEvent('☁️🌱 Awan Benih Rumput dilepaskan — menabur benih rumput di sekitar area!');
      } else if (kind === 'seed_tree') {
        plantSaplingOnTile(tile);
        addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 16, '🌿', '#81c784');
        logEvent('☁️🌳 Awan Benih Pohon dilepaskan — menabur tunas yang akan tumbuh dewasa!');
      } else if (kind === 'seed_nature') {
        if (!tile.hasTree) tile.propType = 'mossy_rock';
        tile.hasMycorrhiza = true;
        addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 16, '🪨', '#ffca28');
        logEvent('☁️🪨 Awan Benih Alam dilepaskan — menjatuhkan batu berlumut & mineral alami!');
      } else if (kind === 'emotion_anger') {
        addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 22, '💢⚡', '#ff5252');
        logEvent('⛈️💢 Awan Amarah dilepaskan — manusia di bawahnya akan terpicu merusak alam!');
      } else if (kind === 'emotion_harmony') {
        addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 22, '🕊️✨', '#80d8ff');
        logEvent('🌤️🕊️ Awan Damai dilepaskan — menyadarkan manusia & menenangkan ekosistem!');
      } else if (kind === 'lightning') {
        spawnLightningBolt(tile.gx + 0.5, tile.gz + 0.5);
        logEvent('⛈️⚡ Awan Petir dilepaskan — menyambarkan kilat petir di jalur badainya!');
      } else {
        if (tile.biome === 'peatland' || peatMoisture < 90) {
          peatMoisture = Math.min(100, peatMoisture + 10);
        }
        logEvent(`🌧️ Awan Hujan diletakkan di ${BIOME_PALETTES[tile.biome].shortName}!`);
      }
    } else if (card.isDirectGrass) {
      tile.type = 'grass';
      tile.hasStump = false;
      tile.producerStage = 3;
      if (!tile.microDecor && Math.random() < 0.45) tile.microDecor = 'flower_yellow';
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#66bb6a');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 14, '🌱+1', '#69f0ae');
      logEvent(`🌱 Rumpun Rumput segar ditanam di ${BIOME_PALETTES[tile.biome].shortName}!`);
    } else if (card.isSekatKanal) {
      tile.hasSekatKanal = true;
      if (!sekatKanalTiles.includes(tile)) sekatKanalTiles.push(tile);
      peatMoisture = Math.min(100, peatMoisture + 22);
      // Extinguish nearby smoldering fires & moisten soil!
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nt = grid[tile.gz + dz] && grid[tile.gz + dz][tile.gx + dx];
          if (nt) {
            if (nt.fireTimer > 0) nt.fireTimer = 0;
            if (nt.type === 'grass' && nt.producerStage < 2) nt.producerStage = 2;
          }
        }
      }
      fireTiles = fireTiles.filter((ft) => ft.fireTimer > 0);
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#4dd0e1');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 18, '🪵+💧', '#80deea');
      logEvent(`🪵 Sekat Kanal Kalimantan dipasang! Air gambut tertahan (Kelembaban ${Math.round(peatMoisture)}%), kabut asap mereda!`);
    } else if (card.isPeatFlora) {
      tile.type = 'grass';
      tile.hasStump = false;
      tile.hasMycorrhiza = true;
      tile.producerStage = 3;
      tile.microDecor = 'kelakai_fern';
      peatMoisture = Math.min(100, peatMoisture + 12);
      if (!tile.hasTree && tile.biome === 'peatland') plantSaplingOnTile(tile);
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#9ccc65');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 18, '🌿+💧', '#aed581');
      logEvent(`🌿 Paludikultur Purun & Jelutung ditanam — memulihkan ekosistem gambut Kalimantan tanpa mengeringkan air!`);
    } else if (card.isDirectTree) {
      tile.type = 'grass';
      tile.hasStump = false;
      tile.saplingStage = 0;
      tile.producerStage = 0;
      if (!tile.hasTree) {
        tile.hasTree = true;
        tile.isPine = tile.biome === 'hills' || pElev > 0;
        treeTiles.push(tile);
      }
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#43a047');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 20, '🌳+1', '#69f0ae');
      logEvent(`🌳 Pohon Alami ditanam langsung di ${BIOME_PALETTES[tile.biome].shortName}!`);
    } else if (card.isSawit) {
      plantSawitOnTile(tile);
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#ff9800');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 18, '🌴+35🪙', '#ffd54f');
      logEvent(`🌴 Pohon Sawit ditanam (${sawitTiles.length} petak)! Koin cepat bertambah, namun hati-hati ancaman BANJIR setelah beberapa tahun!`);
    } else if (card.isHuman) {
      const g = card.gender === 'female' ? 'female' : 'male';
      spawnHumanAt(tile.gx + 0.5, tile.gz + 0.5, 'steward', g);
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, g === 'female' ? '#ff80ab' : '#ffd54f');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 18, g === 'female' ? '👩+1' : '👨+1', g === 'female' ? '#f8bbd0' : '#fff59d');
      logEvent(g === 'female'
        ? `👩 +1 Perempuan Pengelola hadir di ${BIOME_PALETTES[tile.biome].shortName} — siap membangun Rumah & keluarga bersama Laki-laki!`
        : `👨 +1 Laki-laki Pengelola hadir di ${BIOME_PALETTES[tile.biome].shortName} — siap mengumpulkan kayu & membangun Rumah Desa!`);
    } else if (card.isMutualFungi) {
      tile.hasMycorrhiza = true;
      tile.hasParasiteVine = false;
      if (tile.producerStage < 3 && !tile.hasTree) tile.producerStage = 3;
      symStats.mutual++;
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#ffab40');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 16, '🍄', '#00e676');
      logEvent(`🍄 Jamur Mikoriza diletakkan di ${BIOME_PALETTES[tile.biome].shortName}!`);
    } else if (card.isParasite) {
      tile.hasParasiteVine = true;
      symStats.parasite++;
      for (const a of animals) {
        if (Math.hypot(a.gx - tile.gx, a.gz - tile.gz) < 4.5) {
          a.hasParasite = true;
          break;
        }
      }
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#e040fb');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 18, '🦠', '#e040fb');
      logEvent(`🦠 Parasit/Benalu diletakkan di (${tile.gx}, ${tile.gz})!`);
    } else {
      spawnAnimalAt(card.id, tile.gx + 0.5, tile.gz + 0.5);
      const spawned = animals[animals.length - 1];
      if (spawned && spawned.isFly) spawned.flyElev = 14;
      emitRing(tile.gx + 0.5, tile.gz + 0.5, pElev, '#ffd54f');
      addParticle(tile.gx + 0.5, tile.gz + 0.5, pElev + 18, `+1 ${card.name}`, '#fff59d');
      logEvent(`🐾 +1 ${card.name} diletakkan di ${BIOME_PALETTES[tile.biome].shortName} (${tile.gx}, ${tile.gz})!`);
    }
    if (guidedCardIds.includes(card.id)) {
      guidedCardIds = [];
      guidedHintText = '';
      renderDock();
      if (activeRecoveryKey) {
        const rk = activeRecoveryKey;
        activeRecoveryKey = null;
        showReflectionModal(rk);
      }
    }
    tutPlacements++;
    fpsAccum = ISO_FRAME_STEP;
    updateBalanceHUD();
    return true;
  }

  function triggerDisaster(kind, skipConseq = false) {
    if (window.EcoAudio && typeof window.EcoAudio.playError === 'function') window.EcoAudio.playError();
    cam.trauma = 0.75;

    if (kind === 'natural_flood') {
      let focusT = null;
      let count = 0;
      const land = landTilesByRot[0] || [];
      for (let i = 0; i < land.length; i++) {
        const t = land[i];
        if (getTileLift(t) === 0 && riverDistance(t.gx + 0.5, t.gz + 0.5) < 4.5 && hash2(t.gx, t.gz + worldYear) > 0.3) {
          t.floodTimer = 14;
          if (!floodTiles.includes(t)) floodTiles.push(t);
          if (!focusT) focusT = t;
          count++;
        }
      }
      const fc = focusT || { gx: MAP_SIZE * 0.5, gz: MAP_SIZE * 0.5 };
      showEventAlertPopup({
        type: 'custom',
        icon: '🌊',
        alertText: 'Air sungai sedang meluap membanjiri kampung & tepian! Ayo lihat!',
        focusOpts: {
          kind: 'flood',
          gx: fc.gx + 0.5,
          gz: fc.gz + 0.5,
          title: '🌊 SUNGAI MELUAP (BANJIR)',
          desc: `Air bah merendam ${count} lahan tepian sungai`,
          color: '#29b6f6',
          fill: 'rgba(41, 182, 246, 0.24)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('natural_flood');
      logEvent(`🌊 Sungai meluap! ${count} petak dataran rendah terendam banjir!`);
    } else if (kind === 'wildfire') {
      let focusT = null;
      let burned = 0;
      const candidates = treeTiles.length > 0 ? treeTiles.slice() : (landTilesByRot[0] || []);
      const start = candidates[Math.floor(Math.random() * candidates.length)];
      if (start) {
        focusT = start;
        for (let dz = -3; dz <= 3; dz++) {
          for (let dx = -3; dx <= 3; dx++) {
            const nt = grid[start.gz + dz] && grid[start.gz + dz][start.gx + dx];
            if (!nt || nt.isOceanMargin || nt.type === 'water') continue;
            if (Math.hypot(dx, dz) <= 3.2 && Math.random() < 0.65) {
              if (nt.hasTree) {
                nt.hasTree = false;
                nt.hasStump = true;
                const ti = treeTiles.indexOf(nt);
                if (ti >= 0) treeTiles.splice(ti, 1);
              }
              nt.producerStage = 0;
              nt.fireTimer = 12 + Math.random() * 4;
              if (!fireTiles.includes(nt)) fireTiles.push(nt);
              burned++;
            }
          }
        }
      }
      const fc = focusT || { gx: MAP_SIZE * 0.5, gz: MAP_SIZE * 0.5 };
      showEventAlertPopup({
        type: 'custom',
        icon: '🔥',
        alertText: 'Hutan & kebun sedang terbakar hebat! Ayo lihat!',
        focusOpts: {
          kind: 'wildfire',
          gx: fc.gx + 0.5,
          gz: fc.gz + 0.5,
          title: '🔥 HUTAN & LAHAN TERBAKAR',
          desc: `Api membakar ${burned} petak pohon & rumput kering`,
          color: '#ff7043',
          fill: 'rgba(255, 112, 67, 0.24)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('wildfire');
      logEvent(`🔥 Kebakaran melanda ${burned} petak lahan! Tunggu 3 detik atau siram dengan Awan Hujan!`);
    } else if (kind === 'earthquake') {
      cam.trauma = 0.95;
      let rocksAdded = 0;
      let focusT = null;
      const land = landTilesByRot[0] || [];
      for (let i = 0; i < land.length; i++) {
        const t = land[i];
        if (t.biome === 'hills' && !t.hasTree && Math.random() < 0.2) {
          t.propType = 'mossy_rock';
          if (!focusT) focusT = t;
          rocksAdded++;
        }
      }
      if (buildingTiles.length > 0 && Math.random() < 0.6) {
        const b = buildingTiles.pop();
        b.building = null;
      }
      const fc = focusT || { gx: HILL_PEAK.x, gz: HILL_PEAK.z };
      showEventAlertPopup({
        type: 'custom',
        icon: '🌋',
        alertText: 'Tanah berguncang & bukit batu longsor! Ayo lihat!',
        focusOpts: {
          kind: 'earthquake',
          gx: fc.gx + 0.5,
          gz: fc.gz + 0.5,
          title: '🌋 GEMPA & BUKIT LONGSOR',
          desc: `Guncangan menjatuhkan ${rocksAdded} batu besar dari bukit`,
          color: '#ffa726',
          fill: 'rgba(255, 167, 38, 0.24)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('earthquake');
      logEvent(`🌋 Gempa mengguncang pulau & meruntuhkan ${rocksAdded} bongkahan batu dari lereng bukit!`);
    } else if (kind === 'thunderstorm') {
      const targetTree = treeTiles.length > 0 ? treeTiles[Math.floor(Math.random() * treeTiles.length)] : null;
      const cx = targetTree ? targetTree.gx + 0.5 : MAP_SIZE * 0.48;
      const cz = targetTree ? targetTree.gz + 0.5 : MAP_SIZE * 0.45;
      spawnCloudAt(cx - 2, cz, 'lightning');
      spawnCloudAt(cx + 2, cz + 1.5, 'rain');
      spawnLightningBolt(cx, cz);
      lightningQueue.push(
        { delay: 0.55, gx: cx + (Math.random() - 0.5) * 6, gz: cz + (Math.random() - 0.5) * 6 },
        { delay: 1.25, gx: cx + (Math.random() - 0.5) * 8, gz: cz + (Math.random() - 0.5) * 8 },
        { delay: 2.05, gx: cx + (Math.random() - 0.5) * 7, gz: cz + (Math.random() - 0.5) * 7 }
      );
      showEventAlertPopup({
        type: 'custom',
        icon: '⛈️',
        alertText: 'Sedang terjadi Hujan Badai & Sambaran Petir! Ayo lihat!',
        focusOpts: {
          kind: 'thunderstorm',
          gx: cx,
          gz: cz,
          title: '⛈️ HUJAN BADAI & SAMBARAN PETIR',
          desc: 'Kilat petir menyambar pohon tinggi disertai hujan deras',
          color: '#4fc3f7',
          fill: 'rgba(79, 195, 247, 0.22)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('thunderstorm');
      logEvent('⛈️⚡ Hujan badai datang! Perhatikan kilatan petir yang menyambar ke pulau!');
    } else if (kind === 'illegal_logging') {
      let cut = 0;
      let focusT = treeTiles[0] || { gx: MAP_SIZE * 0.45, gz: MAP_SIZE * 0.35 };
      while (treeTiles.length > 8 && cut < 38) {
        const idx = Math.floor(Math.random() * treeTiles.length);
        const tt = treeTiles[idx];
        tt.hasTree = false;
        tt.hasStump = true;
        treeTiles.splice(idx, 1);
        cut++;
      }
      showEventAlertPopup({
        type: 'custom',
        icon: '🪓',
        alertText: 'Pohon-pohon hutan ditebang habis jadi gundul! Ayo lihat!',
        focusOpts: {
          kind: 'illegal_logging',
          gx: focusT.gx + 0.5,
          gz: focusT.gz + 0.5,
          title: '🪓 HUTAN DITEBANG GUNDUL',
          desc: `${cut} pohon ditebang habis menyisakan tunggul kayu`,
          color: '#ffb74d',
          fill: 'rgba(255, 183, 77, 0.24)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('illegal_logging');
      logEvent(`🪓 ${cut} pohon ditebang habis hingga hutan gundul! Tunggu 3 detik untuk melihat akibatnya...`);
    } else if (kind === 'river_waste') {
      const wTiles = waterTilesByRot[0] || [];
      let focusT = null;
      for (let i = 0; i < wTiles.length; i++) {
        const wt = wTiles[i];
        if (riverDistance(wt.gx + 0.5, wt.gz + 0.5) <= 0.2) {
          wt.pollutedTimer = 18;
          if (!pollutedTiles.includes(wt)) pollutedTiles.push(wt);
          if (!focusT) focusT = wt;
        }
      }
      animals = animals.filter((a) => a.type !== 'water_bug');
      const fc = focusT || { gx: MAP_SIZE * 0.5, gz: riverCenterZ(MAP_SIZE * 0.5) };
      showEventAlertPopup({
        type: 'custom',
        icon: '🛢️',
        alertText: 'Sungai sedang tercemar limbah kotor! Ayo lihat!',
        focusOpts: {
          kind: 'river_waste',
          gx: fc.gx + 0.5,
          gz: fc.gz + 0.5,
          title: '🛢️ LIMBAH KOTOR DI SUNGAI',
          desc: 'Air sungai berubah keruh & mematikan serangga air',
          color: '#9ccc65',
          fill: 'rgba(156, 204, 101, 0.25)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('river_waste');
      logEvent('🛢️ Limbah kotor mencemari aliran sungai! Serangga air mati & air menjadi keruh!');
    } else if (kind === 'drought_heat' || kind === 'wipe_producers') {
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].producerStage > 0) tiles[i].producerStage = 0;
      }
      showEventAlertPopup({
        type: 'custom',
        icon: '☀️',
        alertText: 'Kemarau panjang membuat rumput kering & habis! Ayo lihat!',
        focusOpts: {
          kind: 'drought_heat',
          gx: MAP_SIZE * 0.36,
          gz: MAP_SIZE * 0.36,
          title: '☀️ KEMARAU PANJANG (KEKERINGAN)',
          desc: 'Rumput mengering sehingga hewan pemakan tumbuhan kelaparan',
          color: '#ffca28',
          fill: 'rgba(255, 202, 40, 0.24)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('drought_heat');
      logEvent('☀️ Kemarau panjang melanda! Seluruh rumput mengering — tunggu 3 detik melihat dampaknya!');
    } else if (kind === 'bloom_mutualism') {
      if (window.EcoAudio && typeof window.EcoAudio.playUnlock === 'function') window.EcoAudio.playUnlock();
      cam.trauma = 0;
      const tiles = sortedTilesByRot[0];
      for (let i = 0; i < tiles.length; i += 2) {
        const t = tiles[i];
        if (t.type === 'grass') {
          t.hasMycorrhiza = true;
          if (!t.hasTree && t.producerStage < 3) t.producerStage = 3;
        }
      }
      animals.forEach((a) => {
        a.hasParasite = false;
        a.hp = a.maxHp;
      });
      showEventAlertPopup({
        type: 'symbiosis',
        symKind: 'mutual',
        icon: '🤝',
        alertText: 'Sedang terjadi Simbiosis Mutualisme massal! Ayo lihat!'
      });
      logEvent('🤝🌱 Tanah menjadi subur! Jamur akar baik menyuburkan rumput & menyembuhkan satwa!');
    } else if (kind === 'outbreak_parasite') {
      animals.forEach((a, idx) => {
        if (idx % 2 === 0) a.hasParasite = true;
      });
      showEventAlertPopup({
        type: 'symbiosis',
        symKind: 'parasite',
        icon: '🦠',
        alertText: 'Sedang terjadi Wabah Hama & Benalu pada satwa! Ayo lihat!'
      });
      if (!skipConseq) scheduleConsequenceChoice('outbreak_parasite');
      logEvent('🦠 Wabah Hama & Benalu menyerang separuh satwa di pulau!');
    } else if (kind === 'pesticide') {
      animals = animals.filter((a) => !HERBIVORES.includes(a.type));
      const tiles = landTilesByRot[0] || [];
      for (let i = 0; i < tiles.length; i += 3) {
        if (tiles[i].producerStage > 1) tiles[i].producerStage = 1;
      }
      showEventAlertPopup({
        type: 'custom',
        icon: '🧪',
        alertText: 'Racun hama disemprotkan! Serangga & kelinci mati — Ayo lihat!',
        focusOpts: {
          kind: 'pesticide',
          gx: MAP_SIZE * 0.42,
          gz: MAP_SIZE * 0.35,
          title: '🧪 SEMPROT RACUN HAMA (PESTISIDA)',
          desc: 'Pemakan rumput mati keracunan — pemangsa terancam kelaparan',
          color: '#ab47bc',
          fill: 'rgba(171, 71, 188, 0.24)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('pesticide');
      logEvent('🧪 Racun hama disemprotkan! Belalang & Kelinci mati — perhatikan akibatnya dalam 3 detik!');
    } else if (kind === 'peat_fire') {
      peatMoisture = Math.max(14, Math.min(peatMoisture, 28));
      peatSmogAlpha = 0.36;
      const land = landTilesByRot[0] || [];
      let focusT = null;
      let lit = 0;
      for (let i = 0; i < land.length; i++) {
        const t = land[i];
        if ((t.biome === 'peatland' || t.gx < MAP_SIZE * 0.44) && !t.hasSekatKanal && lit < 14 && hash2(t.gx + 2, t.gz + worldYear) > 0.45) {
          t.fireTimer = 14;
          if (!fireTiles.includes(t)) fireTiles.push(t);
          if (!focusT) focusT = t;
          lit++;
        }
      }
      showEventAlertPopup({
        type: 'custom',
        icon: '🌫️',
        alertText: 'Gambut Kalimantan mengering & muncul Kabut Asap! Ayo lihat!',
        focusOpts: {
          kind: 'peat_fire',
          gx: focusT ? focusT.gx + 0.5 : MAP_SIZE * 0.25,
          gz: focusT ? focusT.gz + 0.5 : MAP_SIZE * 0.56,
          title: '🌫️ GAMBUT KERING & KABUT ASAP KALIMANTAN',
          desc: 'Gambut kering melepaskan karbon & api bawah tanah — butuh Sekat Kanal!',
          color: '#ff8a65',
          fill: 'rgba(255, 138, 101, 0.28)'
        }
      });
      if (!skipConseq) scheduleConsequenceChoice('peat_fire');
      logEvent('🌫️🔥 Lahan Gambut Kalimantan mengering! Api bawah tanah & kabut asap mulai menyebar!');
    } else if (kind === 'peat_rewet') {
      if (window.EcoAudio && typeof window.EcoAudio.playUnlock === 'function') window.EcoAudio.playUnlock();
      cam.trauma = 0;
      peatMoisture = 92;
      peatSmogAlpha = 0;
      fireTiles.forEach((ft) => { ft.fireTimer = 0; });
      fireTiles = [];
      const spot = findLandSpotInBiome('peatland');
      const ix = Math.min(MAP_SIZE - 2, Math.max(1, Math.floor(spot.gx)));
      const iz = Math.min(MAP_SIZE - 2, Math.max(1, Math.floor(spot.gz)));
      const centerT = grid[iz] && grid[iz][ix];
      if (centerT && !centerT.isOceanMargin && centerT.type !== 'water') {
        centerT.hasSekatKanal = true;
        if (!sekatKanalTiles.includes(centerT)) sekatKanalTiles.push(centerT);
      }
      showEventAlertPopup({
        type: 'custom',
        icon: '🪵',
        alertText: 'Sekat Kanal Kalimantan berhasil membasahi Gambut! Ayo lihat!',
        focusOpts: {
          kind: 'peatland_care',
          gx: ix + 0.5,
          gz: iz + 0.5,
          title: '🪵 KONSERVASI GAMBUT KALIMANTAN (SEKAT KANAL)',
          desc: 'Sekat Kanal menahan air gambut tetap basah, bebas asap & menjaga habitat Orangutan!',
          color: '#4dd0e1',
          fill: 'rgba(77, 208, 225, 0.24)'
        }
      });
      logEvent('🪵💧 Sekat Kanal & Pembasahan Gambut berhasil! Kelembaban pulih (92%) & asap menghilang!');
    } else if (kind === 'restore_all') {
      if (window.EcoAudio && typeof window.EcoAudio.playUnlock === 'function') window.EcoAudio.playUnlock();
      cam.trauma = 0;
      generateMap();
      logEvent('🌿 Seluruh pulau & 6 bioma berhasil dipulihkan kembali seperti semula!');
    }
    updateBalanceHUD();
  }

    function focusBiomeZone(zoneId) {
    clearEventFocus(false);
    const S = MAP_SIZE / 30;
    const centers = {
      all: { gx: MAP_SIZE / 2, gz: MAP_SIZE / 2, zoom: 0.56, label: '🗺️ Menampilkan seluruh Benua 6 Bioma' },
      grassland: { gx: 7.5 * S, gz: 8.5 * S, zoom: 0.98, label: '🌾 Fokus ke Zona Sawah & Negeri Padang Rumput' },
      hills: { gx: 15.0 * S, gz: 6.5 * S, zoom: 0.98, label: '⛰️ Fokus ke Zona Perbukitan Batu Tinggi' },
      tropical: { gx: 22.5 * S, gz: 8.5 * S, zoom: 0.98, label: '🌴 Fokus ke Zona Hutan Hujan Tropis' },
      swamp: { gx: 7.5 * S, gz: 22.5 * S, zoom: 0.98, label: '🌿 Fokus ke Zona Rawa Bakau' },
      desert: { gx: 22.5 * S, gz: 22.5 * S, zoom: 0.98, label: '🏜️ Fokus ke Zona Gurun Oasis' },
      peatland: { gx: 7.2 * S, gz: 16.8 * S, zoom: 1.08, label: '🪵 Fokus ke Lahan Gambut Kalimantan (Habitat Orangutan & Enggang)' }
    };
    const cfg = centers[zoneId] || centers.all;
    const { rx, rz } = rotateCoords(cfg.gx, cfg.gz);
    const sx = (rx - rz) * (BASE_TW / 2);
    const sy = (rx + rz) * (BASE_TH / 2) - 12;

    cam.targetZoom = cfg.zoom;
    if (canvas) {
      cam.targetX = -sx * cfg.zoom;
      cam.targetY = canvas.clientHeight * 0.36 - sy * cfg.zoom;
    }
    logEvent(cfg.label);
  }

  const EVENT_ENCYCLOPEDIA = {
    mutual: {
      badge: 'SIMBIOSIS ALAM (+/+)',
      title: '🤝 Simbiosis Mutualisme',
      spriteKey: 'mushroom',
      fallbackIcon: '🍄',
      speciesName: 'MIKORIZA & SATWA',
      statusText: '✨ Saling Menguntungkan',
      statusLevel: 'good',
      science: 'Dua makhluk hidup berbeda spesies saling memberi manfaat hingga keduanya makin kuat. Jamur Mikoriza menyuplai mineral akar sambil mendapat karbohidrat dari tumbuhan.',
      steps: [
        { icon: '🍄', label: 'Mikoriza Akar' },
        { icon: '🤝', label: 'Tukar Nutrisi' },
        { icon: '🌿', label: 'Tumbuh & Kebal' }
      ],
      survivalPct: 88,
      survivalLeft: '🌿 Kelestarian 88%',
      survivalRight: '⚠️ Risiko 12%',
      restoreCardId: 'mushroom',
      tip: '💡 Solusi Cepat: Tanam Jamur Mikoriza agar rumput lebih cepat tumbuh dan menyembuhkan parasit.'
    },
    commensal: {
      badge: 'SIMBIOSIS ALAM (+/0)',
      title: '🛡️ Simbiosis Komensalisme',
      spriteKey: 'rabbit',
      fallbackIcon: '🐇',
      speciesName: 'SATWA & POHON',
      statusText: '🛡️ Berlindung Aman',
      statusLevel: 'good',
      science: 'Satu pihak mendapat perlindungan sementara pohon inang tidak dirugikan. Herbivora berteduh di bawah kanopi rimbun agar hemat air dan lebih sulit diburu.',
      steps: [
        { icon: '🌳', label: 'Kanopi Rimbun' },
        { icon: '🐇', label: 'Satwa Berteduh' },
        { icon: '🛡️', label: '+25% Lolos Buru' }
      ],
      survivalPct: 82,
      survivalLeft: '🛡️ Selamat 82%',
      survivalRight: '🦅 Terburu 18%',
      restoreCardId: 'plant_tree',
      tip: '💡 Solusi Cepat: Perbanyak Pohon Alami untuk menjaga tempat berteduh satwa kecil.'
    },
    parasite: {
      badge: 'SIMBIOSIS ALAM (+/-)',
      title: '🦠 Simbiosis Parasitisme',
      spriteKey: 'frog',
      fallbackIcon: '🦠',
      speciesName: 'INANG TERINFEKSI',
      statusText: '⚠️ Terkena Parasit',
      statusLevel: 'warn',
      science: 'Parasit menyerap sari makanan inang sehingga tubuh inang melemah dan mudah lapar. Benalu dan kutu menekan populasi satwa bila predator pembersih kurang.',
      steps: [
        { icon: '🦠', label: 'Benalu Menempel' },
        { icon: '📉', label: 'HP Inang Turun' },
        { icon: '🐦', label: 'Butuh Pembersih' }
      ],
      survivalPct: 48,
      survivalLeft: '💚 Pulih 48%',
      survivalRight: '🦠 Melemah 52%',
      restoreCardId: 'mushroom',
      tip: '💡 Solusi Cepat: Tanam Jamur Mikoriza atau hadirkan Bangau & Awan Damai untuk membersihkan wabah.'
    },
    amensal: {
      badge: 'SIMBIOSIS ALAM (-/0)',
      title: '🌑 Simbiosis Amensalisme',
      spriteKey: 'grass',
      fallbackIcon: '🌑',
      speciesName: 'TUNAS DI BAWAH TAJUK',
      statusText: '🌒 Kurang Cahaya',
      statusLevel: 'warn',
      science: 'Pohon besar meneduhi lantai hutan sehingga tunas rumput di bawahnya terhambat tumbuh. Pohon utama tidak terdampak, tetapi keragaman rumput bergeser ke tepi.',
      steps: [
        { icon: '🌲', label: 'Tajuk Rapat' },
        { icon: '🌑', label: 'Sinar Terhalang' },
        { icon: '🌱', label: 'Tunas Tertekan' }
      ],
      survivalPct: 60,
      survivalLeft: '🌱 Tahan 60%',
      survivalRight: '🌑 Tertekan 40%',
      restoreCardId: 'plant_grass',
      tip: '💡 Solusi Cepat: Sisakan padang terbuka dan tanam Rumpun Rumput di tepi hutan.'
    },
    flood: {
      badge: 'BENCANA ALAM & EKOLOGI',
      title: '🌊 Banjir Bandang & Luapan Sungai',
      spriteKey: 'water_bug',
      fallbackIcon: '🌊',
      speciesName: 'SUNGAI & KAMPUNG',
      statusText: '🚨 Air Meluap Kritis',
      statusLevel: 'critical',
      science: 'Curah hujan tinggi melimpas ke dataran rendah karena akar penahan air berkurang. Pergantian hutan menjadi kebun sawit atau lahan gundul memperparah luapan.',
      steps: [
        { icon: '🌴', label: 'Akar Kurang Serap' },
        { icon: '🌧️', label: 'Hujan Lebat' },
        { icon: '🌊', label: 'Kampung Terendam' }
      ],
      survivalPct: 42,
      survivalLeft: '🏡 Aman 42%',
      survivalRight: '🌊 Terendam 58%',
      restoreCardId: 'plant_tree',
      tip: '💡 Solusi Cepat: Tanam kembali Pohon Alami di tepian sungai dan batasi kebun Sawit.'
    },
    wildfire: {
      badge: 'BENCANA ALAM & IKLIM',
      title: '🔥 Kebakaran Hutan & Lahan',
      spriteKey: 'storm',
      fallbackIcon: '🔥',
      speciesName: 'TEGAKAN HUTAN',
      statusText: '🔥 Kebakaran Aktif',
      statusLevel: 'critical',
      science: 'Api menyambar cepat saat lahan kering atau tersambar petir tanpa curah hujan. Pohon dan rumput berubah menjadi tunggul arang hingga satwa kehilangan pakan.',
      steps: [
        { icon: '☀️', label: 'Lahan Kering' },
        { icon: '🔥', label: 'Api Menyebar' },
        { icon: '🪵', label: 'Tersisa Arang' }
      ],
      survivalPct: 35,
      survivalLeft: '🌱 Selamat 35%',
      survivalRight: '🔥 Hangus 65%',
      restoreCardId: 'cloud',
      tip: '💡 Solusi Cepat: Lepaskan Awan Hujan di atas titik api lalu tanam tunas pohon baru.'
    },
    earthquake: {
      badge: 'BENCANA GEOLOGI',
      title: '🌋 Gempa Bumi & Longsor Bukit',
      spriteKey: 'eagle',
      fallbackIcon: '🌋',
      speciesName: 'LERENG PERBUKITAN',
      statusText: '⚠️ Lereng Runtuh',
      statusLevel: 'critical',
      science: 'Guncangan tektonik meruntuhkan batuan bukit dan merusak bangunan di kaki lereng. Warga dapat menambang batu longsoran tersebut untuk membangun ulang desa.',
      steps: [
        { icon: '🌋', label: 'Guncangan Gempa' },
        { icon: '🪨', label: 'Batu Longsor' },
        { icon: '🏡', label: 'Bangun Ulang' }
      ],
      survivalPct: 58,
      survivalLeft: '🏡 Bertahan 58%',
      survivalRight: '🪨 Rusak 42%',
      restoreCardId: 'human',
      tip: '💡 Solusi Cepat: Kirim Manusia Pengelola agar memulihkan rumah dari batu longsoran.'
    },
    thunderstorm: {
      badge: 'FENOMENA CUACA EKSTREM',
      title: '⛈️ Badai Petir Tropis',
      spriteKey: 'storm',
      fallbackIcon: '⛈️',
      speciesName: 'PUNCAK KANOPi',
      statusText: '⚡ Sambaran Aktif',
      statusLevel: 'warn',
      science: 'Awan badai melepaskan petir ke pohon tinggi sekaligus menurunkan hujan lebat. Meski berisiko membakar tajuk, air hujannya menyuburkan tanah.',
      steps: [
        { icon: '⛈️', label: 'Awan Badai' },
        { icon: '⚡', label: 'Petir Menyambar' },
        { icon: '🌱', label: 'Tanah Subur' }
      ],
      survivalPct: 68,
      survivalLeft: '🌿 Pulih 68%',
      survivalRight: '⚡ Terbakar 32%',
      restoreCardId: 'plant_tree',
      tip: '💡 Solusi Cepat: Tanam Pohon Alami pengganti pada bekas tunggul yang tersambar petir.'
    },
    pesticide: {
      badge: 'MASALAH LINGKUNGAN',
      title: '🧪 Semprot Racun Hama Berlebihan',
      spriteKey: 'hopper',
      fallbackIcon: '🧪',
      speciesName: 'HERBIVORA',
      statusText: '☠️ Keracunan Pakan',
      statusLevel: 'critical',
      science: 'Racun hama mencemari rumput sehingga belalang dan kelinci mati keracunan. Hilangnya mangsa membuat katak, ular, dan elang ikut kelaparan.',
      steps: [
        { icon: '🧪', label: 'Rumput Beracun' },
        { icon: '🦗', label: 'Mangsa Mati' },
        { icon: '🦅', label: 'Predator Lapar' }
      ],
      survivalPct: 32,
      survivalLeft: '🐾 Bertahan 32%',
      survivalRight: '☠️ Terdampak 68%',
      restoreCardId: 'cloud',
      tip: '💡 Solusi Cepat: Turunkan Awan Hujan untuk mencuci racun lalu tambahkan Rumpun Rumput.'
    },
    illegal_logging: {
      badge: 'KERUSAKAN HUTAN',
      title: '🪓 Penebangan Hutan Sampai Gundul',
      spriteKey: 'rabbit',
      fallbackIcon: '🪓',
      speciesName: 'TUTUPAN HUTAN',
      statusText: '⚠️ Hutan Gundul',
      statusLevel: 'critical',
      science: 'Penebangan habis menghilangkan tempat berlindung satwa dan akar penahan air. Tanah terbuka cepat mengering dan rentan longsor saat hujan.',
      steps: [
        { icon: '🪓', label: 'Pohon Ditebang' },
        { icon: '🏜️', label: 'Lahan Terbuka' },
        { icon: '🏃', label: 'Satwa Terancam' }
      ],
      survivalPct: 38,
      survivalLeft: '🌳 Tersisa 38%',
      survivalRight: '🪓 Gundul 62%',
      restoreCardId: 'plant_tree',
      tip: '💡 Solusi Cepat: Tanam kembali Pohon Alami atau lepaskan Awan Pohon di area gundul.'
    },
    river_waste: {
      badge: 'PENCEMARAN AIR',
      title: '🛢️ Limbah Kotor di Aliran Sungai',
      spriteKey: 'water_bug',
      fallbackIcon: '🛢️',
      speciesName: 'BIOTA SUNGAI',
      statusText: '☣️ Air Tercemar',
      statusLevel: 'critical',
      science: 'Limbah kotor menurunkan oksigen air sehingga serangga air dan ikan mati. Satwa darat yang minum di tepian sungai ikut terdampak racun.',
      steps: [
        { icon: '🛢️', label: 'Limbah Masuk' },
        { icon: '💧', label: 'Air Keruh' },
        { icon: '🦟', label: 'Biota Mati' }
      ],
      survivalPct: 36,
      survivalLeft: '💧 Aman 36%',
      survivalRight: '☣️ Tercemar 64%',
      restoreCardId: 'cloud',
      tip: '💡 Solusi Cepat: Turunkan Awan Hujan di atas sungai dan tanam Jamur Mikoriza di tepian.'
    },
    drought_heat: {
      badge: 'CUACA EKSTREM',
      title: '☀️ Kemarau Panjang & Kekeringan',
      spriteKey: 'sand_mouse',
      fallbackIcon: '☀️',
      speciesName: 'PADANG RUMPUT',
      statusText: '🔥 Kekeringan Parah',
      statusLevel: 'warn',
      science: 'Panas terik berkepanjangan mengeringkan rumput sehingga produsen habis. Herbivora harus berebut sisa tanaman hijau untuk bertahan hidup.',
      steps: [
        { icon: '☀️', label: 'Panas Terik' },
        { icon: '🌾', label: 'Rumput Layu' },
        { icon: '🐇', label: 'Pakan Langka' }
      ],
      survivalPct: 45,
      survivalLeft: '🌱 Tahan 45%',
      survivalRight: '☀️ Kering 55%',
      restoreCardId: 'cloud',
      tip: '💡 Solusi Cepat: Lepaskan Awan Hujan dan Awan Rumput agar padang kembali hijau.'
    },
    peat_fire: {
      badge: 'EKOLOGI KALIMANTAN • DAMPAK GAMBUT',
      title: '🌫️ Gambut Kering & Kabut Asap',
      spriteKey: 'orangutan',
      fallbackIcon: '🌫️',
      speciesName: 'ORANGUTAN & GAMBUT',
      statusText: '🔥 Kabut Asap Kritis',
      statusLevel: 'critical',
      science: 'Pengeringan kanal membuat gambut Kalimantan mudah terbakar di bawah tanah dan melepas emisi karbon. Kabut asapnya mengancam hutan Jelutung serta habitat Orangutan dan Enggang.',
      steps: [
        { icon: '🌴', label: 'Gambut Kering' },
        { icon: '🔥', label: 'Api Bawah Tanah' },
        { icon: '🌫️', label: 'Kabut Asap' }
      ],
      survivalPct: 34,
      survivalLeft: '🦧 Selamat 34%',
      survivalRight: '🌫️ Terancam 66%',
      restoreCardId: 'sekat_kanal',
      tip: '💡 Solusi Kalimantan: Pasang Sekat Kanal, turunkan Awan Hujan, lalu tanam Purun & Jelutung!'
    },
    peatland_care: {
      badge: 'KONSERVASI KALIMANTAN • 3R GAMBUT',
      title: '🪵 Sekat Kanal & Paludikultur Gambut',
      spriteKey: 'orangutan',
      fallbackIcon: '🪵',
      speciesName: 'GAMBUT KALIMANTAN',
      statusText: '💧 Gambut Terjaga',
      statusLevel: 'good',
      science: 'Sekat Kanal menahan air tanah gambut Kalimantan agar tetap lembab di musim kemarau. Bersama tanaman asli Purun dan Jelutung, ekosistem aman dari kabut asap.',
      steps: [
        { icon: '🪵', label: 'Sekat Kanal' },
        { icon: '💧', label: 'Air Tertahan' },
        { icon: '🦧', label: 'Habitat Lestari' }
      ],
      survivalPct: 92,
      survivalLeft: '💧 Lembab 92%',
      survivalRight: '🔥 Risiko 8%',
      restoreCardId: 'bibit_gambut',
      tip: '💡 Solusi Kalimantan: Lanjutkan menanam Purun & Jelutung untuk memperkuat cadangan karbon.'
    },
    biome_displaced: {
      badge: 'PERUBAHAN HABITAT & SELEKSI ALAM',
      title: '🏃 Hewan Mengungsi ke Ekosistem Lain',
      spriteKey: 'eagle',
      fallbackIcon: '🦅',
      speciesName: 'SATWA PENGUNGSI',
      statusText: '⚠️ Habitat Tidak Cocok',
      statusLevel: 'critical',
      science: 'Hilangnya habitat memaksa satwa pindah ke bioma asing dengan suhu dan pakan berbeda. Sebagian mampu beradaptasi, tetapi yang lemah akan mati kalah bersaing.',
      steps: [
        { icon: '🏜️', label: 'Habitat Rusak' },
        { icon: '🏃', label: 'Migrasi Paksa' },
        { icon: '🧬', label: 'Adaptasi vs 💀' }
      ],
      survivalPct: 55,
      survivalLeft: '🧬 Adaptasi 55%',
      survivalRight: '💀 Kalah Saing 45%',
      restoreCardId: 'terra_grass',
      tip: '💡 Solusi Cepat: Perluas kembali tanah bioma asli (Pasir Gurun / Tanah Rumput) agar mereka pulang.'
    }
  };

  function syncDebtBadge() {
    if (coinValEl) coinValEl.textContent = String(isoCoins);
    if (debtBadgeEl) {
      if (isoCoinDebt > 0) {
        debtBadgeEl.textContent = `Cicilan -${isoCoinDebt}`;
        debtBadgeEl.classList.remove('hidden');
      } else {
        debtBadgeEl.classList.add('hidden');
      }
    }
  }

  function addIsoCoins(amount) {
    if (!amount || amount <= 0) return;
    let net = amount;
    if (isoCoinDebt > 0) {
      const installment = Math.min(isoCoinDebt, Math.max(1, Math.ceil(amount * 0.4)));
      isoCoinDebt -= installment;
      net -= installment;
      if (isoCoinDebt === 0) {
        logEvent('✅ Pinjaman koin darurat sudah lunas terbayar dari hasil ekosistem!');
      }
    }
    isoCoins += Math.max(0, net);
    syncDebtBadge();
  }

  function requestEmergencyCoinLoan() {
    if (isoCoinDebt >= 160) {
      logEvent('⚠️ Batas pinjaman darurat tercapai (maks 160 koin). Rawat produsen agar cicilan cepat lunas!');
      return;
    }
    isoCoins += 80;
    isoCoinDebt += 80;
    syncDebtBadge();
    renderDock();
    logEvent('🆘 Pinjaman +80 🪙 diterima! Akan otomatis terpotong 40% saat kamu mendapat koin baru.');
  }

  const CONSEQUENCE_REFLECTIONS = {
    pesticide: {
      body: 'Dengan membasuh racun memakai Awan Hujan lalu menanam kembali Rumput, produsen kembali menyediakan energi untuk Herbivora (Belalang & Kelinci) sehingga rantai makanan tersambung lagi!',
      tip: '💡 Konsep IPA: Pestisida membunuh organisme nontarget dan memutus aliran energi dari tingkat trofik I (Produsen).'
    },
    water_pollution: {
      body: 'Air sungai yang kembali jernih menghentikan keracunan pada ikan, katak, dan bangau yang minum di tepian sungai.',
      tip: '💡 Konsep IPA: Pencemaran air terakumulasi dalam tubuh makhluk hidup di ekosistem perairan (biomagnifikasi).'
    },
    drought_heat: {
      body: 'Hujan membasahi tanah gersang sehingga produsen (rumput & pohon) tumbuh lagi dan menyelamatkan herbivora dari kelaparan.',
      tip: '💡 Konsep IPA: Komponen abiotik (air & kelembaban) sangat menentukan kelangsungan komponen biotik.'
    },
    wildfire: {
      body: 'Memadamkan titik api menghentikan kerusakan habitat dan memberi kesempatan tunas baru tumbuh sebagai sumber makanan satwa.',
      tip: '💡 Konsep IPA: Suksesi sekunder dimulai ketika lahan terbakar kembali memiliki air dan tumbuhan perintis.'
    },
    natural_flood: {
      body: 'Akar pohon alami menyerap kelebihan air sungai (infiltrasi) sehingga banjir mereda dan ladang serta satwa tepi sungai kembali aman.',
      tip: '💡 Konsep IPA: Vegetasi berfungsi sebagai daerah resapan air alami yang menjaga kestabilan ekosistem.'
    }
  };

  function showReflectionModal(key) {
    if (!reflectModalEl || !reflectBodyEl || !reflectTipEl) return;
    const info = CONSEQUENCE_REFLECTIONS[key] || {
      body: 'Langkah pemulihanmu mengembalikan komponen kunci ekosistem sehingga aliran energi antar tingkat trofik dapat berjalan seimbang lagi!',
      tip: '💡 Konsep IPA: Setiap komponen biotik dan abiotik saling bergantung menjaga keseimbangan ekosistem.'
    };
    reflectBodyEl.textContent = info.body;
    reflectTipEl.textContent = info.tip;
    reflectModalEl.classList.remove('hidden');
  }

  // Everyday conversational 3-second Consequence Choice definitions ("Oh tidak! Karena ... hilang, maka ... Perbaiki vs Lihat Akibatnya")
  function guidePlayerRecovery({ cat, cardIds, targetGx, targetGz, targetAnimal, targetTitle, targetDesc, instruction, scenarioKey }) {
    if (scenarioKey) activeRecoveryKey = scenarioKey;
    guidedCardIds = Array.isArray(cardIds) ? cardIds.slice() : [];
    guidedHintText = instruction || 'Pilih kartu yang menyala di deck bawah, lalu letakkan di lokasi sasaran!';
    selectedDockCard = null; // Never auto-pick or auto-execute for the player!
    if (canvas) canvas.classList.remove('placing-mode');

    if (cat) {
      dockCategory = cat;
      document.querySelectorAll('.iso-dock-tab').forEach((t) => {
        t.classList.toggle('active', (t.getAttribute('data-cat') || 'all') === cat);
      });
    }
    renderDock();

    if (typeof targetGx === 'number' && typeof targetGz === 'number') {
      focusCustomWorldEvent({
        kind: (eventFocus && eventFocus.kind) || 'mutual',
        gx: targetGx,
        gz: targetGz,
        animal: targetAnimal || null,
        title: targetTitle || '🎯 LOKASI PENANGANAN',
        desc: guidedHintText,
        color: '#ffd54f',
        fill: 'rgba(255, 213, 79, 0.25)'
      });
    }
    if (advisorTipEl) advisorTipEl.textContent = guidedHintText;
    logEvent(guidedHintText);
  }

  const CONSEQUENCE_SCENARIOS = {
    pesticide: {
      badge: '⚠️ RANTAI MAKANAN PUTUS!',
      title: '😱 Oh tidak! Racun Hama Mematikan Pemakan Rumput!',
      body: 'Karena pestisida disemprot berlebihan, rumput ikut tercemar dan Belalang serta Kelinci habis mati! Sekarang Katak, Ular, dan Elang mulai kebingungan dan kelaparan karena makanannya hilang!',
      next: '🔎 Jika dibiarkan: Pemangsa yang kelaparan akan saling menyerang dan populasinya ikut turun drastis.',
      fixLabel: '🧭 Tunjukkan Cara Pulihkan',
      onFix: () => {
        guidePlayerRecovery({
          cat: 'cloud',
          cardIds: ['cloud', 'grass'],
          targetGx: MAP_SIZE * 0.42,
          targetGz: MAP_SIZE * 0.35,
          targetTitle: '🧪 AREA TERKENA PESTISIDA',
          instruction: '👉 Pilih kartu [Awan Hujan] di tab ☁️ Awan, lalu ketuk tepat di padang rumput ini untuk mencuci racun (lalu tambahkan Rumpun Rumput & Belalang)!'
        });
      },
      onWatch: () => {
        animals.forEach((a) => {
          if (CARNIVORES.includes(a.type) || APEXES.includes(a.type)) {
            a.fullTimer = 0;
            a.hunger = Math.min(99, a.hunger + 48);
            a.stateLabel = 'KELAPARAN (MANGSA HABIS!)';
          }
        });
        const pred = animals.find((a) => CARNIVORES.includes(a.type) || APEXES.includes(a.type));
        if (pred) {
          focusCustomWorldEvent({
            kind: 'pesticide',
            gx: pred.gx,
            gz: pred.gz,
            animal: pred,
            title: '🐍 PEMANGSA KELAPARAN',
            desc: pred.def.name + ' kelaparan karena serangga & kelinci mati terkena racun',
            color: '#ff7043',
            fill: 'rgba(255, 112, 67, 0.24)'
          });
        }
        logEvent('👀 Kamu memilih melihat akibatnya: perhatikan Katak, Ular & Elang yang kelaparan mencari sisa mangsa!');
      }
    },
    illegal_logging: {
      badge: '⚠️ HUTAN JADI GUNDUL!',
      title: '😱 Oh tidak! Pohon Habis, Hewan Kehilangan Rumah!',
      body: 'Karena banyak pohon ditebang habis tanpa ditanam lagi, burung kehilangan tempat bertengger, hewan darat kepanasan tanpa teduhan, dan tanah tak kuat menahan air hujan!',
      next: '🔎 Jika dibiarkan: Saat hujan turun, air sungai langsung meluap merendam daratan dan populasi hewan menyusut.',
      fixLabel: '🧭 Tunjukkan Cara Tanam Ulang',
      onFix: () => {
        const land = landTilesByRot[0] || [];
        const stumpTile = land.find((t) => t.hasStump) || land.find((t) => t.type === 'grass' && !t.hasTree);
        guidePlayerRecovery({
          cat: 'prod',
          cardIds: ['plant_tree'],
          targetGx: stumpTile ? stumpTile.gx + 0.5 : MAP_SIZE * 0.45,
          targetGz: stumpTile ? stumpTile.gz + 0.5 : MAP_SIZE * 0.40,
          targetTitle: '🪓 LAHAN HUTAN GUNDUL',
          instruction: '👉 Pilih kartu [Pohon Alami] di tab 🌱 Produsen (atau [Awan Pohon] di ☁️ Awan), lalu tanam tepat di atas bekas tunggul gundul di peta!'
        });
      },
      onWatch: () => {
        animals.forEach((a) => { a.thirst = Math.min(96, a.thirst + 32); });
        triggerDisaster('natural_flood', true);
        logEvent('👀 Akibat hutan gundul mulai terlihat: tanah tak mampu menyerap air hingga memicu banjir di tepian sungai!');
      }
    },
    river_waste: {
      badge: '⚠️ SUNGAI TERCEMAR LIMBAH!',
      title: '😱 Oh tidak! Air Sungai Kotor & Beracun!',
      body: 'Karena limbah dibuang ke sungai, ikan-ikan menghilang dan Serangga Air mati! Hewan yang minum di tepi sungai pun mulai sakit keracunan!',
      next: '🔎 Jika dibiarkan: Katak dan Burung Bangau kehilangan makanan, sementara hewan yang minum air kotor terus melemah.',
      fixLabel: '🧭 Tunjukkan Cara Jernihkan',
      onFix: () => {
        const pt = pollutedTiles[0];
        guidePlayerRecovery({
          cat: 'cloud',
          cardIds: ['cloud'],
          targetGx: pt ? pt.gx + 0.5 : MAP_SIZE * 0.5,
          targetGz: pt ? pt.gz + 0.5 : riverCenterZ(MAP_SIZE * 0.5),
          targetTitle: '🛢️ SUNGAI TERCEMAR LIMBAH',
          instruction: '👉 Pilih kartu [Awan Hujan] di tab ☁️ Awan, lalu ketuk tepat di atas aliran sungai yang keruh ini (lalu tambahkan Jamur Mikoriza di tepian)!'
        });
      },
      onWatch: () => {
        animals.forEach((a, idx) => {
          if (riverDistance(a.gx, a.gz) < 4.5 || idx % 3 === 0) {
            a.hasParasite = true;
            a.hp = Math.max(18, a.hp - 25);
            a.stateLabel = 'KERACUNAN AIR LIMBAH!';
          }
        });
        logEvent('👀 Lihat akibatnya: hewan yang minum di dekat sungai keruh mulai keracunan & melemah!');
      }
    },
    drought_heat: {
      badge: '⚠️ PRODUSEN MENGERING!',
      title: '😱 Oh tidak! Rumput Habis karena Kemarau Panjang!',
      body: 'Karena panas terik tak kunjung hujan, rumput-rumput hijau mati mengering! Karena produsen hilang, Belalang, Kelinci, dan Tikus Pasir kelaparan tak punya makanan!',
      next: '🔎 Jika dibiarkan: Hewan pemakan tumbuhan akan mati kelaparan satu per satu, lalu diikuti kelaparan para pemangsa.',
      fixLabel: '🧭 Tunjukkan Cara Basahi',
      onFix: () => {
        guidePlayerRecovery({
          cat: 'cloud',
          cardIds: ['cloud', 'grass'],
          targetGx: MAP_SIZE * 0.36,
          targetGz: MAP_SIZE * 0.36,
          targetTitle: '☀️ PADANG RUMPUT KERING',
          instruction: '👉 Pilih kartu [Awan Hujan] atau [Awan Rumput] di tab ☁️ Awan, lalu ketuk di atas padang rumput yang gersang ini!'
        });
      },
      onWatch: () => {
        animals.forEach((a) => {
          if (HERBIVORES.includes(a.type)) {
            a.fullTimer = 0;
            a.hunger = Math.min(99, a.hunger + 52);
            a.thirst = Math.min(98, a.thirst + 40);
            a.stateLabel = 'KELAPARAN (RUMPUT KERING!)';
          }
        });
        logEvent('👀 Lihat akibatnya: tanpa rumput hijau, para herbivora kelaparan & kehausan di tanah gersang!');
      }
    },
    wildfire: {
      badge: '⚠️ API MELAHAP LAHAN!',
      title: '😱 Oh tidak! Kebakaran Menghanguskan Pohon & Rumput!',
      body: 'Kobaran api membakar pepohonan dan semak pakan satwa hingga tersisa tunggul arang! Satwa panik berlarian kehilangan tempat tinggal dan sumber makanan.',
      next: '🔎 Jika dibiarkan: Api baru padam setelah menghanguskan area sekitar dan meninggalkan tanah gersang.',
      fixLabel: '🧭 Tunjukkan Cara Padamkan',
      onFix: () => {
        const ft = fireTiles[0];
        guidePlayerRecovery({
          cat: 'cloud',
          cardIds: ['cloud'],
          targetGx: ft ? ft.gx + 0.5 : MAP_SIZE * 0.5,
          targetGz: ft ? ft.gz + 0.5 : MAP_SIZE * 0.45,
          targetTitle: '🔥 TITIK API KEBAKARAN',
          instruction: '👉 Pilih kartu [Awan Hujan] di tab ☁️ Awan, lalu ketuk tepat di atas titik api ini untuk memadamkan kebakaran!'
        });
      },
      onWatch: () => {
        logEvent('👀 Kamu membiarkan kebakaran berlangsung — perhatikan lahan yang berubah menjadi tunggul arang!');
      }
    },
    natural_flood: {
      badge: '⚠️ KAMPUNG & SAWAH TERENDAM!',
      title: '😱 Oh tidak! Air Sungai Meluap Merendam Daratan!',
      body: 'Banjir merendam ladang pangan warga dan rumput di dataran rendah! Hewan kecil di tepi sungai kesulitan mencari makan dan sebagian pondok warga rusak.',
      next: '🔎 Jika dibiarkan: Hasil pangan desa berkurang dan tanah tepian sungai butuh waktu lama untuk surut.',
      fixLabel: '🧭 Tunjukkan Cara Tahan Banjir',
      onFix: () => {
        const ft = floodTiles[0];
        guidePlayerRecovery({
          cat: 'prod',
          cardIds: ['plant_tree'],
          targetGx: ft ? ft.gx + 0.5 : MAP_SIZE * 0.46,
          targetGz: ft ? ft.gz + 0.5 : riverCenterZ(MAP_SIZE * 0.46),
          targetTitle: '🌊 TEPIAN SUNGAI MELUAP',
          instruction: '👉 Pilih kartu [Pohon Alami] di tab 🌱 Produsen, lalu tanam di sepanjang tepian sungai yang banjir ini agar akarnya menyerap air!'
        });
      },
      onWatch: () => {
        logEvent('👀 Banjir dibiarkan surut alami — perhatikan dampaknya pada ladang warga dan satwa tepi sungai!');
      }
    },
    thunderstorm: {
      badge: '⚠️ PETIR MENYAMBAR PULAU!',
      title: '⚡ Oh tidak! Sambaran Petir Membelah Pohon Tinggi!',
      body: 'Petir menyambar beberapa pohon besar hingga tumbang membara! Namun di sisi lain, hujan badainya membawa air melimpah dan menyuburkan tanah.',
      next: '🔎 Pilih: Pelajari cara memulihkan bekas sambaran petir, atau biarkan alam menyeimbangkan dirinya sendiri.',
      fixLabel: '🧭 Tunjukkan Cara Pulihkan',
      onFix: () => {
        const ft = fireTiles[0];
        guidePlayerRecovery({
          cat: 'prod',
          cardIds: ['plant_tree'],
          targetGx: ft ? ft.gx + 0.5 : MAP_SIZE * 0.48,
          targetGz: ft ? ft.gz + 0.5 : MAP_SIZE * 0.38,
          targetTitle: '⚡ POHON TERSAMBAR PETIR',
          instruction: '👉 Pilih kartu [Awan Hujan] (tab ☁️ Awan) untuk memadamkan bara, lalu pilih [Pohon Alami] di tab 🌱 Produsen untuk menanam pohon pengganti!'
        });
      },
      onWatch: () => {
        spawnLightningBolt(MAP_SIZE * (0.35 + Math.random() * 0.3), MAP_SIZE * (0.35 + Math.random() * 0.3));
        logEvent('⚡ Badai petir masih berlanjut menyambar pulau — perhatikan kilatan petir di langit!');
      }
    },
    earthquake: {
      badge: '⚠️ TANAH RETAK & LONGSOR!',
      title: '😱 Oh tidak! Bukit Longsor & Rumah Warga Terguncang!',
      body: 'Gempa menjatuhkan batu-batu besar dari lereng bukit dan merobohkan bangunan warga! Namun bongkahan batu itu bisa dikumpulkan kembali untuk membangun ulang desa.',
      next: '🔎 Pilih: Lihat cara membantu warga membangun ulang, atau biarkan warga menambang batu longsoran sendiri.',
      fixLabel: '🧭 Tunjukkan Cara Bangun Ulang',
      onFix: () => {
        guidePlayerRecovery({
          cat: 'human',
          cardIds: ['human', 'human_female'],
          targetGx: HILL_PEAK.x,
          targetGz: HILL_PEAK.z + 5,
          targetTitle: '🌋 KAKI BUKIT LONGSOR',
          instruction: '👉 Pilih kartu [Laki-laki] atau [Perempuan] di tab 🏡 Manusia, lalu letakkan di kaki bukit ini agar mereka menambang batu & membangun rumah!'
        });
      },
      onWatch: () => {
        logEvent('👀 Warga desa mulai bekerja menambang bongkahan batu sisa longsoran di kaki bukit!');
      }
    },
    peat_fire: {
      badge: '⚠️ KRISIS GAMBUT KALIMANTAN!',
      title: '😱 Oh tidak! Lahan Gambut Mengering & Muncul Kabut Asap!',
      body: 'Air gambut menyusut akibat kemarau & pengeringan lahan! Api bawah tanah mulai membara, asap menyelimuti Kalimantan, dan habitat Orangutan & Enggang terancam!',
      next: '🔎 Jika dibiarkan: Kabut asap makin pekat, pohon Ramin/Jelutung terbakar, dan satwa khas Kalimantan terpaksa mengungsi.',
      fixLabel: '🧭 Tunjukkan Cara Jaga Gambut',
      onFix: () => {
        const ft = fireTiles.find((t) => t.biome === 'peatland') || fireTiles[0];
        guidePlayerRecovery({
          cat: 'prod',
          cardIds: ['sekat_kanal', 'bibit_gambut'],
          targetGx: ft ? ft.gx + 0.5 : MAP_SIZE * 0.25,
          targetGz: ft ? ft.gz + 0.5 : MAP_SIZE * 0.56,
          targetTitle: '🌫️ GAMBUT KALIMANTAN BERASAP',
          instruction: '👉 Pilih kartu [Sekat Kanal] atau [Purun & Jelutung] di tab 🌱 Produsen, lalu letakkan di area Lahan Gambut yang berasap ini (bisa ditambah Awan Hujan)!'
        });
      },
      onWatch: () => {
        peatSmogAlpha = 0.38;
        logEvent('👀 Kabut asap dibiarkan menyebar — amati dampaknya pada hutan gambut & Orangutan!');
      }
    },
    outbreak_parasite: {
      badge: '⚠️ WABAH PENYAKIT & BENALU!',
      title: '😱 Oh tidak! Banyak Hewan Lemas Terkena Parasit!',
      body: 'Benalu dan kutu parasit menyebar cepat menghisap tenaga hewan dan pohon! Jika tak diobati, hewan yang sakit akan mudah dimangsa atau mati lemas.',
      next: '🔎 Jika dibiarkan: Separuh hewan terus kehilangan darah (HP) dan rantai makanan melemah.',
      fixLabel: '🧭 Tunjukkan Cara Obati',
      onFix: () => {
        const sick = animals.find((a) => a.hasParasite) || animals[0];
        guidePlayerRecovery({
          cat: 'prod',
          cardIds: ['mushroom'],
          targetGx: sick ? sick.gx : MAP_SIZE * 0.48,
          targetGz: sick ? sick.gz : MAP_SIZE * 0.48,
          targetAnimal: sick || null,
          targetTitle: '🦠 SATWA TERKENA PARASIT',
          instruction: '👉 Pilih kartu [Jamur Mikoriza] di tab 🌱 Produsen (atau [Burung Bangau] di 🐾 Satwa), lalu letakkan di dekat satwa yang sakit ini!'
        });
      },
      onWatch: () => {
        logEvent('👀 Wabah dibiarkan: perhatikan Burung Bangau & Katak yang berusaha membantu membersihkan kutu satwa!');
      }
    },
    biome_displaced: {
      badge: '⚠️ HABITAT HILANG & MIGRASI SATWA!',
      title: '😱 Oh tidak! Hewan Kehilangan Daerah Asalnya!',
      body: 'Karena daerah asalnya dihapus atau diubah, hewan-hewan setempat terpaksa pindah mengungsi ke ekosistem tetangga! Di tempat asing itu, mereka kaget dengan suhu baru dan kalah cepat mencari makan melawan hewan asli setempat!',
      next: '🔎 Jika dibiarkan: Hanya sebagian kecil yang kuat BERADAPTASI (🧬), sedangkan sisanya akan mati KALAH BERSAING (💀)!',
      fixLabel: '🧭 Tunjukkan Cara Bantu',
      onFix: () => {
        const migrant = animals.find((a) => {
          const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gx)));
          const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gz)));
          const tb = grid[iz][ix].biome;
          const nat = SPECIES_NATIVE_BIOMES[a.type] || ['grassland'];
          return !a.isAdapted && !nat.includes(tb);
        }) || animals[0];
        const orig = (migrant && migrant.originBiome) || 'grassland';
        const cardNeed = orig === 'desert' ? 'terra_sand' : orig === 'hills' ? 'terra_rock' : orig === 'peatland' ? 'terra_peat' : 'terra_grass';
        const cardName = cardNeed === 'terra_sand' ? 'Pasir Gurun' : cardNeed === 'terra_rock' ? 'Bukit Batu' : cardNeed === 'terra_peat' ? 'Lahan Gambut' : 'Tanah Rumput';
        guidePlayerRecovery({
          cat: 'land',
          cardIds: [cardNeed],
          targetGx: migrant ? migrant.gx : MAP_SIZE * 0.5,
          targetGz: migrant ? migrant.gz : MAP_SIZE * 0.5,
          targetAnimal: migrant || null,
          targetTitle: '🏃 LOKASI SATWA MENGUNGSI',
          instruction: `👉 Pilih kartu [${cardName}] di tab 🌍 Tanah & Peta, lalu ketuk tepat di sekitar ${migrant ? migrant.def.name : 'satwa yang mengungsi'} ini agar habitat aslinya pulih!`
        });
      },
      onWatch: () => {
        const migrant = animals.find((a) => {
          const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gx)));
          const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(a.gz)));
          const tb = grid[iz][ix].biome;
          const nat = SPECIES_NATIVE_BIOMES[a.type] || ['grassland'];
          return !a.isAdapted && !nat.includes(tb);
        }) || animals[0];
        if (migrant) {
          migrant.foreignTimer = Math.max(migrant.foreignTimer || 0, 3.2);
          focusCustomWorldEvent({
            kind: 'biome_displaced',
            gx: migrant.gx,
            gz: migrant.gz,
            animal: migrant,
            title: '🏃 SELEKSI ALAM PENGUNGSI',
            desc: `${migrant.def.name} berjuang beradaptasi vs kalah saing di bioma baru`,
            color: '#ffd54f',
            fill: 'rgba(255, 213, 79, 0.24)'
          });
        }
        logEvent('👀 Lihat seleksi alam berlangsung: apakah satwa pengungsi akan BERADAPTASI (🧬) atau mati KALAH SAING (💀)?');
      }
    }
  };

  const DISPLACED_REASONS = {
    terra_erase: {
      title: '😱 Oh tidak! Wilayah Luas Tenggelam & Satwa Mengungsi!',
      body: 'Penghapusan daratan dalam skala luas memaksa satwa setempat berpindah ke bioma tetangga. Di lingkungan baru, mereka harus beradaptasi atau kalah bersaing mencari pakan!',
      sci: 'Hilangnya daratan luas memaksa satwa bermigrasi ke bioma baru yang suhu dan pakannya berbeda. Hanya satwa yang kuat beradaptasi yang bertahan dari persaingan.',
      step1: { icon: '🌊', label: 'Daratan Tenggelam' }
    },
    desertify: {
      title: '🏜️ Oh tidak! Penggurunan Luas Mengusir Satwa Asli!',
      body: 'Perluasan pasir gurun yang besar menghilangkan tanaman basah sehingga satwa asli terpaksa mengungsi ke ekosistem lain dan bersaing dengan penghuni lokal!',
      sci: 'Penggurunan drastis memutus pakan basah dan memaksa satwa mencari rumah baru. Sebagian mampu beradaptasi, tetapi yang lemah kalah bersaing.',
      step1: { icon: '🏜️', label: 'Penggurunan Luas' }
    },
    deforestation: {
      title: '🪓 Oh tidak! Hutan Terkikis & Satwa Kehilangan Rumah!',
      body: 'Berkurangnya hutan alami akibat penebangan atau ekspansi kebun monokultur memaksa satwa kanopi mengungsi ke wilayah lain yang lebih padat penghuni!',
      sci: 'Hilangnya tutupan hutan memutus tempat berteduh dan pakan sehingga satwa bermigrasi. Persaingan wilayah di bioma tujuan meningkat tajam.',
      step1: { icon: '🪓', label: 'Hutan Hilang' }
    },
    wildfire: {
      title: '🔥 Oh tidak! Kebakaran Besar Memaksa Satwa Mengungsi!',
      body: 'Api dan asap pekat membuat satwa berlarian meninggalkan habitatnya menuju bioma terdekat. Di tempat pengungsian baru, mereka harus berebut sumber daya!',
      sci: 'Kebakaran lahan menghanguskan habitat dan mendorong migrasi darurat satwa. Satwa pengungsi harus beradaptasi cepat agar tidak kalah saing.',
      step1: { icon: '🔥', label: 'Lahan Terbakar' }
    },
    reclaim: {
      title: '🌾 Perubahan Bioma Luas Memicu Migrasi Satwa!',
      body: 'Pengubahan bioma dalam area besar membuat satwa asli gurun atau rawa berpindah ke ekosistem lain untuk mencari kondisi suhu yang cocok!',
      sci: 'Perubahan tipe bioma secara besar-besaran menggeser habitat satwa asli. Sebagian beradaptasi, sedangkan yang tidak cocok kalah bersaing.',
      step1: { icon: '🌍', label: 'Bioma Berubah' }
    }
  };

  function maybeTriggerBiomeDisplaced(reason) {
    if (displacedCooldown > 0 || pendingConsequence) return false;
    lastDisplacedReason = DISPLACED_REASONS[reason] ? reason : 'terra_erase';
    displacedCounter = 0;
    displacedAnimalEvacCount = 0;
    displacedCooldown = 45.0; // Never spam popups back-to-back!
    const rInfo = DISPLACED_REASONS[lastDisplacedReason];
    if (CONSEQUENCE_SCENARIOS.biome_displaced) {
      CONSEQUENCE_SCENARIOS.biome_displaced.title = rInfo.title;
      CONSEQUENCE_SCENARIOS.biome_displaced.body = rInfo.body;
    }
    if (EVENT_ENCYCLOPEDIA.biome_displaced) {
      EVENT_ENCYCLOPEDIA.biome_displaced.science = rInfo.sci;
      if (EVENT_ENCYCLOPEDIA.biome_displaced.steps && EVENT_ENCYCLOPEDIA.biome_displaced.steps[0]) {
        EVENT_ENCYCLOPEDIA.biome_displaced.steps[0] = rInfo.step1;
      }
    }
    scheduleConsequenceChoice('biome_displaced');
    return true;
  }

  function scheduleConsequenceChoice(kind) {
    if (!CONSEQUENCE_SCENARIOS[kind]) return;
    pendingConsequence = kind;
    consequenceTimer = 3.0; // Exact 3.0 real-world seconds!
  }

  function openConsequenceModal(kind) {
    const sc = CONSEQUENCE_SCENARIOS[kind];
    if (!sc || !conseqModalEl) return;
    pendingConsequence = kind;
    activeRecoveryKey = kind;
    tutSawConseq = true;
    if (conseqBadgeEl) conseqBadgeEl.textContent = sc.badge;
    if (conseqTitleEl) conseqTitleEl.textContent = sc.title;
    if (conseqBodyEl) conseqBodyEl.textContent = sc.body;
    if (conseqNextEl) conseqNextEl.textContent = sc.next;
    if (conseqFixBtn) conseqFixBtn.textContent = sc.fixLabel || '🌿 Bantu Perbaiki Sekarang';
    conseqModalEl.classList.remove('hidden');
  }

  // Dramatic Forked Lightning Bolt Strike (visual jagged sky bolt + flash + ground shockwave + tree split!)
  function spawnLightningBolt(gx, gz) {
    const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(gx)));
    const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(gz)));
    const tile = grid[iz] && grid[iz][ix];
    const lift = getTileLift(tile);

    // Build normalized jitter offsets for main bolt + 2 forks so bolt projects cleanly at any camera zoom!
    const segs = [];
    let curOff = 0;
    for (let s = 0; s <= 9; s++) {
      if (s === 0 || s === 9) curOff = 0;
      else curOff += (Math.random() - 0.5) * 26;
      segs.push({ t: s / 9, dx: curOff });
    }
    const forks = [
      { fromIdx: 3, dx1: curOff + (Math.random() < 0.5 ? -28 : 28), dy1: 42, dx2: curOff + (Math.random() < 0.5 ? -44 : 44), dy2: 78 },
      { fromIdx: 6, dx1: (Math.random() < 0.5 ? -22 : 22), dy1: 28, dx2: (Math.random() < 0.5 ? -36 : 36), dy2: 54 }
    ];
    lightningBolts.push({
      gx,
      gz,
      elev: lift,
      segs,
      forks,
      life: 0.55,
      maxLife: 0.55
    });
    skyFlashAlpha = 0.52;
    cam.trauma = Math.max(cam.trauma, 0.58);
    spawnRings.push({ gx, gz, elev: lift, color: '#80d8ff', life: 0.9, maxLife: 0.9 });
    spawnRings.push({ gx, gz, elev: lift, color: '#fff59d', life: 0.65, maxLife: 0.65 });
    addParticle(gx, gz, lift + 22, '⚡💥', '#fff59d');

    if (tile && !tile.isOceanMargin && tile.type !== 'water') {
      if (tile.hasTree) {
        tile.hasTree = false;
        tile.hasStump = true;
        const ti = treeTiles.indexOf(tile);
        if (ti >= 0) treeTiles.splice(ti, 1);
        tile.fireTimer = 4.2;
        if (!fireTiles.includes(tile)) fireTiles.push(tile);
      } else if (tile.producerStage > 0 && Math.random() < 0.45) {
        tile.producerStage = 0;
        tile.fireTimer = 3.2;
        if (!fireTiles.includes(tile)) fireTiles.push(tile);
      }
      // Lightning fixes atmospheric nitrogen into fertile soil nearby!
      const adj = grid[iz + 1] && grid[iz + 1][ix];
      if (adj && adj.type === 'grass') adj.hasMycorrhiza = true;
    }
  }

  // Evacuate land animals & humans when their tile is erased/sunk into water so they migrate to surviving ecosystems!
  function evacuateEntitiesFromTile(erasedTile) {
    const findRefuge = (gx, gz) => {
      for (let rad = 1; rad <= 18; rad++) {
        for (let k = 0; k < 16; k++) {
          const ang = (k / 16) * Math.PI * 2;
          const nx = Math.round(gx + Math.cos(ang) * rad);
          const nz = Math.round(gz + Math.sin(ang) * rad);
          const nt = grid[nz] && grid[nz][nx];
          if (nt && !nt.isOceanMargin && nt.type !== 'water') return nt;
        }
      }
      return null;
    };
    let movedAnimals = 0;
    for (let i = 0; i < animals.length; i++) {
      const a = animals[i];
      if (a.isFly) continue;
      if (Math.floor(a.gx) === erasedTile.gx && Math.floor(a.gz) === erasedTile.gz) {
        const ref = findRefuge(a.gx, a.gz);
        if (ref) {
          a.gx = ref.gx + 0.5;
          a.gz = ref.gz + 0.5;
          a.stateLabel = '🏃 MENGUNGSI KE BIOMA LAIN!';
          addParticle(a.gx, a.gz, getTileLift(ref) + 14, '🏃💨', '#ffd54f');
          movedAnimals++;
        }
      }
    }
    for (let i = 0; i < humans.length; i++) {
      const h = humans[i];
      if (Math.floor(h.gx) === erasedTile.gx && Math.floor(h.gz) === erasedTile.gz) {
        const ref = findRefuge(h.gx, h.gz);
        if (ref) {
          h.gx = ref.gx + 0.5;
          h.gz = ref.gz + 0.5;
          h.stateLabel = 'MENGUNGSI DARI LAUT!';
        }
      }
    }
    return movedAnimals;
  }

  function syncTileRenderLists(t) {
    const compareDepth = (r) => (a, b) => {
      const ra = rotateCoordsForRot(a.gx + 0.5, a.gz + 0.5, r);
      const rb = rotateCoordsForRot(b.gx + 0.5, b.gz + 0.5, r);
      return ra.rx + ra.rz - (rb.rx + rb.rz) || ra.rx - rb.rx;
    };
    for (let r = 0; r < 4; r++) {
      const sArr = sortedTilesByRot[r];
      const lArr = landTilesByRot[r];
      const wArr = waterTilesByRot[r];
      if (t.isOceanMargin) {
        const li = lArr.indexOf(t); if (li >= 0) lArr.splice(li, 1);
        const wi = wArr.indexOf(t); if (wi >= 0) wArr.splice(wi, 1);
      } else if (t.type === 'water') {
        if (!sArr.includes(t)) sArr.push(t);
        if (!wArr.includes(t)) wArr.push(t);
        const li = lArr.indexOf(t); if (li >= 0) lArr.splice(li, 1);
      } else {
        if (!sArr.includes(t)) sArr.push(t);
        if (!lArr.includes(t)) {
          lArr.push(t);
          if (getTileLift(t) > 0) lArr.sort(compareDepth(r));
        }
        const wi = wArr.indexOf(t); if (wi >= 0) wArr.splice(wi, 1);
      }
    }
  }

  function applyTerraformBrush(terraKind, centerTile) {
    let modifiedCount = 0;
    let displacedTilesCount = 0;
    let evacuatedNow = 0;
    const brushR = terraKind === 'erase' ? 1.55 : 1.4;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.hypot(dx, dz) > brushR) continue;
        const nx = centerTile.gx + dx;
        const nz = centerTile.gz + dz;
        // Strict maximum island boundary matching screenshot!
        if (!isInsideMaxIslandBounds(nx, nz)) continue;
        const nt = grid[nz][nx];
        nt.terraEdited = true;
        hasAnyTerraEdits = true;
        nt.isRicePaddy = false;
        nt.isPath = false;

        const clearSurface = () => {
          if (nt.hasTree) {
            nt.hasTree = false;
            const ti = treeTiles.indexOf(nt);
            if (ti >= 0) treeTiles.splice(ti, 1);
          }
          if (nt.hasSawit) {
            nt.hasSawit = false;
            const si = sawitTiles.indexOf(nt);
            if (si >= 0) sawitTiles.splice(si, 1);
          }
          if (nt.building) {
            nt.building = null;
            const bi = buildingTiles.indexOf(nt);
            if (bi >= 0) buildingTiles.splice(bi, 1);
          }
          if (nt.isFarm) {
            nt.isFarm = false;
            const fi = farmTiles.indexOf(nt);
            if (fi >= 0) farmTiles.splice(fi, 1);
          }
          nt.saplingStage = 0;
          nt.producerStage = 0;
          nt.hasStump = false;
          nt.propType = 'none';
          nt.microDecor = null;
          nt.riverProp = null;
        };

        if (terraKind === 'erase' || terraKind === 'water') {
          const wasLand = !nt.isOceanMargin && nt.type !== 'water';
          clearSurface();
          // Turn erased area into clear turquoise island water matching the central river!
          nt.isOceanMargin = false;
          nt.type = 'water';
          nt.elev = 1.5;
          if (terraKind === 'water' && Math.random() < 0.20) {
            nt.riverProp = Math.random() < 0.5 ? 'lotus_cluster' : 'river_reeds';
          } else if (terraKind === 'erase' && Math.random() < 0.12) {
            nt.riverProp = 'river_rock';
          }
          syncTileRenderLists(nt);
          evacuatedNow += evacuateEntitiesFromTile(nt);
          if (wasLand) displacedTilesCount++;
          modifiedCount++;
        } else if (terraKind === 'grassland') {
          const prevBiome = nt.biome;
          nt.isOceanMargin = false;
          nt.type = 'grass';
          nt.biome = 'grassland';
          nt.elev = 10;
          nt.riverProp = null;
          if (!nt.hasTree && nt.producerStage === 0 && Math.random() < 0.55) nt.producerStage = 2;
          if (!nt.microDecor && Math.random() < 0.28) nt.microDecor = 'flower_yellow';
          if (prevBiome === 'desert') displacedTilesCount++;
          syncTileRenderLists(nt);
          modifiedCount++;
        } else if (terraKind === 'desert') {
          const prevBiome = nt.biome;
          clearSurface();
          nt.isOceanMargin = false;
          nt.type = 'sand';
          nt.biome = 'desert';
          nt.elev = 9.5;
          if (Math.random() < 0.22) nt.microDecor = Math.random() < 0.5 ? 'dry_shrub' : 'desert_rock';
          if (prevBiome !== 'desert') displacedTilesCount++;
          syncTileRenderLists(nt);
          modifiedCount++;
        } else if (terraKind === 'peatland') {
          nt.isOceanMargin = false;
          nt.type = 'grass';
          nt.biome = 'peatland';
          nt.elev = 7.5;
          nt.riverProp = null;
          peatMoisture = Math.min(100, peatMoisture + 3);
          if (!nt.hasTree && nt.producerStage === 0 && Math.random() < 0.45) nt.producerStage = 2;
          if (!nt.microDecor && Math.random() < 0.45) nt.microDecor = 'kelakai_fern';
          syncTileRenderLists(nt);
          modifiedCount++;
        } else if (terraKind === 'hills') {
          nt.isOceanMargin = false;
          nt.type = 'grass';
          nt.biome = 'hills';
          nt.elev = dx === 0 && dz === 0 ? 23 : 18;
          nt.riverProp = null;
          if (!nt.hasTree && Math.random() < 0.32) nt.propType = 'mossy_rock';
          else if (!nt.hasTree && Math.random() < 0.25) nt.microDecor = 'hill_shrub';
          syncTileRenderLists(nt);
          modifiedCount++;
        }
      }
    }

    if (modifiedCount > 0) {
      // Seamless ~1.5ms localized pixel rebake (smooth turquoise river banks & organic biome edges, ZERO lag!)
      rebakeTerrainSubRect(centerTile.gx + 0.5, centerTile.gz + 0.5, 1.85);
      recountLiveBiomes();
    }

    // Small/minor edits (< 18 tiles and < 3 animals directly displaced) happen silently without interrupting!
    displacedCounter += displacedTilesCount;
    displacedAnimalEvacCount += evacuatedNow;
    const reason =
      terraKind === 'desert' ? 'desertify'
      : terraKind === 'grassland' ? 'reclaim'
      : 'terra_erase';
    const anyBiome75Lost = Object.keys(initialBiomeCounts).some((bk) => getBiomeDamageRatio(bk) >= 0.75);
    if ((anyBiome75Lost || displacedAnimalEvacCount >= 3) && displacedCooldown <= 0 && !pendingConsequence) {
      maybeTriggerBiomeDisplaced(reason);
    }
    return modifiedCount;
  }

    function showEventAlertPopup(opts) {
    pendingAlertEvent = opts;
    if (!eventPopupEl) return;
    if (eventPopupIconEl) eventPopupIconEl.textContent = opts.icon || '🔍';
    if (eventPopupTextEl) eventPopupTextEl.textContent = opts.alertText || 'Sedang terjadi peristiwa ekosistem! Ayo lihat!';
    eventPopupEl.classList.remove('hidden');
  }

  function focusCustomWorldEvent(opts) {
    const styleCol = opts.color || '#ffd54f';
    eventFocus = {
      kind: opts.kind || 'flood',
      gx: opts.gx,
      gz: opts.gz,
      animal: opts.animal || null,
      partnerTile: opts.partnerTile || null,
      partnerAnimal: null,
      title: opts.title,
      desc: opts.desc,
      biomeName: opts.biomeName || 'Pulau Ekosistem',
      color: styleCol,
      fill: opts.fill || 'rgba(255, 213, 79, 0.22)',
      timer: 14.0
    };
    selectedAnimal = opts.animal || null;
    cam.targetZoom = 1.85;
    if (canvas) {
      const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(opts.gx)));
      const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(opts.gz)));
      const lift = getTileLift(grid[iz] && grid[iz][ix]);
      const r = rotateCoords(opts.gx, opts.gz);
      const sx = (r.rx - r.rz) * (BASE_TW / 2);
      const sy = (r.rx + r.rz) * (BASE_TH / 2) - lift;
      const ch = viewH || canvas.clientHeight;
      cam.targetX = -sx * cam.targetZoom;
      cam.targetY = ch * 0.31 - sy * cam.targetZoom;
    }
    if (symResetZoomBtn) symResetZoomBtn.classList.remove('hidden');
    if (eventPopupEl) eventPopupEl.classList.add('hidden');
    logEvent(`🔍 Fokus Kejadian: ${opts.title} — klik tombol (i) untuk membaca penjelasannya!`);
  }

  function renderEduPortrait(spriteKey, fallbackIcon) {
    const cv = document.getElementById('iso-edu-portrait');
    const fb = document.getElementById('iso-edu-portrait-icon');
    let drew = false;
    if (cv && cv.getContext) {
      const pctx = cv.getContext('2d');
      pctx.clearRect(0, 0, cv.width, cv.height);
      const anim = window.EcoSprites && typeof window.EcoSprites.getAnimFrame === 'function'
        ? window.EcoSprites.getAnimFrame(spriteKey, 'move', 0)
        : null;
      const spr = window.EcoSprites && typeof window.EcoSprites.get === 'function'
        ? window.EcoSprites.get(spriteKey, 3)
        : null;
      if (anim && anim.img) {
        pctx.imageSmoothingEnabled = false;
        pctx.drawImage(anim.img, anim.sx, anim.sy, anim.sw, anim.sh, 4, 4, cv.width - 8, cv.height - 8);
        drew = true;
      } else if (spr && spr.width) {
        pctx.imageSmoothingEnabled = false;
        pctx.drawImage(spr, 6, 6, cv.width - 12, cv.height - 12);
        drew = true;
      }
    }
    if (fb) {
      fb.textContent = fallbackIcon || '🌿';
      fb.classList.toggle('hidden', drew);
    }
  }

  function openEduModalForFocus() {
    if (!eventFocus || !eduModalEl) return;
    tutOpenedInfo = true;
    const info = EVENT_ENCYCLOPEDIA[eventFocus.kind] || EVENT_ENCYCLOPEDIA.mutual;
    const focusAnimal = eventFocus.animal && animals.includes(eventFocus.animal) ? eventFocus.animal : null;
    const spriteKey = (focusAnimal && focusAnimal.def && (focusAnimal.def.sprite || focusAnimal.type)) || info.spriteKey || 'eagle';
    const speciesLabel = (focusAnimal && focusAnimal.def && focusAnimal.def.name) || info.speciesName || 'EKOSISTEM';

    if (eduBadgeEl) eduBadgeEl.textContent = info.badge;
    if (eduTitleEl) eduTitleEl.textContent = info.title;
    if (eduSubEl) eduSubEl.textContent = `📍 ${eventFocus.desc}`;
    if (eduBodyEl) eduBodyEl.textContent = info.science;
    if (eduTipEl) eduTipEl.textContent = info.tip;

    const spTagEl = document.getElementById('iso-edu-species');
    if (spTagEl) spTagEl.textContent = speciesLabel;

    const statusEl = document.getElementById('iso-edu-status');
    if (statusEl) {
      const customStatus = focusAnimal && focusAnimal.foreignTimer > 0 && !focusAnimal.isAdapted
        ? '⚠️ Habitat Tidak Cocok'
        : info.statusText || '📌 Sedang Diamati';
      statusEl.textContent = customStatus;
      statusEl.className = `fj-status-pill ${info.statusLevel || 'warn'}`;
    }

    renderEduPortrait(spriteKey, info.fallbackIcon);

    const flowEl = document.getElementById('iso-edu-flow');
    if (flowEl && Array.isArray(info.steps)) {
      flowEl.innerHTML = info.steps
        .map((st, idx) => {
          const arrow = idx < info.steps.length - 1 ? '<span class="fj-step-arrow">→</span>' : '';
          return `<div class="fj-step-node"><span class="fj-step-icon">${st.icon}</span><span class="fj-step-label">${st.label}</span></div>${arrow}`;
        })
        .join('');
    }

    const survEl = document.getElementById('iso-edu-survival');
    if (survEl) {
      let pct = typeof info.survivalPct === 'number' ? info.survivalPct : 60;
      let leftLbl = info.survivalLeft || `🧬 Bertahan ${pct}%`;
      let rightLbl = info.survivalRight || `💀 Risiko ${100 - pct}%`;
      if (eventFocus.kind === 'biome_displaced' && focusAnimal) {
        pct = focusAnimal.isAdapted ? 85 : Math.max(25, Math.round(62 - (focusAnimal.foreignTimer || 0) * 2.2));
        leftLbl = `🧬 Adaptasi ${pct}%`;
        rightLbl = `💀 Kalah Saing ${100 - pct}%`;
      }
      survEl.innerHTML = `
        <div class="fj-survival-labels">
          <span class="fj-surv-good">${leftLbl}</span>
          <span class="fj-surv-bad">${rightLbl}</span>
        </div>
        <div class="fj-survival-track">
          <div class="fj-survival-fill" style="width:${pct}%;"></div>
        </div>`;
    }

    eduModalEl.classList.remove('hidden');
  }

  function clearEventFocus(resetZoom = true) {
    eventFocus = null;
    selectedAnimal = null;
    document.querySelectorAll('.iso-sym-zoom-btn').forEach((b) => b.classList.remove('active'));
    if (symResetZoomBtn) symResetZoomBtn.classList.add('hidden');
    if (zoomInfoBtn) zoomInfoBtn.classList.add('hidden');
    if (resetZoom) {
      focusBiomeZone('all');
    }
  }

  // Zoom kamera langsung ke kejadian Simbiosis (Mutualisme, Komensalisme, Parasitisme, Amensalisme)!
  // Jika belum ada kejadian aktif di detik itu, otomatis memicu contoh alami di pulau agar selalu bisa diamati.
  function focusSymbiosisEvent(kind) {
    const candidates = [];

    if (kind === 'mutual') {
      // 1) Cleaner symbiosis or Herbivore pollinating near lush grass/mycorrhiza
      for (let i = 0; i < animals.length; i++) {
        const a = animals[i];
        if (HERBIVORES.includes(a.type) || a.type === 'heron' || a.type === 'frog') {
          const nearTile = findNearestTile(a.gx, a.gz, 3.0, (t) => t.hasMycorrhiza || t.producerStage >= 2);
          if (nearTile) {
            candidates.push({
              gx: a.gx,
              gz: a.gz,
              animal: a,
              partnerTile: nearTile,
              title: '🤝 SIMBIOSIS MUTUALISME (+/+)',
              desc: `${a.def.name} memperoleh pakan & membantu penyebaran spora/biji tanaman`
            });
          }
        }
      }
      for (let i = 0; i < treeTiles.length; i++) {
        const t = treeTiles[i];
        if (t.hasMycorrhiza) {
          candidates.push({
            gx: t.gx + 0.5,
            gz: t.gz + 0.5,
            animal: null,
            partnerTile: t,
            title: '🤝 SIMBIOSIS MUTUALISME (+/+)',
            desc: 'Jamur Mikoriza menyuplai mineral akar & memperoleh karbohidrat dari pohon'
          });
        }
      }
      if (candidates.length === 0 && treeTiles.length > 0) {
        const t = treeTiles[0];
        t.hasMycorrhiza = true;
        candidates.push({
          gx: t.gx + 0.5,
          gz: t.gz + 0.5,
          animal: null,
          partnerTile: t,
          title: '🤝 SIMBIOSIS MUTUALISME (+/+)',
          desc: 'Jamur Mikoriza menyuplai mineral akar & memperoleh karbohidrat dari pohon'
        });
      }
    } else if (kind === 'commensal') {
      for (let i = 0; i < animals.length; i++) {
        const a = animals[i];
        const nearTree = findNearestTile(a.gx, a.gz, 2.5, (t) => t.hasTree);
        if (nearTree) {
          candidates.push({
            gx: a.gx,
            gz: a.gz,
            animal: a,
            partnerTile: nearTree,
            title: '🛡️ SIMBIOSIS KOMENSALISME (+/0)',
            desc: a.isFly
              ? `${a.def.name} bertengger aman di tajuk pohon tanpa merugikan pohon`
              : `${a.def.name} berlindung di bawah naungan pohon tanpa merugikan pohon`
          });
        }
      }
      if (candidates.length === 0 && animals.length > 0 && treeTiles.length > 0) {
        const a = animals[0];
        const t = treeTiles[0];
        a.gx = t.gx + 0.6;
        a.gz = t.gz + 0.6;
        candidates.push({
          gx: a.gx,
          gz: a.gz,
          animal: a,
          partnerTile: t,
          title: '🛡️ SIMBIOSIS KOMENSALISME (+/0)',
          desc: `${a.def.name} berlindung di bawah naungan pohon tanpa merugikan pohon`
        });
      }
    } else if (kind === 'parasite') {
      for (let i = 0; i < animals.length; i++) {
        const a = animals[i];
        if (a.hasParasite) {
          const vineTile = findNearestTile(a.gx, a.gz, 5.0, (t) => t.hasParasiteVine);
          candidates.push({
            gx: a.gx,
            gz: a.gz,
            animal: a,
            partnerTile: vineTile,
            title: '🦠 SIMBIOSIS PARASITISME (+/-)',
            desc: `Parasit menyerap nutrisi ${a.def.name} sehingga inang melemah`
          });
        }
      }
      for (let i = 0; i < treeTiles.length; i++) {
        const t = treeTiles[i];
        if (t.hasParasiteVine) {
          candidates.push({
            gx: t.gx + 0.5,
            gz: t.gz + 0.5,
            animal: null,
            partnerTile: t,
            title: '🦠 SIMBIOSIS PARASITISME (+/-)',
            desc: 'Benalu menempel dan menghisap air serta nutrisi dari pohon inang'
          });
        }
      }
      if (candidates.length === 0) {
        if (animals.length > 0) {
          const a = animals[Math.floor(Math.random() * animals.length)];
          a.hasParasite = true;
          candidates.push({
            gx: a.gx,
            gz: a.gz,
            animal: a,
            partnerTile: null,
            title: '🦠 SIMBIOSIS PARASITISME (+/-)',
            desc: `Parasit menyerap nutrisi ${a.def.name} sehingga inang melemah`
          });
        } else if (treeTiles.length > 0) {
          const t = treeTiles[0];
          t.hasParasiteVine = true;
          candidates.push({
            gx: t.gx + 0.5,
            gz: t.gz + 0.5,
            animal: null,
            partnerTile: t,
            title: '🦠 SIMBIOSIS PARASITISME (+/-)',
            desc: 'Benalu menempel dan menghisap air serta nutrisi dari pohon inang'
          });
        }
      }
    } else if (kind === 'amensal') {
      for (let i = 0; i < treeTiles.length; i++) {
        const t = treeTiles[i];
        if (!t.hasMycorrhiza && t.producerStage > 0) {
          candidates.push({
            gx: t.gx + 0.5,
            gz: t.gz + 0.5,
            animal: null,
            partnerTile: t,
            title: '🌑 SIMBIOSIS AMENSALISME (-/0)',
            desc: 'Tajuk pohon rimbun menghalangi cahaya matahari bagi rumput muda di bawahnya'
          });
        }
      }
      if (candidates.length === 0 && treeTiles.length > 0) {
        const t = treeTiles[0];
        t.hasMycorrhiza = false;
        t.producerStage = 1;
        candidates.push({
          gx: t.gx + 0.5,
          gz: t.gz + 0.5,
          animal: null,
          partnerTile: t,
          title: '🌑 SIMBIOSIS AMENSALISME (-/0)',
          desc: 'Tajuk pohon rimbun menghalangi cahaya matahari bagi rumput muda di bawahnya'
        });
      }
    }

    if (candidates.length === 0) {
      logEvent('🔍 Tambahkan pohon atau satwa terlebih dahulu untuk mengamati simbiosis.');
      return null;
    }

    const idx = symCycleIdx[kind] % candidates.length;
    symCycleIdx[kind] = (symCycleIdx[kind] + 1) % candidates.length;
    const chosen = candidates[idx];

    const styleMap = {
      mutual: { color: '#00e676', fill: 'rgba(0, 230, 118, 0.18)' },
      commensal: { color: '#29b6f6', fill: 'rgba(41, 182, 246, 0.18)' },
      parasite: { color: '#e040fb', fill: 'rgba(224, 64, 251, 0.20)' },
      amensal: { color: '#ffa726', fill: 'rgba(255, 167, 38, 0.18)' }
    };
    const st = styleMap[kind] || styleMap.mutual;

    eventFocus = {
      kind,
      gx: chosen.gx,
      gz: chosen.gz,
      animal: chosen.animal,
      partnerTile: chosen.partnerTile,
      partnerAnimal: chosen.partnerAnimal || null,
      title: chosen.title,
      desc: chosen.desc,
      color: st.color,
      fill: st.fill,
      timer: 14.0
    };
    selectedAnimal = chosen.animal || null;

    cam.targetZoom = 1.85;
    if (canvas) {
      const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(chosen.gx)));
      const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(chosen.gz)));
      const lift = getTileLift(grid[iz] && grid[iz][ix]);
      const r = rotateCoords(chosen.gx, chosen.gz);
      const sx = (r.rx - r.rz) * (BASE_TW / 2);
      const sy = (r.rx + r.rz) * (BASE_TH / 2) - lift;
      const ch = viewH || canvas.clientHeight;
      cam.targetX = -sx * cam.targetZoom;
      cam.targetY = ch * 0.31 - sy * cam.targetZoom;
    }

    document.querySelectorAll('.iso-sym-zoom-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-sym-zoom') === kind);
    });
    if (symResetZoomBtn) symResetZoomBtn.classList.remove('hidden');

    updateBalanceHUD();
    logEvent(`🔍 Zoom [${idx + 1}/${candidates.length}] ${chosen.title}: ${chosen.desc}`);
    return eventFocus;
  }

  function setupEvents() {
    if (!canvas) return;

    const activePointers = new Map();
    let pinchLastDist = 0;
    let pinchLastMid = null;

    canvas.addEventListener('pointerenter', () => {
      pointerOnCanvas = true;
      pointerDirty = true;
    });

    canvas.addEventListener('pointerleave', () => {
      pointerOnCanvas = false;
      hoverTile = null;
      hoveredAnimal = null;
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!rightClickPanMoved && selectedDockCard) {
        selectedDockCard = null;
        canvas.classList.remove('placing-mode');
        renderDock();
        logEvent('🖐️ Mode Geser Peta aktif.');
      }
      rightClickPanMoved = false;
    });

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        isPaintingWorld = false;
        cam.dragging = false;
        const pts = Array.from(activePointers.values());
        pinchLastDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        pinchLastMid = { x: (pts[0].x + pts[1].x) * 0.5, y: (pts[0].y + pts[1].y) * 0.5 };
        tutZoomed = true;
        return;
      }
      pointerOnCanvas = true;
      const pt = getCanvasPoint(e);
      pointerScreen.x = pt.x;
      pointerScreen.y = pt.y;
      pointerDirty = true;

      // Right-click or middle-click always pans camera cleanly on PC (even while a card is selected!)
      if (e.button === 2 || e.button === 1) {
        rightClickPanMoved = false;
        cam.dragging = true;
        cam.moved = false;
        cam.dragStartX = e.clientX - cam.x;
        cam.dragStartY = e.clientY - cam.y;
        return;
      }

      // WorldBox Tap-to-Place & Hold-to-Paint (left click when a card is selected)
      if (selectedDockCard && e.button === 0) {
        isPaintingWorld = true;
        const tile = screenToWorldTile(pt.x, pt.y);
        hoverTile = tile;
        if (tile) {
          placeCardOnTile(selectedDockCard, tile);
          lastPaintedTile = tile;
          lastPaintTime = performance.now();
        }
        return;
      }

      // Left-click in Hand/Pan mode: inspect animal or pan camera
      let clickedAnimal = null;
      let bestDist = 24;
      for (let i = 0; i < animals.length; i++) {
        const a = animals[i];
        const d = Math.hypot(a.screenX - pt.x, a.screenY - pt.y);
        if (d < bestDist) {
          bestDist = d;
          clickedAnimal = a;
        }
      }
      let clickedHuman = null;
      let bestHD = 24;
      for (let i = 0; i < humans.length; i++) {
        const h = humans[i];
        const d = Math.hypot(h.screenX - pt.x, h.screenY - pt.y);
        if (d < bestHD) {
          bestHD = d;
          clickedHuman = h;
        }
      }
      selectedHuman = clickedHuman === selectedHuman ? null : clickedHuman;
      selectedAnimal = clickedHuman ? null : (clickedAnimal === selectedAnimal ? null : clickedAnimal);
      cam.dragging = true;
      cam.moved = false;
      cam.dragStartX = e.clientX - cam.x;
      cam.dragStartY = e.clientY - cam.y;
    });

    window.addEventListener('pointermove', (e) => {
      if (!active || !canvas) return;
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const mid = { x: (pts[0].x + pts[1].x) * 0.5, y: (pts[0].y + pts[1].y) * 0.5 };
        if (pinchLastDist > 12 && dist > 12) {
          const factor = dist / pinchLastDist;
          cam.targetZoom = Math.min(2.65, Math.max(0.36, cam.targetZoom * factor));
          cam.zoom = cam.targetZoom;
          tutZoomed = true;
        }
        if (pinchLastMid) {
          const dx = mid.x - pinchLastMid.x;
          const dy = mid.y - pinchLastMid.y;
          cam.x += dx; cam.targetX += dx;
          cam.y += dy; cam.targetY += dy;
        }
        pinchLastDist = dist;
        pinchLastMid = mid;
        return;
      }
      const pt = getCanvasPoint(e);
      pointerScreen.x = pt.x;
      pointerScreen.y = pt.y;
      pointerDirty = true;

      // WorldBox Hold & Brush-Paint across the island canvas!
      if (isPaintingWorld && selectedDockCard) {
        const now = performance.now();
        const tile = screenToWorldTile(pt.x, pt.y);
        hoverTile = tile;
        if (tile && tile !== lastPaintedTile && now - lastPaintTime >= 140) {
          placeCardOnTile(selectedDockCard, tile);
          lastPaintedTile = tile;
          lastPaintTime = now;
        }
        return;
      }

      if (cam.dragging) {
        const nx = e.clientX - cam.dragStartX;
        const ny = e.clientY - cam.dragStartY;
        if (Math.hypot(nx - cam.x, ny - cam.y) > 4) {
          if (eventFocus) clearEventFocus(false);
          cam.moved = true;
          rightClickPanMoved = true;
        }
        cam.x = nx;
        cam.y = ny;
        cam.targetX = nx;
        cam.targetY = ny;
        fpsAccum = ISO_FRAME_STEP;
      }
    });

    function stopInteractions(e) {
      if (e && e.pointerId !== undefined) activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        pinchLastDist = 0;
        pinchLastMid = null;
      }
      isPaintingWorld = false;
      lastPaintedTile = null;
      draggingDockCard = null;
      cam.dragging = false;
    }

    window.addEventListener('pointerup', stopInteractions);
    window.addEventListener('pointercancel', stopInteractions);
    window.addEventListener('blur', stopInteractions);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selectedDockCard) {
        selectedDockCard = null;
        if (canvas) canvas.classList.remove('placing-mode');
        renderDock();
        logEvent('🖐️ Mode Geser Peta aktif.');
      }
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        if (!active) return;
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.16 : 0.86;
        cam.targetZoom = Math.min(2.5, Math.max(0.38, cam.targetZoom * factor));
        tutZoomed = true;
      },
      { passive: false }
    );
  }

  function drawMinimap() {
    if (!minimapCtx || !minimapCanvas || grid.length === 0) return;
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    minimapCtx.fillStyle = '#24575c';
    minimapCtx.fillRect(0, 0, mw, mh);
    const cellW = mw / MAP_SIZE;
    const cellH = mh / MAP_SIZE;
    for (let gz = 0; gz < MAP_SIZE; gz++) {
      for (let gx = 0; gx < MAP_SIZE; gx++) {
        const t = grid[gz][gx];
        if (t.isOceanMargin) continue;
        minimapCtx.fillStyle =
          t.type === 'water'
            ? '#52b8be'
            : t.biome === 'desert'
              ? '#cfb070'
              : t.biome === 'hills'
                ? '#8e7f67'
                : t.biome === 'peatland'
                  ? '#5e6b38'
                  : t.biome === 'swamp'
                    ? '#556539'
                    : '#7aa348';
        minimapCtx.fillRect(gx * cellW, gz * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
    minimapCtx.fillStyle = '#ffd54f';
    for (let i = 0; i < animals.length; i++) {
      const a = animals[i];
      minimapCtx.fillRect(a.gx * cellW - 1, a.gz * cellH - 1, 2.2, 2.2);
    }
  }

  global.EcoIso3D = {
    init() {
      canvas = document.getElementById('iso-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      statusLogEl = document.getElementById('iso-status-log');
      balancePctEl = document.getElementById('iso-balance-pct');
      balanceFillEl = document.getElementById('iso-balance-fill');
      popSummaryEl = document.getElementById('iso-pop-summary');
      biomeTitleEl = document.getElementById('iso-biome-title');
      cardDockEl = document.getElementById('iso-card-dock');
      advisorPctEl = document.getElementById('iso-advisor-pct');
      advisorTipEl = document.getElementById('iso-advisor-tip');
      coinValEl = document.getElementById('iso-coin-val');
      debtBadgeEl = document.getElementById('iso-debt-badge');
      loanBtnEl = document.getElementById('iso-loan-btn');
      if (loanBtnEl) loanBtnEl.addEventListener('click', requestEmergencyCoinLoan);
      pyrStatusEl = document.getElementById('iso-pyramid-status');
      pyrRows = {
        prod: { row: document.getElementById('iso-pyr-row-prod'), fill: document.getElementById('iso-pyr-fill-prod'), cnt: document.getElementById('iso-pyr-cnt-prod') },
        herb: { row: document.getElementById('iso-pyr-row-herb'), fill: document.getElementById('iso-pyr-fill-herb'), cnt: document.getElementById('iso-pyr-cnt-herb') },
        carn: { row: document.getElementById('iso-pyr-row-carn'), fill: document.getElementById('iso-pyr-fill-carn'), cnt: document.getElementById('iso-pyr-cnt-carn') },
        apex: { row: document.getElementById('iso-pyr-row-apex'), fill: document.getElementById('iso-pyr-fill-apex'), cnt: document.getElementById('iso-pyr-cnt-apex') }
      };
      reflectModalEl = document.getElementById('iso-reflect-modal');
      reflectBodyEl = document.getElementById('iso-reflect-body');
      reflectTipEl = document.getElementById('iso-reflect-tip');
      const reflectOk = document.getElementById('iso-reflect-ok');
      const reflectX = document.getElementById('iso-reflect-x');
      if (reflectOk) reflectOk.addEventListener('click', () => reflectModalEl && reflectModalEl.classList.add('hidden'));
      if (reflectX) reflectX.addEventListener('click', () => reflectModalEl && reflectModalEl.classList.add('hidden'));
      gestureHintEl = document.getElementById('iso-gesture-hint');
      yearLabelEl = document.getElementById('iso-year-label');
      civSummaryEl = document.getElementById('iso-civ-summary');
      peatBadgeEl = document.getElementById('iso-peat-badge');
      symSummaryEl = document.getElementById('iso-sym-summary');
      symCntEls = {
        mutual: document.getElementById('iso-sym-cnt-mutual'),
        commensal: document.getElementById('iso-sym-cnt-commensal'),
        parasite: document.getElementById('iso-sym-cnt-parasite'),
        amensal: document.getElementById('iso-sym-cnt-amensal')
      };
      symResetZoomBtn = document.getElementById('iso-sym-reset-zoom');
      eventPopupEl = document.getElementById('iso-event-popup');
      eventPopupIconEl = document.getElementById('iso-event-popup-icon');
      eventPopupTextEl = document.getElementById('iso-event-popup-text');
      eventPopupGoBtn = document.getElementById('iso-event-popup-go');
      eventPopupCloseBtn = document.getElementById('iso-event-popup-close');
      zoomInfoBtn = document.getElementById('iso-zoom-i-btn');
      eduModalEl = document.getElementById('iso-edu-modal');
      eduBadgeEl = document.getElementById('iso-edu-badge');
      eduTitleEl = document.getElementById('iso-edu-title');
      eduSubEl = document.getElementById('iso-edu-sub');
      eduBodyEl = document.getElementById('iso-edu-body');
      eduTipEl = document.getElementById('iso-edu-tip');
      conseqModalEl = document.getElementById('iso-conseq-modal');
      conseqBadgeEl = document.getElementById('iso-conseq-badge');
      conseqTitleEl = document.getElementById('iso-conseq-title');
      conseqBodyEl = document.getElementById('iso-conseq-body');
      conseqNextEl = document.getElementById('iso-conseq-next');
      conseqFixBtn = document.getElementById('iso-conseq-fix');
      conseqWatchBtn = document.getElementById('iso-conseq-watch');

      const closeConseq = () => {
        if (conseqModalEl) conseqModalEl.classList.add('hidden');
        consequenceTimer = 0;
      };
      if (conseqFixBtn) {
        conseqFixBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.EcoAudio && typeof window.EcoAudio.playUnlock === 'function') window.EcoAudio.playUnlock();
          const k = pendingConsequence;
          pendingConsequence = null;
          closeConseq();
          if (k && CONSEQUENCE_SCENARIOS[k] && CONSEQUENCE_SCENARIOS[k].onFix) {
            CONSEQUENCE_SCENARIOS[k].onFix();
            updateBalanceHUD();
          }
        });
      }
      if (conseqWatchBtn) {
        conseqWatchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.EcoAudio && typeof window.EcoAudio.playDrop === 'function') window.EcoAudio.playDrop();
          const k = pendingConsequence;
          pendingConsequence = null;
          closeConseq();
          if (k && CONSEQUENCE_SCENARIOS[k] && CONSEQUENCE_SCENARIOS[k].onWatch) {
            CONSEQUENCE_SCENARIOS[k].onWatch();
            updateBalanceHUD();
          }
        });
      }
      const conseqX = document.getElementById('iso-conseq-x');
      if (conseqX) {
        conseqX.addEventListener('click', (e) => {
          e.stopPropagation();
          pendingConsequence = null;
          closeConseq();
        });
      }

      if (eventPopupGoBtn) {
        eventPopupGoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.EcoAudio && typeof window.EcoAudio.playDrop === 'function') window.EcoAudio.playDrop();
          if (eventPopupEl) eventPopupEl.classList.add('hidden');
          if (!pendingAlertEvent) return;
          if (pendingAlertEvent.type === 'symbiosis') {
            focusSymbiosisEvent(pendingAlertEvent.symKind);
          } else if (pendingAlertEvent.focusOpts) {
            focusCustomWorldEvent(pendingAlertEvent.focusOpts);
          }
        });
      }
      if (eventPopupCloseBtn) {
        eventPopupCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (eventPopupEl) eventPopupEl.classList.add('hidden');
        });
      }
      if (zoomInfoBtn) {
        zoomInfoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.EcoAudio && typeof window.EcoAudio.playDrop === 'function') window.EcoAudio.playDrop();
          openEduModalForFocus();
        });
      }
      const closeEdu = (e) => {
        if (e) e.stopPropagation();
        if (eduModalEl) eduModalEl.classList.add('hidden');
      };
      const locateEdu = (e) => {
        if (e) e.stopPropagation();
        if (eduModalEl) eduModalEl.classList.add('hidden');
        if (eventFocus) {
          if (eventFocus.animal && animals.includes(eventFocus.animal)) {
            eventFocus.gx = eventFocus.animal.gx;
            eventFocus.gz = eventFocus.animal.gz;
            selectedAnimal = eventFocus.animal;
          }
          cam.targetZoom = Math.max(cam.targetZoom, 1.85);
          if (canvas) {
            const ix = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gx)));
            const iz = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(eventFocus.gz)));
            const lift = getTileLift(grid[iz] && grid[iz][ix]);
            const r = rotateCoords(eventFocus.gx, eventFocus.gz);
            const sx = (r.rx - r.rz) * (BASE_TW / 2);
            const sy = (r.rx + r.rz) * (BASE_TH / 2) - lift;
            const ch = viewH || canvas.clientHeight;
            cam.targetX = -sx * cam.targetZoom;
            cam.targetY = ch * 0.31 - sy * cam.targetZoom;
            spawnRings.push({ gx: eventFocus.gx, gz: eventFocus.gz, elev: lift, color: '#ffd54f', life: 1.4, maxLife: 1.4 });
          }
          fpsAccum = ISO_FRAME_STEP;
          logEvent(`📍 Kamera diarahkan ke lokasi: ${eventFocus.title || 'Kejadian Ekosistem'}`);
        }
      };
      const restoreAndCloseEdu = (e) => {
        if (e) e.stopPropagation();
        const kind = eventFocus && eventFocus.kind;
        const info = kind ? EVENT_ENCYCLOPEDIA[kind] : null;
        if (eduModalEl) eduModalEl.classList.add('hidden');
        if (info && info.restoreCardId) {
          const card = DOCK_CARDS.find((c) => c.id === info.restoreCardId);
          if (card) {
            guidePlayerRecovery({
              cat: card.cat || 'all',
              cardIds: [card.id],
              targetGx: eventFocus ? eventFocus.gx : MAP_SIZE * 0.5,
              targetGz: eventFocus ? eventFocus.gz : MAP_SIZE * 0.5,
              targetAnimal: eventFocus ? eventFocus.animal : null,
              targetTitle: eventFocus ? eventFocus.title : '🎯 LOKASI PEMULIHAN',
              instruction: `👉 Pilih kartu [${card.name}] yang menyala di deck bawah, lalu letakkan di titik sorotan di peta!`
            });
          }
        }
      };
      const eduX = document.getElementById('iso-edu-x');
      const eduLocate = document.getElementById('iso-edu-locate');
      const eduOk = document.getElementById('iso-edu-close');
      if (eduX) eduX.addEventListener('click', closeEdu);
      if (eduLocate) eduLocate.addEventListener('click', locateEdu);
      if (eduOk) eduOk.addEventListener('click', restoreAndCloseEdu);
      if (eduModalEl) {
        eduModalEl.addEventListener('click', (e) => {
          if (e.target === eduModalEl) closeEdu(e);
        });
      }
      document.querySelectorAll('.iso-sym-zoom-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const kind = btn.getAttribute('data-sym-zoom');
          if (window.EcoAudio && typeof window.EcoAudio.playDrop === 'function') window.EcoAudio.playDrop();
          focusSymbiosisEvent(kind);
        });
      });
      if (symResetZoomBtn) {
        symResetZoomBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearEventFocus(true);
        });
      }
      document.querySelectorAll('.iso-dock-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.iso-dock-tab').forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          dockCategory = tab.getAttribute('data-cat') || 'all';
          renderDock();
        });
      });
      setupEvents();
      generateMap();
      if (window.EcoSprites && typeof window.EcoSprites.onReady === 'function') {
        window.EcoSprites.onReady(() => renderDock());
      }
      if (typeof setTimeout === 'function') setTimeout(() => renderDock(), 600);
    },
    open() {
      if (!canvas) this.init();
      else renderDock();
      active = true;
      fpsAccum = ISO_FRAME_STEP;
      cam.x = 0;
      cam.y = 22;
      cam.targetX = 0;
      cam.targetY = 22;
      cam.zoom = 0.56;
      cam.targetZoom = 0.56;
      if (gestureHintEl && (window.innerWidth <= 900 || 'ontouchstart' in window)) {
        gestureHintEl.classList.remove('hidden');
        if (gestureHintTimer) clearTimeout(gestureHintTimer);
        gestureHintTimer = setTimeout(() => {
          if (gestureHintEl) gestureHintEl.classList.add('hidden');
        }, 3600);
      }
    },
    close() {
      active = false;
    },
    isActive() {
      return active;
    },
    zoomIn() {
      cam.targetZoom = Math.min(2.85, cam.targetZoom * 1.28);
      tutZoomed = true;
      fpsAccum = ISO_FRAME_STEP;
    },
    zoomOut() {
      cam.targetZoom = Math.max(0.38, cam.targetZoom * 0.8);
      tutZoomed = true;
      fpsAccum = ISO_FRAME_STEP;
    },
    rotateCamera() {
      cam.rot = (cam.rot + 1) % 4;
      fpsAccum = ISO_FRAME_STEP;
    },
    focusBiomeZone,
    focusSymbiosisEvent,
    openEduModalForFocus,
    toggleFoodWeb() {
      showFoodWeb = !showFoodWeb;
      fpsAccum = ISO_FRAME_STEP;
      return showFoodWeb;
    },
    toggleSimMove() {
      simMoving = !simMoving;
      fpsAccum = ISO_FRAME_STEP;
      return simMoving;
    },
    togglePause() {
      paused = !paused;
      fpsAccum = ISO_FRAME_STEP;
      return paused;
    },
    setMapMode(mode) {
      const valid = ['multi', 'grassland', 'hills', 'tropical', 'swamp', 'desert', 'peatland'];
      mapMode = valid.includes(mode) ? mode : 'multi';
      selectedDockCard = null;
      generateMap();
      if (biomeTitleEl) {
        biomeTitleEl.textContent =
          mapMode === 'multi'
            ? 'DIORAMA 6 BIOMA (3D)'
            : `${BIOME_PALETTES[mapMode].name} (3D)`;
      }
      const sel = document.getElementById('iso-mode-select');
      if (sel && sel.value !== mapMode) sel.value = mapMode;
      fpsAccum = ISO_FRAME_STEP;
      return mapMode;
    },
    cycleBiome() {
      const modes = ['multi', 'grassland', 'hills', 'tropical', 'swamp', 'desert', 'peatland'];
      const nextIdx = (modes.indexOf(mapMode) + 1) % modes.length;
      return this.setMapMode(modes[nextIdx]);
    },
    triggerDisaster,
    getTutorialState() {
      return {
        active,
        mapMode,
        placements: tutPlacements,
        zoomed: tutZoomed || Math.abs(cam.zoom - 0.56) > 0.14,
        openedInfo: tutOpenedInfo,
        sawConseq: tutSawConseq,
        peatMoisture,
        sekatCount: sekatKanalTiles.length,
        humans: humans.length,
        houses: buildingTiles.length,
        orangutans: animals.filter((a) => a.type === 'orangutan').length,
        selectedCardId: selectedDockCard ? selectedDockCard.id : null,
        guidedCardIds: guidedCardIds.slice(),
        displacedCooldown,
        lastDisplacedReason
      };
    },
    maybeTriggerBiomeDisplaced,
    getBiomeDamageRatio,
    canSpeciesMigrate,
    debugLayout,
    tick(dt) {
      if (!active) return;
      // Full 60 FPS rendering with calm 0.42x simulation speed so animals glide smoothly!
      updateIso(Math.min(dt, 0.05) * SIM_TIME_SCALE);
      renderIso();
    }
  };
})(window);
