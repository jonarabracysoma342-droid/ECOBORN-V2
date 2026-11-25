// Ecoborn V2 — Multi-Biome Simulation Engine (Padang Rumput, Tropis, Rawa, Gurun + Locked Gunung & Tundra)
(function () {
  const SAVE_PREFIX = 'ecoborn_v2_biome_';
  const ACTIVE_BIOME_KEY = 'ecoborn_v2_active_biome';
  const canvas = document.getElementById('world-canvas');
  const ctx = canvas.getContext('2d');
  const worldContainer = document.getElementById('world-container');

  // HUD elements
  const biomeSelectBtn = document.getElementById('biome-select-btn');
  const biomeIconEl = document.getElementById('biome-icon');
  const biomeTitleText = document.getElementById('biome-title-text');
  const langBtn = document.getElementById('lang-btn');
  const coinCountEl = document.getElementById('coin-count');
  const healthPercentEl = document.getElementById('health-percent');
  const healthPillBtn = document.getElementById('health-pill');
  const toastContainer = document.getElementById('toast-container');
  const speedBtn = document.getElementById('speed-btn');
  const speedLabelEl = document.getElementById('speed-label');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const soundBtn = document.getElementById('sound-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Mission elements
  const missionToggleBtn = document.getElementById('mission-toggle-btn');
  const missionBody = document.getElementById('mission-body');
  const missionStatusIcon = document.getElementById('mission-status-icon');
  const missionNameEl = document.getElementById('mission-name');
  const missionDescEl = document.getElementById('mission-desc');
  const missionDiffEl = document.getElementById('mission-diff');
  const missionRewardEl = document.getElementById('mission-reward');
  const missionProgressBar = document.getElementById('mission-progress-bar');
  const missionActionBtn = document.getElementById('mission-action-btn');

  // Deck & Drag elements
  const cardTrack = document.getElementById('card-track');
  const deckPrevBtn = document.getElementById('deck-prev');
  const deckNextBtn = document.getElementById('deck-next');
  const dragGhost = document.getElementById('drag-ghost');
  const dragGhostCanvas = document.getElementById('drag-ghost-canvas');
  const dragGhostLabel = document.getElementById('drag-ghost-label');

  // Modals
  const infoModal = document.getElementById('info-modal');
  const infoSpriteCanvas = document.getElementById('info-sprite-canvas');
  const infoTitleEl = document.getElementById('info-title');
  const infoBadgeRoleEl = document.getElementById('info-badge-role');
  const infoBadgeLevelEl = document.getElementById('info-badge-level');
  const infoDescTextEl = document.getElementById('info-desc-text');
  const infoRoleTextEl = document.getElementById('info-role-text');
  const infoCloseBtn = document.getElementById('info-close-btn');

  const healthModal = document.getElementById('health-modal');
  const modalHealthPctEl = document.getElementById('modal-health-pct');
  const ratioListEl = document.getElementById('ratio-list');
  const healthCloseBtn = document.getElementById('health-close-btn');

  const victoryModal = document.getElementById('victory-modal');
  const victoryContinueBtn = document.getElementById('victory-continue-btn');
  const victoryBiomeBtn = document.getElementById('victory-biome-btn');

  const biomeModal = document.getElementById('biome-modal');
  const biomeListEl = document.getElementById('biome-list');
  const biomeCloseBtn = document.getElementById('biome-close-btn');

  // Main Menu, Materi & Settings elements
  const mainMenuEl = document.getElementById('main-menu');
  const menuSkyCanvas = document.getElementById('menu-sky-canvas');
  const menuSkyCtx = menuSkyCanvas.getContext('2d');
  const homeMenuBtn = document.getElementById('home-menu-btn');
  const hudIsoBtn = document.getElementById('hud-iso-btn');
  const menuPlayBtn = document.getElementById('menu-play-btn');
  const menuIsoBtn = document.getElementById('menu-iso-btn');
  const menuBiokartBtn = document.getElementById('menu-biokart-btn');
  const biokartModal = document.getElementById('biokart-modal');
  const biokartFrame = document.getElementById('biokart-frame');
  const biokartCloseBtn = document.getElementById('biokart-close-btn');
  const menuMateriBtn = document.getElementById('menu-materi-btn');
  const menuSettingsBtn = document.getElementById('menu-settings-btn');
  const menuSoundBtn = document.getElementById('menu-sound-btn');
  const menuAboutBtn = document.getElementById('menu-about-btn');

  const isoModal = document.getElementById('iso-modal');
  const isoWebBtn = document.getElementById('iso-web-btn');
  const isoSimToggleBtn = document.getElementById('iso-sim-toggle-btn');
  const isoSimIcon = document.getElementById('iso-sim-icon');
  const isoSimText = document.getElementById('iso-sim-text');
  const isoDisasterToggleBtn = document.getElementById('iso-disaster-toggle-btn');
  const isoDisasterPopover = document.getElementById('iso-disaster-popover');
  const isoBiomeCycleBtn = document.getElementById('iso-biome-cycle-btn');
  const isoZoomInMapBtn = document.getElementById('iso-zoom-in-btn');
  const isoZoomOutMapBtn = document.getElementById('iso-zoom-out-btn');
  const isoRotMapBtn = document.getElementById('iso-rot-map-btn');
  const isoPauseBtn = document.getElementById('iso-pause-btn');
  const isoPauseIcon = document.getElementById('iso-pause-icon');
  const isoSoundBtn = document.getElementById('iso-sound-btn');
  const isoSoundIcon = document.getElementById('iso-sound-icon');
  const isoCloseBtn = document.getElementById('iso-close-btn');

  const materiModal = document.getElementById('materi-modal');
  const materiCloseBtn = document.getElementById('materi-close-btn');
  const bookIllustCanvas = document.getElementById('book-illust-canvas');
  const bookIllustCtx = bookIllustCanvas.getContext('2d');
  const bookControlsEl = document.getElementById('book-interactive-controls');
  const bookChapterNumEl = document.getElementById('book-chapter-num');
  const bookTitleEl = document.getElementById('book-title');
  const bookBodyTextEl = document.getElementById('book-body-text');
  const bookInspectBoxEl = document.getElementById('book-inspect-box');
  const bookPrevBtn = document.getElementById('book-prev-btn');
  const bookNextBtn = document.getElementById('book-next-btn');
  const bookPageIndicator = document.getElementById('book-page-indicator');
  const settingsModal = document.getElementById('settings-modal');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const setSoundToggle = document.getElementById('set-sound-toggle');
  const setLangToggle = document.getElementById('set-lang-toggle');
  const setResetBtn = document.getElementById('set-reset-btn');

  let menuVisible = true;
  const menuEagle = { x: 110, y: 68, vx: 42, facing: 1, animTime: 0 };
  const menuFrog = { animTime: 0 };
  const menuHopper = { animTime: 0.7 };

  // World dimensions
  let W = 400;
  let H = 560;
  const WORLD_W = 1000;
  let cameraX = 0;
  let groundY = 390;
  const GRASS_SLOTS = 20;
  const MAX_ANIMALS = 20;

  // Background images per biome
  const bgCache = {};
  function getBiomeBg(biome) {
    if (!biome.bg) return null;
    if (!bgCache[biome.id]) {
      const img = new Image();
      const entry = { img, loaded: false };
      img.onload = () => {
        entry.loaded = true;
      };
      img.src = biome.bg;
      bgCache[biome.id] = entry;
    }
    return bgCache[biome.id];
  }

  // Realistic food-chain size hierarchy across all biomes
  const ANIMAL_RENDER_SIZE = {
    hopper: 36,
    water_bug: 36,
    sand_mouse: 40,
    rabbit: 44,
    frog: 48,
    snake: 70,
    tropical_snake: 70,
    water_snake: 70,
    desert_snake: 70,
    eagle: 96,
    desert_eagle: 96,
    heron: 94
  };

  const ANIMAL_GROUND_OFFSET = {
    hopper: 9,
    water_bug: 9,
    sand_mouse: 8,
    rabbit: 8,
    frog: 11,
    snake: 15,
    tropical_snake: 15,
    water_snake: 15,
    desert_snake: 15,
    eagle: 14,
    desert_eagle: 14,
    heron: 14
  };

  function isFlyingType(type) {
    return type === 'eagle' || type === 'desert_eagle' || type === 'heron';
  }

  function defaultState(biomeId = 'grassland', lang = 'id') {
    const biome = window.BIOMES[biomeId] || window.BIOMES.grassland;
    const unlocked = {};
    const speciesFed = {};
    biome.cards.forEach((c) => {
      unlocked[c.id] = Boolean(c.unlockedByDefault);
    });
    biome.chainOrder.slice(1).forEach((k) => {
      speciesFed[k] = false;
    });

    return {
      biomeId: biome.id,
      lang,
      coins: 55,
      coinFrac: 0,
      paused: false,
      speed: 1,
      cloudsPlaced: 0,
      merges: 0,
      mealsTotal: 0,
      hadAnimals: false,
      speciesFed,
      victoryShown: false,
      unlocked,
      missionIndex: 0,
      missionAccepted: false,
      clouds: [],
      grassSlots: [],
      animals: [],
      mushrooms: [],
      raindrops: [],
      particles: [],
      naturalCloudTimer: 6,
      autoSpawnTimer: 5,
      sporeSpawnTimer: 3,
      saveTimer: 0
    };
  }

  let state = defaultState();
  let draggingCard = null;
  let draggingCloud = null;
  let draggingAnimal = null;
  let draggingMushroom = null;
  let panningCamera = false;
  let panLastScreenX = 0;
  let pointerPos = { x: 0, y: 0 };

  function getBiome() {
    return window.BIOMES[state.biomeId] || window.BIOMES.grassland;
  }

  function getCardCost(card) {
    if (!card.buyable) return 0;
    return Math.max(1, Math.round(card.baseCost * getBiome().costMultiplier));
  }

  function t(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[state.lang] || obj.id || '';
  }

  function resizeCanvas() {
    const rect = worldContainer.getBoundingClientRect();
    const isSmall = rect.width <= 540;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);
    W = Math.max(280, Math.floor(rect.width));
    H = Math.max(320, Math.floor(rect.height));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = Math.floor(H * 0.795);

    const margin = 34;
    const usable = WORLD_W - margin * 2;
    state.grassSlots.forEach((slot, i) => {
      slot.x = margin + (usable / (GRASS_SLOTS - 1)) * i;
    });
    state.animals.forEach((a) => {
      if (!isFlyingType(a.type)) {
        a.y = groundY;
        a.baseY = groundY;
      }
    });
    state.mushrooms.forEach((m) => {
      m.y = groundY + 2;
    });
    cameraX = Math.min(Math.max(cameraX, 0), Math.max(0, WORLD_W - W));
  }

  function saveProgress() {
    try {
      localStorage.setItem(ACTIVE_BIOME_KEY, state.biomeId);
      const payload = {
        biomeId: state.biomeId,
        lang: state.lang,
        coins: state.coins,
        cloudsPlaced: state.cloudsPlaced,
        merges: state.merges,
        mealsTotal: state.mealsTotal,
        hadAnimals: state.hadAnimals,
        speciesFed: state.speciesFed,
        victoryShown: state.victoryShown,
        unlocked: state.unlocked,
        missionIndex: state.missionIndex,
        missionAccepted: state.missionAccepted,
        grassSlots: state.grassSlots.map((s) => ({
          stage: s.stage,
          growth: s.growth,
          hasSpore: Boolean(s.hasSpore)
        })),
        animals: state.animals.map((a) => ({
          type: a.type,
          x: a.x,
          y: a.y,
          mealsEaten: a.mealsEaten,
          fullTimer: a.fullTimer,
          starveTimer: a.starveTimer
        }))
      };
      localStorage.setItem(SAVE_PREFIX + state.biomeId, JSON.stringify(payload));
    } catch (_) { }
  }

  function loadProgress(biomeId) {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + biomeId);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.grassSlots)) return false;

      state.lang = saved.lang || state.lang || 'id';
      state.coins = typeof saved.coins === 'number' ? saved.coins : 55;
      state.cloudsPlaced = saved.cloudsPlaced || 0;
      state.merges = saved.merges || 0;
      state.mealsTotal = saved.mealsTotal || 0;
      state.hadAnimals = Boolean(saved.hadAnimals);
      state.speciesFed = Object.assign(state.speciesFed, saved.speciesFed || {});
      state.victoryShown = Boolean(saved.victoryShown);
      state.unlocked = Object.assign(state.unlocked, saved.unlocked || {});
      state.missionIndex = saved.missionIndex || 0;
      state.missionAccepted = Boolean(saved.missionAccepted);

      saved.grassSlots.forEach((gs, i) => {
        if (state.grassSlots[i]) {
          state.grassSlots[i].stage = gs.stage || 0;
          state.grassSlots[i].growth = gs.growth || 0;
          state.grassSlots[i].hasSpore = Boolean(gs.hasSpore);
        }
      });

      state.animals = [];
      (saved.animals || []).forEach((sa) => {
        const yPos = isFlyingType(sa.type) ? sa.y : groundY;
        const a = createAnimal(sa.type, sa.x, yPos);
        a.mealsEaten = sa.mealsEaten || 0;
        a.fullTimer = sa.fullTimer || 0;
        a.starveTimer = sa.starveTimer || 0;
        state.animals.push(a);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function initWorld(ignoreSave = false, targetBiomeId = null) {
    const savedBiome = targetBiomeId || localStorage.getItem(ACTIVE_BIOME_KEY) || 'grassland';
    const currentLang = state ? state.lang : 'id';
    state = defaultState(savedBiome, currentLang);
    const biome = getBiome();

    state.grassSlots = [];
    for (let i = 0; i < GRASS_SLOTS; i++) {
      state.grassSlots.push({
        index: i,
        x: 0,
        stage: 0,
        growth: 0,
        hasSpore: biome.weatherType === 'sun' && i % 3 === 1
      });
    }
    resizeCanvas();

    const loaded = !ignoreSave && loadProgress(state.biomeId);
    cameraX = Math.floor((WORLD_W - W) / 2);
    if (!loaded) {
      const startClouds = biome.cloudsToMerge;
      for (let c = 0; c < startClouds; c++) {
        spawnCloud(WORLD_W * (0.38 + c * 0.08), H * (0.20 + (c % 2) * 0.06), false);
      }
    } else if (state.clouds.length === 0) {
      spawnCloud(WORLD_W * 0.5, H * 0.22, false);
    }

    getBiomeBg(biome);
    applyLanguage();
    renderDeck();
    updateHUD();
    updateMissionUI();
  }

  function createAnimal(type, x, y) {
    const flying = isFlyingType(type);
    const spawnY = flying ? Math.min(Math.max(y, 64), groundY - 95) : groundY;
    return {
      id: Math.random(),
      type,
      x: Math.min(Math.max(x, 24), WORLD_W - 24),
      y: spawnY,
      baseY: spawnY,
      vx: (Math.random() > 0.5 ? 1 : -1) * getSpeed(type),
      facing: 1,
      mealsEaten: 0,
      fullTimer: 0,
      starveTimer: 0,
      eatingTarget: null,
      eatProgress: 0,
      hopPhase: Math.random() * Math.PI * 2,
      animState: 'move',
      animTime: Math.random() * 2,
      idleTimer: 0,
      moveTimer: 2 + Math.random() * 2,
      confusedTimer: 0,
      vy: 0
    };
  }

  function spawnCloud(x, y, isStorm = false) {
    state.clouds.push({
      id: Math.random(),
      x,
      y: Math.min(Math.max(y, 44), groundY - 90),
      vx: (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 10),
      isStorm, // true = Rain Cloud OR Sun Cloud (in Swamp)
      life: isStorm ? 9.0 : 40,
      rainTimer: 0
    });
  }

  function spawnAnimal(type, x, y) {
    if (state.animals.length >= MAX_ANIMALS) return null;
    const a = createAnimal(type, x, y);
    state.hadAnimals = true;
    state.animals.push(a);
    return a;
  }

  function spawnMushroom(x) {
    state.mushrooms.push({
      id: Math.random(),
      x: Math.min(Math.max(x, 24), WORLD_W - 24),
      y: groundY + 2,
      life: 16,
      pulseTimer: 0
    });
    if (state.unlocked.mushroom !== undefined && !state.unlocked.mushroom) {
      state.unlocked.mushroom = true;
      showToast(state.lang === 'en' ? '🔓 Decomposer card unlocked!' : '🔓 Kartu JAMUR terbuka!');
      renderDeck();
    }
  }

  function getSpeed(type) {
    if (isFlyingType(type)) return 54;
    if (type === 'frog' || type === 'rabbit' || type === 'sand_mouse') return 40;
    return 33;
  }

  function addFloatingParticle(x, y, text, color = '#ffd54f') {
    state.particles.push({
      x,
      y,
      vy: -28,
      text,
      color,
      life: 1.25,
      maxLife: 1.25
    });
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-pill';
    el.textContent = msg;
    toastContainer.appendChild(el);
    while (toastContainer.children.length > 3) {
      toastContainer.removeChild(toastContainer.firstChild);
    }
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  function getCounts() {
    const biome = getBiome();
    const prodKey = biome.chainOrder[0];
    const counts = {
      producer: state.grassSlots.filter((s) => s.stage >= 1).length
    };
    counts[prodKey] = counts.producer;
    biome.chainOrder.slice(1).forEach((k) => {
      counts[k] = 0;
    });
    for (const a of state.animals) {
      if (counts[a.type] !== undefined) counts[a.type]++;
    }
    return counts;
  }

  function calcRawHealth(counts) {
    const ratios = getBiome().idealRatios;
    if (!ratios || ratios.length === 0) return 20;
    let scoreSum = 0;
    for (const item of ratios) {
      const actual = counts[item.key] || 0;
      const ratio = actual / item.ideal;
      const itemScore = ratio <= 1 ? ratio : Math.max(0.25, 1 - (ratio - 1) * 0.45);
      scoreSum += itemScore;
    }
    return Math.round((scoreSum / ratios.length) * 100);
  }

  function calcHealth(counts) {
    return Math.max(20, calcRawHealth(counts));
  }

  function addCoins(amount, x, y) {
    state.coins += amount;
    window.EcoAudio.playCoin();
    if (x !== undefined && y !== undefined) {
      addFloatingParticle(x, y - 16, `+${amount} 🪙`, '#ffe066');
    }
    updateHUD();
    renderDeck();
  }

  function unlockCard(cardId) {
    if (!cardId || state.unlocked[cardId]) return;
    state.unlocked[cardId] = true;
    const card = getBiome().cards.find((c) => c.id === cardId);
    window.EcoAudio.playUnlock();
    if (card) {
      showToast(
        state.lang === 'en'
          ? `🔓 ${t(card.name)} card unlocked!`
          : `🔓 Kartu ${t(card.name)} terbuka!`
      );
    }
    renderDeck();
  }

  function checkProgressionAndCollapse() {
    const biome = getBiome();
    const counts = getCounts();
    const rawHealth = calcRawHealth(counts);
    const prodKey = biome.chainOrder[0];
    const herbKey = biome.chainOrder[1];

    if (counts.producer >= 1) unlockCard(prodKey);
    if (counts.producer >= 2) unlockCard(herbKey);

    if (state.hadAnimals && rawHealth < 10 && state.animals.length === 0) {
      showToast(
        state.lang === 'en'
          ? '💥 Ecosystem collapsed! Restarting...'
          : '💥 Ekosistem runtuh! Memulai ulang...'
      );
      localStorage.removeItem(SAVE_PREFIX + state.biomeId);
      initWorld(true, state.biomeId);
      return;
    }

    const allUnlocked = biome.cards.every((c) => state.unlocked[c.id]);
    const allFed = biome.chainOrder.slice(1).every((k) => state.speciesFed[k]);

    if (!state.victoryShown && allUnlocked && allFed) {
      state.victoryShown = true;
      window.EcoAudio.playUnlock();
      victoryModal.classList.remove('hidden');
      saveProgress();
    }
  }

  function update(rawDt) {
    if (state.paused) return;
    const dt = Math.min(rawDt, 0.05) * state.speed;
    const biome = getBiome();
    const counts = getCounts();
    const health = calcHealth(counts);

    // Passive coin income: health * biome coin rate
    state.coinFrac += (health / 100) * biome.coinRate * dt;
    if (state.coinFrac >= 1) {
      const whole = Math.floor(state.coinFrac);
      state.coinFrac -= whole;
      state.coins += whole;
      renderDeck();
    }

    state.saveTimer += dt;
    if (state.saveTimer >= 4) {
      state.saveTimer = 0;
      saveProgress();
    }

    // Swamp natural Spore spawning on empty slots
    if (biome.weatherType === 'sun') {
      state.sporeSpawnTimer -= dt;
      if (state.sporeSpawnTimer <= 0) {
        state.sporeSpawnTimer = 5.5;
        const emptySlots = state.grassSlots.filter((s) => s.stage === 0 && !s.hasSpore);
        if (emptySlots.length > 0) {
          const pick = emptySlots[Math.floor(Math.random() * emptySlots.length)];
          pick.hasSpore = true;
          addFloatingParticle(pick.x, groundY - 14, '✨ Spora', '#a7ffeb');
        }
      }
    }

    // 1. Natural white cloud spawn
    state.naturalCloudTimer -= dt;
    if (state.naturalCloudTimer <= 0) {
      state.naturalCloudTimer = 10;
      const whiteCount = state.clouds.filter((c) => !c.isStorm).length;
      if (whiteCount < biome.cloudsToMerge + 2) {
        spawnCloud(40 + Math.random() * (WORLD_W - 80), 65 + Math.random() * (groundY - 190), false);
      }
    }

    // 2. Clouds movement & weather particles (Rain OR Sunbeams)
    for (let i = state.clouds.length - 1; i >= 0; i--) {
      const c = state.clouds[i];
      if (draggingCloud !== c) {
        c.x += c.vx * dt;
        if (c.x < 30 || c.x > WORLD_W - 30) {
          c.vx *= -1;
          c.x = Math.min(Math.max(c.x, 30), WORLD_W - 30);
        }
      }
      c.life -= dt;

      if (c.isStorm) {
        c.rainTimer -= dt;
        if (c.rainTimer <= 0) {
          c.rainTimer = 0.08;
          state.raindrops.push({
            x: c.x + (Math.random() - 0.5) * 48,
            y: c.y + 18,
            vy: biome.weatherType === 'sun' ? 190 : 245,
            isSun: biome.weatherType === 'sun'
          });
        }
      }

      if (c.life <= 0) state.clouds.splice(i, 1);
    }

    window.EcoAudio.setRaining(
      biome.weatherType === 'rain' && state.clouds.some((c) => c.isStorm)
    );

    // Check cloud merging (2 clouds normal/swamp, 4 clouds in Desert!)
    const needed = biome.cloudsToMerge || 2;
    const whiteClouds = state.clouds.filter((c) => !c.isStorm);
    if (whiteClouds.length >= needed) {
      for (let i = 0; i < whiteClouds.length; i++) {
        const anchor = whiteClouds[i];
        const cluster = whiteClouds.filter(
          (other) => Math.hypot(other.x - anchor.x, other.y - anchor.y) < (needed >= 4 ? 76 : 48)
        );
        if (cluster.length >= needed) {
          const toMerge = cluster.slice(0, needed);
          let mx = 0;
          let my = 0;
          toMerge.forEach((mc) => {
            mx += mc.x;
            my += mc.y;
            if (draggingCloud === mc) draggingCloud = null;
            const idx = state.clouds.indexOf(mc);
            if (idx !== -1) state.clouds.splice(idx, 1);
          });
          mx /= needed;
          my /= needed;
          spawnCloud(mx, my, true);
          state.merges++;
          window.EcoAudio.playMerge();
          if (biome.weatherType === 'sun') {
            addFloatingParticle(mx, my - 10, '🌤️', '#ffee58');
            showToast(
              state.lang === 'en'
                ? '☀️ Clouds merged into a Sun Cloud!'
                : '☀️ 2 Awan bergabung menjadi Awan Matahari!'
            );
          } else {
            addFloatingParticle(mx, my - 10, '⛈️', '#fff');
            showToast(
              state.lang === 'en'
                ? `🌧️ ${needed} Clouds merged into a Rain Cloud!`
                : `🌧️ ${needed} Awan bergabung menjadi Awan Hujan!`
            );
          }
          break;
        }
      }
    }

    // 3. Raindrops / Sunbeams -> grow producer stages 1 -> 2 -> 3
    for (let i = state.raindrops.length - 1; i >= 0; i--) {
      const r = state.raindrops[i];
      r.y += r.vy * dt;
      if (r.y >= groundY) {
        let nearest = null;
        let bestDist = 38;
        for (const slot of state.grassSlots) {
          const d = Math.abs(slot.x - r.x);
          if (d < bestDist) {
            bestDist = d;
            nearest = slot;
          }
        }
        if (nearest && nearest.stage < 3) {
          // In Swamp, sunbeams require a Spore (or already stage >= 1) to grow Water Moss
          const canGrow =
            biome.weatherType !== 'sun' || nearest.hasSpore || nearest.stage >= 1;
          if (canGrow) {
            nearest.growth += 0.34;
            if (nearest.growth >= 1) {
              nearest.hasSpore = false;
              nearest.stage = Math.min(3, nearest.stage + 1);
              nearest.growth = 0;
              const pEmoji = biome.idealRatios[0] ? biome.idealRatios[0].emoji : '🌱';
              addFloatingParticle(nearest.x, groundY - 22, `${pEmoji}${nearest.stage}`, '#8ce05a');
            }
          }
        }
        state.raindrops.splice(i, 1);
      }
    }

    // 4. Mushrooms (Decomposer) boost nearby producer
    for (let i = state.mushrooms.length - 1; i >= 0; i--) {
      const m = state.mushrooms[i];
      m.life -= dt;
      m.pulseTimer -= dt;
      if (m.pulseTimer <= 0) {
        m.pulseTimer = 4;
        const slot = state.grassSlots.find((s) => s.stage < 3 && Math.abs(s.x - m.x) < 95);
        if (slot) {
          slot.hasSpore = false;
          slot.stage = Math.min(3, slot.stage + 1);
          addFloatingParticle(slot.x, groundY - 22, '🍄→🌱', '#8ce05a');
        }
      }
      if (m.life <= 0) state.mushrooms.splice(i, 1);
    }

    // 5. Auto-spawn animals along the biome's food chain when prey is sufficient
    state.autoSpawnTimer -= dt;
    if (state.autoSpawnTimer <= 0) {
      state.autoSpawnTimer = 5.5;
      const cap = Math.min(MAX_ANIMALS, Math.max(4, Math.round((health / 100) * MAX_ANIMALS)));
      if (state.animals.length < cap) {
        const order = biome.chainOrder;
        for (let k = 1; k < order.length; k++) {
          const preyKey = order[k - 1];
          const predKey = order[k];
          const preyCount = counts[preyKey] || 0;
          const predCount = counts[predKey] || 0;
          const reqPrey = k === 1 ? 3 : 2;
          const maxAuto = k === order.length - 1 ? 1 : Math.max(1, Math.floor(preyCount / 2));
          if (preyCount >= reqPrey && predCount < maxAuto) {
            unlockCard(predKey);
            const cardDef = biome.cards.find((c) => c.id === predKey);
            const spawnY = isFlyingType(predKey) ? groundY - 120 : groundY;
            spawnAnimal(predKey, 60 + Math.random() * (WORLD_W - 120), spawnY);
            if (cardDef) {
              showToast(
                state.lang === 'en'
                  ? `${cardDef.emoji} ${t(cardDef.name)} appeared naturally!`
                  : `${cardDef.emoji} ${t(cardDef.name)} muncul alami!`
              );
            }
            break;
          }
        }
      }
    }

    // 6. Animals AI
    for (let i = state.animals.length - 1; i >= 0; i--) {
      const a = state.animals[i];
      a.hopPhase += dt * 7;
      a.animTime += dt;

      if (draggingAnimal === a) {
        a.animState = isFlyingType(a.type) ? 'move' : 'idle';
        a.eatingTarget = null;
        a.eatProgress = 0;
        continue;
      }

      if (!isFlyingType(a.type) && a.y < groundY) {
        a.vy += 680 * dt;
        a.y = Math.min(groundY, a.y + a.vy * dt);
        if (a.y >= groundY) a.vy = 0;
        continue;
      }

      if (a.confusedTimer > 0) {
        a.confusedTimer = Math.max(0, a.confusedTimer - dt);
        a.animState = isFlyingType(a.type) ? 'move' : 'idle';
        a.facing = Math.floor(a.confusedTimer * 4) % 2 === 0 ? 1 : -1;
        continue;
      }

      if (a.fullTimer > 0) {
        a.fullTimer = Math.max(0, a.fullTimer - dt);
        if (a.fullTimer === 0) a.mealsEaten = 0;
        wanderAnimal(a, dt);
        continue;
      }

      if (!a.eatingTarget) {
        a.starveTimer += dt;
        if (a.starveTimer >= 60) {
          const deadX = a.x;
          state.animals.splice(i, 1);
          spawnMushroom(deadX);
          addFloatingParticle(deadX, groundY - 24, '🍄', '#ef5350');
          continue;
        }
      }

      const chainIdx = biome.chainOrder.indexOf(a.type);
      const isHerbivore = chainIdx === 1;

      if (a.eatingTarget) {
        const stillValid = isHerbivore
          ? a.eatingTarget.stage >= 1
          : state.animals.includes(a.eatingTarget);

        if (!stillValid) {
          a.eatingTarget = null;
          a.eatProgress = 0;
          continue;
        }

        a.animState = isFlyingType(a.type) ? 'move' : 'idle';
        a.eatProgress += dt / 2.0;
        if (a.eatProgress >= 1) {
          if (isHerbivore) {
            a.eatingTarget.stage = Math.max(0, a.eatingTarget.stage - 1);
            a.eatingTarget.growth = 0;
          } else {
            const pIdx = state.animals.indexOf(a.eatingTarget);
            if (pIdx !== -1) {
              state.animals.splice(pIdx, 1);
              if (pIdx < i) i--;
            }
          }

          // Unlock next predator in chain
          if (chainIdx >= 1 && chainIdx + 1 < biome.chainOrder.length) {
            unlockCard(biome.chainOrder[chainIdx + 1]);
          }

          a.eatingTarget = null;
          a.eatProgress = 0;
          a.starveTimer = 0;
          a.mealsEaten++;
          state.mealsTotal++;
          state.speciesFed[a.type] = true;

          window.EcoAudio.playEat(isFlyingType(a.type) ? 'eagle' : isHerbivore ? 'hopper' : 'frog');
          // +1 for herbivore up to +4 for apex predator
          const reward =
            chainIdx === biome.chainOrder.length - 1
              ? 4
              : Math.min(4, Math.max(1, chainIdx));
          addCoins(reward, a.x, a.y);

          if (a.mealsEaten >= 3) {
            a.fullTimer = 30;
            addFloatingParticle(a.x, a.y - 34, '😋 30s', '#a6f065');
          }
        }
        continue;
      }

      const target = findPrey(a, biome, chainIdx);
      if (target) {
        a.animState = 'move';
        const dx = target.x - a.x;
        const speed = getSpeed(a.type) * 1.45;
        a.facing = dx >= 0 ? 1 : -1;
        a.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);

        if (isFlyingType(a.type)) {
          const targetY = Math.abs(dx) < 55 ? groundY - 12 : a.baseY;
          a.y += (targetY - a.y) * Math.min(1, dt * 4);
        }

        if (Math.abs(dx) < 16) {
          a.eatingTarget = target;
          a.eatProgress = 0;
        }
      } else {
        wanderAnimal(a, dt);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    checkProgressionAndCollapse();
    updateHUD();
    updateMissionUI();
  }

  function wanderAnimal(a, dt) {
    if (isFlyingType(a.type)) {
      a.animState = 'move';
      a.x += a.vx * dt;
      if (a.x < 24 || a.x > WORLD_W - 24) {
        a.vx *= -1;
        a.x = Math.min(Math.max(a.x, 24), WORLD_W - 24);
      }
      a.facing = a.vx >= 0 ? 1 : -1;
      a.y += (a.baseY + Math.sin(a.hopPhase * 0.4) * 12 - a.y) * Math.min(1, dt * 3);
      return;
    }

    if (a.idleTimer > 0) {
      a.idleTimer -= dt;
      a.animState = 'idle';
    } else {
      a.animState = 'move';
      a.moveTimer -= dt;
      if (a.moveTimer <= 0) {
        a.idleTimer = 1.6 + Math.random() * 1.6;
        a.moveTimer = 2.2 + Math.random() * 2.5;
      }
      a.x += a.vx * dt;
      if (a.x < 24 || a.x > WORLD_W - 24) {
        a.vx *= -1;
        a.x = Math.min(Math.max(a.x, 24), WORLD_W - 24);
      }
      a.facing = a.vx >= 0 ? 1 : -1;
    }
  }

  function findPrey(a, biome, chainIdx) {
    if (chainIdx <= 0) return null;
    if (chainIdx === 1) return findNearestProducer(a.x);
    return findNearestAnimal(a.x, biome.chainOrder[chainIdx - 1]);
  }

  function findNearestProducer(x) {
    let best = null;
    let bestD = Infinity;
    for (const s of state.grassSlots) {
      if (s.stage < 1) continue;
      const d = Math.abs(s.x - x);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  function findNearestAnimal(x, type) {
    let best = null;
    let bestD = Infinity;
    for (const a of state.animals) {
      if (a.type !== type) continue;
      const d = Math.abs(a.x - x);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    return best;
  }

  function drawSprite(sprite, x, y, scaleFactor = 1) {
    if (!sprite) return;
    const dw = (sprite._displaySize || sprite.width) * scaleFactor;
    const dh = (sprite._displaySize || sprite.height) * scaleFactor;
    ctx.save();
    ctx.imageSmoothingEnabled = Boolean(sprite._displaySize);
    if (sprite._displaySize) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, Math.floor(x - dw / 2), Math.floor(y - dh + 14), dw, dh);
    ctx.restore();
  }

  function render() {
    if (menuVisible) {
      renderMainMenuCanvas();
      renderBookIllustration();
      return;
    }
    ctx.imageSmoothingEnabled = false;
    const biome = getBiome();
    const bgEntry = getBiomeBg(biome);

    ctx.save();
    ctx.translate(-cameraX, 0);

    if (bgEntry && bgEntry.loaded) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const imgAspect = bgEntry.img.width / bgEntry.img.height;
      const drawW = Math.max(WORLD_W, H * imgAspect);
      ctx.drawImage(bgEntry.img, 0, 0, drawW, H);
      ctx.restore();
    } else {
      const fb = biome.fallbackColors || { skyTop: '#c8ebea', skyBot: '#f6f3d8', ground: '#6ec23c', soil: '#8b5428' };
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, fb.skyTop);
      skyGrad.addColorStop(1, fb.skyBot);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WORLD_W, groundY);
      ctx.fillStyle = fb.ground;
      ctx.fillRect(0, groundY - 8, WORLD_W, 24);
      ctx.fillStyle = fb.soil;
      ctx.fillRect(0, groundY + 16, WORLD_W, H - groundY - 16);
    }

    // Drifting ambient particles
    const timeNow = performance.now() * 0.001;
    for (let i = 0; i < 14; i++) {
      const lx = ((i * 93 + timeNow * (16 + (i % 3) * 5)) % (WORLD_W + 20)) - 10;
      const ly = 65 + ((i * 47 + Math.sin(timeNow * 1.4 + i) * 18) % (groundY - 95));
      ctx.fillStyle = biome.id === 'desert' ? '#ffe082' : i % 2 === 0 ? '#80dc4e' : '#f48fb1';
      ctx.fillRect(Math.floor(lx), Math.floor(ly), 4, 3);
    }

    if (draggingCard) {
      ctx.save();
      ctx.fillStyle = 'rgba(103, 212, 63, 0.18)';
      if (draggingCard.zone === 'sky') ctx.fillRect(0, 0, WORLD_W, groundY - 24);
      else ctx.fillRect(0, groundY - 36, WORLD_W, 60);
      ctx.restore();
    }

    // Producer slots (Grass / Water Moss / Cactus + Swamp Spores)
    const prodKey = biome.chainOrder[0];
    const prodSprite = window.EcoSprites.get(prodKey, 3);
    const sporeSprite = window.EcoSprites.get('spore', 3);
    for (const slot of state.grassSlots) {
      if (slot.stage >= 1 && prodSprite) {
        const sScale = slot.stage === 1 ? 0.52 : slot.stage === 2 ? 0.76 : 1.0;
        drawSprite(prodSprite, slot.x, groundY, sScale);
      } else if (slot.hasSpore && sporeSprite) {
        drawSprite(sporeSprite, slot.x, groundY, 0.85);
      }
    }

    // Mushrooms
    const mushSprite = window.EcoSprites.get('mushroom', 2);
    for (const m of state.mushrooms) {
      if (mushSprite) drawSprite(mushSprite, m.x, m.y, 1);
    }

    // Animals
    for (const a of state.animals) {
      const anim = window.EcoSprites.getAnimFrame(a.type, a.animState, a.animTime);
      const sz = ANIMAL_RENDER_SIZE[a.type] || 52;
      const gOff = ANIMAL_GROUND_OFFSET[a.type] || 11;
      const dw = sz;
      const dh = sz;
      const bounce =
        (a.type === 'rabbit' || a.type === 'sand_mouse') && a.animState === 'move'
          ? Math.abs(Math.sin(a.hopPhase)) * 7
          : 0;
      const drawX = Math.floor(a.x);
      const drawY = Math.floor(a.y - dh + gOff - bounce);

      if (anim) {
        ctx.save();
        if (anim.filter) ctx.filter = anim.filter;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.translate(drawX, drawY + dh / 2);
        if (draggingAnimal === a) {
          ctx.rotate(Math.sin(performance.now() * 0.018) * 0.22);
        }
        ctx.scale(a.facing, 1);
        ctx.drawImage(anim.img, anim.sx, anim.sy, anim.sw, anim.sh, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else {
        const sprite = window.EcoSprites.get(a.type, 3);
        if (sprite) {
          ctx.save();
          ctx.translate(drawX, drawY + dh / 2);
          if (draggingAnimal === a) {
            ctx.rotate(Math.sin(performance.now() * 0.018) * 0.22);
          }
          ctx.scale(a.facing, 1);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        }
      }

      if (draggingAnimal === a || a.confusedTimer > 0) {
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(draggingAnimal === a ? '😵❓' : '❓', a.x, drawY - 5);
      } else if (a.eatingTarget) {
        const barW = 34;
        const barH = 5;
        const bx = Math.floor(a.x - barW / 2);
        const by = drawY - 6;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
        ctx.fillStyle = '#67d43f';
        ctx.fillRect(bx, by, Math.floor(barW * Math.min(1, a.eatProgress)), barH);
      } else if (a.fullTimer > 0) {
        ctx.font = 'bold 11px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2e7d32';
        ctx.fillText('😋', a.x, drawY - 4);
      }
    }

    // Raindrops OR Golden Sunbeams (Swamp)
    for (const r of state.raindrops) {
      if (r.isSun) {
        ctx.fillStyle = 'rgba(255, 238, 88, 0.85)';
        ctx.fillRect(Math.floor(r.x), Math.floor(r.y), 3, 10);
      } else {
        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(Math.floor(r.x), Math.floor(r.y), 2, 7);
      }
    }

    // Clouds (White Cloud, Storm Rain Cloud, or Swamp Sun Cloud)
    for (const c of state.clouds) {
      const sprKey = !c.isStorm ? 'cloud' : biome.weatherType === 'sun' ? 'sun_cloud' : 'storm';
      const sprite = window.EcoSprites.get(sprKey, 4);
      if (!sprite) continue;
      const dw = sprite._displaySize || sprite.width;
      const dh = sprite._displaySize || sprite.height;
      ctx.save();
      ctx.imageSmoothingEnabled = Boolean(sprite._displaySize);
      if (sprite._displaySize) ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sprite, Math.floor(c.x - dw / 2), Math.floor(c.y - dh / 2), dw, dh);
      ctx.restore();
    }

    // Floating particles
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = '#2b1a10';
      ctx.fillText(p.text, p.x + 1, p.y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (WORLD_W > W) {
      const trackW = 90;
      const thumbW = Math.max(22, (W / WORLD_W) * trackW);
      const tx = (W - trackW) / 2;
      const thumbX = tx + (cameraX / (WORLD_W - W)) * (trackW - thumbW);
      ctx.fillStyle = 'rgba(56, 37, 26, 0.25)';
      ctx.fillRect(tx, 6, trackW, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.fillRect(thumbX, 6, thumbW, 4);
    }

    renderMainMenuCanvas();
    renderBookIllustration();
  }

  function renderMainMenuCanvas() {
    if (!menuVisible) return;
    const shellRect = mainMenuEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, shellRect.width <= 540 ? 1.5 : 2);
    const mw = Math.max(280, Math.floor(shellRect.width));
    const mh = Math.max(320, Math.floor(shellRect.height));
    if (menuSkyCanvas.width !== Math.floor(mw * dpr) || menuSkyCanvas.height !== Math.floor(mh * dpr)) {
      menuSkyCanvas.width = Math.floor(mw * dpr);
      menuSkyCanvas.height = Math.floor(mh * dpr);
    }
    menuSkyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    menuSkyCtx.clearRect(0, 0, mw, mh);

    // Draw Padang Rumput background behind menu
    const meadowBg = getBiomeBg(window.BIOMES.grassland);
    const isLandscapeMenu = mw > mh * 1.15;
    const grassY = Math.floor(mh * 0.795);
    if (meadowBg && meadowBg.loaded) {
      menuSkyCtx.save();
      menuSkyCtx.imageSmoothingEnabled = true;
      menuSkyCtx.imageSmoothingQuality = 'high';
      const imgAspect = meadowBg.img.width / meadowBg.img.height;
      const drawW = Math.max(mw, mh * imgAspect);
      const drawX = (mw - drawW) / 2;
      menuSkyCtx.drawImage(meadowBg.img, drawX, 0, drawW, mh);
      menuSkyCtx.restore();
    }

    const nowSec = performance.now() * 0.001;

    // Fluffy pixel clouds drifting in the menu sky
    const cloudSpr = window.EcoSprites.get('cloud', 4);
    if (cloudSpr) {
      const cw = cloudSpr._displaySize || cloudSpr.width;
      const ch = cloudSpr._displaySize || cloudSpr.height;
      const c1x = ((nowSec * 14) % (mw + 120)) - 60;
      const c2x = ((nowSec * 10 + mw * 0.55) % (mw + 120)) - 60;
      menuSkyCtx.save();
      menuSkyCtx.imageSmoothingEnabled = true;
      menuSkyCtx.imageSmoothingQuality = 'high';
      menuSkyCtx.drawImage(cloudSpr, Math.floor(c1x), 28, cw, ch);
      menuSkyCtx.drawImage(cloudSpr, Math.floor(c2x), 74, Math.floor(cw * 0.85), Math.floor(ch * 0.85));
      menuSkyCtx.restore();
    }

    // Lush Grass & Toadstool Mushrooms rooted right on grassY (0.795 * mh)
    const grassSpr = window.EcoSprites.get('grass', 3);
    const mushSpr = window.EcoSprites.get('mushroom', 2);
    if (grassSpr) {
      const gw = grassSpr._displaySize || grassSpr.width;
      const gh = grassSpr._displaySize || grassSpr.height;
      [0.06, 0.22, 0.78, 0.93].forEach((fx) => {
        menuSkyCtx.drawImage(grassSpr, Math.floor(mw * fx - gw / 2), grassY - gh + 14, gw, gh);
      });
    }
    if (mushSpr) {
      const msw = (mushSpr._displaySize || mushSpr.width) * 0.8;
      const msh = (mushSpr._displaySize || mushSpr.height) * 0.8;
      [0.04, 0.95].forEach((fx) => {
        menuSkyCtx.drawImage(mushSpr, Math.floor(mw * fx - msw / 2), grassY - msh + 12, msw, msh);
      });
    }

    // Animate & draw Padang Rumput Elang flying across the sky!
    menuEagle.animTime = nowSec;
    if (isLandscapeMenu) {
      menuEagle.x = mw * 0.84 + Math.sin(nowSec * 0.8) * (mw * 0.08);
      menuEagle.y = mh * 0.20 + Math.sin(nowSec * 2.0) * 10;
      menuEagle.facing = -1;
    } else {
      menuEagle.x = mw * 0.5 + Math.sin(nowSec * 0.65) * (mw * 0.30);
      menuEagle.y = 54 + Math.sin(nowSec * 1.8) * 8;
      menuEagle.facing = Math.cos(nowSec * 0.65) >= 0 ? 1 : -1;
    }

    const eagleAnim = window.EcoSprites.getAnimFrame('eagle', 'move', menuEagle.animTime);
    if (eagleAnim) {
      const sz = isLandscapeMenu ? 112 : 96;
      menuSkyCtx.save();
      menuSkyCtx.imageSmoothingEnabled = true;
      menuSkyCtx.imageSmoothingQuality = 'high';
      menuSkyCtx.translate(menuEagle.x, menuEagle.y);
      menuSkyCtx.scale(menuEagle.facing, 1);
      menuSkyCtx.drawImage(eagleAnim.img, eagleAnim.sx, eagleAnim.sy, eagleAnim.sw, eagleAnim.sh, -sz / 2, -sz / 2, sz, sz);
      menuSkyCtx.restore();
    }

    // Draw animated Katak firmly on left grass (grassY) & Belalang firmly on right grass (grassY)!
    const frogAnim = window.EcoSprites.getAnimFrame('frog', 'idle', nowSec);
    if (frogAnim) {
      const fsz = 52;
      const fx = Math.floor(mw * 0.14);
      const fy = grassY - fsz + 11;
      menuSkyCtx.save();
      menuSkyCtx.imageSmoothingEnabled = true;
      menuSkyCtx.imageSmoothingQuality = 'high';
      menuSkyCtx.drawImage(frogAnim.img, frogAnim.sx, frogAnim.sy, frogAnim.sw, frogAnim.sh, fx - fsz / 2, fy, fsz, fsz);
      menuSkyCtx.restore();
    }

    const hopAnim = window.EcoSprites.getAnimFrame('hopper', 'idle', nowSec + 0.5);
    if (hopAnim) {
      const hsz = 40;
      const hx = Math.floor(mw * 0.84);
      const hy = grassY - hsz + 9;
      menuSkyCtx.save();
      menuSkyCtx.imageSmoothingEnabled = true;
      menuSkyCtx.imageSmoothingQuality = 'high';
      menuSkyCtx.translate(hx, hy + hsz / 2);
      menuSkyCtx.scale(-1, 1);
      menuSkyCtx.drawImage(hopAnim.img, hopAnim.sx, hopAnim.sy, hopAnim.sw, hopAnim.sh, -hsz / 2, -hsz / 2, hsz, hsz);
      menuSkyCtx.restore();
    }
  }

  function updateHUD() {
    const counts = getCounts();
    const health = calcHealth(counts);
    coinCountEl.textContent = state.coins;
    healthPercentEl.textContent = `${health}%`;
  }

  function applyLanguage() {
    const biome = getBiome();
    langBtn.textContent = state.lang.toUpperCase();
    biomeIconEl.textContent = biome.icon;
    biomeTitleText.textContent = t(biome.title);
    renderDeck();
    updateMissionUI();
  }

  function renderDeck() {
    cardTrack.innerHTML = '';
    const biome = getBiome();
    for (const card of biome.cards.slice(0, 7)) {
      const unlocked = state.unlocked[card.id];
      const cost = getCardCost(card);
      const affordable = !card.buyable || state.coins >= cost;

      const el = document.createElement('div');
      el.className = 'eco-card';
      if (!unlocked) el.classList.add('locked');
      else if (card.buyable && !affordable) el.classList.add('unaffordable');

      const spriteBox = document.createElement('div');
      spriteBox.className = 'card-sprite-box';
      const sprCanvas = document.createElement('canvas');
      sprCanvas.width = 52;
      sprCanvas.height = 42;
      window.EcoSprites.drawToCanvas(sprCanvas, card.sprite, 2);
      spriteBox.appendChild(sprCanvas);

      if (!unlocked) {
        const lock = document.createElement('div');
        lock.className = 'card-lock-badge';
        lock.textContent = '🔒';
        spriteBox.appendChild(lock);
      }

      const nameRow = document.createElement('div');
      nameRow.className = 'card-name-row';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = t(card.name);
      const infoBtn = document.createElement('button');
      infoBtn.className = 'card-info-btn';
      infoBtn.textContent = 'i';
      infoBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openInfoModal(card);
      });
      nameRow.appendChild(nameSpan);
      nameRow.appendChild(infoBtn);

      const costRow = document.createElement('div');
      costRow.className = 'card-cost';
      costRow.textContent = card.buyable
        ? `${cost} 🪙`
        : state.lang === 'en'
          ? 'Natural'
          : 'Alami';

      el.appendChild(spriteBox);
      el.appendChild(nameRow);
      el.appendChild(costRow);

      el.addEventListener('pointerdown', (e) => startCardDrag(e, card));
      cardTrack.appendChild(el);
    }
  }

  function startCardDrag(e, card) {
    if (!state.unlocked[card.id]) {
      window.EcoAudio.playError();
      showToast(`🔒 ${t(card.name)}: ${t(card.unlockText)}`);
      return;
    }
    if (!card.buyable) {
      showToast(
        state.lang === 'en'
          ? `🌿 ${t(card.name)} grows naturally and cannot be bought!`
          : `🌿 ${t(card.name)} muncul alami dan tidak bisa dibeli!`
      );
      return;
    }
    const cost = getCardCost(card);
    if (state.coins < cost) {
      window.EcoAudio.playError();
      showToast(
        state.lang === 'en'
          ? `❌ Not enough coins! Need ${cost} 🪙`
          : `❌ Koin tidak cukup! Butuh ${cost} 🪙`
      );
      return;
    }
    draggingCard = card;
    window.EcoSprites.drawToCanvas(dragGhostCanvas, card.sprite, 3);
    dragGhostLabel.textContent = `${t(card.name)} (-${cost} 🪙)`;
    updateGhostPosition(e.clientX, e.clientY);
    dragGhost.classList.remove('hidden');
  }

  function updateGhostPosition(clientX, clientY) {
    const rect = worldContainer.getBoundingClientRect();
    pointerPos.x = clientX - rect.left;
    pointerPos.y = clientY - rect.top;
    dragGhost.style.left = `${pointerPos.x}px`;
    dragGhost.style.top = `${pointerPos.y}px`;
  }

  function finishDrag(clientX, clientY) {
    const rect = worldContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (draggingCard) {
      const cost = getCardCost(draggingCard);
      const insideWorld = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      if (insideWorld && state.coins >= cost) {
        playCardAt(draggingCard, x + cameraX, y);
      }
      draggingCard = null;
      dragGhost.classList.add('hidden');
    }
    if (draggingAnimal) {
      draggingAnimal.confusedTimer = 2.4;
      draggingAnimal.vy = 0;
      if (isFlyingType(draggingAnimal.type)) {
        draggingAnimal.baseY = Math.min(draggingAnimal.y, groundY - 60);
      }
      draggingAnimal = null;
    }
    draggingCloud = null;
    draggingMushroom = null;
    panningCamera = false;
  }

  function playCardAt(card, x, y) {
    const cost = getCardCost(card);
    if (card.id !== 'cloud' && state.animals.length >= MAX_ANIMALS) {
      window.EcoAudio.playError();
      showToast(state.lang === 'en' ? '🐾 Max 20 animals reached!' : '🐾 Batas maksimal 20 hewan tercapai!');
      return;
    }
    state.coins -= cost;
    window.EcoAudio.playDrop();

    if (card.id === 'cloud') {
      spawnCloud(x, Math.min(y, groundY - 80), false);
      state.cloudsPlaced++;
    } else {
      spawnAnimal(card.id, x, y);
    }

    updateHUD();
    renderDeck();
  }

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const x = sx + cameraX;
    const y = e.clientY - rect.top;

    for (let i = state.clouds.length - 1; i >= 0; i--) {
      const c = state.clouds[i];
      if (Math.hypot(c.x - x, c.y - y) < 42) {
        draggingCloud = c;
        window.EcoAudio.playPickup();
        return;
      }
    }

    for (let i = state.animals.length - 1; i >= 0; i--) {
      const a = state.animals[i];
      if (Math.hypot(a.x - x, (a.y - 24) - y) < 36) {
        draggingAnimal = a;
        a.eatingTarget = null;
        a.eatProgress = 0;
        window.EcoAudio.playPickup();
        return;
      }
    }

    for (let i = state.mushrooms.length - 1; i >= 0; i--) {
      const m = state.mushrooms[i];
      if (Math.hypot(m.x - x, (m.y - 14) - y) < 30) {
        draggingMushroom = m;
        return;
      }
    }

    panningCamera = true;
    panLastScreenX = e.clientX;
  });

  window.addEventListener('pointermove', (e) => {
    if (draggingCard) updateGhostPosition(e.clientX, e.clientY);
    if (draggingCloud) {
      const rect = canvas.getBoundingClientRect();
      draggingCloud.x = Math.min(Math.max((e.clientX - rect.left) + cameraX, 24), WORLD_W - 24);
      draggingCloud.y = Math.min(Math.max(e.clientY - rect.top, 40), groundY - 80);
    }
    if (draggingAnimal) {
      const rect = canvas.getBoundingClientRect();
      draggingAnimal.x = Math.min(Math.max((e.clientX - rect.left) + cameraX, 24), WORLD_W - 24);
      draggingAnimal.y = Math.min(Math.max(e.clientY - rect.top + 16, 48), groundY);
    }
    if (draggingMushroom) {
      const rect = canvas.getBoundingClientRect();
      draggingMushroom.x = Math.min(Math.max((e.clientX - rect.left) + cameraX, 24), WORLD_W - 24);
    }
    if (panningCamera) {
      const dx = e.clientX - panLastScreenX;
      panLastScreenX = e.clientX;
      cameraX = Math.min(Math.max(cameraX - dx, 0), Math.max(0, WORLD_W - W));
    }
  });

  window.addEventListener('pointerup', (e) => finishDrag(e.clientX, e.clientY));

  function getCurrentMission() {
    if (state.missionIndex < window.ECO_MISSIONS.length) {
      return window.ECO_MISSIONS[state.missionIndex];
    }
    return {
      id: `bonus_${state.missionIndex}`,
      title: { id: '🌿 Jaga Keseimbangan', en: '🌿 Keep Balance' },
      desc: { id: 'Capai Kesehatan Ekosistem 85%', en: 'Reach 85% Ecosystem Health' },
      diff: { id: 'Sandbox', en: 'Sandbox' },
      reward: 40,
      targetKey: 'health',
      targetCount: 85
    };
  }

  function getMissionProgress(mission) {
    const counts = getCounts();
    const biome = getBiome();
    if (mission.targetKey === 'cloudsPlaced') return state.cloudsPlaced;
    if (mission.targetKey === 'merges') return state.merges;
    if (mission.targetKey === 'producer') return counts.producer;
    if (mission.targetKey === 'mealsTotal') return state.mealsTotal;
    if (mission.targetKey === 'health') return calcHealth(counts);
    if (mission.targetKey === 'allLevels') {
      return biome.chainOrder.every((k) => (counts[k] || 0) > 0) ? 1 : 0;
    }
    return counts[mission.targetKey] || 0;
  }

  function updateMissionUI() {
    const m = getCurrentMission();
    const current = getMissionProgress(m);
    const pct = Math.min(100, Math.round((current / m.targetCount) * 100));
    const completed = current >= m.targetCount;

    missionNameEl.textContent = t(m.title);
    missionDescEl.textContent = t(m.desc);
    missionDiffEl.textContent = t(m.diff);
    missionRewardEl.textContent = `+${m.reward} 🪙`;
    missionProgressBar.style.width = `${pct}%`;

    if (!state.missionAccepted) {
      missionStatusIcon.textContent = '⭕';
      missionActionBtn.textContent = state.lang === 'en' ? 'START MISSION' : 'AMBIL MISI';
    } else if (completed) {
      missionStatusIcon.textContent = '✅';
      missionActionBtn.textContent = state.lang === 'en' ? `CLAIM +${m.reward} 🪙` : `KLAIM +${m.reward} 🪙`;
    } else {
      missionStatusIcon.textContent = '⏳';
      missionActionBtn.textContent = `${state.lang === 'en' ? 'PROGRESS' : 'PROGRES'} ${Math.min(current, m.targetCount)}/${m.targetCount}`;
    }
  }

  missionActionBtn.addEventListener('click', () => {
    const m = getCurrentMission();
    if (!state.missionAccepted) {
      state.missionAccepted = true;
      window.EcoAudio.playDrop();
      updateMissionUI();
      saveProgress();
      return;
    }
    if (getMissionProgress(m) >= m.targetCount) {
      addCoins(m.reward);
      showToast(state.lang === 'en' ? `🎉 Mission complete! +${m.reward} 🪙` : `🎉 Misi selesai! +${m.reward} 🪙`);
      state.missionIndex++;
      state.missionAccepted = false;
      updateMissionUI();
      saveProgress();
    }
  });

  missionToggleBtn.addEventListener('click', () => {
    const collapsed = missionBody.classList.toggle('collapsed');
    missionToggleBtn.textContent = collapsed ? '+' : '−';
  });

  function openInfoModal(card) {
    window.EcoSprites.drawToCanvas(infoSpriteCanvas, card.sprite, 5);
    infoTitleEl.textContent = `${card.emoji} ${t(card.name)}`;
    infoBadgeRoleEl.textContent = t(card.roleBadge);
    infoBadgeLevelEl.textContent = t(card.levelBadge);
    infoDescTextEl.textContent = t(card.description);
    infoRoleTextEl.textContent = t(card.ecosystemRole);
    infoModal.classList.remove('hidden');
  }

  infoCloseBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
  });

  healthPillBtn.addEventListener('click', () => {
    const counts = getCounts();
    const health = calcHealth(counts);
    const biome = getBiome();
    modalHealthPctEl.textContent = `${health}%`;
    ratioListEl.innerHTML = '';
    for (const item of biome.idealRatios) {
      const actual = counts[item.key] || 0;
      const row = document.createElement('div');
      row.className = 'ratio-row';
      const left = document.createElement('span');
      left.textContent = `${item.emoji} ${t(item.label)}`;
      const right = document.createElement('span');
      right.className = `ratio-val ${actual >= Math.ceil(item.ideal * 0.5) ? 'ok' : 'warn'}`;
      right.textContent = `${actual}/${item.ideal}`;
      row.appendChild(left);
      row.appendChild(right);
      ratioListEl.appendChild(row);
    }
    healthModal.classList.remove('hidden');
  });

  healthCloseBtn.addEventListener('click', () => healthModal.classList.add('hidden'));
  healthModal.addEventListener('click', (e) => {
    if (e.target === healthModal) healthModal.classList.add('hidden');
  });

  // Biome Selector Modal
  function openBiomeModal() {
    biomeListEl.innerHTML = '';
    for (const b of Object.values(window.BIOMES)) {
      const btn = document.createElement('button');
      btn.className = 'biome-option-btn';
      if (b.id === state.biomeId) btn.classList.add('active');
      if (!b.selectable) btn.classList.add('locked');

      const left = document.createElement('div');
      const chainText = b.idealRatios && b.idealRatios.length
        ? b.idealRatios.map((r) => r.emoji).join(' → ')
        : '🔒 Segera Hadir';
      left.innerHTML = `<div>${b.icon} <strong>${t(b.name)}</strong> <span class="badge-diff">${t(b.difficulty)}</span></div>
        <div style="font-size:10.5px;color:#6d5647;margin-top:2px;">${chainText}</div>`;

      const right = document.createElement('span');
      right.className = 'badge-reward';
      right.textContent = b.selectable ? `${b.costMultiplier}× 🪙` : '🔒';

      btn.appendChild(left);
      btn.appendChild(right);

      btn.addEventListener('click', () => {
        if (!b.selectable) {
          window.EcoAudio.playError();
          showToast(
            state.lang === 'en'
              ? `🔒 ${t(b.name)} biome is not selectable yet!`
              : `🔒 Bioma ${t(b.name)} belum bisa dipilih!`
          );
          return;
        }
        saveProgress();
        biomeModal.classList.add('hidden');
        setMenuVisible(false);
        initWorld(false, b.id);
        showToast(`${b.icon} ${t(b.title)}`);
      });

      biomeListEl.appendChild(btn);
    }
    biomeModal.classList.remove('hidden');
  }

  biomeSelectBtn.addEventListener('click', openBiomeModal);
  biomeCloseBtn.addEventListener('click', () => biomeModal.classList.add('hidden'));
  biomeModal.addEventListener('click', (e) => {
    if (e.target === biomeModal) biomeModal.classList.add('hidden');
  });

  victoryContinueBtn.addEventListener('click', () => victoryModal.classList.add('hidden'));
  victoryBiomeBtn.addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    openBiomeModal();
  });

  // Main Menu Button Wiring (Mulai Bermain opens Biome Selection)
  function setMenuVisible(visible) {
    menuVisible = visible;
    mainMenuEl.classList.toggle('hidden', !visible);
    document.getElementById('game-shell').classList.toggle('menu-active', visible);
    resizeCanvas();
  }

  homeMenuBtn.addEventListener('click', () => {
    window.EcoAudio.playDrop();
    setMenuVisible(true);
  });

  menuPlayBtn.addEventListener('click', () => {
    window.EcoAudio.playDrop();
    openBiomeModal();
  });

  function openIsoLab() {
    window.EcoAudio.playDrop();
    isoModal.classList.remove('hidden');
    if (window.EcoIso3D) window.EcoIso3D.open();
  }

  menuIsoBtn.addEventListener('click', openIsoLab);
  hudIsoBtn.addEventListener('click', openIsoLab);

  if (menuBiokartBtn && biokartModal && biokartFrame) {
    menuBiokartBtn.addEventListener('click', () => {
      window.EcoAudio.playDrop();
      biokartFrame.src = 'biokart/index.html';
      biokartModal.classList.remove('hidden');
    });
  }
  if (biokartCloseBtn && biokartModal && biokartFrame) {
    biokartCloseBtn.addEventListener('click', () => {
      window.EcoAudio.playDrop();
      biokartModal.classList.add('hidden');
      biokartFrame.src = 'about:blank';
    });
  }

  isoCloseBtn.addEventListener('click', () => {
    isoModal.classList.add('hidden');
    isoDisasterPopover.classList.add('hidden');
    if (window.EcoIso3D) window.EcoIso3D.close();
  });

  isoWebBtn.addEventListener('click', () => {
    if (!window.EcoIso3D) return;
    window.EcoAudio.playDrop();
    const on = window.EcoIso3D.toggleFoodWeb();
    isoWebBtn.classList.toggle('active', on);
  });

  isoSimToggleBtn.addEventListener('click', () => {
    if (!window.EcoIso3D) return;
    window.EcoAudio.playDrop();
    const moving = window.EcoIso3D.toggleSimMove();
    isoSimIcon.textContent = moving ? '⏹' : '▶';
    isoSimText.innerHTML = moving ? 'Simulasi<br/>Jalan' : 'Simulasi<br/>Mulai';
  });

  isoDisasterToggleBtn.addEventListener('click', () => {
    window.EcoAudio.playDrop();
    isoDisasterPopover.classList.toggle('hidden');
  });

  const isoModeSelectEl = document.getElementById('iso-mode-select');
  if (isoModeSelectEl) {
    isoModeSelectEl.addEventListener('change', () => {
      window.EcoAudio.playDrop();
      if (window.EcoIso3D) window.EcoIso3D.setMapMode(isoModeSelectEl.value);
    });
  }

  if (isoBiomeCycleBtn) {
    isoBiomeCycleBtn.addEventListener('click', () => {
      if (!window.EcoIso3D) return;
      window.EcoAudio.playDrop();
      window.EcoIso3D.cycleBiome();
    });
  }

  if (isoZoomInMapBtn) {
    isoZoomInMapBtn.addEventListener('click', () => {
      if (window.EcoIso3D) window.EcoIso3D.zoomIn();
    });
  }
  if (isoZoomOutMapBtn) {
    isoZoomOutMapBtn.addEventListener('click', () => {
      if (window.EcoIso3D) window.EcoIso3D.zoomOut();
    });
  }
  if (isoRotMapBtn) {
    isoRotMapBtn.addEventListener('click', () => {
      if (window.EcoIso3D) window.EcoIso3D.rotateCamera();
    });
  }

  document.querySelectorAll('.iso-zone-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.EcoAudio.playDrop();
      if (window.EcoIso3D) window.EcoIso3D.focusBiomeZone(btn.dataset.zone);
    });
  });

  isoPauseBtn.addEventListener('click', () => {
    if (!window.EcoIso3D) return;
    const isP = window.EcoIso3D.togglePause();
    isoPauseIcon.textContent = isP ? '▶' : '⏸';
  });

  isoSoundBtn.addEventListener('click', () => {
    const next = !window.EcoAudio.isEnabled();
    window.EcoAudio.setEnabled(next);
    isoSoundIcon.textContent = next ? '🔊' : '🔇';
    syncSettingsUI();
  });

  document.querySelectorAll('.disaster-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.EcoIso3D) window.EcoIso3D.triggerDisaster(btn.dataset.disaster);
      isoDisasterPopover.classList.add('hidden');
    });
  });

  // 3D HUD Collapsible Panels & Smooth Card Dock Scroll Buttons (Desktop + Mobile UX)
  const isoTrPanel = document.getElementById('iso-hud-tr');
  const isoTrToggleBtn = document.getElementById('iso-tr-toggle-btn');
  const isoTlZoneToggle = document.getElementById('iso-tl-zone-toggle');
  const isoZoneCollapsible = document.getElementById('iso-zone-collapsible');
  const isoDockPrevBtn = document.getElementById('iso-dock-prev');
  const isoDockNextBtn = document.getElementById('iso-dock-next');
  const isoCardDockEl = document.getElementById('iso-card-dock');

  if (isoTrPanel && window.innerWidth <= 820) {
    isoTrPanel.classList.add('collapsed');
    if (isoTrToggleBtn) isoTrToggleBtn.textContent = '▸';
  }
  if (isoTrToggleBtn && isoTrPanel) {
    isoTrToggleBtn.addEventListener('click', () => {
      const collapsed = isoTrPanel.classList.toggle('collapsed');
      isoTrToggleBtn.textContent = collapsed ? '▸' : '▾';
    });
  }
  if (isoTlZoneToggle && isoZoneCollapsible) {
    isoTlZoneToggle.addEventListener('click', () => {
      const isOpen = isoZoneCollapsible.classList.toggle('open');
      isoTlZoneToggle.textContent = isOpen ? '🗺️▴' : '🗺️▾';
    });
  }
  if (isoDockPrevBtn && isoCardDockEl) {
    isoDockPrevBtn.addEventListener('click', () => {
      isoCardDockEl.scrollBy({ left: -220, behavior: 'smooth' });
    });
  }
  if (isoDockNextBtn && isoCardDockEl) {
    isoDockNextBtn.addEventListener('click', () => {
      isoCardDockEl.scrollBy({ left: 220, behavior: 'smooth' });
    });
  }

  // 2-Page Interactive Book Data & Logic
  let bookPage = 0;
  let bookSubSelection = 0;

  const BOOK_CHAPTERS = [
    {
      tag: 'BAB 1 DARI 5 • KONSEP DASAR',
      title: 'Rantai Makanan & Tingkat Trofik',
      body: `<p><strong>Rantai makanan</strong> adalah peristiwa makan dan dimakan antar makhluk hidup dengan urutan tertentu. Setiap posisi organisme disebut <strong>tingkat trofik</strong>.</p>
      <p style="margin-top:5px;">Klik salah satu makhluk hidup di <strong>halaman kiri</strong> untuk mengamati animasi dan peran ekologisnya!</p>`,
      options: [
        {
          label: '🌱 Produsen',
          sprite: 'grass',
          isAnim: false,
          role: 'Tingkat Trofik 1 (Autotrof)',
          detail: '<strong>🌱 Produsen (Rumput / Lumut Air / Kaktus):</strong> Organisme autotrof yang menghasilkan makanan sendiri melalui fotosintesis dengan bantuan air hujan dan cahaya matahari. Tanpa produsen, energi tidak dapat masuk ke ekosistem.'
        },
        {
          label: '🦗 Konsumen I',
          sprite: 'hopper',
          isAnim: true,
          role: 'Tingkat Trofik 2 (Herbivora)',
          detail: '<strong>🦗 Konsumen Primer (Belalang / Kelinci / Tikus Pasir / Serangga Air):</strong> Hewan herbivora pemakan tumbuhan. Mereka memindahkan energi dari produsen ke tingkat konsumen berikutnya.'
        },
        {
          label: '🐸 Konsumen II',
          sprite: 'frog',
          isAnim: true,
          role: 'Tingkat Trofik 3 (Karnivora Kecil)',
          detail: '<strong>🐸 Konsumen Sekunder (Katak):</strong> Karnivora pemangsa herbivora. Kehadiran katak mencegah ledakan populasi serangga agar tumbuhan tidak habis.'
        },
        {
          label: '🐍 Konsumen III',
          sprite: 'snake',
          isAnim: true,
          role: 'Tingkat Trofik 4 (Karnivora Menengah)',
          detail: '<strong>🐍 Konsumen Tersier (Ular):</strong> Predator menengah yang memangsa konsumen sekunder dan menjaga keseimbangan rantai makanan sebelum mencapai predator puncak.'
        },
        {
          label: '🦅 Puncak',
          sprite: 'eagle',
          isAnim: true,
          role: 'Tingkat Trofik 5 (Apex Predator)',
          detail: '<strong>🦅 Predator Puncak (Elang / Bangau):</strong> Konsumen teratas yang tidak memiliki pemangsa alami di ekosistemnya.'
        },
        {
          label: '🍄 Pengurai',
          sprite: 'mushroom',
          isAnim: false,
          role: 'Dekomposer (Penutup Siklus)',
          detail: '<strong>🍄 Pengurai (Jamur):</strong> Menguraikan organisme yang mati (setelah kelaparan 60 detik) kembali menjadi zat hara untuk menyuburkan produsen baru!'
        }
      ]
    },
    {
      tag: 'BAB 2 DARI 5 • ALIRAN ENERGI',
      title: 'Piramida Makanan & Hukum 10%',
      body: `<p>Mengapa di alam jumlah <strong>Rumput</strong> harus jauh lebih banyak daripada <strong>Elang</strong>? Karena menurut <strong>Hukum 10% Lindeman</strong>, hanya sekitar <strong>10% energi</strong> yang berpindah ke tingkat trofik di atasnya (90% dipakai bernapas, bergerak, dan terbuang sebagai panas).</p>`,
      options: [
        {
          label: '🌱 Dasar (10.000 kkal)',
          tier: 0,
          detail: '<strong>Tingkat 1 — Produsen (Rasio 16 | 10.000 kkal):</strong> Menyimpan energi terbesar langsung dari matahari. Harus memiliki populasi paling banyak untuk menopang seluruh piramida.'
        },
        {
          label: '🦗 Herbivora (1.000 kkal)',
          tier: 1,
          detail: '<strong>Tingkat 2 — Konsumen Primer (Rasio 8 | 1.000 kkal):</strong> Menerima 10% energi dari produsen. Di Ecoborn, minimal 3 Rumput memicu hadirnya Belalang secara alami.'
        },
        {
          label: '🐸 Sekunder (100 kkal)',
          tier: 2,
          detail: '<strong>Tingkat 3 — Konsumen Sekunder (Rasio 4 | 100 kkal):</strong> Menerima 10% energi dari herbivora. Populasi idealnya setengah dari populasi belalang.'
        },
        {
          label: '🐍 Tersier (10 kkal)',
          tier: 3,
          detail: '<strong>Tingkat 4 — Konsumen Tersier (Rasio 2 | 10 kkal):</strong> Energi makin menyusut sehingga ekosistem hanya mampu mendukung sedikit ular.'
        },
        {
          label: '🦅 Puncak (1 kkal)',
          tier: 4,
          detail: '<strong>Tingkat 5 — Predator Puncak (Rasio 1 | 1 kkal):</strong> Hanya 1 Elang yang dibutuhkan untuk menyeimbangkan 16 Rumput, 8 Belalang, 4 Katak, dan 2 Ular (Rasio 16:8:4:2:1).'
        }
      ]
    },
    {
      tag: 'BAB 3 DARI 5 • ADAPTASI BIOMA',
      title: 'Siklus Cuaca & 4 Bioma Ekosistem',
      body: `<p>Setiap bioma memiliki kondisi iklim, cara turunnya hujan/cahaya, serta adaptasi makhluk hidup yang berbeda. Klik bioma di <strong>halaman kiri</strong> untuk melihat simulasi cuacanya!</p>`,
      options: [
        {
          label: '🌾 Padang Rumput',
          biomeId: 'grassland',
          detail: '<strong>🌾 Bioma Padang Rumput (Mudah • Harga 1.0×):</strong> 2 Awan Putih bergabung menjadi Awan Hujan yang menumbuhkan Rumput (tahap 1–3). Rantai: <em>Rumput → Belalang → Katak → Ular → Elang</em>.'
        },
        {
          label: '🌴 Hutan Tropis',
          biomeId: 'tropical',
          detail: '<strong>🌴 Bioma Tropis (Mudah • Harga 0.9×):</strong> Curah hujan tinggi dan subur. 2 Awan Putih menurunkan hujan untuk Rumput Tropis. Rantai: <em>Rumput → Kelinci → Ular Tropis → Elang</em>.'
        },
        {
          label: '🌿 Rawa Gambut',
          biomeId: 'swamp',
          detail: '<strong>🌿 Bioma Rawa (Sedang • Harga 1.3×):</strong> 2 Awan Putih bergabung menjadi <strong>Awan Matahari 🌤️</strong>! Cahayanya menyinari <strong>Spora ✨</strong> di air hingga tumbuh menjadi <strong>Lumut Air</strong>. Rantai: <em>Lumut Air → Serangga Air → Katak → Ular Air → Bangau</em>.'
        },
        {
          label: '🏜️ Gurun Pasir',
          biomeId: 'desert',
          detail: '<strong>🏜️ Bioma Gurun (Sulit • Harga 2.0×):</strong> Sangat kering! Butuh <strong>4 Awan Putih sekaligus</strong> untuk memicu hujan yang menumbuhkan <strong>Kaktus 🌵</strong>. Rantai: <em>Kaktus → Tikus Pasir → Ular Gurun → Elang Gurun</em>.'
        }
      ]
    },
    {
      tag: 'BAB 4 DARI 5 • SIMBIOSIS DI ALAM',
      title: 'Simbiosis & Pola Interaksi Ekosistem',
      body: `<p>Selain rantai makanan, makhluk hidup di alam membentuk hubungan erat yang disebut <strong>Simbiosis</strong>. Klik jenis interaksi di <strong>halaman kiri</strong> untuk melihat simulasi & pengaruhnya (+ / 0 / -):</p>`,
      options: [
        {
          label: '🤝 Mutualisme (+/+)',
          symType: 'mutualism',
          detail: '<strong>🤝 Simbiosis Mutualisme (+ / +):</strong> Kedua organisme saling diuntungkan! Contoh di Ecoborn: (1) <strong>Jamur Mikoriza (🍄) & Akar Tanaman</strong> saling bertukar mineral dan karbon untuk mempercepat tumbuh produsen; (2) <strong>Belalang/Serangga Penyerbuk</strong> membantu polinasi bunga; (3) <strong>Bangau (🦩)</strong> membersihkan kutu parasit pada satwa rawa.'
        },
        {
          label: '🛡️ Komensalisme (+/0)',
          symType: 'commensalism',
          detail: '<strong>🛡️ Simbiosis Komensalisme (+ / 0):</strong> Satu pihak diuntungkan (+), sedangkan pihak lain tidak dirugikan maupun diuntungkan (0). Contoh di Ecoborn: <strong>Katak (🐸) & Kelinci (🐇)</strong> berlindung/berkamuflase di bawah naungan <strong>Pohon 3D (🌲)</strong> dari pantauan predator, serta <strong>Elang (🦅)</strong> yang bertengger di puncak pohon.'
        },
        {
          label: '🦠 Parasitisme (+/-)',
          symType: 'parasitism',
          detail: '<strong>🦠 Simbiosis Parasitisme (+ / -):</strong> Satu pihak untung (parasit +) dan pihak lain rugi (inang -). Contoh di Ecoborn: <strong>Benalu & Cacing/Kutu Parasit (🦠)</strong> menempel pada pohon atau satwa inang, menyerap nutrisi dan menurunkan HP inang hingga dibersihkan oleh interaksi Mutualisme.'
        },
        {
          label: '⚔️ Kompetisi (-/-)',
          symType: 'competition',
          detail: '<strong>⚔️ Kompetisi Interspesifik (- / -):</strong> Dua spesies pada tingkat trofik yang sama (misal <strong>Belalang vs Kelinci</strong>, atau <strong>Ular vs Elang</strong>) saling bersaing memperebutkan sumber makanan terbatas di area yang sama.'
        },
        {
          label: '🚫 Amensalisme (-/0)',
          symType: 'amensalism',
          detail: '<strong>🚫 Simbiosis Amensalisme / Alelopati (- / 0):</strong> Satu organisme terhambat pertumbuhannya (-), sedangkan organisme penghasil zat tidak diuntungkan maupun dirugikan (0). Contoh: Pohon pinus/kaktus tua mengeluarkan senyawa alelopati yang menghambat tunas rumput liar tumbuh tepat di bawah batangnya.'
        }
      ]
    },
    {
      tag: 'BAB 5 DARI 5 • SIMULASI KASUS HOTS',
      title: 'Uji Pemahaman: Efek Domino Ekologi',
      body: `<p><strong>Studi Kasus:</strong> Di suatu ekosistem Padang Rumput yang seimbang, seluruh <strong>Ular (🐍)</strong> tiba-tiba punah akibat diburu manusia. Apa dampak berantai (<em>trophic cascade</em>) yang paling tepat terjadi selanjutnya?</p>`,
      options: [
        {
          label: 'A. Katak naik, Belalang turun',
          quizCorrect: true,
          detail: '<strong>✅ TEPAT SEKALI! (Analisis HOTS Benar):</strong> Tanpa Ular sebagai pemangsa, populasi <strong>Katak (🐸) meningkat tajam</strong>. Akibatnya Katak memangsa lebih banyak <strong>Belalang (🦗) hingga anjlok</strong>, sementara <strong>Elang (🦅) kehilangan mangsa utamanya</strong>!'
        },
        {
          label: 'B. Elang makin banyak',
          quizCorrect: false,
          detail: '<strong>❌ Kurang Tepat:</strong> Ular adalah makanan utama Elang di rantai makanan ini. Jika Ular punah, Elang justru kekurangan makanan dan terancam mati kelaparan.'
        },
        {
          label: 'C. Katak ikut punah',
          quizCorrect: false,
          detail: '<strong>❌ Kurang Tepat:</strong> Katak tidak memakan Ular, melainkan dimangsa oleh Ular. Hilangnya pemangsa justru membuat populasi Katak melonjak dalam jangka pendek.'
        }
      ]
    }
  ];

  function renderBookPage() {
    const ch = BOOK_CHAPTERS[bookPage];
    bookChapterNumEl.textContent = ch.tag;
    bookTitleEl.textContent = ch.title;
    bookBodyTextEl.innerHTML = ch.body;
    bookPageIndicator.textContent = `Hal. ${bookPage + 1} / ${BOOK_CHAPTERS.length}`;
    bookPrevBtn.disabled = bookPage === 0;
    bookNextBtn.disabled = bookPage === BOOK_CHAPTERS.length - 1;

    bookControlsEl.innerHTML = '';
    ch.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'book-chip-btn' + (idx === bookSubSelection ? ' active' : '');
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        window.EcoAudio.playDrop();
        bookSubSelection = idx;
        renderBookPage();
      });
      bookControlsEl.appendChild(btn);
    });

    const activeOpt = ch.options[bookSubSelection] || ch.options[0];
    bookInspectBoxEl.innerHTML = activeOpt.detail;
  }

  function renderBookIllustration() {
    if (materiModal.classList.contains('hidden')) return;
    const cw = bookIllustCanvas.width;
    const ch = bookIllustCanvas.height;
    const bctx = bookIllustCtx;
    const nowSec = performance.now() * 0.001;
    bctx.clearRect(0, 0, cw, ch);

    const chapter = BOOK_CHAPTERS[bookPage];
    const opt = chapter.options[bookSubSelection] || chapter.options[0];

    if (bookPage === 0) {
      // Chapter 1: Live animated creature/plant on meadow stage + chain mini-icons
      const bg = getBiomeBg(window.BIOMES.grassland);
      if (bg && bg.loaded) {
        bctx.drawImage(bg.img, 0, 0, cw, ch);
      } else {
        bctx.fillStyle = '#c8ebea';
        bctx.fillRect(0, 0, cw, ch);
      }

      // Spotlight circle
      bctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      bctx.beginPath();
      bctx.arc(cw / 2, ch * 0.56, 52, 0, Math.PI * 2);
      bctx.fill();

      if (opt.isAnim) {
        const anim = window.EcoSprites.getAnimFrame(opt.sprite, 'move', nowSec);
        if (anim) {
          const sz = opt.sprite === 'eagle' ? 92 : 76;
          bctx.save();
          bctx.imageSmoothingEnabled = true;
          bctx.imageSmoothingQuality = 'high';
          bctx.drawImage(anim.img, anim.sx, anim.sy, anim.sw, anim.sh, (cw - sz) / 2, ch * 0.56 - sz / 2, sz, sz);
          bctx.restore();
        }
      } else {
        const spr = window.EcoSprites.get(opt.sprite, 4);
        if (spr) {
          const sz = 72;
          bctx.drawImage(spr, (cw - sz) / 2, ch * 0.56 - sz / 2, sz, sz);
        }
      }

      bctx.fillStyle = 'rgba(42, 22, 11, 0.82)';
      bctx.fillRect(0, ch - 28, cw, 28);
      bctx.fillStyle = '#fff3c4';
      bctx.font = 'bold 11.5px Segoe UI, sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText(opt.role, cw / 2, ch - 10);
    } else if (bookPage === 1) {
      // Chapter 2: Interactive 5-tier Energy Pyramid (16:8:4:2:1 / 10,000 -> 1 kcal)
      bctx.fillStyle = '#f5faf5';
      bctx.fillRect(0, 0, cw, ch);
      const tiers = [
        { name: '🌱 Produsen (10.000 kkal • 16)', color: '#43a047', w: 236 },
        { name: '🦗 Konsumen I (1.000 kkal • 8)', color: '#66bb6a', w: 192 },
        { name: '🐸 Konsumen II (100 kkal • 4)', color: '#26a69a', w: 148 },
        { name: '🐍 Konsumen III (10 kkal • 2)', color: '#ffa726', w: 108 },
        { name: '🦅 Puncak (1 kkal • 1)', color: '#ef5350', w: 72 }
      ];
      const rowH = 30;
      const baseY = ch - 14;
      tiers.forEach((tr, i) => {
        const y = baseY - (i + 1) * (rowH + 3);
        const x = (cw - tr.w) / 2;
        const selected = opt.tier === i;
        bctx.fillStyle = tr.color;
        bctx.fillRect(x, y, tr.w, rowH);
        bctx.lineWidth = selected ? 3 : 1.5;
        bctx.strokeStyle = selected ? '#2a160b' : '#ffffff';
        bctx.strokeRect(x, y, tr.w, rowH);
        bctx.fillStyle = '#ffffff';
        bctx.font = (selected ? '900 10.5px' : 'bold 9.5px') + ' Segoe UI, sans-serif';
        bctx.textAlign = 'center';
        bctx.fillText(tr.name, cw / 2, y + 19);
      });
    } else if (bookPage === 2) {
      // Chapter 3: Live Biome Preview (Background + Weather + Creatures)
      const bDef = window.BIOMES[opt.biomeId] || window.BIOMES.grassland;
      const bg = getBiomeBg(bDef);
      if (bg && bg.loaded) {
        bctx.drawImage(bg.img, 0, 0, cw, ch);
      } else {
        bctx.fillStyle = bDef.fallbackColors.skyTop;
        bctx.fillRect(0, 0, cw, ch);
      }
      const cSpr = window.EcoSprites.get(bDef.weatherType === 'sun' ? 'sun_cloud' : 'storm', 3);
      if (cSpr) {
        const cx = cw * 0.5 + Math.sin(nowSec * 1.4) * 35;
        bctx.drawImage(cSpr, cx - 28, 14, 56, 56);
        bctx.fillStyle = bDef.weatherType === 'sun' ? '#ffee58' : '#4fc3f7';
        for (let r = 0; r < 6; r++) {
          const rx = cx - 18 + r * 7;
          const ry = 60 + ((nowSec * 90 + r * 19) % 75);
          bctx.fillRect(rx, ry, 2, 7);
        }
      }
      const pSpr = window.EcoSprites.get(bDef.chainOrder[0], 3);
      if (pSpr) {
        bctx.drawImage(pSpr, cw * 0.25 - 22, ch * 0.78 - 34, 44, 44);
        bctx.drawImage(pSpr, cw * 0.72 - 22, ch * 0.78 - 34, 44, 44);
      }
      const hAnim = window.EcoSprites.getAnimFrame(bDef.chainOrder[1], 'move', nowSec);
      if (hAnim) {
        bctx.drawImage(hAnim.img, hAnim.sx, hAnim.sy, hAnim.sw, hAnim.sh, cw * 0.48 - 24, ch * 0.78 - 38, 48, 48);
      }
    } else if (bookPage === 3) {
      // Chapter 4: Interactive Symbiosis Diagram (+/+, +/0, +/-, -/-, -/0)
      bctx.fillStyle = '#f3fbf7';
      bctx.fillRect(0, 0, cw, ch);

      const pairs = {
        mutualism: { leftSpr: 'mushroom', rightSpr: 'grass', badge: '🤝 MUTUALISME (+ / +)', col: '#00c853', desc: 'Mikoriza 🍄 ↔ Akar Tanaman 🌱 (Saling Untung)' },
        commensalism: { leftSpr: 'frog', rightSpr: 'cactus', badge: '🛡️ KOMENSALISME (+ / 0)', col: '#0288d1', desc: 'Katak 🐸 Berlindung di Pohon 🌲 (Pohon Netral)' },
        parasitism: { leftSpr: 'spore', rightSpr: 'rabbit', badge: '🦠 PARASITISME (+ / -)', col: '#aa00ff', desc: 'Parasit 🦠 Hisap Nutrisi Inang 🐇 (Inang Rugi)' },
        competition: { leftSpr: 'hopper', rightSpr: 'rabbit', badge: '⚔️ KOMPETISI (- / -)', col: '#e64a19', desc: 'Belalang 🦗 vs Kelinci 🐇 Rebut Pakan Rumput' },
        amensalism: { leftSpr: 'cactus', rightSpr: 'grass', badge: '🚫 AMENSALISME (- / 0)', col: '#f57f17', desc: 'Alelopati Pohon Tua Menghambat Rumput Liar' }
      };
      const cfg = pairs[opt.symType] || pairs.mutualism;

      // Header pill
      bctx.fillStyle = cfg.col;
      bctx.fillRect(24, 14, cw - 48, 26);
      bctx.fillStyle = '#ffffff';
      bctx.font = '900 11.5px Segoe UI, sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText(cfg.badge, cw / 2, 31);

      // Left & Right Organism Circles + Animated Connecting Arc
      const lx = 72;
      const rx = cw - 72;
      const cy = 104;

      bctx.strokeStyle = cfg.col;
      bctx.lineWidth = 3;
      bctx.beginPath();
      bctx.moveTo(lx, cy);
      bctx.quadraticCurveTo(cw / 2, cy - 34, rx, cy);
      bctx.stroke();

      const s1 = window.EcoSprites.get(cfg.leftSpr, 3);
      const s2 = window.EcoSprites.get(cfg.rightSpr, 3);
      if (s1) bctx.drawImage(s1, lx - 28, cy - 28, 56, 56);
      if (s2) bctx.drawImage(s2, rx - 28, cy - 28, 56, 56);

      bctx.fillStyle = '#263238';
      bctx.font = 'bold 10.5px Segoe UI, sans-serif';
      bctx.fillText(cfg.desc, cw / 2, ch - 18);
    } else {
      // Chapter 5: HOTS Trophic Cascade Diagram
      bctx.fillStyle = '#fffDF7';
      bctx.fillRect(0, 0, cw, ch);
      bctx.font = 'bold 12px Segoe UI, sans-serif';
      bctx.textAlign = 'center';
      bctx.fillStyle = '#3b2618';
      bctx.fillText('Simulasi Rantai Makanan Saat Ular Punah:', cw / 2, 26);

      const nodes = [
        { e: '🌱', n: 'Rumput', st: opt.quizCorrect ? '📈 Naik' : '?' },
        { e: '🦗', n: 'Belalang', st: opt.quizCorrect ? '📉 Turun' : '?' },
        { e: '🐸', n: 'Katak', st: opt.quizCorrect ? '📈 Meledak!' : '?' },
        { e: '🐍', n: 'Ular', st: '❌ PUNAH' },
        { e: '🦅', n: 'Elang', st: opt.quizCorrect ? '📉 Lapar' : '?' }
      ];
      nodes.forEach((nd, i) => {
        const nx = 30 + i * 54;
        const ny = 92;
        bctx.fillStyle = i === 3 ? '#ffebee' : '#e8f5e9';
        bctx.strokeStyle = i === 3 ? '#e53935' : '#43a047';
        bctx.lineWidth = 2;
        bctx.beginPath();
        bctx.arc(nx, ny, 21, 0, Math.PI * 2);
        bctx.fill();
        bctx.stroke();
        bctx.font = '18px Segoe UI Emoji, sans-serif';
        bctx.fillText(nd.e, nx, ny + 6);
        bctx.font = 'bold 9.5px Segoe UI, sans-serif';
        bctx.fillStyle = '#3b2618';
        bctx.fillText(nd.n, nx, ny + 35);
        bctx.fillStyle = i === 3 ? '#c62828' : '#2e7d32';
        bctx.fillText(nd.st, nx, ny + 48);
      });
    }
  }

  bookPrevBtn.addEventListener('click', () => {
    if (bookPage > 0) {
      window.EcoAudio.playDrop();
      bookPage--;
      bookSubSelection = 0;
      renderBookPage();
    }
  });

  bookNextBtn.addEventListener('click', () => {
    if (bookPage < BOOK_CHAPTERS.length - 1) {
      window.EcoAudio.playDrop();
      bookPage++;
      bookSubSelection = 0;
      renderBookPage();
    }
  });

  menuMateriBtn.addEventListener('click', () => {
    window.EcoAudio.playDrop();
    bookPage = 0;
    bookSubSelection = 0;
    renderBookPage();
    materiModal.classList.remove('hidden');
  });

  materiCloseBtn.addEventListener('click', () => materiModal.classList.add('hidden'));
  materiModal.addEventListener('click', (e) => {
    if (e.target === materiModal) materiModal.classList.add('hidden');
  });

  function syncSettingsUI() {
    const snd = window.EcoAudio.isEnabled();
    setSoundToggle.textContent = snd ? (state.lang === 'en' ? 'ON' : 'AKTIF') : 'OFF';
    menuSoundBtn.textContent = snd ? '🔊' : '🔇';
    soundBtn.textContent = snd ? '🔊' : '🔇';
    setLangToggle.textContent = state.lang === 'en' ? 'ENGLISH' : 'INDONESIA';
    menuPlayBtn.textContent = state.lang === 'en' ? '🌿 2D FOOD CHAIN WORLD' : '🌿 DUNIA 2D RANTAI MAKANAN';
    if (menuBiokartBtn) menuBiokartBtn.textContent = '🏎️ BIOKART RACERS';
    menuMateriBtn.textContent = state.lang === 'en' ? 'STUDY BOOK' : 'MATERI';
    menuSettingsBtn.textContent = state.lang === 'en' ? 'SETTINGS' : 'PENGATURAN';
  }

  menuSettingsBtn.addEventListener('click', () => {
    window.EcoAudio.playDrop();
    syncSettingsUI();
    settingsModal.classList.remove('hidden');
  });

  settingsCloseBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  menuSoundBtn.addEventListener('click', () => {
    const next = !window.EcoAudio.isEnabled();
    window.EcoAudio.setEnabled(next);
    syncSettingsUI();
  });

  setSoundToggle.addEventListener('click', () => {
    const next = !window.EcoAudio.isEnabled();
    window.EcoAudio.setEnabled(next);
    syncSettingsUI();
  });

  setLangToggle.addEventListener('click', () => {
    state.lang = state.lang === 'id' ? 'en' : 'id';
    applyLanguage();
    syncSettingsUI();
    saveProgress();
  });

  setResetBtn.addEventListener('click', () => {
    localStorage.removeItem(SAVE_PREFIX + state.biomeId);
    initWorld(true, state.biomeId);
    settingsModal.classList.add('hidden');
    showToast(state.lang === 'en' ? '🔄 Biome reset!' : '🔄 Bioma dimulai ulang!');
  });

  const mediaInfoModal = document.getElementById('media-info-modal');
  const mediaInfoX = document.getElementById('media-info-x');
  const mediaInfoClose = document.getElementById('media-info-close');

  function closeMediaInfo() {
    if (mediaInfoModal) mediaInfoModal.classList.add('hidden');
  }
  if (mediaInfoX) mediaInfoX.addEventListener('click', closeMediaInfo);
  if (mediaInfoClose) mediaInfoClose.addEventListener('click', closeMediaInfo);
  if (mediaInfoModal) {
    mediaInfoModal.addEventListener('click', (e) => {
      if (e.target === mediaInfoModal) closeMediaInfo();
    });
    mediaInfoModal.querySelectorAll('.mi-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-mi-tab');
        mediaInfoModal.querySelectorAll('.mi-tab').forEach((t) => t.classList.toggle('active', t === tab));
        mediaInfoModal.querySelectorAll('.mi-panel').forEach((p) => {
          p.classList.toggle('active', p.getAttribute('data-mi-panel') === key);
        });
      });
    });
  }

  menuAboutBtn.addEventListener('click', () => {
    window.EcoAudio.playDrop();
    if (mediaInfoModal) {
      mediaInfoModal.classList.remove('hidden');
    } else {
      openInfoModal(getBiome().cards[0]);
    }
  });

  // Controls
  langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'id' ? 'en' : 'id';
    applyLanguage();
    saveProgress();
  });

  speedBtn.addEventListener('click', () => {
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
    speedLabelEl.textContent = `${state.speed}x`;
  });

  playPauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    playPauseBtn.textContent = state.paused ? '▶' : '⏸';
  });

  soundBtn.addEventListener('click', () => {
    const next = !window.EcoAudio.isEnabled();
    window.EcoAudio.setEnabled(next);
    soundBtn.textContent = next ? '🔊' : '🔇';
  });

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(SAVE_PREFIX + state.biomeId);
    initWorld(true, state.biomeId);
    showToast(state.lang === 'en' ? '🔄 Biome reset!' : '🔄 Bioma dimulai ulang!');
  });

  deckPrevBtn.addEventListener('click', () => cardTrack.scrollBy({ left: -160, behavior: 'smooth' }));
  deckNextBtn.addEventListener('click', () => cardTrack.scrollBy({ left: 160, behavior: 'smooth' }));
  window.addEventListener('resize', resizeCanvas);

  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (window.EcoIso3D && window.EcoIso3D.isActive()) {
      window.EcoIso3D.tick(Math.min(dt, 0.05));
    } else {
      if (!menuVisible) update(dt);
      else {
        const dtM = Math.min(dt, 0.05);
        menuEagle.animTime += dtM;
        menuFrog.animTime += dtM;
        menuHopper.animTime += dtM;
        menuEagle.x += menuEagle.vx * dtM;
        if (menuEagle.x > 360) menuEagle.vx = -Math.abs(menuEagle.vx);
        if (menuEagle.x < 40) menuEagle.vx = Math.abs(menuEagle.vx);
        menuEagle.facing = menuEagle.vx >= 0 ? 1 : -1;
      }
      render();
    }
    requestAnimationFrame(loop);
  }

  window.Eco2D = {
    getTutorialState() {
      const grassCount = state.grassSlots.filter((s) => s.stage > 0).length;
      const unlockCount = Object.values(state.unlocked || {}).filter(Boolean).length;
      return {
        menuVisible,
        biomeId: state.biomeId,
        cloudsPlaced: state.cloudsPlaced,
        merges: state.merges,
        mealsTotal: state.mealsTotal,
        grassCount,
        animalsCount: state.animals.length,
        coins: state.coins,
        speed: state.speed,
        unlockCount
      };
    }
  };

  initWorld(false);
  window.EcoSprites.onReady(() => renderDeck());
  requestAnimationFrame(loop);
})();
