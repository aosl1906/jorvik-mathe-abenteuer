/**
 * Jorvik Mathe-Abenteuer – Hauptsteuerung (Timer, Modi, Schutzschild, Schatzkammer)
 */
(function () {
  'use strict';

  const MG = window.MathGenerator;
  const Lab = window.LabyrinthEngine;
  const Sound = window.SoundEngine;
  const Artworks = window.ArtworkGenerator;

  const STORAGE_KEYS = {
    VAULT: 'jorvik_mathe_vault_v1',
    STATS: 'jorvik_mathe_stats_v1'
  };

  const QUEST_DURATION_SEC = 20 * 60; // 20:00 Minuten
  const isCoarsePointer = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  let scratchpad = null;
  let activeInputEl = null;

  const loadedStats = loadJSON(STORAGE_KEYS.STATS, {});

  // =========================================================================
  // Zustand
  // =========================================================================
  const state = {
    activeMode: 'labyrinth',
    activeTopics: Object.values(MG.CATEGORIES),

    // Timer
    timerSecondsLeft: QUEST_DURATION_SEC,
    timerRunning: false,
    timerIntervalId: null,

    // Anti-Leichtsinns-Schutzschild
    taskShownAt: Date.now(),
    taskAttempts: 0,
    taskLocked: false,
    easyTasksRemaining: 0,

    // Mode 1: Bild-Puzzle
    gridSize: 12,
    artworks: Artworks.getArtworks(),
    currentArtworkIndex: 0,
    revealedTiles: [], // Array of booleans
    currentTask: null,
    puzzleCompleted: false,

    // Mode 3: Strategisches Licht-Labyrinth
    labyrinthSize: 'compact',
    labyrinthLevel: null,
    labyrinthCompleted: false,
    candidateTasks: [],
    selectedTaskIndex: 0,
    selectedObstacleId: null,
    hoveredObstacleId: null,
    hoveredComboIds: null,
    pendingLabyrinthTimeoutId: null,

    // Mode 2: Fehler-Detektiv
    lukasExam: [],
    lukasDecisions: {}, // { [itemId]: { choice: 'correct' | 'error', val: '', num: '', den: '', reason: '' } }
    examGraded: false,

    // Persistierte Daten
    vault: loadJSON(STORAGE_KEYS.VAULT, []),
    stats: {
      solved: Number(loadedStats.solved) || 0,
      stars: Number(loadedStats.stars) || 0,
      labyrinths: Number(loadedStats.labyrinths) || 0,
      topicPerf: loadedStats.topicPerf && typeof loadedStats.topicPerf === 'object' ? loadedStats.topicPerf : {}
    }
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(state.vault));
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.stats));
    } catch {
      // Ignorieren falls Storage voll
    }
  }

  // =========================================================================
  // DOM-Referenzen
  // =========================================================================
  const els = {
    timerDisplay: document.getElementById('timerDisplay'),
    timerToggleBtn: document.getElementById('timerToggleBtn'),
    timerResetBtn: document.getElementById('timerResetBtn'),
    questProgressBar: document.getElementById('questProgressBar'),
    questModal: document.getElementById('questModal'),
    questContinueBtn: document.getElementById('questContinueBtn'),
    questResetCloseBtn: document.getElementById('questResetCloseBtn'),

    muteBtn: document.getElementById('muteBtn'),
    modeTabs: document.querySelectorAll('.mode-tab'),
    modeSections: document.querySelectorAll('.mode-section'),
    topicToggleBtn: document.getElementById('topicToggleBtn'),
    topicSummaryText: document.getElementById('topicSummaryText'),
    topicDrawer: document.getElementById('topicDrawer'),
    topicFilters: document.getElementById('topicFilters'),
    topicSelectAllBtn: document.getElementById('topicSelectAllBtn'),
    shieldStatus: document.getElementById('shieldStatus'),
    vaultCountBadge: document.getElementById('vaultCountBadge'),

    // Mode 1 & 3 (Bild-Puzzle & Licht-Labyrinth)
    labyrinthToolbar: document.getElementById('labyrinthToolbar'),
    puzzleToolbar: document.getElementById('puzzleToolbar'),
    labCompactBtn: document.getElementById('labCompactBtn'),
    labMasterBtn: document.getElementById('labMasterBtn'),
    labSolvedBadge: document.getElementById('labSolvedBadge'),
    newLabyrinthBtn: document.getElementById('newLabyrinthBtn'),
    labyrinthStageCard: document.getElementById('labyrinthStageCard'),
    puzzleStageCard: document.getElementById('puzzleStageCard'),
    labyrinthTitle: document.getElementById('labyrinthTitle'),
    labyrinthSubtitle: document.getElementById('labyrinthSubtitle'),
    labyrinthBeamStatus: document.getElementById('labyrinthBeamStatus'),
    labyrinthBoardWrap: document.getElementById('labyrinthBoardWrap'),
    labyrinthGrid: document.getElementById('labyrinthGrid'),
    labyrinthBeamSvg: document.getElementById('labyrinthBeamSvg'),
    labyrinthObstacleList: document.getElementById('labyrinthObstacleList'),
    labyrinthCompletedBanner: document.getElementById('labyrinthCompletedBanner'),
    nextLabyrinthBtn: document.getElementById('nextLabyrinthBtn'),
    labyrinthTaskPoolWrap: document.getElementById('labyrinthTaskPoolWrap'),
    labyrinthTargetHint: document.getElementById('labyrinthTargetHint'),
    rerollTasksBtn: document.getElementById('rerollTasksBtn'),
    labyrinthTaskGrid: document.getElementById('labyrinthTaskGrid'),

    grid12Btn: document.getElementById('grid12Btn'),
    grid16Btn: document.getElementById('grid16Btn'),
    artworkSelect: document.getElementById('artworkSelect'),
    customImageInput: document.getElementById('customImageInput'),
    puzzleTitle: document.getElementById('puzzleTitle'),
    puzzleSubtitle: document.getElementById('puzzleSubtitle'),
    tilesRemainingText: document.getElementById('tilesRemainingText'),
    puzzleBoard: document.getElementById('puzzleBoard'),
    puzzleImage: document.getElementById('puzzleImage'),
    puzzleTiles: document.getElementById('puzzleTiles'),
    puzzleCompletedBanner: document.getElementById('puzzleCompletedBanner'),
    nextPuzzleBtn: document.getElementById('nextPuzzleBtn'),

    taskCategoryBadge: document.getElementById('taskCategoryBadge'),
    difficultyBadge: document.getElementById('difficultyBadge'),
    taskPrompt: document.getElementById('taskPrompt'),
    taskForm: document.getElementById('taskForm'),
    integerInputWrap: document.getElementById('integerInputWrap'),
    integerInput: document.getElementById('integerInput'),
    integerUnitLabel: document.getElementById('integerUnitLabel'),
    clearIntegerBtn: document.getElementById('clearIntegerBtn'),
    fractionInputWrap: document.getElementById('fractionInputWrap'),
    numInput: document.getElementById('numInput'),
    denInput: document.getElementById('denInput'),
    clearFractionBtn: document.getElementById('clearFractionBtn'),
    pencilNumpad: document.getElementById('pencilNumpad'),
    switchFracFieldBtn: document.getElementById('switchFracFieldBtn'),
    submitAnswerBtn: document.getElementById('submitAnswerBtn'),
    hintBtn: document.getElementById('hintBtn'),
    hintBox: document.getElementById('hintBox'),
    feedbackBox: document.getElementById('feedbackBox'),
    nextTaskWrap: document.getElementById('nextTaskWrap'),
    nextTaskBtn: document.getElementById('nextTaskBtn'),

    // Mode 2
    examinerStars: document.getElementById('examinerStars'),
    newExamBtn: document.getElementById('newExamBtn'),
    examProgressText: document.getElementById('examProgressText'),
    lukasExamList: document.getElementById('lukasExamList'),
    gradeExamBtn: document.getElementById('gradeExamBtn'),
    examSummaryBox: document.getElementById('examSummaryBox'),

    // Vault
    statLabyrinths: document.getElementById('statLabyrinths'),
    statSolved: document.getElementById('statSolved'),
    statPuzzles: document.getElementById('statPuzzles'),
    statStars: document.getElementById('statStars'),
    vaultGallery: document.getElementById('vaultGallery')
  };

  // =========================================================================
  // 20-Minuten-Abenteuer-Timer
  // =========================================================================
  function renderTimer() {
    const mins = Math.floor(state.timerSecondsLeft / 60);
    const secs = state.timerSecondsLeft % 60;
    els.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const pct = ((QUEST_DURATION_SEC - state.timerSecondsLeft) / QUEST_DURATION_SEC) * 100;
    els.questProgressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    els.timerToggleBtn.textContent = state.timerRunning ? '⏸' : '▶';
  }

  function startTimer() {
    if (state.timerRunning) return;
    if (state.timerSecondsLeft <= 0) state.timerSecondsLeft = QUEST_DURATION_SEC;
    state.timerRunning = true;
    renderTimer();
    state.timerIntervalId = setInterval(() => {
      if (state.timerSecondsLeft > 0) {
        state.timerSecondsLeft -= 1;
        renderTimer();
      }
      if (state.timerSecondsLeft <= 0) {
        pauseTimer();
        Sound.playFanfare();
        els.questModal.classList.remove('hidden');
      }
    }, 1000);
  }

  function pauseTimer() {
    state.timerRunning = false;
    if (state.timerIntervalId) {
      clearInterval(state.timerIntervalId);
      state.timerIntervalId = null;
    }
    renderTimer();
  }

  function resetTimer() {
    pauseTimer();
    state.timerSecondsLeft = QUEST_DURATION_SEC;
    renderTimer();
  }

  // =========================================================================
  // Themen-Filter & Mute & Mode-Switching
  // =========================================================================
  function renderTopicFilters() {
    els.topicFilters.innerHTML = '';
    const entries = Object.entries(MG.CATEGORY_LABELS);
    entries.forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const active = state.activeTopics.includes(key);
      btn.className = `topic-pill ${active ? 'active' : ''}`;
      btn.textContent = (active ? '✓ ' : '') + label;
      btn.addEventListener('click', () => {
        if (state.activeTopics.includes(key)) {
          if (state.activeTopics.length === 1) {
            // Mindestens ein Thema muss aktiv bleiben
            return;
          }
          state.activeTopics = state.activeTopics.filter(t => t !== key);
        } else {
          state.activeTopics.push(key);
        }
        renderTopicFilters();
        // Neue Aufgaben aus den gewählten Themen laden
        refreshActiveModeTasks();
      });
      els.topicFilters.appendChild(btn);
    });

    if (els.topicSummaryText) {
      const total = entries.length;
      const activeCount = state.activeTopics.length;
      if (activeCount === total) {
        els.topicSummaryText.textContent = `Themen: Alle (${total}/${total})`;
      } else {
        const names = entries
          .filter(([k]) => state.activeTopics.includes(k))
          .map(([, label]) => label);
        els.topicSummaryText.textContent = `Themen (${activeCount}/${total}): ${names.join(', ')}`;
      }
    }
  }

  function updateMuteUI() {
    els.muteBtn.textContent = Sound.isMuted() ? '🔇' : '🔊';
    els.muteBtn.title = Sound.isMuted() ? 'Sound einschalten' : 'Sound stummschalten';
  }

  function recordTopicAttempt(category, isSuccess, firstTry) {
    if (!category) return;
    if (!state.stats.topicPerf || typeof state.stats.topicPerf !== 'object') {
      state.stats.topicPerf = {};
    }
    const existing = state.stats.topicPerf[category] || {
      solved: 0,
      errors: 0,
      recentErrorEMA: 0.25
    };
    if (isSuccess) {
      existing.solved += 1;
      if (firstTry) {
        existing.recentErrorEMA = Math.max(0.05, existing.recentErrorEMA * 0.85);
      }
    } else {
      existing.errors += 1;
      existing.recentErrorEMA = Math.min(0.95, existing.recentErrorEMA * 0.8 + 0.2);
    }
    state.stats.topicPerf[category] = existing;
    saveState();
  }

  function refreshActiveModeTasks() {
    if (state.activeMode === 'labyrinth') {
      if (!state.labyrinthLevel) {
        initLabyrinthLevel();
      } else {
        loadLabyrinthCandidateTasks();
      }
    } else if (state.activeMode === 'puzzle') {
      loadNextPuzzleTask();
    }
  }

  function switchMode(mode) {
    state.activeMode = mode;
    els.modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    const isBoardMode = mode === 'labyrinth' || mode === 'puzzle';
    els.modeSections.forEach(sec => {
      const shouldShow = sec.id === 'mode-puzzle' ? isBoardMode : sec.id === `mode-${mode}`;
      sec.classList.toggle('active', shouldShow);
    });

    const isLab = mode === 'labyrinth';
    if (els.labyrinthToolbar) els.labyrinthToolbar.classList.toggle('hidden', !isLab);
    if (els.labyrinthStageCard) els.labyrinthStageCard.classList.toggle('hidden', !isLab);
    if (els.labyrinthTaskPoolWrap) els.labyrinthTaskPoolWrap.classList.toggle('hidden', !isLab);
    if (els.puzzleToolbar) els.puzzleToolbar.classList.toggle('hidden', isLab);
    if (els.puzzleStageCard) els.puzzleStageCard.classList.toggle('hidden', isLab);

    if (mode === 'labyrinth') {
      if (!state.labyrinthLevel) {
        initLabyrinthLevel();
      } else {
        renderLabyrinthBoard();
        if (state.candidateTasks.length > 0) {
          selectCandidateTask(state.selectedTaskIndex, false);
        } else {
          loadLabyrinthCandidateTasks();
        }
      }
    } else if (mode === 'puzzle') {
      loadNextPuzzleTask();
    } else if (mode === 'vault') {
      renderVault();
    } else if (mode === 'detective' && state.lukasExam.length === 0) {
      startNewLukasExam();
    }
  }

  // =========================================================================
  // Spielmodus 1: Magisches Bild-Puzzle
  // =========================================================================
  function populateArtworkSelect() {
    els.artworkSelect.innerHTML = '';
    state.artworks.forEach((art, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = art.title;
      els.artworkSelect.appendChild(opt);
    });
    els.artworkSelect.value = String(state.currentArtworkIndex);
  }

  function initPuzzleBoard() {
    const art = state.artworks[state.currentArtworkIndex] || state.artworks[0];
    els.puzzleTitle.textContent = art.title;
    els.puzzleSubtitle.textContent = art.subtitle || 'Jorvik-Abenteuer';
    els.puzzleImage.src = art.src;
    els.puzzleCompletedBanner.classList.add('hidden');
    state.puzzleCompleted = false;

    els.puzzleBoard.classList.toggle('grid-12', state.gridSize === 12);
    els.puzzleBoard.classList.toggle('grid-16', state.gridSize === 16);

    state.revealedTiles = Array(state.gridSize).fill(false);
    renderTiles();
  }

  function renderTiles() {
    els.puzzleTiles.innerHTML = '';
    const crystalIcons = ['✦', '❖', '✧', '💎'];
    state.revealedTiles.forEach((isRevealed, idx) => {
      const tile = document.createElement('div');
      tile.className = 'crystal-tile' + (isRevealed ? ' revealed' : '');
      tile.dataset.index = String(idx);
      tile.textContent = crystalIcons[idx % crystalIcons.length];
      els.puzzleTiles.appendChild(tile);
    });
    updateRemainingCounter();
  }

  function updateRemainingCounter() {
    const remaining = state.revealedTiles.filter(r => !r).length;
    els.tilesRemainingText.textContent = String(remaining);
  }

  function shatterRandomTile() {
    const hiddenIndices = [];
    state.revealedTiles.forEach((rev, i) => {
      if (!rev) hiddenIndices.push(i);
    });
    if (hiddenIndices.length === 0) return;

    const pickIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    state.revealedTiles[pickIdx] = true;

    const tileEl = els.puzzleTiles.querySelector(`.crystal-tile[data-index="${pickIdx}"]`);
    if (tileEl) {
      tileEl.classList.add('shattering');
      setTimeout(() => tileEl.classList.add('revealed'), 580);
    }
    Sound.playTileShatter();
    updateRemainingCounter();

    if (hiddenIndices.length === 1) {
      // Alle Kacheln aufgedeckt!
      state.puzzleCompleted = true;
      setTimeout(() => {
        Sound.playFanfare();
        els.puzzleCompletedBanner.classList.remove('hidden');
        unlockCurrentArtworkInVault();
      }, 620);
    }
  }

  function unlockCurrentArtworkInVault() {
    const art = state.artworks[state.currentArtworkIndex];
    if (!art) return;
    if (!state.vault.some(v => v.id === art.id)) {
      state.vault.push({
        id: art.id,
        title: art.title,
        subtitle: art.subtitle,
        src: art.src,
        unlockedAt: new Date().toLocaleDateString('de-DE')
      });
      saveState();
      updateVaultBadge();
    }
  }

  function unlockBonusArtworkInVault() {
    const nextArt = state.artworks.find(art => !state.vault.some(v => v.id === art.id));
    if (!nextArt) return null;
    state.vault.push({
      id: nextArt.id,
      title: nextArt.title,
      subtitle: nextArt.subtitle,
      src: nextArt.src,
      unlockedAt: new Date().toLocaleDateString('de-DE')
    });
    saveState();
    updateVaultBadge();
    return nextArt;
  }

  // =========================================================================
  // Spielmodus 3: Strategisches Licht-Labyrinth (Zahlenblick)
  // =========================================================================
  function getEmitterArrow(dir) {
    return { U: '↑', D: '↓', L: '←', R: '→' }[dir] || '✦';
  }

  function renderObstacleGraphicHTML(obs) {
    if (obs.type === 'mirror') {
      const isFwd = obs.state === '/';
      const ax1 = isFwd ? 12 : 12;
      const ay1 = isFwd ? 52 : 12;
      const ax2 = isFwd ? 52 : 52;
      const ay2 = isFwd ? 12 : 52;
      const gx1 = isFwd ? 15 : 15;
      const gy1 = isFwd ? 15 : 49;
      const gx2 = isFwd ? 49 : 49;
      const gy2 = isFwd ? 49 : 15;
      return `
        <svg class="lab-obs-svg" viewBox="0 0 64 64" aria-hidden="true">
          <line x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}" stroke="rgba(243, 200, 107, 0.42)" stroke-width="2.5" stroke-dasharray="4 4" stroke-linecap="round" />
          <path d="M 22 10 A 22 22 0 0 1 42 10" fill="none" stroke="rgba(243, 200, 107, 0.78)" stroke-width="2" stroke-linecap="round" />
          <polyline points="38,7 43,10 38,13" fill="none" stroke="rgba(243, 200, 107, 0.85)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="#5eead4" stroke-width="7.5" stroke-linecap="round" opacity="0.45" />
          <line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="#a5f3fc" stroke-width="5" stroke-linecap="round" />
          <line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
          <circle cx="${ax1}" cy="${ay1}" r="3.6" fill="#f3c86b" />
          <circle cx="${ax2}" cy="${ay2}" r="3.6" fill="#f3c86b" />
        </svg>
      `;
    }

    if (obs.type === 'prism') {
      const isReflect = obs.state === 'reflect';
      const isFwd = obs.deflectSlash === '/';
      const dx1 = 18;
      const dy1 = isFwd ? 46 : 18;
      const dx2 = 46;
      const dy2 = isFwd ? 18 : 46;
      if (isReflect) {
        return `
          <svg class="lab-obs-svg" viewBox="0 0 64 64" aria-hidden="true">
            <line x1="6" y1="32" x2="58" y2="32" stroke="rgba(94, 234, 212, 0.32)" stroke-width="1.8" stroke-dasharray="3 3" />
            <line x1="32" y1="6" x2="32" y2="58" stroke="rgba(94, 234, 212, 0.32)" stroke-width="1.8" stroke-dasharray="3 3" />
            <polygon points="32,7 57,32 32,57 7,32" fill="rgba(167, 139, 250, 0.34)" stroke="#f3c86b" stroke-width="2.6" stroke-linejoin="round" />
            <line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="#fde047" stroke-width="6.5" stroke-linecap="round" />
            <line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        `;
      }
      return `
        <svg class="lab-obs-svg" viewBox="0 0 64 64" aria-hidden="true">
          <polygon points="32,7 57,32 32,57 7,32" fill="rgba(196, 181, 253, 0.1)" stroke="#c4b5fd" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round" />
          <line x1="7" y1="32" x2="57" y2="32" stroke="#5eead4" stroke-width="2.8" stroke-linecap="round" />
          <line x1="32" y1="7" x2="32" y2="57" stroke="#5eead4" stroke-width="2.8" stroke-linecap="round" />
          <line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="#f3c86b" stroke-width="3.2" stroke-dasharray="4 3" stroke-linecap="round" opacity="0.9" />
        </svg>
      `;
    }

    const isOpen = obs.state === 'open';
    const pillarFill = isOpen ? '#34d399' : '#f59e0b';
    if (!isOpen) {
      return `
        <svg class="lab-obs-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="12" width="9" height="40" rx="3" fill="${pillarFill}" opacity="0.85" />
          <rect x="47" y="12" width="9" height="40" rx="3" fill="${pillarFill}" opacity="0.85" />
          <line x1="17" y1="22" x2="47" y2="22" stroke="#f87171" stroke-width="3.5" />
          <line x1="17" y1="42" x2="47" y2="42" stroke="#f87171" stroke-width="3.5" />
          <line x1="18" y1="16" x2="46" y2="48" stroke="#fbbf24" stroke-width="2.8" stroke-linecap="round" />
          <line x1="46" y1="16" x2="18" y2="48" stroke="#fbbf24" stroke-width="2.8" stroke-linecap="round" />
          <path d="M 27 28 V 23 a 5 5 0 0 1 10 0 V 28" fill="none" stroke="#fff7ed" stroke-width="2.6" stroke-linecap="round" />
          <rect x="24" y="28" width="16" height="13" rx="3" fill="#fbbf24" stroke="#10231e" stroke-width="1.8" />
        </svg>
      `;
    }
    return `
      <svg class="lab-obs-svg" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="12" width="8" height="40" rx="3" fill="${pillarFill}" opacity="0.72" />
        <rect x="48" y="12" width="8" height="40" rx="3" fill="${pillarFill}" opacity="0.72" />
        <line x1="16" y1="14" x2="22" y2="9" stroke="#34d399" stroke-width="2.8" stroke-linecap="round" />
        <line x1="48" y1="14" x2="42" y2="9" stroke="#34d399" stroke-width="2.8" stroke-linecap="round" />
        <line x1="12" y1="32" x2="52" y2="32" stroke="#5eead4" stroke-width="2.8" stroke-dasharray="4 3" stroke-linecap="round" />
        <line x1="32" y1="10" x2="32" y2="54" stroke="#34d399" stroke-width="2.8" stroke-dasharray="4 3" stroke-linecap="round" />
      </svg>
    `;
  }

  function getPreviewTraceForObstacle(level, targetIds) {
    if (!level || !targetIds) return null;
    const idList = Array.isArray(targetIds) ? targetIds : [targetIds];
    const idSet = new Set(idList.filter(Boolean));
    if (idSet.size === 0) return null;

    const baseTrace = Lab.traceBeam(level);
    const baseHitSet = new Set(baseTrace.hitObstacleIds || []);
    const targets = (level.obstacles || []).filter(o => idSet.has(o.id));
    const needBridge = targets.length > 0
      && targets.every(t => !t.isDecoy && !baseHitSet.has(t.id) && typeof t.pathOrder === 'number');
    const minTargetOrder = needBridge
      ? Math.min(...targets.map(t => t.pathOrder))
      : null;

    const clonedObstacles = (level.obstacles || []).map(o => {
      const copy = { ...o };
      if (idSet.has(copy.id)) {
        if (!copy.locked) {
          if (!copy.isDecoy && copy.state !== copy.solvedState) {
            copy.state = copy.solvedState;
          } else if (copy.type === 'mirror') {
            copy.state = copy.state === '/' ? '\\' : '/';
          } else if (copy.type === 'gate') {
            copy.state = copy.state === 'open' ? 'closed' : 'open';
          } else if (copy.type === 'prism') {
            copy.state = copy.state === 'pass' ? 'reflect' : 'pass';
          }
        }
      } else if (minTargetOrder !== null && !copy.isDecoy && typeof copy.pathOrder === 'number' && copy.pathOrder < minTargetOrder) {
        copy.state = copy.solvedState;
      }
      return copy;
    });
    return Lab.traceBeam({ ...level, obstacles: clonedObstacles });
  }

  function renderLabyrinthBeamSvg(baseTrace) {
    const level = state.labyrinthLevel;
    if (!els.labyrinthBeamSvg || !level || !baseTrace) return;

    els.labyrinthBeamSvg.setAttribute('viewBox', `0 0 ${level.cols} ${level.rows}`);
    const ptsStr = baseTrace.points.map(p => `${(p.c + 0.5).toFixed(3)},${(p.r + 0.5).toFixed(3)}`).join(' ');
    const beamClass = baseTrace.hitTarget ? 'lab-beam-line is-victory' : 'lab-beam-line';

    let previewMarkup = '';
    const previewIds = (Array.isArray(state.hoveredComboIds) && state.hoveredComboIds.length > 0)
      ? state.hoveredComboIds
      : (state.hoveredObstacleId || state.selectedObstacleId);
    if (previewIds && !state.labyrinthCompleted) {
      const previewTrace = getPreviewTraceForObstacle(level, previewIds);
      if (previewTrace && previewTrace.points.length > 0) {
        const previewPts = previewTrace.points
          .map(p => `${(p.c + 0.5).toFixed(3)},${(p.r + 0.5).toFixed(3)}`)
          .join(' ');
        const previewCls = previewTrace.hitTarget ? 'lab-beam-preview is-victory-preview' : 'lab-beam-preview';
        previewMarkup = `<polyline class="${previewCls}" points="${previewPts}" />`;
      }
    }

    els.labyrinthBeamSvg.innerHTML = `
      <polyline class="lab-beam-glow ${baseTrace.hitTarget ? 'is-victory' : ''}" points="${ptsStr}" />
      <polyline class="${beamClass}" points="${ptsStr}" />
      ${previewMarkup}
    `;
  }

  function updateLabyrinthTargetHint() {
    if (!els.labyrinthTargetHint || !state.labyrinthLevel) return;
    const comboPairs = Lab.findComboPairs(state.labyrinthLevel);

    if (Array.isArray(state.hoveredComboIds) && state.hoveredComboIds.length >= 2) {
      els.labyrinthTargetHint.innerHTML =
        '⚡ <strong>Kombo-Vorschau:</strong> Eine Zahl für beide Runen schaltet 2 Bauteile zugleich!';
      return;
    }

    const activeId = state.hoveredObstacleId || state.selectedObstacleId;
    if (activeId) {
      const obs = state.labyrinthLevel.obstacles.find(o => o.id === activeId);
      const profile = obs && MG.getConditionMeta(obs.conditionId);
      if (obs && profile) {
        if (obs.locked) {
          els.labyrinthTargetHint.innerHTML = '✓ <strong>Bauteil sitzt bereits perfekt!</strong>';
          return;
        }
        if (obs.isGuard && obs.state === obs.solvedState) {
          els.labyrinthTargetHint.innerHTML =
            `⚠️ <strong>Schon offen!</strong> Vermeide Ergebnisse mit <strong>${profile.icon} ${profile.shortLabel}</strong>`;
          return;
        }
        const pair = comboPairs.find(p => p.obsA.id === obs.id || p.obsB.id === obs.id);
        if (pair) {
          const partner = pair.obsA.id === obs.id ? pair.obsB : pair.obsA;
          const partnerMeta = MG.getConditionMeta(partner.conditionId);
          if (partnerMeta) {
            els.labyrinthTargetHint.innerHTML =
              `🎯 <strong>${profile.icon} ${profile.shortLabel}</strong> • ⚡ Kombo möglich mit <strong>${partnerMeta.icon} ${partnerMeta.shortLabel}</strong>!`;
            return;
          }
        }
        els.labyrinthTargetHint.innerHTML =
          `🎯 Gesucht: <strong>${profile.icon} ${profile.shortLabel}</strong>`;
        return;
      }
    }

    if (comboPairs.length > 0) {
      const pA = MG.getConditionMeta(comboPairs[0].obsA.conditionId);
      const pB = MG.getConditionMeta(comboPairs[0].obsB.conditionId);
      if (pA && pB) {
        els.labyrinthTargetHint.innerHTML =
          `⚡ <strong>Kombo-Tipp:</strong> Suche eine Aufgabe, die <strong>${pA.icon} ${pA.shortLabel}</strong> + <strong>${pB.icon} ${pB.shortLabel}</strong> zugleich erfüllt!`;
        return;
      }
    }

    els.labyrinthTargetHint.textContent = '🎯 Wähle eine Aufgabe für die nächste offene Rune!';
  }

  function clearPendingLabyrinthTimeout() {
    if (state.pendingLabyrinthTimeoutId) {
      clearTimeout(state.pendingLabyrinthTimeoutId);
      state.pendingLabyrinthTimeoutId = null;
    }
  }

  function initLabyrinthLevel() {
    clearPendingLabyrinthTimeout();
    state.labyrinthLevel = Lab.generateLevel(state.labyrinthSize, state.activeTopics);
    state.labyrinthCompleted = false;
    state.selectedObstacleId = null;
    state.hoveredObstacleId = null;
    state.hoveredComboIds = null;
    els.labyrinthTitle.textContent = state.labyrinthLevel.title;
    els.labyrinthSubtitle.textContent = state.labyrinthLevel.subtitle;
    els.labyrinthCompletedBanner.classList.add('hidden');
    renderLabyrinthBoard();
    loadLabyrinthCandidateTasks();
  }

  function renderLabyrinthBoard() {
    const level = state.labyrinthLevel;
    if (!level || !els.labyrinthGrid) return;

    const trace = Lab.traceBeam(level);
    const hitSet = new Set(trace.hitObstacleIds || []);
    const obsByKey = new Map(level.obstacles.map(o => [`${o.r},${o.c}`, o]));
    const wallSet = new Set(level.walls.map(w => `${w.r},${w.c}`));
    const comboPairs = Lab.findComboPairs(level);

    const getHighlightedComboSet = () => {
      const set = new Set();
      if (Array.isArray(state.hoveredComboIds)) {
        state.hoveredComboIds.forEach(id => set.add(id));
        return set;
      }
      const activeId = state.hoveredObstacleId || state.selectedObstacleId;
      if (activeId) {
        comboPairs.forEach(p => {
          if (p.obsA.id === activeId) set.add(p.obsB.id);
          if (p.obsB.id === activeId) set.add(p.obsA.id);
        });
      }
      return set;
    };

    const syncComboPartnerClasses = () => {
      const partnerSet = getHighlightedComboSet();
      els.labyrinthGrid.querySelectorAll('.lab-obstacle[data-obs-id]').forEach(el => {
        el.classList.toggle('is-combo-partner', partnerSet.has(el.dataset.obsId));
      });
    };

    els.labyrinthGrid.style.setProperty('--lab-cols', String(level.cols));
    els.labyrinthGrid.innerHTML = '';

    const setHoveredObstacle = obsId => {
      if (state.hoveredObstacleId === obsId && !state.hoveredComboIds) return;
      state.hoveredComboIds = null;
      state.hoveredObstacleId = obsId;
      syncComboPartnerClasses();
      renderLabyrinthBeamSvg(trace);
      updateLabyrinthTargetHint();
    };

    const setHoveredCombo = ids => {
      state.hoveredObstacleId = null;
      state.hoveredComboIds = ids;
      syncComboPartnerClasses();
      renderLabyrinthBeamSvg(trace);
      updateLabyrinthTargetHint();
    };

    const initialPartnerSet = getHighlightedComboSet();

    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'lab-cell';
        const cellKey = `${r},${c}`;

        if (r === level.emitter.r && c === level.emitter.c) {
          cell.classList.add('lab-emitter');
          cell.innerHTML = `<span class="lab-emitter-icon">🔦</span><span class="lab-emitter-dir">${getEmitterArrow(level.emitter.dir)}</span>`;
          cell.title = 'Lichtquelle (Start)';
        } else if (r === level.target.r && c === level.target.c) {
          cell.classList.add('lab-target');
          if (trace.hitTarget) cell.classList.add('is-lit');
          cell.innerHTML = `<span class="lab-target-icon">💎</span>`;
          cell.title = 'Ziel-Kristall';
        } else if (wallSet.has(cellKey)) {
          cell.classList.add('lab-wall');
          cell.innerHTML = `<span aria-hidden="true">🪨</span>`;
          cell.title = 'Felsen (blockiert Licht)';
        } else if (obsByKey.has(cellKey)) {
          const obs = obsByKey.get(cellKey);
          const profile = MG.getConditionMeta(obs.conditionId) || {};
          cell.dataset.obsId = obs.id;
          cell.classList.add('lab-obstacle', `lab-type-${obs.type}`);
          if (obs.type === 'gate') cell.classList.add(obs.state === 'open' ? 'is-open' : 'is-closed');
          if (obs.type === 'prism') cell.classList.add(obs.state === 'reflect' ? 'is-reflect' : 'is-pass');
          if (obs.locked) cell.classList.add('is-locked');
          if (obs.isGuard && obs.state === obs.solvedState && !obs.locked) cell.classList.add('is-guard');
          if (state.selectedObstacleId === obs.id) cell.classList.add('is-focused');
          if (hitSet.has(obs.id)) cell.classList.add('in-beam');
          if (trace.blockedByObstacleId === obs.id) cell.classList.add('is-blocking');
          if (initialPartnerSet.has(obs.id)) cell.classList.add('is-combo-partner');

          let statusHtml = '';
          if (obs.locked) {
            statusHtml = '<span class="lab-obs-status is-solved" title="Eingerastet">✓</span>';
          } else if (obs.isGuard && obs.state === obs.solvedState) {
            statusHtml = '<span class="lab-obs-status is-guard" title="Wächter-Tor: Schon offen!">⚠️</span>';
          }
          const condHtml = obs.locked
            ? '<span class="lab-obs-cond is-locked-cond">✓ Bereit</span>'
            : `<span class="lab-obs-cond ${profile.colorClass || ''}">${profile.icon || ''} ${profile.shortLabel || ''}</span>`;

          cell.innerHTML = `
            ${statusHtml}
            ${renderObstacleGraphicHTML(obs)}
            ${condHtml}
          `;
          cell.title = obs.locked
            ? 'Bereits eingerastet (✓)'
            : `${profile.icon || ''} ${profile.label || ''}`;
          cell.addEventListener('pointerenter', () => setHoveredObstacle(obs.id));
          cell.addEventListener('pointerleave', () => {
            if (state.hoveredObstacleId === obs.id) setHoveredObstacle(null);
          });
          cell.addEventListener('click', () => {
            state.hoveredComboIds = null;
            state.selectedObstacleId = state.selectedObstacleId === obs.id ? null : obs.id;
            renderLabyrinthBoard();
            if (state.selectedObstacleId) {
              ensureFocusedObstacleInTaskPool(state.selectedObstacleId);
            }
          });
        }
        els.labyrinthGrid.appendChild(cell);
      }
    }

    // Lichtstrahl-SVG + optionale Vorschau zeichnen
    renderLabyrinthBeamSvg(trace);

    // Kompakte visuelle Kombo- & Runen-Leiste unter dem Board rendern
    if (els.labyrinthObstacleList) {
      els.labyrinthObstacleList.innerHTML = '';

      if (comboPairs.length > 0 && !state.labyrinthCompleted) {
        const pair = comboPairs[0];
        const pA = MG.getConditionMeta(pair.obsA.conditionId) || {};
        const pB = MG.getConditionMeta(pair.obsB.conditionId) || {};
        const comboBtn = document.createElement('button');
        comboBtn.type = 'button';
        comboBtn.className = 'lab-combo-chip';
        comboBtn.innerHTML = `
          <span class="lab-combo-badge">⚡ 2er-Kombo</span>
          <span class="lab-combo-runes">
            <span class="lab-chip-cond ${pA.colorClass || ''}">${pA.icon || ''} ${pA.shortLabel || ''}</span>
            <span class="lab-combo-plus">+</span>
            <span class="lab-chip-cond ${pB.colorClass || ''}">${pB.icon || ''} ${pB.shortLabel || ''}</span>
          </span>
        `;
        comboBtn.addEventListener('pointerenter', () => setHoveredCombo([pair.obsA.id, pair.obsB.id]));
        comboBtn.addEventListener('pointerleave', () => {
          if (state.hoveredComboIds) setHoveredCombo(null);
        });
        comboBtn.addEventListener('click', () => {
          state.hoveredComboIds = null;
          state.selectedObstacleId = pair.obsA.id;
          renderLabyrinthBoard();
          ensureFocusedObstacleInTaskPool(pair.obsA.id);
        });
        els.labyrinthObstacleList.appendChild(comboBtn);
      }

      level.obstacles
        .filter(obs => !obs.locked)
        .forEach(obs => {
          const profile = MG.getConditionMeta(obs.conditionId) || {};
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'lab-obs-chip';
          if (state.selectedObstacleId === obs.id) btn.classList.add('is-focused');
          if (hitSet.has(obs.id)) btn.classList.add('in-beam');
          if (obs.isGuard && obs.state === obs.solvedState) btn.classList.add('is-guard');
          const guardTag = obs.isGuard && obs.state === obs.solvedState
            ? '<span class="lab-chip-guard">⚠️</span>'
            : '';
          btn.innerHTML = `${guardTag}<span class="lab-chip-cond ${profile.colorClass || ''}">${profile.icon || ''} <strong>${profile.shortLabel || ''}</strong></span>`;
          btn.addEventListener('pointerenter', () => setHoveredObstacle(obs.id));
          btn.addEventListener('pointerleave', () => {
            if (state.hoveredObstacleId === obs.id) setHoveredObstacle(null);
          });
          btn.addEventListener('click', () => {
            state.hoveredComboIds = null;
            state.selectedObstacleId = state.selectedObstacleId === obs.id ? null : obs.id;
            renderLabyrinthBoard();
            if (state.selectedObstacleId) {
              ensureFocusedObstacleInTaskPool(state.selectedObstacleId);
            }
          });
          els.labyrinthObstacleList.appendChild(btn);
        });
    }

    // Status-Anzeige aktualisieren
    if (els.labyrinthBeamStatus) {
      if (trace.hitTarget) {
        els.labyrinthBeamStatus.textContent = '✨ Ziel-Kristall erreicht!';
      } else if (trace.stoppedBy === 'gate' && trace.blockedByObstacleId) {
        const blk = level.obstacles.find(o => o.id === trace.blockedByObstacleId);
        const blkMeta = blk && MG.getConditionMeta(blk.conditionId);
        els.labyrinthBeamStatus.textContent = blkMeta
          ? `🔒 Gestoppt bei ${blkMeta.icon} ${blkMeta.shortLabel}`
          : '🔒 Am Tor gestoppt';
      } else if (trace.stoppedBy === 'wall') {
        els.labyrinthBeamStatus.textContent = '🪨 Am Felsen gestoppt';
      } else {
        els.labyrinthBeamStatus.textContent = '🔦 Strahl verlässt das Feld';
      }
    }

    if (els.labSolvedBadge) {
      els.labSolvedBadge.textContent = `${state.stats.labyrinths} ${state.stats.labyrinths === 1 ? 'Labyrinth' : 'Labyrinthe'} gelöst`;
    }

    updateLabyrinthTargetHint();
  }

  function renderCandidateTaskGrid() {
    if (!els.labyrinthTaskGrid) return;
    els.labyrinthTaskGrid.innerHTML = '';
    state.candidateTasks.forEach((task, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'candidate-task-card';
      if (idx === state.selectedTaskIndex) btn.classList.add('active');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(idx === state.selectedTaskIndex));
      btn.innerHTML = `
        <div class="candidate-card-top">
          <span class="candidate-slot">Aufgabe ${idx + 1}</span>
          <span class="candidate-cat">${MG.CATEGORY_LABELS[task.category] || 'Mathe'}</span>
        </div>
        <div class="candidate-prompt">${task.promptHTML}</div>
      `;
      btn.addEventListener('click', () => {
        if (state.labyrinthCompleted) return;
        selectCandidateTask(idx, false);
      });
      els.labyrinthTaskGrid.appendChild(btn);
    });
  }

  function loadLabyrinthCandidateTasks() {
    if (!state.labyrinthLevel) return;
    clearPendingLabyrinthTimeout();
    const diff = state.easyTasksRemaining > 0 ? 'easy' : 'normal';
    const weights = MG.getCategoryWeights(state.activeTopics, state.stats.topicPerf);
    let requiredProfiles = Lab.getRequiredProfileIds(state.labyrinthLevel);
    if (state.selectedObstacleId) {
      const focusedObs = state.labyrinthLevel.obstacles.find(o => o.id === state.selectedObstacleId);
      if (focusedObs && focusedObs.conditionId) {
        requiredProfiles = [
          focusedObs.conditionId,
          ...requiredProfiles.filter(id => id !== focusedObs.conditionId)
        ];
      }
    }
    state.candidateTasks = MG.generateStrategicTaskPool(
      requiredProfiles,
      state.activeTopics,
      diff,
      weights,
      4
    );
    state.selectedTaskIndex = 0;
    renderCandidateTaskGrid();
    selectCandidateTask(0, true);
  }

  function ensureFocusedObstacleInTaskPool(obstacleId) {
    if (!obstacleId || !state.labyrinthLevel || !Array.isArray(state.candidateTasks) || state.candidateTasks.length === 0) {
      return;
    }
    const obs = state.labyrinthLevel.obstacles.find(o => o.id === obstacleId);
    if (!obs || !obs.conditionId) return;

    const comboPairs = Lab.findComboPairs(state.labyrinthLevel);
    const comboPair = comboPairs.find(p => p.obsA.id === obs.id || p.obsB.id === obs.id);
    if (comboPair) {
      const hasComboTask = state.candidateTasks.some(t =>
        MG.doesTaskMatchCondition(t, comboPair.obsA.conditionId)
        && MG.doesTaskMatchCondition(t, comboPair.obsB.conditionId)
      );
      if (hasComboTask) return;

      const diff = state.easyTasksRemaining > 0 ? 'easy' : 'normal';
      const weights = MG.getCategoryWeights(state.activeTopics, state.stats.topicPerf);
      const replacementTask = MG.generateTaskForProfile(comboPair.profileId, state.activeTopics, diff, weights);
      const replaceIdx = (state.selectedTaskIndex + 1) % state.candidateTasks.length;
      state.candidateTasks[replaceIdx] = replacementTask;
      renderCandidateTaskGrid();
      return;
    }

    const hasMatchingTask = state.candidateTasks.some(t => MG.doesTaskMatchCondition(t, obs.conditionId));
    if (hasMatchingTask) return;

    const diff = state.easyTasksRemaining > 0 ? 'easy' : 'normal';
    const weights = MG.getCategoryWeights(state.activeTopics, state.stats.topicPerf);
    const replacementTask = MG.generateTaskForProfile(obs.conditionId, state.activeTopics, diff, weights);
    const replaceIdx = (state.selectedTaskIndex + 1) % state.candidateTasks.length;
    state.candidateTasks[replaceIdx] = replacementTask;
    renderCandidateTaskGrid();
  }

  function selectCandidateTask(index, clearScratch = false) {
    clearPendingLabyrinthTimeout();
    if (!state.candidateTasks || state.candidateTasks.length === 0) return;
    const safeIdx = Math.max(0, Math.min(index, state.candidateTasks.length - 1));
    state.selectedTaskIndex = safeIdx;
    const chosenTask = state.candidateTasks[safeIdx];
    renderCandidateTaskGrid();
    applyTaskToForm(chosenTask, clearScratch);
  }

  function formatConditionShort(condId) {
    const meta = MG.getConditionMeta(condId);
    if (!meta) return '';
    return `${meta.icon || ''} ${meta.shortLabel || ''}`.trim();
  }

  function applyLabyrinthTaskResult(matchingRuneIds, ansHTML) {
    if (!state.labyrinthLevel) return;
    const res = Lab.applyTaskToLevel(state.labyrinthLevel, matchingRuneIds);
    state.selectedObstacleId = null;
    state.hoveredObstacleId = null;
    state.hoveredComboIds = null;
    renderLabyrinthBoard();

    if (res.trace && res.trace.hitTarget) {
      state.labyrinthCompleted = true;
      state.stats.labyrinths += 1;
      saveState();
      Sound.playFanfare();
      const bonusArt = unlockBonusArtworkInVault();
      const moves = state.labyrinthLevel.moves || 1;
      const moveWord = moves === 1 ? 'Zug' : 'Zügen';
      const comboBadge = res.isCombo ? '⚡ <strong>DOPPEL-KOMBO!</strong> ' : '';
      const bonusText = bonusArt
        ? ` Bonus-Motiv „${bonusArt.title}“ für deine Schatzkammer freigeschaltet!`
        : '';
      showFeedbackHTML(
        'ok',
        `${comboBadge}🌟 <strong>Ziel-Kristall in nur ${moves} ${moveWord} erreicht!</strong>${bonusText}`
      );
      renderLabyrinthBoard();
      els.labyrinthCompletedBanner.classList.remove('hidden');
      return;
    }

    if (res.isCombo) {
      showFeedbackHTML(
        'ok',
        `⚡ <strong>DOPPEL-KOMBO!</strong> Dein Ergebnis (<strong>${ansHTML}</strong>) schaltet gleich <strong>${res.newlySolved.length} Bauteile (✓)</strong> auf einmal!`
      );
      state.pendingLabyrinthTimeoutId = setTimeout(() => {
        if (!state.labyrinthCompleted && state.activeMode === 'labyrinth') {
          loadLabyrinthCandidateTasks();
        }
      }, 1400);
      return;
    }

    if (res.newlySolved.length === 1 && res.trippedGuards.length === 0) {
      const runeLabel = formatConditionShort(res.newlySolved[0].conditionId);
      showFeedbackHTML(
        'ok',
        `✨ <strong>Treffer!</strong> Ergebnis (<strong>${ansHTML}</strong>) schaltet <strong>${runeLabel} → ✓</strong>`
      );
      state.pendingLabyrinthTimeoutId = setTimeout(() => {
        if (!state.labyrinthCompleted && state.activeMode === 'labyrinth') {
          loadLabyrinthCandidateTasks();
        }
      }, 1200);
      return;
    }

    if (res.newlySolved.length >= 1 && res.trippedGuards.length > 0) {
      const solvedLabel = res.newlySolved.map(o => formatConditionShort(o.conditionId)).join(' + ');
      const guardLabel = res.trippedGuards.map(o => formatConditionShort(o.conditionId)).join(' + ');
      showFeedbackHTML(
        'ok',
        `✨ <strong>${solvedLabel} → ✓</strong> gelöst! (Hinweis: <strong>${ansHTML}</strong> hat auch das ⚠️ Wächter-Tor <strong>${guardLabel}</strong> geschaltet)`
      );
      state.pendingLabyrinthTimeoutId = setTimeout(() => {
        if (!state.labyrinthCompleted && state.activeMode === 'labyrinth') {
          loadLabyrinthCandidateTasks();
        }
      }, 1500);
      return;
    }

    if (res.newlySolved.length === 0 && res.trippedGuards.length > 0) {
      const guardLabel = res.trippedGuards.map(o => formatConditionShort(o.conditionId)).join(' + ');
      showFeedbackHTML(
        'warn',
        `⚠️ Dein Ergebnis (<strong>${ansHTML}</strong>) passt zu <strong>${guardLabel}</strong> und hat das offene Wächter-Tor geschaltet. Öffne es im nächsten Zug wieder!`
      );
      state.pendingLabyrinthTimeoutId = setTimeout(() => {
        if (!state.labyrinthCompleted && state.activeMode === 'labyrinth') {
          loadLabyrinthCandidateTasks();
        }
      }, 1500);
      return;
    }

    showFeedbackHTML(
      'warn',
      `✅ Richtig gerechnet (<strong>${ansHTML}</strong>), aber diese Runen sind schon alle gelöst (✓). Neue Aufgaben kommen!`
    );
    state.pendingLabyrinthTimeoutId = setTimeout(() => {
      if (!state.labyrinthCompleted && state.activeMode === 'labyrinth') {
        loadLabyrinthCandidateTasks();
      }
    }, 1300);
  }

  function updateShieldBadge() {
    if (state.easyTasksRemaining > 0) {
      els.shieldStatus.textContent = `🌿 Frust-Bremse aktiv (${state.easyTasksRemaining})`;
      els.shieldStatus.classList.add('easy-active');
      els.difficultyBadge.classList.remove('hidden');
    } else {
      els.shieldStatus.textContent = '🛡️ Schutzschild aktiv';
      els.shieldStatus.classList.remove('easy-active');
      els.difficultyBadge.classList.add('hidden');
    }
  }

  function setActiveNumpadTarget(el) {
    activeInputEl = el;
    els.numInput.classList.toggle('active-target', el === els.numInput);
    els.denInput.classList.toggle('active-target', el === els.denInput);
  }

  function applyTaskToForm(task, clearScratch = true) {
    state.currentTask = task;
    state.taskShownAt = Date.now();
    state.taskAttempts = 0;
    state.taskLocked = false;

    if (scratchpad && clearScratch) {
      scratchpad.clear();
    }

    els.taskCategoryBadge.textContent = MG.CATEGORY_LABELS[state.currentTask.category] || 'Mathe';
    els.taskPrompt.innerHTML = state.currentTask.promptHTML;
    els.taskPrompt.classList.toggle('word-problem', state.currentTask.category === MG.CATEGORIES.WORD_PROBLEMS);
    els.hintBox.classList.add('hidden');
    els.hintBox.textContent = '';
    els.feedbackBox.classList.add('hidden');
    els.nextTaskWrap.classList.add('hidden');

    els.integerInput.value = '';
    els.numInput.value = '';
    els.denInput.value = '';
    els.integerInput.disabled = false;
    els.numInput.disabled = false;
    els.denInput.disabled = false;
    els.submitAnswerBtn.disabled = false;

    const coarse = isCoarsePointer();
    const isScalar = state.currentTask.inputType === 'integer' || state.currentTask.inputType === 'decimal';
    if (isScalar) {
      const isDecimal = state.currentTask.inputType === 'decimal';
      els.integerInput.type = 'text';
      els.integerInput.inputMode = coarse ? 'none' : (isDecimal ? 'decimal' : 'numeric');
      els.integerInput.placeholder = isDecimal ? 'z.B. 2,5' : '?';
      els.integerInputWrap.classList.remove('hidden');
      els.fractionInputWrap.classList.add('hidden');
      if (els.switchFracFieldBtn) els.switchFracFieldBtn.classList.add('hidden');
      els.integerUnitLabel.textContent = state.currentTask.unitLabel || '';
      setActiveNumpadTarget(els.integerInput);
      if (!coarse) setTimeout(() => els.integerInput.focus(), 30);
    } else {
      els.numInput.inputMode = coarse ? 'none' : 'numeric';
      els.denInput.inputMode = coarse ? 'none' : 'numeric';
      els.integerInputWrap.classList.add('hidden');
      els.fractionInputWrap.classList.remove('hidden');
      if (els.switchFracFieldBtn) els.switchFracFieldBtn.classList.remove('hidden');
      setActiveNumpadTarget(els.numInput);
      if (!coarse) setTimeout(() => els.numInput.focus(), 30);
    }

    updateShieldBadge();
  }

  function loadNextPuzzleTask() {
    const diff = state.easyTasksRemaining > 0 ? 'easy' : 'normal';
    const weights = MG.getCategoryWeights(state.activeTopics, state.stats.topicPerf);
    const task = MG.generateTask(state.activeTopics, diff, weights);
    applyTaskToForm(task, true);
  }

  function showFeedback(type, text) {
    els.feedbackBox.className = `feedback-box ${type}`;
    els.feedbackBox.textContent = text;
    els.feedbackBox.classList.remove('hidden');
  }

  function showFeedbackHTML(type, html) {
    els.feedbackBox.className = `feedback-box ${type}`;
    els.feedbackBox.innerHTML = html;
    els.feedbackBox.classList.remove('hidden');
  }

  function handleTaskSubmit(e) {
    e.preventDefault();
    if (!state.currentTask || state.taskLocked) return;

    // Timer automatisch beim ersten Rechnen starten, falls noch pausiert
    if (!state.timerRunning && state.timerSecondsLeft === QUEST_DURATION_SEC) {
      startTimer();
    }

    const elapsedMs = Date.now() - state.taskShownAt;
    const isScalar = state.currentTask.inputType === 'integer' || state.currentTask.inputType === 'decimal';
    const userInput = isScalar
      ? { value: els.integerInput.value }
      : { num: els.numInput.value, den: els.denInput.value };

    const result = MG.checkAnswer(state.currentTask, userInput);

    if (result.status === 'invalid') {
      showFeedback('warn', 'Bitte gib zuerst eine gültige Zahl ein (der Nenner darf nicht 0 sein).');
      return;
    }

    // Kategorie 5: Teilweise gekürzt -> freundlicher Hinweis, kein Fehler
    if (result.status === 'partial_reduce') {
      Sound.playPlopp();
      showFeedback('warn', `✨ ${result.message}`);
      return;
    }

    // Richtige Antwort (oder ungekürzt bei Kategorie 1)
    if (result.status === 'correct' || result.status === 'unreduced_ok') {
      Sound.playCrystal();
      const firstTry = state.taskAttempts === 0;
      recordTopicAttempt(state.currentTask.category, true, firstTry);
      state.taskLocked = true;
      state.taskAttempts = 0;
      if (state.easyTasksRemaining > 0) {
        state.easyTasksRemaining -= 1;
      }
      state.stats.solved += 1;
      saveState();

      if (state.activeMode === 'labyrinth' && state.labyrinthLevel) {
        const matchingRuneIds = MG.getMatchingRuneIds(state.currentTask);
        applyLabyrinthTaskResult(matchingRuneIds, state.currentTask.displayAnswerHTML);
        return;
      }

      const praise = result.status === 'unreduced_ok'
        ? `🌟 ${result.message}`
        : '✨ Kristallklar gelöst! Ein weiteres Stück von Jorvik wird sichtbar!';
      showFeedback('ok', praise);

      if (!state.puzzleCompleted) {
        shatterRandomTile();
      }
      const delayMs = result.status === 'unreduced_ok' ? 2800 : 1150;
      setTimeout(() => {
        if (!state.puzzleCompleted && state.activeMode === 'puzzle') {
          loadNextPuzzleTask();
        }
      }, delayMs);
      return;
    }

    // Falsche Antwort -> Anti-Leichtsinns-Schutzschild prüfen!
    // Regel A: Unter 3,5 Sekunden -> NICHT als Fehler werten!
    if (elapsedMs < 3500) {
      Sound.playPlopp();
      showFeedback(
        'warn',
        '🐎 Halt, die Zügel nicht so schnell schießen lassen! Schau dir Vorzeichen, Klammern und Nullen noch einmal in Ruhe an.'
      );
      return;
    }

    // Regel B: Reguläre falsche Antwort -> 3 Versuche pro Aufgabe
    Sound.playGentleWrong();
    recordTopicAttempt(state.currentTask.category, false, false);
    state.taskAttempts += 1;

    if (state.taskAttempts === 1) {
      showFeedback(
        'gentle',
        'Fast! Schau dir die Aufgabe noch einmal genau an oder frag die Reitlehrerin um einen Tipp. (Versuch 1 von 3)'
      );
    } else if (state.taskAttempts === 2) {
      els.hintBox.textContent = `🐴 Reitlehrerin: „${state.currentTask.hint}“`;
      els.hintBox.classList.remove('hidden');
      showFeedback(
        'gentle',
        'Noch nicht ganz! Die Reitlehrerin hat dir einen Tipp dagelassen – du hast noch einen Versuch! (Versuch 2 von 3)'
      );
    } else {
      state.taskLocked = true;
      state.easyTasksRemaining = 2;
      updateShieldBadge();
      els.integerInput.disabled = true;
      els.numInput.disabled = true;
      els.denInput.disabled = true;
      els.submitAnswerBtn.disabled = true;

      const explanationText = state.currentTask.explanation || state.currentTask.hint;
      showFeedbackHTML(
        'gentle',
        `<div>Kein Problem! Die richtige Lösung ist: <strong>${state.currentTask.displayAnswerHTML}</strong></div>` +
        `<div class="feedback-explanation">🐴 <strong>Erklärung:</strong> ${explanationText}</div>` +
        `<div class="feedback-explanation">Wir schalten kurz einen Gang zurück für ein sicheres Erfolgserlebnis!</div>`
      );
      els.nextTaskWrap.classList.remove('hidden');
    }
  }

  // =========================================================================
  // Spielmodus 2: Der Jorvik-Fehler-Detektiv
  // =========================================================================
  function startNewLukasExam() {
    state.lukasExam = MG.generateLukasExam(state.activeTopics);
    state.lukasDecisions = {};
    state.examGraded = false;
    els.examSummaryBox.classList.add('hidden');
    els.gradeExamBtn.classList.remove('hidden');
    renderLukasExam();
  }

  function updateExamProgress() {
    const decided = Object.keys(state.lukasDecisions).length;
    els.examProgressText.textContent = `${decided} von ${state.lukasExam.length} geprüft`;
  }

  function renderLukasExam() {
    els.lukasExamList.innerHTML = '';
    els.examinerStars.textContent = String(state.stats.stars);

    state.lukasExam.forEach((item, index) => {
      const dec = state.lukasDecisions[item.id] || {};
      const card = document.createElement('div');
      card.className = 'exam-item';
      if (dec.choice === 'correct') card.classList.add('marked-correct');
      if (dec.choice === 'error') card.classList.add('marked-error');

      const topRow = document.createElement('div');
      topRow.className = 'exam-item-top';

      const taskText = document.createElement('div');
      taskText.className = 'exam-task-text';
      taskText.innerHTML = `<span>${index + 1}.</span> ${item.task.promptHTML} <span class="lukas-ans-pill">${item.lukasAnswerHTML}</span>`;

      const btns = document.createElement('div');
      btns.className = 'exam-item-btns';

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = `btn-check ${dec.choice === 'correct' ? 'active' : ''}`;
      okBtn.textContent = '✓ Richtig';
      okBtn.disabled = state.examGraded;
      okBtn.addEventListener('click', () => {
        state.lukasDecisions[item.id] = { choice: 'correct' };
        renderLukasExam();
      });

      const errBtn = document.createElement('button');
      errBtn.type = 'button';
      errBtn.className = `btn-redpen ${dec.choice === 'error' ? 'active' : ''}`;
      errBtn.textContent = '🖍️ Fehler gefunden!';
      errBtn.disabled = state.examGraded;
      errBtn.addEventListener('click', () => {
        state.lukasDecisions[item.id] = {
          choice: 'error',
          val: dec.val || '',
          num: dec.num || '',
          den: dec.den || '',
          reason: dec.reason || ''
        };
        renderLukasExam();
      });

      btns.appendChild(okBtn);
      btns.appendChild(errBtn);
      topRow.appendChild(taskText);
      topRow.appendChild(btns);
      card.appendChild(topRow);

      // Korrektur-Feld bei "Fehler gefunden!"
      if (dec.choice === 'error') {
        const drawer = document.createElement('div');
        drawer.className = 'correction-drawer';

        const inputsRow = document.createElement('div');
        inputsRow.className = 'correction-inputs';
        inputsRow.innerHTML = '<strong>Deine Korrektur für Lukas:</strong>';

        if (item.task.inputType === 'integer' || item.task.inputType === 'decimal') {
          const isDecimal = item.task.inputType === 'decimal';
          const inp = document.createElement('input');
          inp.type = isDecimal ? 'text' : 'number';
          if (isDecimal) inp.inputMode = 'decimal';
          inp.className = 'math-input';
          inp.placeholder = isDecimal ? 'z.B. 2,5' : 'Lösung';
          inp.value = dec.val || '';
          inp.disabled = state.examGraded;
          inp.addEventListener('input', e => {
            state.lukasDecisions[item.id].val = e.target.value;
          });
          inputsRow.appendChild(inp);
          if (item.task.unitLabel) {
            const unitSpan = document.createElement('span');
            unitSpan.textContent = item.task.unitLabel;
            inputsRow.appendChild(unitSpan);
          }
        } else {
          const nInp = document.createElement('input');
          nInp.type = 'number';
          nInp.className = 'math-input';
          nInp.placeholder = 'Zähler';
          nInp.value = dec.num || '';
          nInp.disabled = state.examGraded;
          nInp.addEventListener('input', e => {
            state.lukasDecisions[item.id].num = e.target.value;
          });

          const slash = document.createElement('span');
          slash.textContent = 'über';

          const dInp = document.createElement('input');
          dInp.type = 'number';
          dInp.className = 'math-input';
          dInp.placeholder = 'Nenner';
          dInp.value = dec.den || '';
          dInp.disabled = state.examGraded;
          dInp.addEventListener('input', e => {
            state.lukasDecisions[item.id].den = e.target.value;
          });

          inputsRow.appendChild(nInp);
          inputsRow.appendChild(slash);
          inputsRow.appendChild(dInp);
        }

        if (!state.examGraded) {
          const clrBtn = document.createElement('button');
          clrBtn.type = 'button';
          clrBtn.className = 'btn-clear-input';
          clrBtn.title = 'Eingabe löschen';
          clrBtn.setAttribute('aria-label', 'Eingabe löschen');
          clrBtn.textContent = '✕';
          clrBtn.addEventListener('click', () => {
            state.lukasDecisions[item.id].val = '';
            state.lukasDecisions[item.id].num = '';
            state.lukasDecisions[item.id].den = '';
            renderLukasExam();
          });
          inputsRow.appendChild(clrBtn);
        }

        drawer.appendChild(inputsRow);

        // Multiple Choice: Was hat Lukas falsch gemacht?
        if (item.reasonOptions && item.reasonOptions.length > 0) {
          const reasonWrap = document.createElement('div');
          reasonWrap.className = 'reason-options';
          item.reasonOptions.forEach(opt => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `reason-chip ${dec.reason === opt ? 'active' : ''}`;
            chip.textContent = opt;
            chip.disabled = state.examGraded;
            chip.addEventListener('click', () => {
              state.lukasDecisions[item.id].reason = opt;
              renderLukasExam();
            });
            reasonWrap.appendChild(chip);
          });
          drawer.appendChild(reasonWrap);
        }

        card.appendChild(drawer);
      }

      // Auswertung nach Abgabe anzeigen
      if (state.examGraded) {
        const resDiv = document.createElement('div');
        const userSaidCorrect = dec.choice === 'correct';
        let pointEarned = false;

        if (item.isCorrect && userSaidCorrect) {
          pointEarned = true;
          resDiv.className = 'exam-item-result good';
          resDiv.innerHTML = `✅ Perfekt erkannt! Lukas sagt: <em>„${item.lukasComment}“</em>`;
        } else if (!item.isCorrect && dec.choice === 'error') {
          const checkRes = MG.checkAnswer(item.task, {
            value: dec.val,
            num: dec.num,
            den: dec.den
          });
          if (checkRes.status === 'correct' || checkRes.status === 'unreduced_ok') {
            pointEarned = true;
            const reasonRight = dec.reason && dec.reason === item.mistakeReason;
            const reasonNote = reasonRight
              ? ' Auch den Fehlergrund hast du genau getroffen!'
              : (dec.reason ? ` (Lukas’ eigentlicher Fehler war: ${item.mistakeReason})` : '');
            resDiv.className = 'exam-item-result good';
            resDiv.innerHTML = `⭐ Adlerauge! Fehler gefunden &amp; richtig korrigiert!${reasonNote} Lukas: <em>„${item.lukasComment}“</em>`;
          } else {
            resDiv.className = 'exam-item-result info';
            resDiv.innerHTML = `🖍️ Fehler super entdeckt! Die richtige Lösung lautet: ${item.task.displayAnswerHTML} (${item.mistakeReason}).`;
          }
        } else if (item.isCorrect && !userSaidCorrect) {
          resDiv.className = 'exam-item-result info';
          resDiv.innerHTML = `🐴 Hier hatte Lukas ausnahmsweise mal alles richtig gerechnet (${item.task.displayAnswerHTML}).`;
        } else {
          resDiv.className = 'exam-item-result info';
          resDiv.innerHTML = `🔍 Hier hat sich ein Fehler versteckt (${item.mistakeReason}). Richtig wäre: ${item.task.displayAnswerHTML}.`;
        }
        item._earned = pointEarned;
        card.appendChild(resDiv);
      }

      els.lukasExamList.appendChild(card);
    });

    updateExamProgress();
  }

  function gradeLukasExam() {
    if (Object.keys(state.lukasDecisions).length < state.lukasExam.length) {
      els.examSummaryBox.className = 'completed-banner';
      els.examSummaryBox.classList.remove('hidden');
      els.examSummaryBox.innerHTML = '<p>Bitte prüfe zuerst alle 6 Aufgaben von Lukas (Haken oder Rotstift), bevor du die Arbeit abgibst!</p>';
      Sound.playPlopp();
      return;
    }

    state.examGraded = true;
    renderLukasExam();

    const earnedStars = state.lukasExam.filter(item => item._earned).length;
    state.stats.stars += earnedStars;
    saveState();

    els.examinerStars.textContent = String(state.stats.stars);
    els.gradeExamBtn.classList.add('hidden');
    els.examSummaryBox.className = 'completed-banner';
    els.examSummaryBox.classList.remove('hidden');
    els.examSummaryBox.innerHTML = `
      <h3>🌟 Klassenarbeit korrigiert! +${earnedStars} Prüfer-Sterne</h3>
      <p>Lukas aus Moorland: <em>„Vielen Dank für deine Hilfe! Mit dir als Reitlehrerin schaffe ich die nächste Arbeit bestimmt mit links!“</em></p>
      <button type="button" id="nextExamInlineBtn" class="btn-primary">Nächste Klassenarbeit prüfen</button>
    `;
    document.getElementById('nextExamInlineBtn').addEventListener('click', startNewLukasExam);
    Sound.playFanfare();
  }

  // =========================================================================
  // Schatzkammer (LocalStorage)
  // =========================================================================
  function updateVaultBadge() {
    els.vaultCountBadge.textContent = String(state.vault.length);
  }

  function renderVault() {
    if (els.statLabyrinths) els.statLabyrinths.textContent = String(state.stats.labyrinths || 0);
    els.statSolved.textContent = String(state.stats.solved);
    els.statPuzzles.textContent = String(state.vault.length);
    els.statStars.textContent = String(state.stats.stars);

    els.vaultGallery.innerHTML = '';
    if (state.vault.length === 0) {
      els.vaultGallery.innerHTML = `
        <div class="vault-empty">
          <h3>Noch keine Bilder in der Schatzkammer</h3>
          <p>Löse im Modus „Magisches Bild-Puzzle“ alle Kristalle auf, um dein erstes Jorvik-Bild hier zu sammeln!</p>
        </div>`;
      return;
    }

    state.vault.forEach(item => {
      const card = document.createElement('div');
      card.className = 'vault-card';
      card.innerHTML = `
        <img src="${item.src}" alt="${item.title}" />
        <div class="vault-card-body">
          <h3>${item.title}</h3>
          <p>${item.subtitle || 'Jorvik'} • Freigeschaltet am ${item.unlockedAt || 'heute'}</p>
        </div>
      `;
      els.vaultGallery.appendChild(card);
    });
  }

  function compressImageFile(file, callback) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 900;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => callback(ev.target.result);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // Event-Listener & Initialisierung
  // =========================================================================
  function bindEvents() {
    els.timerToggleBtn.addEventListener('click', () => {
      if (state.timerRunning) pauseTimer();
      else startTimer();
    });
    els.timerResetBtn.addEventListener('click', resetTimer);

    els.questContinueBtn.addEventListener('click', () => {
      els.questModal.classList.add('hidden');
    });
    els.questResetCloseBtn.addEventListener('click', () => {
      els.questModal.classList.add('hidden');
      resetTimer();
      startTimer();
    });

    els.muteBtn.addEventListener('click', () => {
      Sound.toggleMute();
      updateMuteUI();
    });

    els.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    if (els.labCompactBtn) {
      els.labCompactBtn.addEventListener('click', () => {
        state.labyrinthSize = 'compact';
        els.labCompactBtn.classList.add('active');
        if (els.labMasterBtn) els.labMasterBtn.classList.remove('active');
        initLabyrinthLevel();
      });
    }

    if (els.labMasterBtn) {
      els.labMasterBtn.addEventListener('click', () => {
        state.labyrinthSize = 'master';
        els.labMasterBtn.classList.add('active');
        if (els.labCompactBtn) els.labCompactBtn.classList.remove('active');
        initLabyrinthLevel();
      });
    }

    if (els.newLabyrinthBtn) {
      els.newLabyrinthBtn.addEventListener('click', initLabyrinthLevel);
    }

    if (els.nextLabyrinthBtn) {
      els.nextLabyrinthBtn.addEventListener('click', initLabyrinthLevel);
    }

    if (els.rerollTasksBtn) {
      els.rerollTasksBtn.addEventListener('click', () => {
        if (!state.labyrinthCompleted) {
          loadLabyrinthCandidateTasks();
        }
      });
    }

    els.grid12Btn.addEventListener('click', () => {
      state.gridSize = 12;
      els.grid12Btn.classList.add('active');
      els.grid16Btn.classList.remove('active');
      initPuzzleBoard();
    });

    els.grid16Btn.addEventListener('click', () => {
      state.gridSize = 16;
      els.grid16Btn.classList.add('active');
      els.grid12Btn.classList.remove('active');
      initPuzzleBoard();
    });

    els.artworkSelect.addEventListener('change', e => {
      state.currentArtworkIndex = parseInt(e.target.value, 10) || 0;
      initPuzzleBoard();
    });

    els.customImageInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      compressImageFile(file, dataUrl => {
        state.artworks.unshift({
          id: 'upload_' + Date.now(),
          title: file.name.replace(/\.[^.]+$/, ''),
          subtitle: 'Eigenes Jorvik-Bild',
          src: dataUrl
        });
        state.currentArtworkIndex = 0;
        populateArtworkSelect();
        initPuzzleBoard();
      });
    });

    els.nextPuzzleBtn.addEventListener('click', () => {
      state.currentArtworkIndex = (state.currentArtworkIndex + 1) % state.artworks.length;
      els.artworkSelect.value = String(state.currentArtworkIndex);
      initPuzzleBoard();
      loadNextPuzzleTask();
    });

    els.taskForm.addEventListener('submit', handleTaskSubmit);

    els.clearIntegerBtn.addEventListener('click', () => {
      if (state.taskLocked) return;
      els.integerInput.value = '';
      setActiveNumpadTarget(els.integerInput);
    });

    els.clearFractionBtn.addEventListener('click', () => {
      if (state.taskLocked) return;
      els.numInput.value = '';
      els.denInput.value = '';
      setActiveNumpadTarget(els.numInput);
    });

    [els.integerInput, els.numInput, els.denInput].forEach(inp => {
      inp.addEventListener('focus', () => setActiveNumpadTarget(inp));
      inp.addEventListener('pointerdown', () => setActiveNumpadTarget(inp));
    });

    if (els.switchFracFieldBtn) {
      els.switchFracFieldBtn.addEventListener('click', () => {
        if (state.taskLocked) return;
        const nextEl = activeInputEl === els.denInput ? els.numInput : els.denInput;
        setActiveNumpadTarget(nextEl);
        if (!isCoarsePointer()) nextEl.focus();
      });
    }

    if (els.pencilNumpad) {
      els.pencilNumpad.addEventListener('click', e => {
        const btn = e.target.closest('.numpad-btn[data-key]');
        if (!btn || state.taskLocked || !activeInputEl || activeInputEl.disabled) return;
        const key = btn.dataset.key;
        const val = activeInputEl.value;
        if (key === 'backspace') {
          activeInputEl.value = val.slice(0, -1);
        } else if (key === '-') {
          activeInputEl.value = val.startsWith('-') ? val.slice(1) : '-' + val;
        } else if (key === ',') {
          if (!val.includes(',') && !val.includes('.')) {
            activeInputEl.value = val === '' || val === '-' ? val + '0,' : val + ',';
          }
        } else {
          activeInputEl.value = val + key;
        }
      });
    }

    els.nextTaskBtn.addEventListener('click', () => {
      refreshActiveModeTasks();
    });

    els.hintBtn.addEventListener('click', () => {
      if (!state.currentTask) return;
      els.hintBox.textContent = `🐴 Reitlehrerin: „${state.currentTask.hint}“`;
      els.hintBox.classList.remove('hidden');
    });

    els.newExamBtn.addEventListener('click', startNewLukasExam);
    els.gradeExamBtn.addEventListener('click', gradeLukasExam);

    if (els.topicToggleBtn && els.topicDrawer) {
      els.topicToggleBtn.addEventListener('click', () => {
        const isOpen = !els.topicDrawer.classList.contains('hidden');
        els.topicDrawer.classList.toggle('hidden', isOpen);
        els.topicToggleBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    if (els.topicSelectAllBtn) {
      els.topicSelectAllBtn.addEventListener('click', () => {
        state.activeTopics = Object.values(MG.CATEGORIES);
        renderTopicFilters();
        refreshActiveModeTasks();
      });
    }
  }

  function init() {
    updateMuteUI();
    renderTimer();
    renderTopicFilters();
    updateVaultBadge();
    populateArtworkSelect();
    initPuzzleBoard();
    initLabyrinthLevel();
    switchMode('labyrinth');
    bindEvents();

    // Schmierzettel initialisieren
    scratchpad = window.Scratchpad.init(document.getElementById('scratchpadCanvas'), {
      clearBtn: document.getElementById('clearScratchBtn'),
      colorButtons: document.querySelectorAll('.pen-btn')
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
