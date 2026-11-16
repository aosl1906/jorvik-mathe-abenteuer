/**
 * Jorvik Mathe-Abenteuer – Hauptsteuerung (Timer, Modi, Schutzschild, Schatzkammer)
 */
(function () {
  'use strict';

  const MG = window.MathGenerator;
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

  // =========================================================================
  // Zustand
  // =========================================================================
  const state = {
    activeMode: 'puzzle',
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

    // Mode 1: Puzzle
    gridSize: 12,
    artworks: Artworks.getArtworks(),
    currentArtworkIndex: 0,
    revealedTiles: [], // Array of booleans
    currentTask: null,
    puzzleCompleted: false,

    // Mode 2: Fehler-Detektiv
    lukasExam: [],
    lukasDecisions: {}, // { [itemId]: { choice: 'correct' | 'error', val: '', num: '', den: '', reason: '' } }
    examGraded: false,

    // Persistierte Daten
    vault: loadJSON(STORAGE_KEYS.VAULT, []),
    stats: loadJSON(STORAGE_KEYS.STATS, { solved: 0, stars: 0 })
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

    // Mode 1
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
        // Neue Aufgabe aus den gewählten Themen laden
        loadNextPuzzleTask();
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

  function switchMode(mode) {
    state.activeMode = mode;
    els.modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    els.modeSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `mode-${mode}`);
    });
    if (mode === 'vault') {
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

  function loadNextPuzzleTask() {
    const diff = state.easyTasksRemaining > 0 ? 'easy' : 'normal';
    state.currentTask = MG.generateTask(state.activeTopics, diff);
    state.taskShownAt = Date.now();
    state.taskAttempts = 0;
    state.taskLocked = false;

    if (scratchpad) {
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
      state.taskLocked = true;
      state.taskAttempts = 0;
      if (state.easyTasksRemaining > 0) {
        state.easyTasksRemaining -= 1;
      }
      state.stats.solved += 1;
      saveState();

      const praise = result.status === 'unreduced_ok'
        ? `🌟 ${result.message}`
        : '✨ Kristallklar gelöst! Ein weiteres Stück von Jorvik wird sichtbar!';
      showFeedback('ok', praise);

      if (!state.puzzleCompleted) {
        shatterRandomTile();
      }
      const delayMs = result.status === 'unreduced_ok' ? 2800 : 1150;
      setTimeout(() => {
        if (!state.puzzleCompleted) {
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
      loadNextPuzzleTask();
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
        loadNextPuzzleTask();
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
    loadNextPuzzleTask();
    bindEvents();

    // Schmierzettel initialisieren
    scratchpad = window.Scratchpad.init(document.getElementById('scratchpadCanvas'), {
      clearBtn: document.getElementById('clearScratchBtn'),
      colorButtons: document.querySelectorAll('.pen-btn')
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
