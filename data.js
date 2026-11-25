// Ecoborn V2 — Multi-Biome Definitions (4 Playable: Padang Rumput, Tropis, Rawa, Gurun + 2 Locked: Gunung, Tundra)
(function (global) {
  global.BIOMES = {
    grassland: {
      id: 'grassland',
      selectable: true,
      icon: '🌾',
      name: { id: 'Padang Rumput', en: 'Grassland' },
      title: { id: 'EKOSISTEM PADANG RUMPUT', en: 'GRASSLAND ECOSYSTEM' },
      difficulty: { id: 'Mudah', en: 'Easy' },
      costMultiplier: 1.0,
      coinRate: 0.5,
      cloudsToMerge: 2,
      weatherType: 'rain', // 2 white clouds -> rain cloud -> grows grass (1..3)
      bg: 'assets/bg/meadow_bg.jpg?v=4',
      fallbackColors: { skyTop: '#7ec8f2', skyBot: '#f6f3d8', ground: '#6ec23c', soil: '#8b5428' },
      chainOrder: ['grass', 'hopper', 'frog', 'snake', 'eagle'],
      idealRatios: [
        { key: 'grass', emoji: '🌱', label: { id: 'Rumput', en: 'Grass' }, ideal: 16 },
        { key: 'hopper', emoji: '🦗', label: { id: 'Belalang', en: 'Grasshopper' }, ideal: 8 },
        { key: 'frog', emoji: '🐸', label: { id: 'Katak', en: 'Frog' }, ideal: 4 },
        { key: 'snake', emoji: '🐍', label: { id: 'Ular', en: 'Snake' }, ideal: 2 },
        { key: 'eagle', emoji: '🦅', label: { id: 'Elang', en: 'Eagle' }, ideal: 1 }
      ],
      cards: [
        {
          id: 'cloud',
          name: { id: 'AWAN', en: 'CLOUD' },
          emoji: '☁️',
          sprite: 'cloud',
          baseCost: 10,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: true,
          roleBadge: { id: 'Cuaca & Siklus Air', en: 'Weather & Water Cycle' },
          levelBadge: { id: '💧 Gabung 2 Awan → Hujan', en: '💧 Merge 2 Clouds → Rain' },
          description: {
            id: 'Gabungkan 2 awan putih untuk membentuk Awan Hujan yang menumbuhkan Rumput hingga tahap 3!',
            en: 'Merge 2 white clouds into a Rain Cloud that grows Grass up to stage 3!'
          },
          ecosystemRole: {
            id: 'Hujan menyuburkan tanah dan menumbuhkan rumput sebagai dasar rantai makanan.',
            en: 'Rain waters the soil and grows grass as the base of the food chain.'
          }
        },
        {
          id: 'grass',
          name: { id: 'RUMPUT', en: 'GRASS' },
          emoji: '🌱',
          sprite: 'grass',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Tumbuh dari hujan', en: 'Grows from rain' },
          roleBadge: { id: 'Produsen', en: 'Producer' },
          levelBadge: { id: '📊 Produsen (Dasar Rantai)', en: '📊 Producer (Base)' },
          description: {
            id: 'Rumput tumbuh dari hujan (tahap 1–3) dan menjadi makanan utama Belalang.',
            en: 'Grass grows from rain (stages 1–3) and feeds Grasshoppers.'
          },
          ecosystemRole: {
            id: 'Mengubah energi matahari menjadi nutrisi bagi seluruh ekosistem padang rumput.',
            en: 'Converts sunlight into nutrients for the entire grassland ecosystem.'
          }
        },
        {
          id: 'hopper',
          name: { id: 'BELALANG', en: 'GRASSHOPPER' },
          emoji: '🦗',
          sprite: 'hopper',
          baseCost: 20,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: '2 petak Rumput', en: '2 Grass tiles' },
          roleBadge: { id: 'Herbivora', en: 'Herbivore' },
          levelBadge: { id: '📊 Konsumen Primer (+1 🪙)', en: '📊 Primary Consumer (+1 🪙)' },
          description: {
            id: 'Memakan rumput secara bertahap (+1 🪙). Muncul otomatis saat ada 3 Rumput.',
            en: 'Eats grass gradually (+1 🪙). Spawns automatically when 3 Grass tiles exist.'
          },
          ecosystemRole: {
            id: 'Belalang yang makan rumput membuka rantai pemangsa berikutnya (Katak).',
            en: 'Grasshoppers eating grass unlock the next predator (Frog).'
          }
        },
        {
          id: 'frog',
          name: { id: 'KATAK', en: 'FROG' },
          emoji: '🐸',
          sprite: 'frog',
          baseCost: 26,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Belalang makan rumput', en: 'Grasshopper eats grass' },
          roleBadge: { id: 'Karnivora Kecil', en: 'Small Carnivore' },
          levelBadge: { id: '📊 Konsumen Sekunder (+2 🪙)', en: '📊 Secondary Consumer (+2 🪙)' },
          description: {
            id: 'Katak memangsa belalang di padang rumput (+2 🪙 per makan).',
            en: 'Frogs prey on grasshoppers in the meadow (+2 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Mengendalikan populasi belalang dan membuka kartu Ular.',
            en: 'Controls grasshopper population and unlocks Snakes.'
          }
        },
        {
          id: 'snake',
          name: { id: 'ULAR', en: 'SNAKE' },
          emoji: '🐍',
          sprite: 'snake',
          baseCost: 33,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Katak makan belalang', en: 'Frog eats grasshopper' },
          roleBadge: { id: 'Karnivora Menengah', en: 'Mid Carnivore' },
          levelBadge: { id: '📊 Konsumen Tersier (+3 🪙)', en: '📊 Tertiary Consumer (+3 🪙)' },
          description: {
            id: 'Ular padang rumput berburu katak (+3 🪙 per makan).',
            en: 'Meadow snakes hunt frogs (+3 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Menjaga populasi katak dan membuka Predator Puncak (Elang).',
            en: 'Balances frog populations and unlocks the Apex Predator (Eagle).'
          }
        },
        {
          id: 'eagle',
          name: { id: 'ELANG', en: 'EAGLE' },
          emoji: '🦅',
          sprite: 'eagle',
          baseCost: 46,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: false,
          unlockText: { id: 'Ular makan katak', en: 'Snake eats frog' },
          roleBadge: { id: 'Predator Puncak', en: 'Apex Predator' },
          levelBadge: { id: '📊 Konsumen Puncak (+4 🪙)', en: '📊 Apex Predator (+4 🪙)' },
          description: {
            id: 'Elang terbang di langit dan menukik berburu ular (+4 🪙 per makan).',
            en: 'Eagles soar in the sky and swoop down to hunt snakes (+4 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Predator puncak yang menjaga keseimbangan seluruh rantai makanan.',
            en: 'Apex predator that keeps the entire food chain in harmony.'
          }
        },
        {
          id: 'mushroom',
          name: { id: 'JAMUR', en: 'MUSHROOM' },
          emoji: '🍄',
          sprite: 'mushroom',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Hewan mati (60s lapar)', en: 'Animal dies (60s hungry)' },
          roleBadge: { id: 'Pengurai', en: 'Decomposer' },
          levelBadge: { id: '♻️ Pengurai Alami', en: '♻️ Natural Decomposer' },
          description: {
            id: 'Muncul dari hewan yang mati kelaparan (60 detik) untuk menyuburkan kembali produsen.',
            en: 'Grows from starved animals (60s) to return nutrients to producers.'
          },
          ecosystemRole: {
            id: 'Menutup siklus nutrisi alam dengan mengembalikan zat hara ke tanah.',
            en: 'Closes the nutrient loop by returning minerals to the soil.'
          }
        }
      ]
    },

    tropical: {
      id: 'tropical',
      selectable: true,
      icon: '🌴',
      name: { id: 'Tropis', en: 'Tropical' },
      title: { id: 'EKOSISTEM HUTAN TROPIS', en: 'TROPICAL ECOSYSTEM' },
      difficulty: { id: 'Mudah', en: 'Easy' },
      costMultiplier: 0.9,
      coinRate: 0.55,
      cloudsToMerge: 2,
      weatherType: 'rain',
      bg: 'assets/bg/tropis_bg.jpg?v=1',
      fallbackColors: { skyTop: '#4fc3f7', skyBot: '#dcedc8', ground: '#43a047', soil: '#5d4037' },
      chainOrder: ['grass', 'rabbit', 'tropical_snake', 'eagle'],
      idealRatios: [
        { key: 'grass', emoji: '🌿', label: { id: 'Rumput Tropis', en: 'Tropical Grass' }, ideal: 16 },
        { key: 'rabbit', emoji: '🐇', label: { id: 'Kelinci', en: 'Rabbit' }, ideal: 8 },
        { key: 'tropical_snake', emoji: '🐍', label: { id: 'Ular Tropis', en: 'Tropical Snake' }, ideal: 3 },
        { key: 'eagle', emoji: '🦅', label: { id: 'Elang', en: 'Eagle' }, ideal: 1 }
      ],
      cards: [
        {
          id: 'cloud',
          name: { id: 'AWAN', en: 'CLOUD' },
          emoji: '☁️',
          sprite: 'cloud',
          baseCost: 10,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: true,
          roleBadge: { id: 'Cuaca Tropis', en: 'Tropical Weather' },
          levelBadge: { id: '💧 Gabung 2 Awan → Hujan', en: '💧 Merge 2 Clouds → Rain' },
          description: {
            id: 'Curah hujan tinggi di hutan tropis menumbuhkan Rumput dengan cepat (harga kartu 0,9× lebih murah!).',
            en: 'High tropical rainfall grows Grass quickly (card costs are 0.9× cheaper!).'
          },
          ecosystemRole: {
            id: 'Menjaga kelembapan tinggi yang mendukung pertumbuhan produsen tropis.',
            en: 'Maintains high humidity supporting tropical producer growth.'
          }
        },
        {
          id: 'grass',
          name: { id: 'RUMPUT', en: 'GRASS' },
          emoji: '🌿',
          sprite: 'grass',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Tumbuh dari hujan', en: 'Grows from rain' },
          roleBadge: { id: 'Produsen', en: 'Producer' },
          levelBadge: { id: '📊 Produsen Tropis', en: '📊 Tropical Producer' },
          description: {
            id: 'Rumput tropis yang subur menjadi sumber pakan utama bagi Kelinci.',
            en: 'Lush tropical grass serves as the main food source for Rabbits.'
          },
          ecosystemRole: {
            id: 'Produsen utama penyedia energi di lantai hutan tropis.',
            en: 'Primary energy producer on the tropical forest floor.'
          }
        },
        {
          id: 'rabbit',
          name: { id: 'KELINCI', en: 'RABBIT' },
          emoji: '🐇',
          sprite: 'rabbit',
          baseCost: 22,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: '2 petak Rumput', en: '2 Grass tiles' },
          roleBadge: { id: 'Herbivora', en: 'Herbivore' },
          levelBadge: { id: '📊 Konsumen Primer (+1 🪙)', en: '📊 Primary Consumer (+1 🪙)' },
          description: {
            id: 'Kelinci melompat lincah memakan rumput tropis (+1 🪙 per makan).',
            en: 'Rabbits hop across the jungle meadow eating grass (+1 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Herbivora mamalia yang menghubungkan tumbuhan dengan predator reptil.',
            en: 'Mammalian herbivore linking plants to reptile predators.'
          }
        },
        {
          id: 'tropical_snake',
          name: { id: 'ULAR TROPIS', en: 'TROPICAL SNAKE' },
          emoji: '🐍',
          sprite: 'tropical_snake',
          baseCost: 32,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Kelinci makan rumput', en: 'Rabbit eats grass' },
          roleBadge: { id: 'Karnivora', en: 'Carnivore' },
          levelBadge: { id: '📊 Konsumen Sekunder (+2 🪙)', en: '📊 Secondary Consumer (+2 🪙)' },
          description: {
            id: 'Ular hijau-emas hutan tropis yang memangsa Kelinci (+2 🪙 per makan).',
            en: 'Green-gold tropical snake that preys on Rabbits (+2 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Mengontrol populasi kelinci dan menjadi mangsa Elang.',
            en: 'Controls rabbit numbers and serves as prey for Eagles.'
          }
        },
        {
          id: 'eagle',
          name: { id: 'ELANG', en: 'EAGLE' },
          emoji: '🦅',
          sprite: 'eagle',
          baseCost: 46,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: false,
          unlockText: { id: 'Ular Tropis makan kelinci', en: 'Tropical Snake eats rabbit' },
          roleBadge: { id: 'Predator Puncak', en: 'Apex Predator' },
          levelBadge: { id: '📊 Predator Puncak (+4 🪙)', en: '📊 Apex Predator (+4 🪙)' },
          description: {
            id: 'Elang kanopi hutan tropis yang berburu Ular Tropis dari udara (+4 🪙).',
            en: 'Canopy eagle hunting Tropical Snakes from the sky (+4 🪙).'
          },
          ecosystemRole: {
            id: 'Menjaga keseimbangan puncak rantai makanan hutan tropis.',
            en: 'Maintains top-level balance in the tropical food chain.'
          }
        },
        {
          id: 'mushroom',
          name: { id: 'JAMUR', en: 'MUSHROOM' },
          emoji: '🍄',
          sprite: 'mushroom',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Hewan mati (60s lapar)', en: 'Animal dies (60s hungry)' },
          roleBadge: { id: 'Pengurai', en: 'Decomposer' },
          levelBadge: { id: '♻️ Pengurai Hutan', en: '♻️ Forest Decomposer' },
          description: {
            id: 'Menguraikan sisa hewan mati di tanah lembap hutan tropis.',
            en: 'Decomposes dead animals on the humid tropical floor.'
          },
          ecosystemRole: {
            id: 'Mengembalikan unsur hara dengan cepat ke tanah tropis.',
            en: 'Rapidly recycles nutrients back into tropical soil.'
          }
        }
      ]
    },

    swamp: {
      id: 'swamp',
      selectable: true,
      icon: '🌿',
      name: { id: 'Rawa', en: 'Swamp' },
      title: { id: 'EKOSISTEM RAWA GAMBUT', en: 'SWAMP WETLAND ECOSYSTEM' },
      difficulty: { id: 'Sedang', en: 'Medium' },
      costMultiplier: 1.3,
      coinRate: 0.45,
      cloudsToMerge: 2,
      weatherType: 'sun', // 2 clouds merge -> Sun Cloud -> light turns Spores into Water Moss!
      bg: 'assets/bg/rawa_bg.jpg?v=1',
      fallbackColors: { skyTop: '#80cbc4', skyBot: '#e0f2f1', ground: '#2e7d32', soil: '#3e2723' },
      chainOrder: ['water_moss', 'water_bug', 'frog', 'water_snake', 'heron'],
      idealRatios: [
        { key: 'water_moss', emoji: '🌿', label: { id: 'Lumut Air', en: 'Water Moss' }, ideal: 16 },
        { key: 'water_bug', emoji: '🪲', label: { id: 'Serangga Air', en: 'Water Bug' }, ideal: 8 },
        { key: 'frog', emoji: '🐸', label: { id: 'Katak', en: 'Frog' }, ideal: 4 },
        { key: 'water_snake', emoji: '🐍', label: { id: 'Ular Air', en: 'Water Snake' }, ideal: 2 },
        { key: 'heron', emoji: '🦩', label: { id: 'Bangau', en: 'Heron' }, ideal: 1 }
      ],
      cards: [
        {
          id: 'cloud',
          name: { id: 'AWAN', en: 'CLOUD' },
          emoji: '🌤️',
          sprite: 'cloud',
          baseCost: 10,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: true,
          roleBadge: { id: 'Cuaca Rawa', en: 'Swamp Weather' },
          levelBadge: { id: '☀️ Gabung 2 Awan → Awan Matahari', en: '☀️ Merge 2 Clouds → Sun Cloud' },
          description: {
            id: 'Di Rawa, 2 awan bergabung menjadi Awan Matahari! Cahayanya menyinari Spora dan mengubahnya menjadi Lumut Air.',
            en: 'In the Swamp, 2 clouds merge into a Sun Cloud! Its rays turn Spores into Water Moss.'
          },
          ecosystemRole: {
            id: 'Sinar matahari memicu fotosintesis spora di permukaan air rawa.',
            en: 'Sunlight triggers photosynthesis in spores across the swamp water.'
          }
        },
        {
          id: 'spore',
          name: { id: 'SPORA', en: 'SPORE' },
          emoji: '✨',
          sprite: 'spore',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: true,
          unlockText: { id: 'Muncul alami di rawa', en: 'Appears naturally in swamp' },
          roleBadge: { id: 'Bibit Produsen', en: 'Producer Seed' },
          levelBadge: { id: '🌱 Bibit Lumut Air', en: '🌱 Water Moss Spore' },
          description: {
            id: 'Spora muncul alami di rawa dan tidak bisa dibeli. Sinari dengan Awan Matahari agar tumbuh menjadi Lumut Air!',
            en: 'Spores appear naturally and cannot be bought. Shine a Sun Cloud on them to grow Water Moss!'
          },
          ecosystemRole: {
            id: 'Cikal bakal produsen utama di ekosistem perairan rawa.',
            en: 'The starting seed for primary producers in wetland waters.'
          }
        },
        {
          id: 'water_moss',
          name: { id: 'LUMUT AIR', en: 'WATER MOSS' },
          emoji: '🌿',
          sprite: 'water_moss',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Spora disinari Awan Matahari', en: 'Spore lit by Sun Cloud' },
          roleBadge: { id: 'Produsen Rawa', en: 'Swamp Producer' },
          levelBadge: { id: '📊 Produsen (Tahap 1–3)', en: '📊 Producer (Stages 1–3)' },
          description: {
            id: 'Lumut Air tumbuh dari Spora yang terkena cahaya Awan Matahari dan menjadi pakan Serangga Air.',
            en: 'Water Moss grows from Spores lit by Sun Clouds and feeds Water Bugs.'
          },
          ecosystemRole: {
            id: 'Menghasilkan oksigen dan makanan di perairan rawa.',
            en: 'Produces oxygen and food across the wetland waters.'
          }
        },
        {
          id: 'water_bug',
          name: { id: 'SERANGGA AIR', en: 'WATER BUG' },
          emoji: '🪲',
          sprite: 'water_bug',
          baseCost: 20,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: '2 petak Lumut Air', en: '2 Water Moss tiles' },
          roleBadge: { id: 'Herbivora Air', en: 'Aquatic Herbivore' },
          levelBadge: { id: '📊 Konsumen Primer (+1 🪙)', en: '📊 Primary Consumer (+1 🪙)' },
          description: {
            id: 'Serangga Air memakan Lumut Air secara bertahap (+1 🪙 per makan).',
            en: 'Water Bugs feed on Water Moss gradually (+1 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Sumber makanan utama bagi amfibi rawa seperti Katak.',
            en: 'Primary food source for wetland amphibians like Frogs.'
          }
        },
        {
          id: 'frog',
          name: { id: 'KATAK', en: 'FROG' },
          emoji: '🐸',
          sprite: 'frog',
          baseCost: 26,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Serangga Air makan lumut', en: 'Water Bug eats moss' },
          roleBadge: { id: 'Amfibi Karnivora', en: 'Carnivorous Amphibian' },
          levelBadge: { id: '📊 Konsumen Sekunder (+2 🪙)', en: '📊 Secondary Consumer (+2 🪙)' },
          description: {
            id: 'Katak rawa memangsa Serangga Air (+2 🪙 per makan).',
            en: 'Swamp frogs prey on Water Bugs (+2 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Menghubungkan serangga air dengan predator Ular Air.',
            en: 'Links aquatic insects to Water Snake predators.'
          }
        },
        {
          id: 'water_snake',
          name: { id: 'ULAR AIR', en: 'WATER SNAKE' },
          emoji: '🐍',
          sprite: 'water_snake',
          baseCost: 33,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Katak makan serangga air', en: 'Frog eats water bug' },
          roleBadge: { id: 'Reptil Rawa', en: 'Swamp Reptile' },
          levelBadge: { id: '📊 Konsumen Tersier (+3 🪙)', en: '📊 Tertiary Consumer (+3 🪙)' },
          description: {
            id: 'Ular Air berenang dan berburu Katak di tepian rawa (+3 🪙 per makan).',
            en: 'Water Snakes hunt Frogs along the swamp bank (+3 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Mengendalikan populasi katak dan menjadi mangsa Bangau.',
            en: 'Controls frog populations and becomes prey for Herons.'
          }
        },
        {
          id: 'heron',
          name: { id: 'BANGAU', en: 'HERON' },
          emoji: '🦩',
          sprite: 'heron',
          baseCost: 46,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: false,
          unlockText: { id: 'Ular Air makan katak', en: 'Water Snake eats frog' },
          roleBadge: { id: 'Predator Puncak', en: 'Apex Predator' },
          levelBadge: { id: '📊 Predator Puncak Rawa (+4 🪙)', en: '📊 Swamp Apex Predator (+4 🪙)' },
          description: {
            id: 'Burung Bangau terbang di atas rawa dan menukik menangkap Ular Air (+4 🪙).',
            en: 'Herons glide above the marsh and swoop down to catch Water Snakes (+4 🪙).'
          },
          ecosystemRole: {
            id: 'Predator puncak penjaga keseimbangan ekosistem lahan basah.',
            en: 'Apex predator maintaining balance across the wetland.'
          }
        }
      ]
    },

    desert: {
      id: 'desert',
      selectable: true,
      icon: '🏜️',
      name: { id: 'Gurun', en: 'Desert' },
      title: { id: 'EKOSISTEM GURUN PASIR', en: 'ARID DESERT ECOSYSTEM' },
      difficulty: { id: 'Sulit', en: 'Hard' },
      costMultiplier: 2.0,
      coinRate: 0.35,
      cloudsToMerge: 4, // Di Gurun butuh 4 awan sekaligus!
      weatherType: 'rain',
      bg: 'assets/bg/gurun_bg.jpg?v=1',
      fallbackColors: { skyTop: '#ffb74d', skyBot: '#fff8e1', ground: '#e6b86a', soil: '#a1662f' },
      chainOrder: ['cactus', 'sand_mouse', 'desert_snake', 'desert_eagle'],
      idealRatios: [
        { key: 'cactus', emoji: '🌵', label: { id: 'Kaktus', en: 'Cactus' }, ideal: 12 },
        { key: 'sand_mouse', emoji: '🐁', label: { id: 'Tikus Pasir', en: 'Sand Mouse' }, ideal: 6 },
        { key: 'desert_snake', emoji: '🐍', label: { id: 'Ular Gurun', en: 'Desert Snake' }, ideal: 3 },
        { key: 'desert_eagle', emoji: '🦅', label: { id: 'Elang Gurun', en: 'Desert Eagle' }, ideal: 1 }
      ],
      cards: [
        {
          id: 'cloud',
          name: { id: 'AWAN', en: 'CLOUD' },
          emoji: '☁️',
          sprite: 'cloud',
          baseCost: 10,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: true,
          roleBadge: { id: 'Cuaca Gurun Ekstrem', en: 'Extreme Desert Weather' },
          levelBadge: { id: '⛈️ Butuh 4 Awan → Hujan!', en: '⛈️ Needs 4 Clouds → Rain!' },
          description: {
            id: 'Di Gurun yang kering, butuh 4 Awan Putih berkumpul sekaligus untuk menurunkan hujan! Harga kartu juga 2× lipat.',
            en: 'In the arid Desert, 4 White Clouds must gather together to trigger rain! Card costs are 2×.'
          },
          ecosystemRole: {
            id: 'Hujan langka di gurun menjadi satu-satunya sumber air bagi Kaktus.',
            en: 'Rare desert rain is the sole water source for Cacti.'
          }
        },
        {
          id: 'cactus',
          name: { id: 'KAKTUS', en: 'CACTUS' },
          emoji: '🌵',
          sprite: 'cactus',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Tumbuh dari hujan (4 awan)', en: 'Grows from rain (4 clouds)' },
          roleBadge: { id: 'Produsen Gurun', en: 'Desert Producer' },
          levelBadge: { id: '📊 Produsen Penyimpan Air', en: '📊 Water-Storing Producer' },
          description: {
            id: 'Kaktus menyimpan cadangan air di batangnya (tahap 1–3) dan menjadi sumber makanan & air bagi Tikus Pasir.',
            en: 'Cacti store water in their stems (stages 1–3) and provide food and moisture for Sand Mice.'
          },
          ecosystemRole: {
            id: 'Tumbuhan xerofit penopang utama kehidupan di bioma gurun.',
            en: 'Xerophyte plant sustaining all life in the desert biome.'
          }
        },
        {
          id: 'sand_mouse',
          name: { id: 'TIKUS PASIR', en: 'SAND MOUSE' },
          emoji: '🐁',
          sprite: 'sand_mouse',
          baseCost: 20,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: '2 petak Kaktus', en: '2 Cactus tiles' },
          roleBadge: { id: 'Herbivora Gurun', en: 'Desert Herbivore' },
          levelBadge: { id: '📊 Konsumen Primer (+1 🪙)', en: '📊 Primary Consumer (+1 🪙)' },
          description: {
            id: 'Tikus Pasir memakan tunas dan buah Kaktus untuk bertahan di panas gurun (+1 🪙).',
            en: 'Sand Mice feed on Cactus shoots and fruit to survive the desert heat (+1 🪙).'
          },
          ecosystemRole: {
            id: 'Mangsa utama bagi reptil predator gurun.',
            en: 'Primary prey for desert reptile predators.'
          }
        },
        {
          id: 'desert_snake',
          name: { id: 'ULAR GURUN', en: 'DESERT SNAKE' },
          emoji: '🐍',
          sprite: 'desert_snake',
          baseCost: 30,
          buyable: true,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Tikus Pasir makan kaktus', en: 'Sand Mouse eats cactus' },
          roleBadge: { id: 'Karnivora Gurun', en: 'Desert Carnivore' },
          levelBadge: { id: '📊 Konsumen Sekunder (+3 🪙)', en: '📊 Secondary Consumer (+3 🪙)' },
          description: {
            id: 'Ular derik pasir yang berburu Tikus Pasir (+3 🪙 per makan).',
            en: 'Sand sidewinder snake hunting Sand Mice (+3 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Mengendalikan populasi pengerat gurun dan menjadi mangsa Elang Gurun.',
            en: 'Controls desert rodent numbers and feeds Desert Eagles.'
          }
        },
        {
          id: 'desert_eagle',
          name: { id: 'ELANG GURUN', en: 'DESERT EAGLE' },
          emoji: '🦅',
          sprite: 'desert_eagle',
          baseCost: 45,
          buyable: true,
          zone: 'sky',
          unlockedByDefault: false,
          unlockText: { id: 'Ular Gurun makan tikus pasir', en: 'Desert Snake eats sand mouse' },
          roleBadge: { id: 'Predator Puncak', en: 'Apex Predator' },
          levelBadge: { id: '📊 Predator Puncak Gurun (+4 🪙)', en: '📊 Desert Apex Predator (+4 🪙)' },
          description: {
            id: 'Elang Gurun terbang di udara panas mengincar Ular Gurun (+4 🪙 per makan).',
            en: 'Desert Eagles ride thermal currents hunting Desert Snakes (+4 🪙 per meal).'
          },
          ecosystemRole: {
            id: 'Predator puncak penjaga keseimbangan rantai makanan gurun.',
            en: 'Apex predator balancing the desert food chain.'
          }
        },
        {
          id: 'mushroom',
          name: { id: 'JAMUR GURUN', en: 'DESERT FUNGI' },
          emoji: '🍄',
          sprite: 'mushroom',
          baseCost: 0,
          buyable: false,
          zone: 'ground',
          unlockedByDefault: false,
          unlockText: { id: 'Hewan mati (60s lapar)', en: 'Animal dies (60s hungry)' },
          roleBadge: { id: 'Pengurai', en: 'Decomposer' },
          levelBadge: { id: '♻️ Pengurai Pasir', en: '♻️ Desert Decomposer' },
          description: {
            id: 'Mikroba & jamur pengurai yang mengembalikan nutrisi hewan mati ke pasir gurun.',
            en: 'Fungi and decomposers returning nutrients from dead animals to desert sand.'
          },
          ecosystemRole: {
            id: 'Menyuburkan tanah kering agar Kaktus baru dapat tumbuh.',
            en: 'Enriches dry soil so new Cacti can grow.'
          }
        }
      ]
    },

    // Kode untuk Gunung dan Tundra sudah ada, tapi keduanya belum bisa dipilih
    mountain: {
      id: 'mountain',
      selectable: false,
      icon: '⛰️',
      name: { id: 'Gunung', en: 'Mountain' },
      title: { id: 'EKOSISTEM PEGUNUNGAN ALPIN', en: 'ALPINE MOUNTAIN ECOSYSTEM' },
      difficulty: { id: 'Sulit', en: 'Hard' },
      costMultiplier: 1.8,
      coinRate: 0.4,
      cloudsToMerge: 3,
      weatherType: 'rain',
      chainOrder: ['alpine_grass', 'pika', 'mountain_fox', 'golden_eagle'],
      idealRatios: [],
      cards: []
    },
    tundra: {
      id: 'tundra',
      selectable: false,
      icon: '❄️',
      name: { id: 'Tundra', en: 'Tundra' },
      title: { id: 'EKOSISTEM TUNDRA KUTUB', en: 'ARCTIC TUNDRA ECOSYSTEM' },
      difficulty: { id: 'Ahli', en: 'Expert' },
      costMultiplier: 2.2,
      coinRate: 0.3,
      cloudsToMerge: 4,
      weatherType: 'snow',
      chainOrder: ['lichen', 'lemming', 'arctic_fox', 'snowy_owl'],
      idealRatios: [],
      cards: []
    }
  };

  // Universal progressive missions per biome
  global.ECO_MISSIONS = [
    {
      id: 'm1',
      title: { id: '☁️ Taruh Awan', en: '☁️ Place a Cloud' },
      desc: { id: 'Seret 1 kartu Awan ke langit', en: 'Drag 1 Cloud card to the sky' },
      diff: { id: 'Tutorial', en: 'Tutorial' },
      reward: 15,
      targetKey: 'cloudsPlaced',
      targetCount: 1
    },
    {
      id: 'm2',
      title: { id: '🌦️ Gabungkan Awan', en: '🌦️ Merge Clouds' },
      desc: { id: 'Gabungkan awan putih untuk memicu cuaca', en: 'Merge white clouds to trigger weather' },
      diff: { id: 'Mudah', en: 'Easy' },
      reward: 20,
      targetKey: 'merges',
      targetCount: 1
    },
    {
      id: 'm3',
      title: { id: '🌱 Tumbuhkan Produsen', en: '🌱 Grow Producers' },
      desc: { id: 'Miliki 3 petak Produsen tumbuh', en: 'Have 3 growing Producer tiles' },
      diff: { id: 'Mudah', en: 'Easy' },
      reward: 25,
      targetKey: 'producer',
      targetCount: 3
    },
    {
      id: 'm4',
      title: { id: '😋 Beri Makan', en: '😋 Feed the Chain' },
      desc: { id: 'Saksikan hewan selesai makan 2 kali', en: 'Have animals finish eating 2 times' },
      diff: { id: 'Sedang', en: 'Medium' },
      reward: 30,
      targetKey: 'mealsTotal',
      targetCount: 2
    },
    {
      id: 'm5',
      title: { id: '🦅 Lengkapi Rantai', en: '🦅 Complete the Chain' },
      desc: { id: 'Hadirkan seluruh tingkat trofik bioma ini', en: 'Have all trophic levels of this biome alive' },
      diff: { id: 'Sulit', en: 'Hard' },
      reward: 50,
      targetKey: 'allLevels',
      targetCount: 1
    },
    {
      id: 'm6',
      title: { id: '❤️ Seimbangkan Ekosistem', en: '❤️ Balance Ecosystem' },
      desc: { id: 'Capai Kesehatan Ekosistem 80%', en: 'Reach 80% Ecosystem Health' },
      diff: { id: 'Ahli', en: 'Expert' },
      reward: 65,
      targetKey: 'health',
      targetCount: 80
    }
  ];
})(window);
