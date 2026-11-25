// Multi-Biome Sprites & 8-12 FPS Sprite Sheet Animations
(function (global) {
  const PALETTES = {
    cloud: { O: '#2d3b4e', W: '#ffffff', L: '#dfe9f3', S: '#b6cce2' },
    storm: { O: '#1e2530', D: '#5b687a', M: '#77869b', L: '#96a5b8', Y: '#ffd54f' },
    sun_cloud: { O: '#3e2723', Y: '#ffee58', G: '#fbc02d', N: '#f57f17', W: '#ffffff', L: '#e1f5fe' },
    grass: { O: '#234a1e', G: '#4ea832', L: '#7cd649', D: '#357a25', Y: '#ffe055', W: '#ffffff', B: '#6d4423' },
    sprout: { O: '#234a1e', G: '#58b439', L: '#8ce05a', B: '#704726', D: '#4c2f18' },
    spore: { O: '#1b4d3e', G: '#4db6ac', L: '#a7ffeb', Y: '#fff59d', B: '#4e342e' },
    water_moss: { O: '#004d40', G: '#00897b', L: '#4db6ac', M: '#80cbc4', B: '#3e2723' },
    cactus: { O: '#1b3b1a', G: '#2e7d32', L: '#66bb6a', D: '#1b5e20', P: '#f06292', Y: '#fff176' },
    rabbit: { O: '#3e2723', W: '#fffdf7', S: '#e0d6c8', P: '#f48fb1', E: '#111111' },
    sand_mouse: { O: '#3e2723', M: '#d7a86e', L: '#f5d09c', D: '#a6753b', P: '#e57373', E: '#111111' },
    water_bug: { O: '#0d2b36', B: '#0288d1', L: '#4fc3f7', D: '#01579b', E: '#111111', W: '#ffffff' },
    heron: { O: '#263238', W: '#ffffff', S: '#cfd8dc', Y: '#ffb300', P: '#e57373', E: '#111111' },
    hopper: { O: '#1f3b16', G: '#67d43f', L: '#a6f065', D: '#3d9922', E: '#111111', W: '#ffffff' },
    frog: { O: '#1b3a2e', G: '#58b98b', L: '#8ce0b3', D: '#398a64', B: '#d9f2d0', E: '#111111', W: '#ffffff' },
    snake: { O: '#47210d', M: '#d96b27', L: '#f59c42', D: '#a64414', Y: '#ffd56b', E: '#111111', R: '#e53935' },
    tropical_snake: { O: '#1b3b18', M: '#43a047', L: '#9ccc65', D: '#2e7d32', Y: '#ffee58', E: '#111111', R: '#e53935' },
    water_snake: { O: '#0d2e3a', M: '#00838f', L: '#4dd0e1', D: '#006064', Y: '#b2ebf2', E: '#111111', R: '#e53935' },
    desert_snake: { O: '#3e2723', M: '#c68b38', L: '#e6b86a', D: '#8d5b19', Y: '#fff3cd', E: '#111111', R: '#e53935' },
    eagle: { O: '#2b1e16', B: '#6e4c36', D: '#4a3222', W: '#f7f5f0', S: '#d8d2c5', Y: '#f5b025', E: '#111111' },
    desert_eagle: { O: '#2b1e16', B: '#8d5b19', D: '#5d3a0a', W: '#fff3cd', S: '#e6b86a', Y: '#ffb300', E: '#111111' },
    mushroom: { O: '#3e211b', R: '#e53935', D: '#b71c1c', W: '#fff8e7', S: '#e0d2b8' },
    orangutan: { O: '#2d140a', A: '#c65d24', D: '#8c3511', F: '#df9467', E: '#141414', B: '#5e230c' },
    hornbill: { O: '#16161c', K: '#262834', W: '#f6f3e8', Y: '#f5b027', R: '#d9532f', E: '#111111' }
  };

  const GRIDS = {
    cloud: [
      '.....OOOO.......', '....OWWWWO......', '..OOOWWWWWO.....', '.OWWWWWWWWWOO...',
      'OWWWWWWWWWWWWO..', 'OWWWWWWWWWWWWWO.', 'OWWWWLWWWWWLWWWO', '.OLLLLLLLLLLLLLO',
      '..OSSSSSSSSSSSO.', '...OOOOOOOOOOO..'
    ],
    storm: [
      '.....OOOO.......', '....ODDDDO......', '..OOODDDDDO.....', '.ODDDDDDDDDDO...',
      'ODDDDDDDDDDDDDO.', 'OMMMMMMMDDDDDMDO', 'OMMMMYYMMMMMMMDO', '.OLLLLYYLLLLLLO.',
      '..OSSSSYSSSSSO..', '...OOOOOOOOOOO..'
    ],
    sun_cloud: [
      '....OO..OO......', '..OOYYYYYYOO....', '.OYYGGGGGGYYO...', '.OYGGGGGGGGYO...',
      '..OYGGWWWWWWOO..', '.OOWWWWWWWWWWWOO', 'OWWWWWWWWWWWWWWO', 'OWWWWWWWWWWWWWWO',
      '.OLLLLLLLLLLLLO.', '..OOOOOOOOOOOO..'
    ],
    grass: [
      '....O.....O.....', '...OGO...OGO..O.', '..OGLO..OGLO.OYO', '.OGLLO.OGLLO..O.',
      'OOGLLOOOGLLOO...', 'OGGLLGGGLLGGOO..', 'OGGYYGGWWGGLLO..', 'OGGDGGGGGGDGLO..',
      'ODDDGGGGGGDDGO..', 'ODDDDDDDDDDDDO..', '.OBBBBBBBBBBO...', '..OOOOOOOOOO....'
    ],
    sprout: [
      '.....OO...OO....', '....OGLO.OLGO...', '.....OGO.OGO....', '......OOGOO.....',
      '.......OGO......', '....OOOBBBOOO...', '...OBBBBBBBBBO..', '..OOOOOOOOOOOOO.'
    ],
    spore: [
      '......OO........', '.....OYYO..OO...', '......OO..OYYO..', '...OO......OO...',
      '..OYYO..OOOO....', '...OO..OGLLGO...', '......OGGLLGGO..', '.....OBBBBBBBBO.',
      '......OOOOOOOO..'
    ],
    water_moss: [
      '....OO....OO....', '...OGMO..OMGO...', '..OGLLMOOMLLGO..', '.OGGLLGGGGLLGGO.',
      'OGGGMGGGGGGMGGO.', 'OGGGGGGGGGGGGGO.', '.OOBBBBBBBBBBOO.', '..OOOOOOOOOOOO..'
    ],
    cactus: [
      '......OPPO......', '.....OPYYPO.....', '..OO..OGGO..OO..', '.OGLO.OGLO.OGLO.',
      '.OGLO.OGLO.OGLO.', '.OGLOOOGLOOOGLO.', '..OGGGGGLGGGGO..', '....OGGGLGGO....',
      '....OGGGLGGO....', '....OGGGLGGO....', '....ODDDDDDO....', '.....OOOOOO.....'
    ],
    rabbit: [
      '........OO.OO...', '.......OWO.OWO..', '.......OWP.OWPO.', '.......OWWWWWO..',
      '..OOOO.OWWEEWWO.', '.OWWWWOOWWWWWWO.', 'OWWWWWWWWWWWWWO.', 'OWWSSWWWWWWSSWO.',
      '.OOWWWWWWWWWOO..', '..OWWO....OWWO..', '..OOOO....OOOO..'
    ],
    sand_mouse: [
      '........OO..OO..', '.......OMO.OMO..', '.......OML.OMLO.', '..OOOO.OMMEEMMO.',
      '.OMLLMOOMMMMMMO.', 'OPOMMMMMMMMMMO..', '.O.OMMLLLMMMO...', '...OMDO..OMDO...',
      '...OOO...OOO....'
    ],
    water_bug: [
      '....OO....OO....', '...OBLO..OLBO...', '..OOWEOOOBBBO...', '.OBBLLBBBBLLBO..',
      'OBBBLBBBBBBBLBO.', '.OODBBBBBBBDOO..', '..OBDO....OBDO..', '..OOO......OOO..'
    ],
    heron: [
      '..OOOO....OOOO..', '.OWWWWO..OWWWWO.', '.OWWWWWOOWWWWWWO', '..OWWWWWWEWWWWYY',
      '...OOWWWWWWWWO..', '.....OSSSSSSO...', '......OP..PO....', '......OO..OO....'
    ],
    hopper: [
      '.........OO.....', '....OO..OGLO....', '...OGLO.OGDO....', '..OOWEOOGGO.....',
      '.OGGLGGGGLGO....', 'OGGLLGGGGGGGO...', '.OODGGGGDDGOO...', '...OGDO..OGDO...',
      '..OOO......OOO..'
    ],
    frog: [
      '....OOO..OOO....', '...OWEOOOWEOO...', '...OGGGGGGGGO...', '..OGLLGGGGLLGO..',
      '..OGGGGGGGGGGO..', '..OOBBBBBBBOOO..', '.OGGBBBBBBBGGO..', '.OODGDDDDDGDOO..',
      '..OOO....OOO....'
    ],
    snake: [
      '.........OOO....', '........OMMMO...', '.......OMWEMO...', '.......OMMMMOR..',
      '....OOOOMDDO....', '...OMLLMMMO.....', '..OMDMMMMMMO....', '..OMMMYYYMMMO...',
      '...OOOOOOOOO....'
    ],
    tropical_snake: [
      '.........OOO....', '........OMMMO...', '.......OMWEMO...', '.......OMMMMOR..',
      '....OOOOMDDO....', '...OMLLMMMO.....', '..OMDMMMMMMO....', '..OMMMYYYMMMO...',
      '...OOOOOOOOO....'
    ],
    water_snake: [
      '.........OOO....', '........OMMMO...', '.......OMWEMO...', '.......OMMMMOR..',
      '....OOOOMDDO....', '...OMLLMMMO.....', '..OMDMMMMMMO....', '..OMMMYYYMMMO...',
      '...OOOOOOOOO....'
    ],
    desert_snake: [
      '.........OOO....', '........OMMMO...', '.......OMWEMO...', '.......OMMMMOR..',
      '....OOOOMDDO....', '...OMLLMMMO.....', '..OMDMMMMMMO....', '..OMMMYYYMMMO...',
      '...OOOOOOOOO....'
    ],
    eagle: [
      '......OOOO......', '.....OWWWWO.....', '....OWWEEWWO....', '....OWWWWWYYO...',
      '...OOBBBBBYYO...', '..OBBBBBBBBBO...', '.OBBDDBBBBBDBO..', '..OOBBBBBBBBO...',
      '....OYYOOYYO....'
    ],
    desert_eagle: [
      '......OOOO......', '.....OWWWWO.....', '....OWWEEWWO....', '....OWWWWWYYO...',
      '...OOBBBBBYYO...', '..OBBBBBBBBBO...', '.OBBDDBBBBBDBO..', '..OOBBBBBBBBO...',
      '....OYYOOYYO....'
    ],
    mushroom: [
      '....OOOOOOO.....', '..OORRRRRRROO...', '.ORRWWRRRWWRRO..', '.ORRRRRRRRRRRO..',
      'ORRRWWRRRRWWRRO.', 'ODDDDDDDDDDDDDO.', '..OOOWWWWWOOO...', '....OWSSSSO.....',
      '....OWSSSSO.....', '.....OOOOO......'
    ],
    orangutan: [
      '....OOOOOOOO....', '..OOAAAAAAAADO..', '.OAAFFFFFFAAAOO.', 'OAAFEEFFEEFAAAO.',
      'OAAFFAAAAFFAAAO.', '.OOAAAAAAAADOO..', '.OOAAAAAAAAADO..', 'OAAAABBBBAAAAAO.',
      'OAAO.AAAA.OAAAO.', 'OAO..OAAO..OAAO.', '.O...O..O...OO..'
    ],
    hornbill: [
      '......OOOO......', '....OORRRRO.....', '...OYYYYYYROO...', '..OKKKKKYYYYYO..',
      '..OKEKKWWKKKOO..', '...OKKKKKKKO....', '..OKKKKKKKWKO...', '.OKKKKKKKWWWKO..',
      '...OOKKKKKKKO...', '....OY....YO....'
    ]
  };

  const PNG_MAP = {
    cloud: 'assets/sprites/awan.png?v=6',
    storm: 'assets/sprites/awan_hitam.png?v=6',
    sun_cloud: 'assets/sprites/awan_matahari.png?v=6',
    grass: 'assets/sprites/rumput.png?v=6',
    spore: 'assets/sprites/spora.png?v=6',
    water_moss: 'assets/sprites/lumut_air.png?v=6',
    cactus: 'assets/sprites/kaktus.png?v=6',
    hopper: 'assets/sprites/belalang.png?v=6',
    water_bug: 'assets/sprites/serangga_air.png?v=6',
    sand_mouse: 'assets/sprites/tikus_pasir.png?v=6',
    rabbit: 'assets/sprites/kelinci.png?v=6',
    frog: 'assets/sprites/katak.png?v=6',
    snake: 'assets/sprites/ular.png?v=6',
    eagle: 'assets/sprites/elang.png?v=6',
    heron: 'assets/sprites/bangau.png?v=6',
    mushroom: 'assets/sprites/jamur.png?v=6'
  };

  const ANIM_SHEETS = {
    eagle: {
      src: 'assets/sheets/elang_sheet.png?v=7',
      frameSize: 128,
      fps: 8,
      rowCounts: [7, 7, 5, 5],
      pingPong: true,
      states: { idle: [2], move: [2] }
    },
    heron: {
      src: 'assets/sheets/bangau_sheet.png?v=1',
      frameSize: 128,
      fps: 8,
      rowCounts: [4, 4],
      states: { idle: [0, 1], move: [0, 1] }
    },
    hopper: {
      src: 'assets/sheets/belalang_sheet.png?v=6',
      frameSize: 128,
      fps: 7,
      rowCounts: [8, 8, 8, 8],
      states: { idle: [0], move: [3] }
    },
    water_bug: {
      src: 'assets/sheets/serangga_air_sheet.png?v=1',
      frameSize: 128,
      fps: 8,
      rowCounts: [4, 4],
      states: { idle: [0], move: [1] }
    },
    sand_mouse: {
      src: 'assets/sheets/tikus_pasir_sheet.png?v=1',
      frameSize: 128,
      fps: 8,
      rowCounts: [4, 4],
      states: { idle: [0], move: [1] }
    },
    rabbit: {
      src: 'assets/sheets/kelinci_sheet.png?v=1',
      frameSize: 128,
      fps: 8,
      rowCounts: [4, 4],
      states: { idle: [0], move: [1] }
    },
    frog: {
      src: 'assets/sheets/katak_sheet.png?v=6',
      frameSize: 128,
      fps: 7,
      rowCounts: [8, 8, 8, 8],
      states: { idle: [0], move: [3] }
    },
    snake: {
      src: 'assets/sheets/ular_sheet.png?v=6',
      frameSize: 128,
      fps: 8,
      rowCounts: [7, 7, 7, 6],
      states: { idle: [0, 1], move: [2, 3] }
    },
    iso_grass: {
      src: 'assets/sheets/iso_grass_sheet.png?v=1',
      frameSize: 128,
      fps: 1.2,
      rowCounts: [4],
      pingPong: true,
      states: { idle: [0], move: [0] }
    },
    iso_tree: {
      src: 'assets/sheets/iso_tree_sheet.png?v=1',
      frameSize: 128,
      fps: 1.1,
      rowCounts: [4],
      pingPong: true,
      states: { idle: [0], move: [0] }
    },
    iso_cactus: {
      src: 'assets/sheets/iso_cactus_sheet.png?v=1',
      frameSize: 128,
      fps: 1.0,
      rowCounts: [4],
      pingPong: true,
      states: { idle: [0], move: [0] }
    },
    human_steward: {
      src: 'assets/sheets/human_steward_sheet.png?v=1',
      frameSize: 128,
      fps: 5.5,
      rowCounts: [4],
      states: { idle: [0], move: [0] }
    },
    human_destroyer: {
      src: 'assets/sheets/human_destroyer_sheet.png?v=1',
      frameSize: 128,
      fps: 5.5,
      rowCounts: [4],
      states: { idle: [0], move: [0] }
    }
  };

  // Map biome variant creatures to base animated sheets + CSS filter tint
  const ANIM_ALIAS = {
    human_steward: { sheet: 'human_steward', filter: '' },
    human_destroyer: { sheet: 'human_destroyer', filter: '' },
    iso_grass: { sheet: 'iso_grass', filter: '' },
    iso_tree: { sheet: 'iso_tree', filter: '' },
    iso_cactus: { sheet: 'iso_cactus', filter: '' },
    eagle: { sheet: 'eagle', filter: '' },
    desert_eagle: { sheet: 'eagle', filter: 'sepia(0.45) saturate(1.4)' },
    heron: { sheet: 'heron', filter: '' },
    hopper: { sheet: 'hopper', filter: '' },
    water_bug: { sheet: 'water_bug', filter: '' },
    sand_mouse: { sheet: 'sand_mouse', filter: '' },
    rabbit: { sheet: 'rabbit', filter: '' },
    frog: { sheet: 'frog', filter: '' },
    snake: { sheet: 'snake', filter: '' },
    tropical_snake: { sheet: 'snake', filter: 'hue-rotate(75deg) saturate(1.3)' },
    water_snake: { sheet: 'snake', filter: 'hue-rotate(155deg) saturate(1.2)' },
    desert_snake: { sheet: 'snake', filter: 'sepia(0.5) brightness(1.08)' }
  };

  const SIZE_MAP = { 2: 44, 3: 58, 4: 84, 5: 96 };
  const cache = {};
  const loadedImages = {};
  const loadedSheets = {};
  const readyCallbacks = [];
  let loadedCount = 0;
  const totalPngs = Object.keys(PNG_MAP).length;

  for (const [key, src] of Object.entries(PNG_MAP)) {
    const img = new Image();
    img.onload = () => {
      loadedImages[key] = img;
      for (const ck of Object.keys(cache)) {
        if (ck.startsWith(`${key}_`) || ck.startsWith(`png_${key}_`)) delete cache[ck];
      }
      loadedCount++;
      if (loadedCount === totalPngs) readyCallbacks.forEach((cb) => cb());
    };
    img.src = src;
  }

  for (const [key, def] of Object.entries(ANIM_SHEETS)) {
    const img = new Image();
    img.onload = () => {
      const stateFrames = {};
      for (const [st, rows] of Object.entries(def.states)) {
        const list = [];
        for (const r of rows) {
          const cnt = def.rowCounts[r] || 0;
          for (let c = 0; c < cnt; c++) list.push({ row: r, col: c });
          if (def.pingPong && cnt > 2) {
            for (let c = cnt - 2; c >= 1; c--) list.push({ row: r, col: c });
          }
        }
        stateFrames[st] = list;
      }
      loadedSheets[key] = { img, def, stateFrames };
    };
    img.src = def.src;
  }

  function buildSpriteCanvas(key, scale = 3) {
    if (loadedImages[key]) {
      const img = loadedImages[key];
      const targetSize = SIZE_MAP[scale] || 58;
      const hiRes = targetSize * 2;
      const cKey = `png_${key}_${scale}`;
      if (cache[cKey]) return cache[cKey];
      const c = document.createElement('canvas');
      c.width = hiRes;
      c.height = hiRes;
      const cctx = c.getContext('2d');
      cctx.imageSmoothingEnabled = true;
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(img, 0, 0, hiRes, hiRes);
      c._displaySize = targetSize;
      cache[cKey] = c;
      return c;
    }

    const cacheKey = `${key}_${scale}`;
    if (cache[cacheKey]) return cache[cacheKey];

    const grid = GRIDS[key] || GRIDS.grass;
    const pal = PALETTES[key] || PALETTES.grass;
    const h = grid.length;
    const w = grid[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        ctx.fillStyle = pal[ch] || '#ff00ff';
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    cache[cacheKey] = canvas;
    return canvas;
  }

  function drawToCanvas(targetCanvas, key, scale = 3) {
    const alias = ANIM_ALIAS[key];
    const baseKey = alias && loadedImages[alias.sheet] ? alias.sheet : key;
    const sprite = buildSpriteCanvas(baseKey, scale);
    if (!sprite || !targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    const isHiRes = Boolean(sprite._displaySize);
    ctx.save();
    if (alias && alias.filter) ctx.filter = alias.filter;
    ctx.imageSmoothingEnabled = isHiRes;
    if (isHiRes) ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    const drawW = isHiRes ? Math.min(targetCanvas.width, sprite._displaySize) : sprite.width;
    const drawH = isHiRes ? Math.min(targetCanvas.height, sprite._displaySize) : sprite.height;
    const dx = Math.floor((targetCanvas.width - drawW) / 2);
    const dy = Math.floor((targetCanvas.height - drawH) / 2);
    ctx.drawImage(sprite, dx, dy, drawW, drawH);
    ctx.restore();
  }

  function getAnimFrame(key, animState, timeSec) {
    const alias = ANIM_ALIAS[key];
    if (!alias) return null;
    const entry = loadedSheets[alias.sheet];
    if (!entry) return null;
    const frames = entry.stateFrames[animState] || entry.stateFrames.idle;
    if (!frames || frames.length === 0) return null;
    const idx = Math.floor(timeSec * entry.def.fps) % frames.length;
    const f = frames[idx];
    const sz = entry.def.frameSize;
    return {
      img: entry.img,
      sx: f.col * sz,
      sy: f.row * sz,
      sw: sz,
      sh: sz,
      filter: alias.filter || ''
    };
  }

  const TERRAIN_SHEETS = {
    water: 'assets/sheets/iso_water_tiles.png?v=1',
    ground: 'assets/sheets/iso_ground_tiles.png?v=1'
  };
  const loadedTerrain = {};
  Object.keys(TERRAIN_SHEETS).forEach((k) => {
    const img = new Image();
    img.onload = () => {
      loadedTerrain[k] = img;
    };
    img.src = TERRAIN_SHEETS[k];
  });

  function getTerrainTile(sheetKey, row, col) {
    const img = loadedTerrain[sheetKey];
    if (!img) return null;
    const sz = 128;
    return {
      img,
      sx: Math.max(0, Math.min(6, col)) * sz,
      sy: Math.max(0, Math.min(3, row)) * sz,
      sw: sz,
      sh: sz
    };
  }

  global.EcoSprites = {
    get: buildSpriteCanvas,
    getAnimFrame,
    getTerrainTile,
    drawToCanvas,
    onReady(cb) {
      if (loadedCount >= totalPngs) cb();
      else readyCallbacks.push(cb);
    }
  };
})(window);
