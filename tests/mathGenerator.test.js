const assert = require('assert');
const MG = require('../js/mathGenerator.js');
const Lab = require('../js/labyrinthEngine.js');

console.log('Starte Validierung von MathGenerator...');

const categories = Object.values(MG.CATEGORIES);

// 1. Teste 500 Aufgaben pro Kategorie (normal & easy)
for (const cat of categories) {
  for (const diff of ['normal', 'easy']) {
    for (let i = 0; i < 500; i++) {
      const task = MG.generateTask([cat], diff);
      assert.strictEqual(task.category, cat);
      assert.ok(task.promptHTML && task.promptHTML.length > 0, 'promptHTML darf nicht leer sein');
      assert.ok(task.hint && task.hint.length > 0, 'hint darf nicht leer sein');
      assert.ok(task.explanation && task.explanation.length > 0, 'explanation darf nicht leer sein');
      const plainText = task.promptHTML.replace(/<[^>]+>/g, '');
      assert.ok(!plainText.includes('/'), `Kein Schrägstrich im Aufgabentext erlaubt: ${plainText}`);

      if (task.inputType === 'integer') {
        assert.strictEqual(typeof task.answer, 'number');
        assert.ok(Number.isInteger(task.answer), `Antwort muss ganzzahlig sein: ${task.answer}`);
        assert.ok(Number.isFinite(task.answer), 'Antwort muss endlich sein');

        // Prüfe checkAnswer
        assert.strictEqual(MG.checkAnswer(task, { value: String(task.answer) }).status, 'correct');
        assert.strictEqual(MG.checkAnswer(task, { value: String(task.answer + 1) }).status, 'wrong');
      } else if (task.inputType === 'decimal') {
        assert.strictEqual(typeof task.answer, 'number');
        assert.ok(Number.isFinite(task.answer), 'Antwort muss endlich sein');

        const commaStr = String(task.answer).replace('.', ',');
        const dotStr = String(task.answer);
        assert.strictEqual(MG.checkAnswer(task, { value: commaStr }).status, 'correct');
        assert.strictEqual(MG.checkAnswer(task, { value: dotStr }).status, 'correct');
        assert.strictEqual(MG.checkAnswer(task, { value: String(task.answer + 1) }).status, 'wrong');
        assert.strictEqual(MG.checkAnswer(task, { value: 'abc' }).status, 'invalid');
      } else if (task.inputType === 'fraction') {
        assert.ok(Number.isInteger(task.answer.num));
        assert.ok(Number.isInteger(task.answer.den) && task.answer.den > 0);
        assert.strictEqual(MG.gcd(task.answer.num, task.answer.den), 1, 'Referenzlösung muss vollständig gekürzt sein');

        // Korrekte gekürzte Antwort
        assert.strictEqual(
          MG.checkAnswer(task, { num: String(task.answer.num), den: String(task.answer.den) }).status,
          'correct'
        );

        if (task.answer.den === 1) {
          assert.strictEqual(
            MG.checkAnswer(task, { num: String(task.answer.num), den: '' }).status,
            'correct',
            'Ganzzahliges Bruchergebnis muss auch mit leerem Nenner akzeptiert werden'
          );
        }

        // Ungekürzte äquivalente Antwort (Faktor 2)
        const unreduced = MG.checkAnswer(task, {
          num: String(task.answer.num * 2),
          den: String(task.answer.den * 2)
        });
        if (!task.allowUnreduced) {
          assert.strictEqual(unreduced.status, 'partial_reduce', 'Aufgabe ohne allowUnreduced muss teilweise gekürzte Brüche abweisen');
        } else {
          assert.strictEqual(unreduced.status, 'unreduced_ok', 'Aufgabe mit allowUnreduced muss ungekürzte Brüche mit Hinweis akzeptieren');
        }
      }
    }
  }
}

// 2. Teste Lukas-Klassenarbeit (Mode 2)
for (let i = 0; i < 100; i++) {
  const exam = MG.generateLukasExam(categories);
  assert.strictEqual(exam.length, 6, 'Klassenarbeit muss genau 6 Aufgaben haben');
  const correctCount = exam.filter(item => item.isCorrect).length;
  const wrongCount = exam.filter(item => !item.isCorrect).length;
  assert.strictEqual(correctCount, 2, 'Genau 2 Aufgaben müssen richtig sein');
  assert.strictEqual(wrongCount, 4, 'Genau 4 Aufgaben müssen Fehler enthalten');

  for (const item of exam) {
    if (!item.isCorrect) {
      assert.ok(item.mistakeReason, 'Fehlerhafte Aufgabe braucht mistakeReason');
      assert.ok(item.reasonOptions.includes(item.mistakeReason), 'reasonOptions muss mistakeReason enthalten');
    }
  }
}

// 3. Expliziter Test für leeren Nenner bei ganzzahligen Bruchergebnissen
const wholeFracTask = { inputType: 'fraction', allowUnreduced: true, answer: { num: 2, den: 1 } };
assert.strictEqual(MG.checkAnswer(wholeFracTask, { num: '2', den: '' }).status, 'correct');
assert.strictEqual(MG.checkAnswer(wholeFracTask, { num: '3', den: '' }).status, 'wrong');
assert.strictEqual(MG.checkAnswer(wholeFracTask, { num: '', den: '' }).status, 'invalid');

// 4. Teste RESULT_PROFILES, classifyTaskResult & adaptive Gewichtung
const allProfileIds = Object.keys(MG.RESULT_PROFILES);
assert.strictEqual(allProfileIds.length, 8, 'Es müssen genau 8 disjunkte Ergebnis-Profile existieren');

for (const cat of categories) {
  for (let i = 0; i < 40; i++) {
    const t = MG.generateTask([cat], 'normal');
    const profileId = MG.classifyTaskResult(t);
    assert.ok(MG.RESULT_PROFILES[profileId], `Ungültiges Ergebnis-Profil: ${profileId}`);
  }
}

const weights = MG.getCategoryWeights(categories, {
  [MG.CATEGORIES.SIGNED_MUL_DIV]: { solved: 1, errors: 5, recentErrorEMA: 0.85 },
  [MG.CATEGORIES.FRACTIONS_OPS]: { solved: 20, errors: 0, recentErrorEMA: 0.05 }
});
assert.ok(
  weights[MG.CATEGORIES.SIGNED_MUL_DIV] > weights[MG.CATEGORIES.FRACTIONS_OPS],
  'Fehleranfällige Kategorie muss höher gewichtet werden'
);

// 4b. Teste visuelle Mathe-Runen (RUNE_CONDITIONS), getMatchingRuneIds & doesTaskMatchCondition
const runeIds = Object.keys(MG.RUNE_CONDITIONS);
assert.strictEqual(runeIds.length, 6, 'Es müssen genau 6 visuelle Mathe-Runen existieren');
for (const rId of ['LT10', 'GE10', 'EVEN', 'ODD', 'NEG', 'FRAC']) {
  const meta = MG.RUNE_CONDITIONS[rId];
  assert.ok(meta, `Visuelle Rune ${rId} fehlt`);
  assert.ok(meta.shortLabel && meta.shortLabel.length <= 7, `Rune ${rId} muss kurzes Label <= 7 Zeichen haben`);
}
const sampleSixTask = { inputType: 'integer', answer: 6 };
const sixRunes = MG.getMatchingRuneIds(sampleSixTask);
assert.ok(sixRunes.includes('LT10') && sixRunes.includes('EVEN'), 'Ergebnis 6 muss LT10 und EVEN zugleich erfüllen');
assert.strictEqual(MG.doesTaskMatchCondition(sampleSixTask, 'LT10'), true);
assert.strictEqual(MG.doesTaskMatchCondition(sampleSixTask, 'EVEN'), true);
assert.strictEqual(MG.doesTaskMatchCondition(sampleSixTask, 'GE10'), false);

// 5. Teste generateTaskForProfile & generateStrategicTaskPool (auch bei nur 1 aktivem Thema)
for (const profileId of allProfileIds) {
  const forcedTask = MG.generateTaskForProfile(profileId, [MG.CATEGORIES.SIGNED_MUL_DIV], 'normal');
  assert.strictEqual(MG.classifyTaskResult(forcedTask), profileId, `Fallback/Profil ${profileId} muss exakt klassifiziert werden`);
  const plain = forcedTask.promptHTML.replace(/<[^>]+>/g, '');
  assert.ok(!plain.includes('/'), `Kein Schrägstrich im Fallback-Text erlaubt: ${plain}`);
}

for (let i = 0; i < 30; i++) {
  const req = [allProfileIds[i % 8], allProfileIds[(i + 2) % 8], allProfileIds[(i + 5) % 8], allProfileIds[(i + 7) % 8]];
  const pool = MG.generateStrategicTaskPool(req, categories, 'normal', weights);
  assert.strictEqual(pool.length, 4, 'Strategie-Pool muss genau 4 Aufgaben liefern');
  const poolProfiles = pool.map(t => MG.classifyTaskResult(t));
  for (const r of req) {
    assert.ok(poolProfiles.includes(r), `Pool muss benötigtes Profil ${r} enthalten`);
  }
}

// 6. Teste Licht-Labyrinth Generierung, Kombo-Chancen & Lösbarkeit über 150 Level
for (let i = 0; i < 150; i++) {
  const sizeMode = i % 2 === 0 ? 'compact' : 'master';
  const topicSubset = i % 3 === 0 ? [MG.CATEGORIES.SIGNED_MUL_DIV] : categories;
  const level = Lab.generateLevel(sizeMode, topicSubset);

  const startTrace = Lab.traceBeam(level);
  assert.strictEqual(startTrace.hitTarget, false, `Startzustand darf Ziel nicht sofort treffen (Level ${i})`);

  const solvedLevel = {
    ...level,
    obstacles: level.obstacles.map(o => ({
      ...o,
      state: o.isDecoy ? o.state : o.solvedState
    }))
  };
  const solvedTrace = Lab.traceBeam(solvedLevel);
  assert.strictEqual(solvedTrace.hitTarget, true, `Lösungszustand muss Ziel-Kristall treffen (Level ${i}, ${sizeMode})`);

  const comboPairs = Lab.findComboPairs(level);
  assert.ok(comboPairs.length >= 1, `Jedes Level muss mindestens 1 echte 2er-Kombo-Chance bieten (Level ${i})`);

  const reqIds = Lab.getRequiredProfileIds(level);
  assert.ok(reqIds.length >= 3 && reqIds.length <= 6, `Unerwartete Bauteil-Anzahl: ${reqIds.length}`);
  const taskPool = MG.generateStrategicTaskPool(reqIds, topicSubset, 'normal', weights, 4);
  assert.strictEqual(taskPool.length, 4, 'Strategie-Pool muss 4 Aufgaben enthalten');
  for (const reqId of reqIds.slice(0, 4)) {
    assert.ok(
      taskPool.some(t => MG.doesTaskMatchCondition(t, reqId)),
      `Aufgaben-Pool deckt priorisierte Bauteil-Rune ${reqId} nicht ab`
    );
  }

  // Prüfe Kombo-Schaltung & Einrasten (locked)
  const comboRes = Lab.applyTaskToLevel(level, comboPairs[0].runeIds);
  assert.strictEqual(comboRes.isCombo, true, `Kombo-Auslösung muss isCombo === true liefern (Level ${i})`);
  assert.ok(comboRes.newlySolved.length >= 2, `Kombo muss >= 2 Bauteile gleichzeitig lösen (Level ${i})`);
  assert.ok(
    comboRes.newlySolved.every(o => o.locked && o.state === o.solvedState),
    'Gelöste Bauteile müssen dauerhaft einrasten (locked)'
  );

  // Prüfe toggleObstacle auf separatem Level
  const toggleLevel = Lab.generateLevel(sizeMode, topicSubset);
  const firstObs = toggleLevel.obstacles[0];
  const prevState = firstObs.state;
  const toggleRes = Lab.toggleObstacle(toggleLevel, firstObs.id);
  assert.notStrictEqual(toggleRes.obstacle.state, prevState, 'toggleObstacle muss Bauteil-Zustand ändern');
}

// 7. Teste Einheiten umrechnen (Strecken, Flächen inkl. a/ha, Gewicht, Zeit)
const unitDomainsSeen = new Set();
const unitLabelsSeen = new Set();
const unitProfilesSeen = new Set();
for (let i = 0; i < 400; i++) {
  const ut = MG.generateTask([MG.CATEGORIES.UNITS_CONVERT], 'normal');
  assert.strictEqual(ut.category, MG.CATEGORIES.UNITS_CONVERT);
  assert.ok(ut.raw && ut.raw.domain, 'UNITS_CONVERT muss raw.domain liefern');
  unitDomainsSeen.add(ut.raw.domain);
  unitLabelsSeen.add(ut.raw.fromUnit);
  unitLabelsSeen.add(ut.raw.toUnit);
  unitProfilesSeen.add(MG.classifyTaskResult(ut));
  assert.ok(!String(ut.answer).includes('e'), `Keine wissenschaftliche Schreibweise erlaubt: ${ut.answer}`);
  assert.ok(!ut.displayAnswerHTML.includes('e-'), `displayAnswerHTML darf keine Exponential-Notation enthalten: ${ut.displayAnswerHTML}`);
}
for (const dom of ['length', 'area', 'weight', 'time']) {
  assert.ok(unitDomainsSeen.has(dom), `Domain ${dom} fehlt bei UNITS_CONVERT`);
}
assert.ok(unitLabelsSeen.has('a'), 'Flächeneinheit Ar (a) muss vorkommen');
assert.ok(unitLabelsSeen.has('ha'), 'Flächeneinheit Hektar (ha) muss vorkommen');
for (const nonNegProfile of ['FRAC_LOW', 'FRAC_HIGH', 'DEC_GT1', 'SMALL_EVEN', 'SMALL_ODD', 'BIG_EVEN', 'BIG_ODD']) {
  assert.ok(unitProfilesSeen.has(nonNegProfile), `Ergebnis-Profil ${nonNegProfile} fehlt bei UNITS_CONVERT`);
}

const unitExam = MG.generateLukasExam([MG.CATEGORIES.UNITS_CONVERT]);
assert.strictEqual(unitExam.length, 6, 'Lukas-Arbeit für Einheiten muss 6 Aufgaben liefern');

const unitLab = Lab.generateLevel('compact', [MG.CATEGORIES.UNITS_CONVERT]);
const unitReqIds = Lab.getRequiredProfileIds(unitLab);
const unitPool = MG.generateStrategicTaskPool(unitReqIds, [MG.CATEGORIES.UNITS_CONVERT], 'normal', null, 4);
assert.strictEqual(unitPool.length, 4, 'Strategie-Pool für Einheiten muss 4 Aufgaben liefern');

console.log('Alle 5.000+ Aufgaben, Einheiten-Umrechnungen, Lukas-Arbeiten, Strategie-Pools und 150 Licht-Labyrinthe erfolgreich validiert!');
