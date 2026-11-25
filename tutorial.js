// Ecoborn V2 — Evolving Interactive Tutorial System (2D & 3D Isometric)
// Advances dynamically across gameplay milestones rather than showing only at startup.
(function (global) {
  'use strict';

  const STORAGE_KEY = 'ecoborn_evolving_tutorial_v1';

  const DEFAULT_STORE = {
    disabled: false,
    done: {},
    shown: {}
  };

  function loadStore() {
    try {
      if (typeof localStorage === 'undefined') return { ...DEFAULT_STORE, done: {}, shown: {} };
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STORE, done: {}, shown: {} };
      const parsed = JSON.parse(raw);
      return {
        disabled: Boolean(parsed.disabled),
        done: parsed.done || {},
        shown: parsed.shown || {}
      };
    } catch (_) {
      return { ...DEFAULT_STORE, done: {}, shown: {} };
    }
  }

  function saveStore(st) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
      }
    } catch (_) {}
  }

  const CHAPTERS_2D = [
    {
      id: '2d_intro',
      mode: '2d',
      chapterLabel: 'BAB 1 • PRODUSEN & CUACA',
      stepNum: '1/4',
      progress: 25,
      title: '🌱 Mulai dari Awan & Rumput',
      body: 'Seret kartu <strong>Rumput</strong> (atau seret dua <strong>Awan</strong> hingga bertumbukan menjadi Awan Hujan!) agar tanah mulai ditumbuhi produsen hijau.',
      hintDefault: '🎯 Tugas: Tumbuhkan minimal 2 petak rumput atau turunkan 1 Awan.',
      hintDone: '✅ Bagus! Rumput hijau mulai tumbuh dan siap memberi makan satwa!',
      targetSelector: '#deck-bar',
      unlockWhen: (s2) => !s2.menuVisible,
      isComplete: (s2) => s2.grassCount >= 2 || s2.cloudsPlaced >= 1 || s2.merges >= 1
    },
    {
      id: '2d_chain',
      mode: '2d',
      chapterLabel: 'BAB 2 • RANTAI MAKANAN & MISI',
      stepNum: '2/4',
      progress: 50,
      title: '🦗 Rantai Makanan & Misi Ekosistem',
      body: 'Setelah rumput tumbuh, letakkan <strong>Herbivora</strong> (seperti Belalang). Perhatikan <strong>Kartu Misi</strong> untuk membuka predator baru secara bertahap!',
      hintDefault: '🎯 Tugas: Letakkan minimal 1 satwa ke daratan dan cek progres Misi.',
      hintDone: '✅ Keren! Makhluk hidup sudah berinteraksi dalam rantai makanan!',
      targetSelector: '#mission-widget',
      unlockWhen: (s2) => !s2.menuVisible && (s2.grassCount >= 2 || s2.animalsCount >= 1),
      isComplete: (s2) => s2.animalsCount >= 1 && s2.mealsTotal >= 1
    },
    {
      id: '2d_biomes',
      mode: '2d',
      chapterLabel: 'BAB 3 • BIOMA & KECEPATAN',
      stepNum: '3/4',
      progress: 75,
      title: '🏜️ Jelajahi Bioma & Atur Waktu',
      body: 'Ekosistem berkembang seiring waktu! Kamu bisa mengganti kecepatan simulasi (<strong>1x–3x</strong>) atau berpindah ke bioma Gurun, Rawa & Tropis lewat pemilih bioma.',
      hintDefault: '🎯 Tugas: Kumpulkan ≥ 65 koin atau coba atur kecepatan simulasi.',
      hintDone: '✅ Hebat! Ekosistemmu makin matang untuk tantangan 3D!',
      targetSelector: '#biome-select-btn',
      unlockWhen: (s2) => !s2.menuVisible && (s2.mealsTotal >= 2 || s2.coins >= 65 || s2.animalsCount >= 2),
      isComplete: (s2) => s2.speed > 1 || s2.biomeId !== 'grassland' || s2.animalsCount >= 3
    },
    {
      id: '2d_portal3d',
      mode: '2d',
      chapterLabel: 'BAB 4 • DUNIA 3D ISOMETRIK',
      stepNum: '4/4',
      progress: 100,
      title: '🌍 Lanjutkan ke Pulau 3D & Kalimantan!',
      body: 'Siap simulasi skala pulau? Ketuk tombol <strong>🌍 3D</strong> untuk mengelola 6 bioma sekaligus — termasuk <strong>Lahan Gambut Kalimantan</strong>, desa manusia & simulasi bencana!',
      hintDefault: '🎯 Ketuk tombol 🌍 3D di kiri atas kapan saja untuk masuk.',
      hintDone: '✅ Tutorial 2D tuntas! Selamat bereksperimen di Mode 2D & 3D!',
      targetSelector: '#hud-iso-btn',
      unlockWhen: (s2) => !s2.menuVisible && (s2.animalsCount >= 3 || s2.coins >= 85),
      isComplete: () => false
    }
  ];

  const CHAPTERS_3D = [
    {
      id: '3d_place',
      mode: '3d',
      chapterLabel: 'BAB 1 (3D) • KENDALI PULAU',
      stepNum: '1/4',
      progress: 25,
      title: '🖐️ Ketuk Kartu & Lukis Ekosistem',
      body: 'Pilih kartu di bawah lalu ketuk/seret pada daratan pulau. <strong>Di HP:</strong> geser dengan 1 jari untuk menggeser peta dan <strong>cubit 2 jari</strong> untuk zoom!',
      hintDefault: '🎯 Tugas: Letakkan 2 kartu (misal Pohon, Rumput, atau Satwa) di pulau.',
      hintDone: '✅ Mantap! Kamu sudah menguasai penempatan kartu di Pulau 3D!',
      targetSelector: '.iso-dock-center',
      unlockWhen: (s3) => s3.active,
      isComplete: (s3) => s3.placements >= 2
    },
    {
      id: '3d_zoom_info',
      mode: '3d',
      chapterLabel: 'BAB 2 (3D) • SIMBIOSIS & INFO (i)',
      stepNum: '2/4',
      progress: 50,
      title: '🔍 Zoom Detail & Tombol Info Kejadian',
      body: 'Gunakan <strong>🔍+ / cubit 2 jari</strong> untuk melihat detail rumput & satwa. Saat muncul popup <strong>"Ayo Lihat!"</strong> atau klik tombol <strong>Simbiosis</strong>, tekan ikon <strong>( i )</strong> untuk penjelasan sains!',
      hintDefault: '🎯 Tugas: Lakukan Zoom In atau klik salah satu kejadian Simbiosis.',
      hintDone: '✅ Sempurna! Kamu kini bisa menginspeksi peristiwa alam secara detail!',
      targetSelector: '#iso-zoom-in-btn',
      unlockWhen: (s3) => s3.active && s3.placements >= 1,
      isComplete: (s3) => s3.zoomed || s3.openedInfo
    },
    {
      id: '3d_kalimantan',
      mode: '3d',
      chapterLabel: 'BAB 3 (3D) • GAMBUT KALIMANTAN',
      stepNum: '3/4',
      progress: 75,
      title: '🪵 Jaga Lahan Gambut Kalimantan!',
      body: 'Lihat bioma <strong>🪵 Gambut Kalimantan</strong> (habitat <strong>Orangutan & Enggang</strong>)! Jika terlalu banyak Sawit atau kemarau, gambut mengering memicu <strong>Kabut Asap</strong>. Jaga kelembabannya dengan <strong>Sekat Kanal</strong> & <strong>Purun/Jelutung</strong>!',
      hintDefault: '🎯 Tugas: Ketuk zona 🪵 Gambut atau ubah mode ke Gambut Kalimantan.',
      hintDone: '✅ Hebat! Menjaga air gambut = melindungi iklim & satwa Kalimantan!',
      targetSelector: '[data-zone="peatland"], #iso-mode-select',
      unlockWhen: (s3) => s3.active && (s3.placements >= 2 || s3.zoomed || s3.mapMode === 'peatland'),
      onEnter: () => {
        if (global.EcoIso3D && typeof global.EcoIso3D.focusBiomeZone === 'function') {
          const st = global.EcoIso3D.getTutorialState();
          if (st.mapMode === 'multi') global.EcoIso3D.focusBiomeZone('peatland');
        }
      },
      isComplete: (s3) => s3.mapMode === 'peatland' || s3.sekatCount >= 1
    },
    {
      id: '3d_village_disaster',
      mode: '3d',
      chapterLabel: 'BAB 4 (3D) • DESA & BENCANA',
      stepNum: '4/4',
      progress: 100,
      title: '🏡 Bangun Negeri & Uji Bencana Alam',
      body: 'Pasangkan manusia <strong>Laki-laki & Perempuan</strong> agar membangun rumah & ladang! Uji juga menu <strong>⚡ Bencana</strong> (termasuk Kebakaran Gambut / Pestisida) untuk melihat <strong>pilihan konsekuensi 3 detik</strong>.',
      hintDefault: '🎯 Kamu bisa membuka ulang panduan ini kapan saja lewat tombol 🎓.',
      hintDone: '✅ Semua Bab 3D dipelajari! Selamat menjaga keseimbangan Ecoborn!',
      targetSelector: '#iso-disaster-toggle-btn',
      unlockWhen: (s3) => s3.active && (s3.placements >= 4 || s3.sekatCount >= 1 || s3.sawConseq || s3.humans >= 2),
      isComplete: (s3) => s3.sawConseq || (s3.humans >= 2 && s3.houses >= 1)
    }
  ];

  let store = loadStore();
  let currentChapter = null;
  let visible = false;
  let dismissCooldownUntil = 0;

  let overlayEl = null;
  let spotEl = null;
  let cardEl = null;
  let chEl = null;
  let stepEl = null;
  let fillEl = null;
  let titleEl = null;
  let bodyEl = null;
  let hintEl = null;
  let skipBtn = null;
  let nextBtn = null;

  function queryDom() {
    if (typeof document === 'undefined') return false;
    overlayEl = document.getElementById('eco-tutorial-overlay');
    spotEl = document.getElementById('eco-tut-spotlight');
    cardEl = document.getElementById('eco-tut-card');
    chEl = document.getElementById('eco-tut-chapter');
    stepEl = document.getElementById('eco-tut-step');
    fillEl = document.getElementById('eco-tut-progress-fill');
    titleEl = document.getElementById('eco-tut-title');
    bodyEl = document.getElementById('eco-tut-body');
    hintEl = document.getElementById('eco-tut-hint');
    skipBtn = document.getElementById('eco-tut-skip');
    nextBtn = document.getElementById('eco-tut-next');
    return Boolean(overlayEl && cardEl);
  }

  function resolveTargetElement(selectorStr) {
    if (!selectorStr || typeof document === 'undefined') return null;
    const parts = selectorStr.split(',').map((s) => s.trim());
    for (let i = 0; i < parts.length; i++) {
      const el = document.querySelector(parts[i]);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) return el;
      }
    }
    return null;
  }

  function positionSpotlightAndCard(chapter) {
    if (!spotEl || !cardEl || typeof window === 'undefined') return;
    const vw = window.innerWidth || 390;
    const vh = window.innerHeight || 780;
    const target = resolveTargetElement(chapter.targetSelector);

    if (!target) {
      spotEl.classList.add('no-target');
      cardEl.style.left = `${Math.max(12, Math.floor((vw - Math.min(340, vw - 24)) * 0.5))}px`;
      cardEl.style.top = `${Math.max(24, Math.floor(vh * 0.25))}px`;
      return;
    }

    spotEl.classList.remove('no-target');
    const tr = target.getBoundingClientRect();
    const pad = 6;
    const sx = Math.max(4, tr.left - pad);
    const sy = Math.max(4, tr.top - pad);
    const sw = Math.min(vw - sx - 4, tr.width + pad * 2);
    const sh = Math.min(vh - sy - 4, tr.height + pad * 2);

    spotEl.style.left = `${Math.round(sx)}px`;
    spotEl.style.top = `${Math.round(sy)}px`;
    spotEl.style.width = `${Math.round(sw)}px`;
    spotEl.style.height = `${Math.round(sh)}px`;

    const cardW = Math.min(340, vw - 24);
    const cardH = cardEl.offsetHeight || 195;
    let cx = Math.min(Math.max(12, sx + sw * 0.5 - cardW * 0.5), vw - cardW - 12);
    let cy = sy + sh + 12;
    if (cy + cardH > vh - 12) {
      cy = sy - cardH - 12;
    }
    if (cy < 12) {
      cy = Math.max(12, Math.min(vh - cardH - 12, vh * 0.34));
    }
    cardEl.style.left = `${Math.round(cx)}px`;
    cardEl.style.top = `${Math.round(cy)}px`;
  }

  function renderChapter(ch, completed) {
    if (!queryDom()) return;
    currentChapter = ch;
    visible = true;
    overlayEl.classList.remove('hidden');
    if (chEl) chEl.textContent = ch.chapterLabel;
    if (stepEl) stepEl.textContent = ch.stepNum;
    if (fillEl) fillEl.style.width = `${ch.progress}%`;
    if (titleEl) titleEl.textContent = ch.title;
    if (bodyEl) bodyEl.innerHTML = ch.body;
    if (hintEl) hintEl.textContent = completed ? ch.hintDone : ch.hintDefault;
    if (nextBtn) nextBtn.textContent = completed ? 'Lanjut →' : 'Mengerti';
    positionSpotlightAndCard(ch);
  }

  function hideTutorial(markDone = true, disableFuture = false) {
    if (markDone && currentChapter) {
      store.done[currentChapter.id] = true;
      store.shown[currentChapter.id] = true;
    }
    if (disableFuture) store.disabled = true;
    saveStore(store);
    visible = false;
    currentChapter = null;
    dismissCooldownUntil = Date.now() + 2500;
    if (overlayEl) overlayEl.classList.add('hidden');
  }

  function getActiveContext() {
    const s3 = global.EcoIso3D && typeof global.EcoIso3D.getTutorialState === 'function'
      ? global.EcoIso3D.getTutorialState()
      : { active: false };
    const s2 = global.Eco2D && typeof global.Eco2D.getTutorialState === 'function'
      ? global.Eco2D.getTutorialState()
      : { menuVisible: true };
    return { mode: s3.active ? '3d' : '2d', s2, s3 };
  }

  function pollTutorial() {
    if (typeof document === 'undefined') return;
    const { mode, s2, s3 } = getActiveContext();
    if (mode === '2d' && s2.menuVisible) {
      if (visible && overlayEl) {
        visible = false;
        overlayEl.classList.add('hidden');
      }
      return;
    }

    const list = mode === '3d' ? CHAPTERS_3D : CHAPTERS_2D;
    const stateObj = mode === '3d' ? s3 : s2;

    if (visible && currentChapter) {
      if (currentChapter.mode !== mode) {
        visible = false;
        currentChapter = null;
        if (overlayEl) overlayEl.classList.add('hidden');
      } else {
        const doneNow = Boolean(currentChapter.isComplete(stateObj));
        if (doneNow && !store.done[currentChapter.id]) {
          store.done[currentChapter.id] = true;
          saveStore(store);
          renderChapter(currentChapter, true);
        } else {
          positionSpotlightAndCard(currentChapter);
        }
        return;
      }
    }

    if (store.disabled || Date.now() < dismissCooldownUntil) return;

    // Evolve to the first unlocked, not-yet-shown chapter for current mode!
    for (let i = 0; i < list.length; i++) {
      const ch = list[i];
      if (store.done[ch.id] || store.shown[ch.id]) continue;
      if (ch.unlockWhen(stateObj)) {
        store.shown[ch.id] = true;
        saveStore(store);
        if (typeof ch.onEnter === 'function') ch.onEnter();
        renderChapter(ch, Boolean(ch.isComplete(stateObj)));
        break;
      }
    }
  }

  function openManualForCurrentMode() {
    store.disabled = false;
    const { mode, s2, s3 } = getActiveContext();
    const list = mode === '3d' ? CHAPTERS_3D : CHAPTERS_2D;
    const stateObj = mode === '3d' ? s3 : s2;

    let target = list.find((ch) => !store.done[ch.id]);
    if (!target) {
      // Reset progress for current mode so user can replay evolving chapters!
      list.forEach((ch) => {
        delete store.done[ch.id];
        delete store.shown[ch.id];
      });
      target = list[0];
    }
    store.shown[target.id] = true;
    saveStore(store);
    if (typeof target.onEnter === 'function') target.onEnter();
    renderChapter(target, Boolean(target.isComplete(stateObj)));
  }

  function bindUiEvents() {
    if (!queryDom()) return;
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prev = currentChapter;
        hideTutorial(true, false);
        // Immediately offer next unlocked chapter if player already reached its milestone
        const { mode, s2, s3 } = getActiveContext();
        const list = mode === '3d' ? CHAPTERS_3D : CHAPTERS_2D;
        const stateObj = mode === '3d' ? s3 : s2;
        const idx = prev ? list.findIndex((c) => c.id === prev.id) : -1;
        const nextCh = list[idx + 1];
        if (nextCh && nextCh.unlockWhen(stateObj) && !store.done[nextCh.id]) {
          store.shown[nextCh.id] = true;
          saveStore(store);
          if (typeof nextCh.onEnter === 'function') nextCh.onEnter();
          renderChapter(nextCh, Boolean(nextCh.isComplete(stateObj)));
        }
      });
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideTutorial(true, true);
      });
    }
    const hudBtn = document.getElementById('hud-tutorial-btn');
    if (hudBtn) hudBtn.addEventListener('click', openManualForCurrentMode);
    const isoBtn = document.getElementById('iso-tutorial-btn');
    if (isoBtn) isoBtn.addEventListener('click', openManualForCurrentMode);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (visible && currentChapter) positionSpotlightAndCard(currentChapter);
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        bindUiEvents();
        setInterval(pollTutorial, 850);
      });
    } else {
      bindUiEvents();
      setInterval(pollTutorial, 850);
    }
  }

  global.EcoTutorial = {
    CHAPTERS_2D,
    CHAPTERS_3D,
    openManualForCurrentMode,
    pollTutorial,
    resetAll() {
      store = { disabled: false, done: {}, shown: {} };
      saveStore(store);
    },
    getStore: () => store
  };
})(typeof window !== 'undefined' ? window : globalThis);
