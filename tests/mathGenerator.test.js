const assert = require('assert');
const MG = require('../js/mathGenerator.js');

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

console.log('Alle 5.000+ generierten Aufgaben und 100 Lukas-Klassenarbeiten erfolgreich validiert!');
