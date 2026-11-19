/**
 * Jorvik Mathe-Abenteuer – Prozeduraler Aufgaben-Generator (6. Klasse Gymnasium)
 * UMD-kompatibel: funktioniert direkt im Browser (window.MathGenerator) und in Node.js (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MathGenerator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CATEGORIES = {
    FRACTIONS_OPS: 'fractions_ops',
    FRACTIONS_UNITS: 'fractions_units',
    SIGNED_MUL_DIV: 'signed_mul_div',
    BRACKETS_ORDER: 'brackets_order',
    FRACTIONS_REDUCE: 'fractions_reduce',
    DECIMALS_OPS: 'decimals_ops',
    DECIMALS_CONVERT: 'decimals_convert',
    UNITS_CONVERT: 'units_convert',
    WORD_PROBLEMS: 'word_problems'
  };

  const CATEGORY_LABELS = {
    fractions_ops: 'Bruchrechnen',
    fractions_units: 'Brüche & Einheiten',
    signed_mul_div: 'Vorzeichen (· und :)',
    brackets_order: 'Klammern & Punkt-vor-Strich',
    fractions_reduce: 'Brüche kürzen',
    decimals_ops: 'Dezimalzahlen (+, −, ·, :)',
    decimals_convert: 'Brüche ↔ Dezimalzahlen',
    units_convert: 'Einheiten umrechnen',
    word_problems: '📖 Textaufgaben'
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
  }

  function simplify(num, den) {
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const g = gcd(num, den);
    return { num: num / g, den: den / g };
  }

  /**
   * Erzeugt HTML für einen echten Bruchstrich (keine Schrägstriche im Aufgabentext).
   */
  function fracHTML(num, den) {
    return `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
  }

  function signedHTML(n) {
    if (n >= 0) return `(+${n})`;
    return `(${n})`;
  }

  function roundTo(n, decimals = 4) {
    const f = Math.pow(10, decimals);
    return Math.round((n + Number.EPSILON) * f) / f;
  }

  function formatDE(n, decimals = 6) {
    const rounded = roundTo(n, decimals);
    if (rounded === 0) return '0';
    let str = String(rounded);
    if (/[eE]/.test(str)) {
      str = rounded.toFixed(decimals).replace(/\.?0+$/, '');
    }
    return str.replace('.', ',');
  }

  function parseDecimalInput(raw) {
    const str = String(raw || '').trim().replace(',', '.');
    if (!/^[+-]?\d+(\.\d+)?$/.test(str)) return NaN;
    const val = Number(str);
    return Number.isFinite(val) ? val : NaN;
  }

  // =========================================================================
  // 1. Bruchrechnen (Grundrechenarten)
  // =========================================================================
  function generateFractionOps(difficulty = 'normal') {
    const ops = ['+', '-', '·', ':'];
    const op = pick(ops);
    const maxDen = difficulty === 'easy' ? 6 : 10;
    const maxNum = difficulty === 'easy' ? 5 : 11;

    let n1 = randInt(1, maxNum);
    let d1 = randInt(2, maxDen);
    let n2 = randInt(1, maxNum);
    let d2 = randInt(2, maxDen);

    // Vermeide triviale ganze Zahlen bei beiden Brüchen gleichzeitig
    if (n1 % d1 === 0) n1 += 1;
    if (n2 % d2 === 0) n2 += 1;

    // Bei leichter Stufe nur echte Brüche
    if (difficulty === 'easy') {
      n1 = randInt(1, d1 - 1);
      n2 = randInt(1, d2 - 1);
    }

    let resNum, resDen;

    if (op === '+') {
      resNum = n1 * d2 + n2 * d1;
      resDen = d1 * d2;
    } else if (op === '-') {
      // Sicherstellen, dass das Ergebnis >= 0 ist (bzw. > 0 für angenehmes Spielen)
      if (n1 * d2 <= n2 * d1) {
        [n1, d1, n2, d2] = [n2, d2, n1, d1];
        if (n1 * d2 === n2 * d1) {
          n1 += 1;
        }
      }
      resNum = n1 * d2 - n2 * d1;
      resDen = d1 * d2;
    } else if (op === '·') {
      resNum = n1 * n2;
      resDen = d1 * d2;
    } else {
      // Division: (n1/d1) : (n2/d2)
      resNum = n1 * d2;
      resDen = d1 * n2;
    }

    const simplified = simplify(resNum, resDen);
    const commonDen = lcm(d1, d2);

    let hint = '';
    let explanation = '';
    if (op === '+' || op === '-') {
      hint = d1 === d2
        ? `Beide Brüche haben schon den gleichen Nenner ${d1}. Du kannst die Zähler direkt ${op === '+' ? 'addieren' : 'subtrahieren'}.`
        : `Suche zuerst den gemeinsamen Hauptnenner von ${d1} und ${d2} (z. B. ${commonDen}) und erweitere beide Brüche.`;
      const opSym = op === '+' ? '+' : '−';
      explanation = `Hauptnenner ${commonDen}: ${n1 * (commonDen / d1)}/${commonDen} ${opSym} ${n2 * (commonDen / d2)}/${commonDen} = ${simplified.num}/${simplified.den}` + (simplified.den === 1 ? ` = ${simplified.num}` : '');
    } else if (op === '·') {
      hint = `Bei der Multiplikation rechnest du Zähler mal Zähler (${n1} · ${n2}) und Nenner mal Nenner (${d1} · ${d2}). Tipp: Du darfst auch über Kreuz kürzen!`;
      explanation = `Rechnung: (${n1} · ${n2}) über (${d1} · ${d2}) = ${resNum}/${resDen} (gekürzt: ${simplified.num}/${simplified.den})`;
    } else {
      hint = `Durch einen Bruch teilt man, indem man mit dem Kehrwert malnimmt: drehe den zweiten Bruch um (${d2} nach oben, ${n2} nach unten) und multipliziere.`;
      explanation = `Mit Kehrwert malnehmen: (${n1} · ${d2}) über (${d1} · ${n2}) = ${resNum}/${resDen} (gekürzt: ${simplified.num}/${simplified.den})`;
    }

    return {
      category: CATEGORIES.FRACTIONS_OPS,
      inputType: 'fraction',
      allowUnreduced: true,
      promptHTML: `${fracHTML(n1, d1)} <span class="op">${op}</span> ${fracHTML(n2, d2)} <span class="eq">=</span>`,
      answer: { num: simplified.num, den: simplified.den },
      displayAnswerHTML: simplified.den === 1 ? `${simplified.num}` : fracHTML(simplified.num, simplified.den),
      hint,
      explanation,
      raw: { n1, d1, n2, d2, op }
    };
  }

  // =========================================================================
  // 2. Bruchrechnen mit Einheiten
  // =========================================================================
  const UNIT_TEMPLATES = [
    { fromUnit: 'km', toUnit: 'm', factor: 1000, amounts: [1, 2, 3, 4, 5, 8, 10] },
    { fromUnit: 'kg', toUnit: 'g', factor: 1000, amounts: [1, 2, 3, 4, 5] },
    { fromUnit: 't', toUnit: 'kg', factor: 1000, amounts: [1, 2, 3, 5] },
    { fromUnit: 'm', toUnit: 'cm', factor: 100, amounts: [1, 2, 3, 4, 5, 6] },
    { fromUnit: 'cm', toUnit: 'mm', factor: 10, amounts: [2, 3, 4, 5, 8, 10] },
    { fromUnit: 'l', toUnit: 'ml', factor: 1000, amounts: [1, 2, 3, 4, 5] },
    { fromUnit: '€', toUnit: 'Cent', factor: 100, amounts: [1, 2, 3, 4, 5, 8] },
    { fromUnit: 'Stunde', toUnit: 'Minuten', factor: 60, amounts: [1, 2, 3] },
    { fromUnit: 'Minute', toUnit: 'Sekunden', factor: 60, amounts: [1, 2, 3, 4] },
    { fromUnit: 'Tag', toUnit: 'Stunden', factor: 24, amounts: [1, 2, 3] }
  ];

  function generateFractionUnits(difficulty = 'normal') {
    const validDens = difficulty === 'easy' ? [2, 4, 5, 10] : [2, 3, 4, 5, 6, 8, 10, 12];
    let tpl, amount, den, num, totalSmall;

    for (let attempt = 0; attempt < 50; attempt++) {
      tpl = pick(UNIT_TEMPLATES);
      amount = difficulty === 'easy' ? pick(tpl.amounts.slice(0, 3)) : pick(tpl.amounts);
      totalSmall = amount * tpl.factor;

      const possibleDens = validDens.filter(d => totalSmall % d === 0);
      if (possibleDens.length > 0) {
        den = pick(possibleDens);
        num = randInt(1, den - 1);
        // Kürze den Aufgabenbruch, damit er sauber aussieht
        const s = simplify(num, den);
        num = s.num;
        den = s.den;
        if (totalSmall % den === 0) break;
      }
    }

    const answerVal = (totalSmall / den) * num;

    // Pluralanpassung für Stunde/Minute/Tag
    let fromLabel = tpl.fromUnit;
    if (amount > 1) {
      if (fromLabel === 'Stunde') fromLabel = 'Stunden';
      else if (fromLabel === 'Minute') fromLabel = 'Minuten';
      else if (fromLabel === 'Tag') fromLabel = 'Tage';
    }

    const hint = `Rechne zuerst ${amount} ${fromLabel} in ${tpl.toUnit} um (${amount} · ${tpl.factor} = ${totalSmall} ${tpl.toUnit}). Teile dann durch ${den} und nimm mal ${num}.`;
    const explanation = `${amount} ${fromLabel} = ${totalSmall} ${tpl.toUnit}. Davon (${totalSmall} : ${den}) · ${num} = ${answerVal} ${tpl.toUnit}.`;

    return {
      category: CATEGORIES.FRACTIONS_UNITS,
      inputType: 'integer',
      unitLabel: tpl.toUnit,
      promptHTML: `${fracHTML(num, den)} von <strong>${amount} ${fromLabel}</strong> sind <span class="blank-unit">? ${tpl.toUnit}</span>`,
      answer: answerVal,
      displayAnswerHTML: `${answerVal} ${tpl.toUnit}`,
      hint,
      explanation,
      raw: { num, den, amount, fromLabel, toUnit: tpl.toUnit, factor: tpl.factor, totalSmall }
    };
  }

  // =========================================================================
  // 3. Vorzeichen bei Multiplikation & Division mit Klammern
  // =========================================================================
  function generateSignedMulDiv(difficulty = 'normal') {
    const isMul = Math.random() < 0.5;
    const maxFactor = difficulty === 'easy' ? 9 : 13;

    let a, b, answer, op;

    if (isMul) {
      op = '·';
      a = randInt(2, maxFactor) * (Math.random() < 0.7 ? -1 : 1);
      b = randInt(2, maxFactor) * (Math.random() < 0.7 ? -1 : 1);
      if (a > 0 && b > 0) a = -a; // Mindestens ein negatives Vorzeichen
      answer = a * b;
    } else {
      op = ':';
      const quotient = randInt(2, maxFactor) * (Math.random() < 0.65 ? -1 : 1);
      b = randInt(2, difficulty === 'easy' ? 9 : 12) * (Math.random() < 0.65 ? -1 : 1);
      if (quotient > 0 && b > 0) b = -b;
      a = quotient * b;
      answer = quotient;
    }

    const sameSign = (a < 0 && b < 0) || (a > 0 && b > 0);
    const hint = sameSign
      ? `Beide Zahlen haben das gleiche Vorzeichen (${a < 0 ? 'Minus und Minus' : 'Plus und Plus'}). Gleiche Vorzeichen ergeben im Ergebnis immer PLUS (+)!`
      : `Die Zahlen haben unterschiedliche Vorzeichen (Plus und Minus). Ungleiche Vorzeichen ergeben im Ergebnis immer MINUS (−)!`;
    const explanation = `${sameSign ? 'Gleiche Vorzeichen ergeben Plus (+)' : 'Ungleiche Vorzeichen ergeben Minus (−)'}: ${signedHTML(a)} ${op} ${signedHTML(b)} = ${answer}.`;

    return {
      category: CATEGORIES.SIGNED_MUL_DIV,
      inputType: 'integer',
      promptHTML: `${signedHTML(a)} <span class="op">${op}</span> ${signedHTML(b)} <span class="eq">=</span>`,
      answer,
      displayAnswerHTML: `${answer}`,
      hint,
      explanation,
      raw: { a, b, op }
    };
  }

  // =========================================================================
  // 4. Rechnen mit Klammern (Punkt-vor-Strich & Vorzeichen)
  // =========================================================================
  function generateBracketsOrder(difficulty = 'normal') {
    const pattern = difficulty === 'easy' ? randInt(1, 2) : randInt(1, 4);
    let promptHTML, answer, hint, explanation;

    if (pattern === 1) {
      // (a - b) * (c - d)
      const a = randInt(10, difficulty === 'easy' ? 25 : 35);
      const b = randInt(15, difficulty === 'easy' ? 30 : 45);
      const c = randInt(-9, 5);
      const d = randInt(2, 10);
      const left = a - b;
      const right = c - d;
      answer = left * right;
      promptHTML = `(${a} − ${b}) <span class="op">·</span> (${c < 0 ? c : c} − ${d}) <span class="eq">=</span>`;
      hint = `Rechne zuerst beide Klammern getrennt aus: (${a} − ${b} = ${left}) und (${c} − ${d} = ${right}). Multipliziere dann beide Ergebnisse.`;
      explanation = `Klammern zuerst: (${a} − ${b}) = ${left} und (${c} − ${d}) = ${right}. Danach: ${left} · (${right}) = ${answer}.`;
    } else if (pattern === 2) {
      // a - (b + c) * d
      const b = randInt(-10, -2);
      const c = randInt(4, 14);
      const d = randInt(2, difficulty === 'easy' ? 4 : 6);
      const a = randInt(5, 25);
      const bracketVal = b + c;
      answer = a - bracketVal * d;
      promptHTML = `${a} − (${b} + ${c}) <span class="op">·</span> ${d} <span class="eq">=</span>`;
      hint = `Klammer zuerst! Rechne (${b} + ${c} = ${bracketVal}). Dann Punkt-vor-Strich: erst mit ${d} malnehmen, danach von ${a} abziehen.`;
      explanation = `Klammer zuerst: (${b} + ${c}) = ${bracketVal}. Punkt-vor-Strich: ${bracketVal} · ${d} = ${bracketVal * d}. Zuletzt: ${a} − (${bracketVal * d}) = ${answer}.`;
    } else if (pattern === 3) {
      // (-x + y) : (-z) + w  (Division geht garantiert auf!)
      const divisor = randInt(2, 8) * -1;
      const quotient = randInt(-7, 7) || 3;
      const dividend = divisor * quotient; // z. B. -12
      const y = randInt(2, 15);
      const x = dividend - y; // x + y = dividend
      const w = randInt(2, 15);
      answer = quotient + w;
      const xStr = x < 0 ? `${x}` : `${x}`;
      promptHTML = `(${xStr} + ${y}) <span class="op">:</span> (${divisor}) + ${w} <span class="eq">=</span>`;
      hint = `Berechne zuerst die erste Klammer (${x} + ${y} = ${dividend}). Teile dann durch (${divisor}) und addiere am Ende ${w}.`;
      explanation = `Klammer zuerst: (${x} + ${y}) = ${dividend}. Punkt-vor-Strich: ${dividend} : (${divisor}) = ${quotient}. Zuletzt: ${quotient} + ${w} = ${answer}.`;
    } else {
      // a + b * (c - d)
      const a = randInt(-12, 18);
      const b = randInt(2, 6);
      const c = randInt(3, 12);
      const d = randInt(8, 20);
      const bracketVal = c - d;
      answer = a + b * bracketVal;
      promptHTML = `${a} + ${b} <span class="op">·</span> (${c} − ${d}) <span class="eq">=</span>`;
      hint = `Zuerst die Klammer (${c} − ${d} = ${bracketVal}), dann Punkt-vor-Strich (${b} · ${bracketVal}), und erst zum Schluss ${a} addieren.`;
      explanation = `Klammer zuerst: (${c} − ${d}) = ${bracketVal}. Punkt-vor-Strich: ${b} · (${bracketVal}) = ${b * bracketVal}. Zuletzt: ${a} + (${b * bracketVal}) = ${answer}.`;
    }

    return {
      category: CATEGORIES.BRACKETS_ORDER,
      inputType: 'integer',
      promptHTML,
      answer,
      displayAnswerHTML: `${answer}`,
      hint,
      explanation,
      raw: { pattern }
    };
  }

  // =========================================================================
  // 5. Kürzen von Brüchen
  // =========================================================================
  function generateFractionReduce(difficulty = 'normal') {
    const basePairs = difficulty === 'easy'
      ? [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6]]
      : [[3, 5], [5, 8], [7, 12], [11, 25], [7, 8], [4, 9], [5, 12], [1, 3], [2, 3], [3, 4]];

    const [baseNum, baseDen] = pick(basePairs);
    const multipliers = difficulty === 'easy'
      ? [3, 4, 5, 6, 8, 9]
      : [6, 8, 9, 12, 14, 15, 16, 18];
    const mult = pick(multipliers);

    const num = baseNum * mult;
    const den = baseDen * mult;

    // Finde einen einfachen gemeinsamen Teiler für den Tipp
    let smallDiv = 2;
    for (const p of [2, 3, 5, 7, 11]) {
      if (num % p === 0 && den % p === 0) {
        smallDiv = p;
        break;
      }
    }

    return {
      category: CATEGORIES.FRACTIONS_REDUCE,
      inputType: 'fraction',
      allowUnreduced: false,
      promptHTML: `Kürze vollständig: ${fracHTML(num, den)} <span class="eq">=</span>`,
      answer: { num: baseNum, den: baseDen },
      displayAnswerHTML: fracHTML(baseNum, baseDen),
      hint: `Schau, durch welche Zahl sowohl ${num} als auch ${den} teilbar sind – zum Beispiel durch ${smallDiv}. Kürze dann weiter, bis nichts mehr geht!`,
      explanation: `Zähler und Nenner durch ${mult} teilen: (${num} : ${mult}) über (${den} : ${mult}) = ${baseNum}/${baseDen}.`,
      raw: { num, den, baseNum, baseDen, mult }
    };
  }

  // =========================================================================
  // 5b. Dezimalzahlen: Grundrechenarten (+, −, ·, :)
  // =========================================================================
  function generateDecimalsOps(difficulty = 'normal') {
    const op = pick(['+', '-', '·', ':']);

    if (op === '+' || op === '-') {
      const scaleA = difficulty === 'easy' ? 10 : pick([10, 100]);
      const scaleB = difficulty === 'easy' ? 10 : (scaleA === 10 ? 100 : pick([10, 100]));
      let a = randInt(11, difficulty === 'easy' ? 89 : 199) / scaleA;
      let b = randInt(11, difficulty === 'easy' ? 79 : 149) / scaleB;
      if (op === '-' && a <= b) {
        a = roundTo(b + randInt(5, 45) / 10, 2);
      }
      const ans = roundTo(op === '+' ? a + b : a - b, 2);
      const opSymbol = op === '+' ? '+' : '−';
      const hint = op === '+'
        ? 'Schreibe Komma unter Komma! Fülle fehlende Nachkommastellen gedanklich mit einer 0 auf.'
        : 'Schreibe Komma unter Komma und ergänze bei Bedarf eine 0 am Ende (z. B. 5,2 = 5,20).';
      return {
        category: CATEGORIES.DECIMALS_OPS,
        inputType: 'decimal',
        unitLabel: '',
        promptHTML: `${formatDE(a)} ${opSymbol} ${formatDE(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: formatDE(ans),
        hint,
        explanation: `Komma unter Komma gerechnet: ${formatDE(a)} ${opSymbol} ${formatDE(b)} = ${formatDE(ans)}.`,
        raw: { a, b, op }
      };
    }

    if (op === '·') {
      let a, b, hint;
      if (difficulty === 'easy') {
        a = randInt(11, 49) / 10;
        b = pick([2, 3, 4, 5, 10]);
        hint = b === 10
          ? 'Bei · 10 wandert das Komma um 1 Stelle nach rechts!'
          : 'Rechne zuerst ohne Komma und setze im Ergebnis genauso viele Nachkommastellen.';
      } else {
        const variant = randInt(1, 3);
        if (variant === 1) {
          // Zehnerpotenz
          a = randInt(12, 485) / 100;
          b = pick([10, 100]);
          hint = `Bei · ${b} wandert das Komma um ${b === 10 ? 1 : 2} ${b === 10 ? 'Stelle' : 'Stellen'} nach rechts.`;
        } else if (variant === 2) {
          // Dezimalzahl · natürliche Zahl
          a = randInt(12, 65) / 10;
          b = randInt(2, 9);
          hint = 'Rechne zuerst ohne Komma und setze dann im Ergebnis genauso viele Nachkommastellen wie bei der ersten Zahl.';
        } else {
          // Dezimalzahl · Dezimalzahl
          a = randInt(2, 19) / 10;
          b = randInt(2, 9) / 10;
          hint = 'Rechne zuerst ohne Komma! Das Ergebnis bekommt so viele Nachkommastellen, wie beide Faktoren zusammen haben.';
        }
      }
      const ans = roundTo(a * b, 4);
      return {
        category: CATEGORIES.DECIMALS_OPS,
        inputType: 'decimal',
        unitLabel: '',
        promptHTML: `${formatDE(a)} · ${formatDE(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: formatDE(ans),
        hint,
        explanation: `Rechnung: ${formatDE(a)} · ${formatDE(b)} = ${formatDE(ans)}.`,
        raw: { a, b, op: '·' }
      };
    }

    // Division (:) – immer exakt aufgehend konstruiert
    let a, b, ans, hint;
    if (difficulty === 'easy') {
      b = randInt(2, 6);
      ans = randInt(2, 24) / 10;
      a = roundTo(ans * b, 2);
      hint = 'Teile wie gewohnt. Sobald du beim Rechnen das Komma überschreitest, setzt du im Ergebnis ein Komma!';
    } else {
      const variant = randInt(1, 3);
      if (variant === 1) {
        // Teilen durch 10 oder 100
        b = pick([10, 100]);
        ans = randInt(12, 495) / 100;
        a = roundTo(ans * b, 4);
        hint = `Bei : ${b} wandert das Komma um ${b === 10 ? 1 : 2} ${b === 10 ? 'Stelle' : 'Stellen'} nach links.`;
      } else if (variant === 2) {
        // Dezimalzahl : natürliche Zahl
        b = randInt(2, 8);
        ans = randInt(11, 95) / (Math.random() < 0.5 ? 10 : 100);
        a = roundTo(ans * b, 4);
        hint = 'Sobald du beim schriftlichen Teilen das Komma überschreitest, setzt du auch im Ergebnis das Komma.';
      } else {
        // Kommaverschiebung: Dezimalzahl : Dezimalzahl
        b = randInt(2, 9) / 10;
        ans = randInt(2, 18) / (Math.random() < 0.5 ? 1 : 10);
        a = roundTo(ans * b, 4);
        hint = 'Verschiebe bei beiden Zahlen das Komma um gleich viele Stellen nach rechts, bis der Divisor eine ganze Zahl ist!';
      }
    }
    return {
      category: CATEGORIES.DECIMALS_OPS,
      inputType: 'decimal',
      unitLabel: '',
      promptHTML: `${formatDE(a)} : ${formatDE(b)} <span class="eq">=</span>`,
      answer: roundTo(ans, 4),
      displayAnswerHTML: formatDE(ans),
      hint,
      explanation: `Rechnung: ${formatDE(a)} : ${formatDE(b)} = ${formatDE(ans)}.`,
      raw: { a, b, op: ':' }
    };
  }

  // =========================================================================
  // 5c. Brüche <-> Dezimalzahlen umwandeln
  // =========================================================================
  function generateDecimalsConvert(difficulty = 'normal') {
    const toDecimal = Math.random() < 0.5;

    if (toDecimal) {
      const dens = difficulty === 'easy'
        ? [2, 4, 5, 10]
        : [2, 4, 5, 8, 10, 20, 25, 50];
      const den = pick(dens);
      const rawNum = randInt(1, den - 1);
      const s = simplify(rawNum, den);
      const ans = roundTo(s.num / s.den, 4);
      return {
        category: CATEGORIES.DECIMALS_CONVERT,
        inputType: 'decimal',
        unitLabel: '',
        promptHTML: `Wandle den Bruch in eine Dezimalzahl um:<br>${fracHTML(s.num, s.den)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: formatDE(ans),
        hint: 'Erweitere den Bruch auf Zehntel (10), Hundertstel (100) oder Tausendstel (1000) – oder teile Zähler durch Nenner!',
        explanation: `${s.num} : ${s.den} = ${formatDE(ans)}.`,
        raw: { direction: 'toDecimal', num: s.num, den: s.den }
      };
    }

    // Dezimalzahl -> vollständig gekürzter Bruch
    const easyDecimals = [
      { num: 1, den: 2 }, { num: 1, den: 4 }, { num: 3, den: 4 },
      { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
      { num: 1, den: 10 }, { num: 3, den: 10 }, { num: 7, den: 10 }, { num: 9, den: 10 }
    ];
    const normalDecimals = [
      ...easyDecimals,
      { num: 1, den: 8 }, { num: 3, den: 8 }, { num: 5, den: 8 }, { num: 7, den: 8 },
      { num: 3, den: 20 }, { num: 7, den: 20 }, { num: 9, den: 20 },
      { num: 1, den: 25 }, { num: 3, den: 25 }, { num: 6, den: 25 }, { num: 12, den: 25 },
      { num: 5, den: 4 }, { num: 3, den: 2 }, { num: 7, den: 5 }
    ];
    const chosen = pick(difficulty === 'easy' ? easyDecimals : normalDecimals);
    const decVal = roundTo(chosen.num / chosen.den, 4);

    return {
      category: CATEGORIES.DECIMALS_CONVERT,
      inputType: 'fraction',
      allowUnreduced: false,
      promptHTML: `Wandle die Dezimalzahl in einen vollständig gekürzten Bruch um:<br><strong>${formatDE(decVal)}</strong> <span class="eq">=</span>`,
      answer: { num: chosen.num, den: chosen.den },
      displayAnswerHTML: fracHTML(chosen.num, chosen.den),
      hint: 'Lies die Nachkommastellen als Zehntel (10), Hundertstel (100) oder Tausendstel (1000) ab und kürze den Bruch danach vollständig!',
      explanation: `${formatDE(decVal)} entspricht vollständig gekürzt ${chosen.num}/${chosen.den}.`,
      raw: { direction: 'toFraction', decVal, baseNum: chosen.num, baseDen: chosen.den }
    };
  }

  // =========================================================================
  // 6b. Größen & Einheiten mit Dezimalzahlen umrechnen
  //     (Strecken, Flächen inkl. a & ha, Gewicht, Zeiteinheiten)
  // =========================================================================
  const UNIT_CONVERT_DOMAINS = {
    length: [
      {
        fromUnit: 'km', toUnit: 'm', factor: 1000, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 1.2, 3, 0.05],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 1.25, 2.05, 0.002, 0.005, 0.008, 0.015, 0.03, 0.075, 0.4, 0.125]
      },
      {
        fromUnit: 'm', toUnit: 'km', factor: 1000, op: 'div',
        easyVals: [500, 1500, 2500, 250, 750, 1200],
        normalVals: [500, 1500, 2500, 250, 750, 1250, 1750, 2050, 40, 80, 120, 350, 650, 5, 25]
      },
      {
        fromUnit: 'm', toUnit: 'dm', factor: 10, op: 'mul',
        easyVals: [1.5, 2.5, 0.4, 0.7, 3.2, 0.5],
        normalVals: [1.5, 2.5, 0.4, 0.7, 0.03, 0.05, 0.08, 0.12, 1.25, 2.75, 3.5]
      },
      {
        fromUnit: 'dm', toUnit: 'm', factor: 10, op: 'div',
        easyVals: [15, 25, 4, 8, 30, 5],
        normalVals: [15, 25, 4, 8, 30, 5, 0.5, 2.5, 3.5, 12.5, 7, 18, 50, 250]
      },
      {
        fromUnit: 'm', toUnit: 'cm', factor: 100, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.04, 0.05],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.003, 0.008, 0.012, 0.015, 0.04, 0.35, 1.25, 2.08]
      },
      {
        fromUnit: 'cm', toUnit: 'm', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 40, 80],
        normalVals: [50, 150, 250, 25, 75, 40, 80, 3, 8, 12, 35, 125, 208, 0.5, 1.5, 300]
      },
      {
        fromUnit: 'dm', toUnit: 'cm', factor: 10, op: 'mul',
        easyVals: [1.5, 2.5, 0.4, 0.7, 0.8],
        normalVals: [1.5, 2.5, 0.4, 0.7, 0.03, 0.08, 0.125, 1.25, 3.5, 0.65, 2.4]
      },
      {
        fromUnit: 'cm', toUnit: 'dm', factor: 10, op: 'div',
        easyVals: [15, 25, 5, 8, 40],
        normalVals: [15, 25, 5, 8, 40, 0.3, 1.5, 6.5, 12.5, 24, 35, 7]
      },
      {
        fromUnit: 'cm', toUnit: 'mm', factor: 10, op: 'mul',
        easyVals: [1.5, 2.5, 0.4, 0.7, 0.5],
        normalVals: [1.5, 2.5, 0.4, 0.7, 0.03, 0.08, 0.15, 1.25, 3.5, 0.25]
      },
      {
        fromUnit: 'mm', toUnit: 'cm', factor: 10, op: 'div',
        easyVals: [15, 25, 4, 8, 30],
        normalVals: [15, 25, 4, 8, 30, 0.5, 3, 6, 12.5, 35, 75, 18]
      }
    ],
    area: [
      {
        fromUnit: 'km²', toUnit: 'ha', factor: 100, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.04, 0.05],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.004, 0.007, 0.015, 0.03, 0.35, 1.25, 0.008]
      },
      {
        fromUnit: 'ha', toUnit: 'km²', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 40, 80],
        normalVals: [50, 150, 250, 25, 75, 40, 80, 3, 12, 35, 125, 200, 500, 0.5]
      },
      {
        fromUnit: 'ha', toUnit: 'a', factor: 100, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.04, 0.05],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.003, 0.009, 0.015, 0.03, 0.35, 1.25, 0.08]
      },
      {
        fromUnit: 'a', toUnit: 'ha', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 40, 80],
        normalVals: [50, 150, 250, 25, 75, 40, 80, 3, 12, 35, 125, 200, 500, 5, 0.5]
      },
      {
        fromUnit: 'a', toUnit: 'm²', factor: 100, op: 'mul',
        easyVals: [1, 5, 1.5, 2.5, 0.5, 0.25, 0.04, 0.05],
        normalVals: [5, 1.5, 2.5, 0.5, 0.25, 0.002, 0.007, 0.015, 0.03, 0.35, 1.25, 4.5, 0.08]
      },
      {
        fromUnit: 'm²', toUnit: 'a', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 200, 500],
        normalVals: [50, 150, 250, 25, 75, 200, 500, 3, 12, 35, 125, 450, 80, 5, 0.5]
      },
      {
        fromUnit: 'ha', toUnit: 'm²', factor: 10000, op: 'mul', twoStep: true,
        easyVals: [0.5, 0.25],
        normalVals: [0.03, 0.25, 0.5, 1.5, 0.005, 0.0004, 0.0007, 0.0015, 0.045, 0.08]
      },
      {
        fromUnit: 'm²', toUnit: 'ha', factor: 10000, op: 'div', twoStep: true,
        easyVals: [2500, 5000],
        normalVals: [300, 2500, 5000, 15000, 50, 400, 7500, 12500, 800, 1200]
      },
      {
        fromUnit: 'm²', toUnit: 'dm²', factor: 100, op: 'mul',
        easyVals: [1.5, 2.5, 0.5, 0.25, 0.04, 0.05],
        normalVals: [1.5, 2.5, 0.5, 0.25, 0.003, 0.008, 0.015, 0.03, 0.35, 1.25, 0.09]
      },
      {
        fromUnit: 'dm²', toUnit: 'm²', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 40, 80],
        normalVals: [50, 150, 250, 25, 75, 40, 80, 3, 12, 35, 125, 300, 0.5, 1.5]
      },
      {
        fromUnit: 'dm²', toUnit: 'cm²', factor: 100, op: 'mul',
        easyVals: [1.5, 2.5, 0.5, 0.25, 0.04, 0.05],
        normalVals: [1.5, 2.5, 0.5, 0.25, 0.003, 0.007, 0.015, 0.03, 0.35, 1.25]
      },
      {
        fromUnit: 'cm²', toUnit: 'dm²', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 40, 80],
        normalVals: [50, 150, 250, 25, 75, 40, 80, 3, 12, 35, 125, 0.03, 0.5, 1.5]
      },
      {
        fromUnit: 'cm²', toUnit: 'mm²', factor: 100, op: 'mul',
        easyVals: [1.5, 2.5, 0.5, 0.25, 0.04, 0.05],
        normalVals: [1.5, 2.5, 0.5, 0.25, 0.003, 0.008, 0.015, 0.03, 0.35, 1.25]
      },
      {
        fromUnit: 'mm²', toUnit: 'cm²', factor: 100, op: 'div',
        easyVals: [50, 150, 250, 25, 75, 40, 80],
        normalVals: [50, 150, 250, 25, 75, 40, 80, 3, 12, 35, 125, 0.5, 5]
      },
      {
        fromUnit: 'm²', toUnit: 'cm²', factor: 10000, op: 'mul', twoStep: true,
        easyVals: [0.5, 0.25],
        normalVals: [0.03, 0.25, 0.5, 1.5, 0.005, 0.0004, 0.0007, 0.0015, 0.08]
      },
      {
        fromUnit: 'cm²', toUnit: 'm²', factor: 10000, op: 'div', twoStep: true,
        easyVals: [2500, 5000],
        normalVals: [0.03, 0.5, 5, 50, 300, 2500, 5000, 7500, 12500, 15000]
      }
    ],
    weight: [
      {
        fromUnit: 't', toUnit: 'kg', factor: 1000, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 1.2, 3],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 1.25, 2.05, 0.002, 0.005, 0.008, 0.015, 0.03, 0.075, 0.35]
      },
      {
        fromUnit: 'kg', toUnit: 't', factor: 1000, op: 'div',
        easyVals: [500, 1500, 2500, 250, 750, 1200],
        normalVals: [500, 1500, 2500, 250, 750, 1250, 1750, 40, 80, 120, 350, 650, 25, 5]
      },
      {
        fromUnit: 'kg', toUnit: 'g', factor: 1000, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.05, 1.2],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.003, 0.006, 0.015, 0.03, 0.085, 1.25, 2.35, 0.45]
      },
      {
        fromUnit: 'g', toUnit: 'kg', factor: 1000, op: 'div',
        easyVals: [500, 1500, 2500, 250, 750, 400],
        normalVals: [500, 1500, 2500, 250, 750, 400, 30, 75, 150, 350, 650, 1250, 1750, 5, 0.5]
      },
      {
        fromUnit: 'g', toUnit: 'mg', factor: 1000, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.1],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.002, 0.005, 0.015, 0.03, 0.08, 1.25, 0.35]
      },
      {
        fromUnit: 'mg', toUnit: 'g', factor: 1000, op: 'div',
        easyVals: [500, 1500, 2500, 250, 750, 600],
        normalVals: [500, 1500, 2500, 250, 750, 600, 25, 80, 120, 350, 650, 1250, 5]
      }
    ],
    time: [
      {
        fromUnit: 'h', toUnit: 'min', factor: 60, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 1, 2],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.05, 0.1, 0.15, 0.2, 0.35, 0.4, 0.45, 0.6, 1.25, 1.75, 2.25, 0.005, 0.015, 0.025]
      },
      {
        fromUnit: 'min', toUnit: 'h', factor: 60, op: 'div',
        easyVals: [30, 15, 45, 90, 120, 150],
        normalVals: [30, 15, 45, 90, 120, 150, 6, 12, 18, 24, 36, 42, 48, 54, 75, 105, 135, 180, 3, 9]
      },
      {
        fromUnit: 'min', toUnit: 's', factor: 60, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 2],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.05, 0.1, 0.15, 0.2, 0.35, 0.4, 0.45, 1.25, 1.75, 0.005, 0.015, 0.025]
      },
      {
        fromUnit: 's', toUnit: 'min', factor: 60, op: 'div',
        easyVals: [30, 15, 45, 90, 120, 150],
        normalVals: [30, 15, 45, 90, 120, 150, 6, 12, 18, 24, 36, 42, 48, 54, 75, 105, 180, 3, 9]
      },
      {
        fromUnit: 'd', toUnit: 'h', factor: 24, op: 'mul',
        easyVals: [0.5, 1.5, 2.5, 0.25, 0.75, 2],
        normalVals: [0.5, 1.5, 2.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875, 1.25, 1.75, 2.25, 3]
      },
      {
        fromUnit: 'h', toUnit: 'd', factor: 24, op: 'div',
        easyVals: [12, 6, 18, 36, 48, 72],
        normalVals: [12, 6, 18, 36, 48, 72, 3, 9, 15, 21, 30, 42, 60, 84, 96, 120]
      }
    ]
  };

  function getUnitConvertHint(domain, fromUnit, toUnit, factor, op) {
    const dirWord = op === 'mul' ? 'malnehmen (·)' : 'teilen (:)';
    if (domain === 'area') {
      return `Flächen-Treppe: mm² ↔ cm² ↔ dm² ↔ m² ↔ a ↔ ha ↔ km². Pro Schritt gilt Faktor 100! Hier rechnest du ${dirWord} ${factor}.`;
    }
    if (domain === 'time') {
      return `Zeit-Umrechnung: 1 d = 24 h, 1 h = 60 min, 1 min = 60 s (Achtung: kein Zehnersystem!). Rechne hier ${dirWord} ${factor}.`;
    }
    if (domain === 'weight') {
      return `Gewichts-Treppe: 1 t = 1000 kg, 1 kg = 1000 g, 1 g = 1000 mg. Verschiebe das Komma beim ${op === 'mul' ? 'Malnehmen nach rechts' : 'Teilen nach links'} (${factor}).`;
    }
    return `Längen-Treppe: 1 km = 1000 m, 1 m = 10 dm = 100 cm, 1 dm = 10 cm, 1 cm = 10 mm. Rechne ${dirWord} ${factor}.`;
  }

  function generateUnitsConvert(difficulty = 'normal') {
    const domain = pick(['length', 'area', 'weight', 'time']);
    const pool = UNIT_CONVERT_DOMAINS[domain].filter(s => difficulty !== 'easy' || !s.twoStep);
    const spec = pick(pool);
    const fromVal = pick(difficulty === 'easy' ? spec.easyVals : spec.normalVals);
    const rawAns = spec.op === 'mul' ? fromVal * spec.factor : fromVal / spec.factor;
    const ans = roundTo(rawAns, 6);

    const hint = getUnitConvertHint(domain, spec.fromUnit, spec.toUnit, spec.factor, spec.op);
    const opSymbol = spec.op === 'mul' ? '·' : ':';
    const explanation = `Rechnung: ${formatDE(fromVal)} ${spec.fromUnit} ${opSymbol} ${spec.factor} = ${formatDE(ans)} ${spec.toUnit}.`;

    return {
      category: CATEGORIES.UNITS_CONVERT,
      inputType: 'decimal',
      unitLabel: spec.toUnit,
      promptHTML: `Rechne in die gesuchte Einheit um:<br><strong>${formatDE(fromVal)} ${spec.fromUnit}</strong> <span class="eq">=</span> <span class="blank-unit">? ${spec.toUnit}</span>`,
      answer: ans,
      displayAnswerHTML: `${formatDE(ans)} ${spec.toUnit}`,
      hint,
      explanation,
      raw: {
        domain,
        fromVal,
        fromUnit: spec.fromUnit,
        toUnit: spec.toUnit,
        factor: spec.factor,
        op: spec.op
      }
    };
  }

  // =========================================================================
  // 6. Textaufgaben (alle Themengebiete rund um Jorvik)
  // =========================================================================
  function generateWordProblem(difficulty = 'normal') {
    const subType = pick([
      CATEGORIES.FRACTIONS_OPS,
      CATEGORIES.FRACTIONS_UNITS,
      CATEGORIES.SIGNED_MUL_DIV,
      CATEGORIES.BRACKETS_ORDER,
      CATEGORIES.FRACTIONS_REDUCE,
      CATEGORIES.DECIMALS_OPS,
      CATEGORIES.DECIMALS_CONVERT,
      CATEGORIES.UNITS_CONVERT
    ]);

    if (subType === CATEGORIES.FRACTIONS_OPS) {
      const variant = randInt(1, 3);
      const maxDen = difficulty === 'easy' ? 6 : 8;
      let d1 = randInt(2, maxDen);
      let d2 = randInt(2, maxDen);
      let n1 = randInt(1, d1 - 1);
      let n2 = randInt(1, d2 - 1);

      if (variant === 1) {
        // Addition: Reitstrecke oder Futter
        const resNum = n1 * d2 + n2 * d1;
        const resDen = d1 * d2;
        const s = simplify(resNum, resDen);
        const cDen = lcm(d1, d2);
        const story = pick([
          `Lisa reitet morgens ${fracHTML(n1, d1)} km durch Moorland und nachmittags noch ${fracHTML(n2, d2)} km durch den Hollow Woods. Wie viele Kilometer ist sie insgesamt geritten?`,
          `Im Stall bekommt Starshine morgens ${fracHTML(n1, d1)} kg Hafer und abends ${fracHTML(n2, d2)} kg Hafer. Wie viel Kilogramm Hafer frisst er an diesem Tag?`
        ]);
        return {
          category: CATEGORIES.WORD_PROBLEMS,
          subCategory: CATEGORIES.FRACTIONS_OPS,
          inputType: 'fraction',
          allowUnreduced: true,
          promptHTML: story,
          answer: s,
          displayAnswerHTML: s.den === 1 ? `${s.num}` : fracHTML(s.num, s.den),
          hint: `Addiere die beiden Brüche. Bringe sie dafür zuerst auf den gemeinsamen Nenner ${cDen}.`,
          explanation: `Rechnung: ${n1 * (cDen / d1)}/${cDen} + ${n2 * (cDen / d2)}/${cDen} = ${resNum * (cDen / resDen)}/${cDen}` + (s.den === 1 ? ` = ${s.num}` : ` = ${s.num}/${s.den}`),
          raw: { n1, d1, n2, d2, op: '+' }
        };
      }

      if (variant === 2) {
        // Subtraktion: Wasser/Futter übrig
        if (n1 * d2 <= n2 * d1) {
          const tn = n1; const td = d1;
          n1 = n2; d1 = d2;
          n2 = tn; d2 = td;
          if (n1 * d2 === n2 * d1) {
            n1 = d1; // sicherstellen dass n1/d1 > n2/d2
          }
        }
        const resNum = n1 * d2 - n2 * d1;
        const resDen = d1 * d2;
        const s = simplify(resNum, resDen);
        const cDen = lcm(d1, d2);
        const story = `Im Eimer sind ${fracHTML(n1, d1)} Liter Wasser. Pony Keks trinkt davon ${fracHTML(n2, d2)} Liter. Wie viel Liter Wasser bleiben im Eimer?`;
        return {
          category: CATEGORIES.WORD_PROBLEMS,
          subCategory: CATEGORIES.FRACTIONS_OPS,
          inputType: 'fraction',
          allowUnreduced: true,
          promptHTML: story,
          answer: s,
          displayAnswerHTML: s.den === 1 ? `${s.num}` : fracHTML(s.num, s.den),
          hint: `Subtrahiere den getrunkenen Teil vom Anfangswert. Der gemeinsame Nenner ist ${cDen}.`,
          explanation: `Rechnung: ${n1 * (cDen / d1)}/${cDen} − ${n2 * (cDen / d2)}/${cDen} = ${s.num}/${s.den}`,
          raw: { n1, d1, n2, d2, op: '-' }
        };
      }

      // Multiplikation: Anteil von einem Anteil
      const resNum = n1 * n2;
      const resDen = d1 * d2;
      const s = simplify(resNum, resDen);
      const story = `Ein Sack Möhren wiegt ${fracHTML(n1, d1)} kg. Maya nimmt davon ${fracHTML(n2, d2)} für ihren Ausritt mit. Wie viel Kilogramm Möhren nimmt sie mit?`;
      return {
        category: CATEGORIES.WORD_PROBLEMS,
        subCategory: CATEGORIES.FRACTIONS_OPS,
        inputType: 'fraction',
        allowUnreduced: true,
        promptHTML: story,
        answer: s,
        displayAnswerHTML: s.den === 1 ? `${s.num}` : fracHTML(s.num, s.den),
        hint: `„Ein Bruchteil von etwas“ bedeutet: Brüche multiplizieren! Rechne Zähler mal Zähler und Nenner mal Nenner.`,
        explanation: `Rechnung: (${n1} · ${n2}) über (${d1} · ${d2}) = ${resNum}/${resDen} (gekürzt: ${s.num}/${s.den})`,
        raw: { n1, d1, n2, d2, op: '·' }
      };
    }

    if (subType === CATEGORIES.FRACTIONS_UNITS) {
      const scenarios = [
        {
          fromUnit: 'h',
          toUnit: 'min',
          factor: 60,
          dens: [2, 3, 4, 5, 6, 10, 12],
          makeText: (n, d, amt) => `Der Ausritt zum Leuchtturm dauert ${fracHTML(n, d)} Stunden. Wie viele Minuten sind das?`
        },
        {
          fromUnit: 'km',
          toUnit: 'm',
          factor: 1000,
          dens: [2, 4, 5, 8, 10],
          makeText: (n, d) => `Die neue Reitstrecke in Firgrove ist ${fracHTML(n, d)} km lang. Wie viele Meter sind das?`
        },
        {
          fromUnit: 'kg',
          toUnit: 'g',
          factor: 1000,
          dens: [2, 4, 5, 8, 10],
          makeText: (n, d) => `Für die Pferde werden ${fracHTML(n, d)} kg Leckerlis abgewogen. Wie viele Gramm sind das?`
        }
      ];
      const sc = pick(scenarios);
      const den = pick(difficulty === 'easy' ? sc.dens.filter(d => d <= 6) : sc.dens);
      const num = randInt(1, den - 1);
      const s = simplify(num, den);
      const ans = (sc.factor / s.den) * s.num;

      return {
        category: CATEGORIES.WORD_PROBLEMS,
        subCategory: CATEGORIES.FRACTIONS_UNITS,
        inputType: 'integer',
        unitLabel: sc.toUnit,
        promptHTML: sc.makeText(s.num, s.den, 1),
        answer: ans,
        displayAnswerHTML: `${ans} ${sc.toUnit}`,
        hint: `1 ${sc.fromUnit} sind ${sc.factor} ${sc.toUnit}. Teile ${sc.factor} durch ${s.den} und multipliziere mit ${s.num}.`,
        explanation: `1 ${sc.fromUnit} = ${sc.factor} ${sc.toUnit}. Erst ${sc.factor} : ${s.den} = ${sc.factor / s.den} ${sc.toUnit}, dann · ${s.num} = ${ans} ${sc.toUnit}.`,
        raw: { amount: 1, num: s.num, den: s.den, fromUnit: sc.fromUnit, toUnit: sc.toUnit, factor: sc.factor }
      };
    }

    if (subType === CATEGORIES.SIGNED_MUL_DIV) {
      const hours = randInt(3, difficulty === 'easy' ? 6 : 9);
      const drop = -randInt(2, difficulty === 'easy' ? 5 : 8);
      const ans = hours * drop;
      const story = pick([
        `Im frostigen Dinotal sinkt die Temperatur jede Stunde um ${Math.abs(drop)} °C (also ${drop} °C pro Stunde). Wie groß ist die gesamte Temperaturänderung nach ${hours} Stunden?`,
        `Bei einer Klettertour im Gebirge geht es ${hours} Abschnitte lang jeweils ${Math.abs(drop)} Meter bergab (${drop} m pro Abschnitt). Wie viele Meter Höhenunterschied sind das insgesamt?`
      ]);
      return {
        category: CATEGORIES.WORD_PROBLEMS,
        subCategory: CATEGORIES.SIGNED_MUL_DIV,
        inputType: 'integer',
        unitLabel: '',
        promptHTML: story,
        answer: ans,
        displayAnswerHTML: `${ans}`,
        hint: `Es sinkt bzw. geht bergab – das Ergebnis hat also ein Minuszeichen! Rechne ${hours} · (${drop}).`,
        explanation: `Plus mal Minus ergibt Minus: ${hours} · (${drop}) = ${ans}.`,
        raw: { a: hours, b: drop, op: '·' }
      };
    }

    if (subType === CATEGORIES.BRACKETS_ORDER) {
      const variant = randInt(1, 2);
      if (variant === 1) {
        const stalls = randInt(3, 6);
        const horsesPerStall = randInt(2, 4);
        const guestHorses = randInt(2, 5);
        const applesEach = randInt(2, 4);
        const ans = (stalls * horsesPerStall + guestHorses) * applesEach;
        return {
          category: CATEGORIES.WORD_PROBLEMS,
          subCategory: CATEGORIES.BRACKETS_ORDER,
          inputType: 'integer',
          unitLabel: 'Äpfel',
          promptHTML: `Im Stall von Moorland stehen ${stalls} Boxen mit je ${horsesPerStall} Pferden. Dazu kommen ${guestHorses} Gastpferde. Jedes Pferd bekommt ${applesEach} Äpfel. Wie viele Äpfel werden insgesamt verteilt?`,
          answer: ans,
          displayAnswerHTML: `${ans} Äpfel`,
          hint: `Rechne zuerst die Gesamtzahl der Pferde aus: (${stalls} · ${horsesPerStall} + ${guestHorses}), und nimm das Ergebnis mal ${applesEach}.`,
          explanation: `Pferde im Stall: ${stalls} · ${horsesPerStall} = ${stalls * horsesPerStall}, plus ${guestHorses} Gastpferde = ${stalls * horsesPerStall + guestHorses} Pferde. Mal ${applesEach} Äpfel = ${ans} Äpfel.`,
          raw: { pattern: 1 }
        };
      } else {
        const bags = randInt(2, 5);
        const priceBag = randInt(4, 9);
        const brushes = randInt(2, 4);
        const priceBrush = randInt(3, 7);
        const ans = bags * priceBag + brushes * priceBrush;
        return {
          category: CATEGORIES.WORD_PROBLEMS,
          subCategory: CATEGORIES.BRACKETS_ORDER,
          inputType: 'integer',
          unitLabel: 'JS',
          promptHTML: `Linda kauft im Reitershop ${bags} Beutel Leckerlis zu je ${priceBag} Jorvik-Schillingen (JS) und ${brushes} Putzbürsten zu je ${priceBrush} JS. Wie viel muss sie insgesamt bezahlen?`,
          answer: ans,
          displayAnswerHTML: `${ans} JS`,
          hint: `Punkt-vor-Strich! Rechne zuerst ${bags} · ${priceBag} und ${brushes} · ${priceBrush}, und addiere dann beide Beträge.`,
          explanation: `Leckerlis: ${bags} · ${priceBag} = ${bags * priceBag} JS. Bürsten: ${brushes} · ${priceBrush} = ${brushes * priceBrush} JS. Zusammen: ${bags * priceBag} + ${brushes * priceBrush} = ${ans} JS.`,
          raw: { pattern: 2 }
        };
      }
    }

    if (subType === CATEGORIES.DECIMALS_OPS) {
      const variant = randInt(1, 3);
      if (variant === 1) {
        const p1 = randInt(120, 680) / 100;
        const p2 = randInt(150, 790) / 100;
        const ans = roundTo(p1 + p2, 2);
        return {
          category: CATEGORIES.WORD_PROBLEMS,
          subCategory: CATEGORIES.DECIMALS_OPS,
          inputType: 'decimal',
          unitLabel: '€',
          promptHTML: `Im Reitladen in Silverglade kauft Lisa Hufkratzer für ${formatDE(p1)} € und eine Mähnenbürste für ${formatDE(p2)} €. Wie viel Euro muss sie bezahlen?`,
          answer: ans,
          displayAnswerHTML: `${formatDE(ans)} €`,
          hint: 'Addiere beide Preise – achte darauf, Komma unter Komma zu schreiben!',
          explanation: `Rechnung: ${formatDE(p1)} + ${formatDE(p2)} = ${formatDE(ans)} €.`,
          raw: { a: p1, b: p2, op: '+' }
        };
      }
      if (variant === 2) {
        const total = randInt(45, 95) / 10;
        const done = randInt(125, Math.floor(total * 100) - 50) / 100;
        const ans = roundTo(total - done, 2);
        return {
          category: CATEGORIES.WORD_PROBLEMS,
          subCategory: CATEGORIES.DECIMALS_OPS,
          inputType: 'decimal',
          unitLabel: 'km',
          promptHTML: `Die Reitstrecke durch Valedale ist ${formatDE(total)} km lang. Maya ist bereits ${formatDE(done)} km geritten. Wie viele Kilometer fehlen ihr noch?`,
          answer: ans,
          displayAnswerHTML: `${formatDE(ans)} km`,
          hint: 'Ziehe die bereits gerittene Strecke von der Gesamtstrecke ab (Komma unter Komma).',
          explanation: `Rechnung: ${formatDE(total)} − ${formatDE(done)} = ${formatDE(ans)} km.`,
          raw: { a: total, b: done, op: '-' }
        };
      }
      const weight = randInt(11, 35) / 10;
      const count = randInt(3, difficulty === 'easy' ? 5 : 8);
      const ans = roundTo(weight * count, 2);
      return {
        category: CATEGORIES.WORD_PROBLEMS,
        subCategory: CATEGORIES.DECIMALS_OPS,
        inputType: 'decimal',
        unitLabel: 'kg',
        promptHTML: `Ein Sack Pferdeleckerlis wiegt ${formatDE(weight)} kg. Für das Turnier kauft der Stall ${count} Säcke. Wie viele Kilogramm sind das insgesamt?`,
        answer: ans,
        displayAnswerHTML: `${formatDE(ans)} kg`,
        hint: `Multipliziere ${formatDE(weight)} mit ${count}. Das Ergebnis hat wieder eine Nachkommastelle.`,
        explanation: `Rechnung: ${formatDE(weight)} · ${count} = ${formatDE(ans)} kg.`,
        raw: { a: weight, b: count, op: '·' }
      };
    }

    if (subType === CATEGORIES.DECIMALS_CONVERT) {
      const pairs = [
        { num: 1, den: 2 }, { num: 1, den: 4 }, { num: 3, den: 4 },
        { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
        { num: 1, den: 8 }, { num: 3, den: 8 }
      ];
      const chosen = pick(pairs);
      const decVal = roundTo(chosen.num / chosen.den, 4);
      return {
        category: CATEGORIES.WORD_PROBLEMS,
        subCategory: CATEGORIES.DECIMALS_CONVERT,
        inputType: 'fraction',
        allowUnreduced: false,
        promptHTML: `Für ein Rezept für Pferde-Kekse braucht man ${formatDE(decVal)} kg Haferflocken. Wie viel Kilogramm sind das als vollständig gekürzter Bruch?`,
        answer: { num: chosen.num, den: chosen.den },
        displayAnswerHTML: fracHTML(chosen.num, chosen.den),
        hint: 'Schreibe die Dezimalzahl als Zehntel, Hundertstel oder Tausendstel und kürze dann vollständig!',
        explanation: `${formatDE(decVal)} entspricht gekürzt ${chosen.num}/${chosen.den}.`,
        raw: { direction: 'toFraction', decVal, baseNum: chosen.num, baseDen: chosen.den }
      };
    }

    if (subType === CATEGORIES.UNITS_CONVERT) {
      const stories = [
        {
          domain: 'area',
          fromVal: pick([4.5, 2.5, 5, 0.75]),
          fromUnit: 'a',
          toUnit: 'm²',
          factor: 100,
          op: 'mul',
          buildPrompt: v => `Die neue Auslauf-Koppel am Moorland-Stall hat eine Fläche von <strong>${formatDE(v)} a</strong>. Wie viele Quadratmeter (m²) sind das?`
        },
        {
          domain: 'area',
          fromVal: pick([0.35, 0.5, 1.25]),
          fromUnit: 'ha',
          toUnit: 'm²',
          factor: 10000,
          op: 'mul',
          buildPrompt: v => `Die große Weide hinter Valedale misst <strong>${formatDE(v)} ha</strong>. Wie vielen Quadratmetern (m²) entspricht das?`
        },
        {
          domain: 'length',
          fromVal: pick([1.5, 2.4, 0.75, 1.25]),
          fromUnit: 'km',
          toUnit: 'm',
          factor: 1000,
          op: 'mul',
          buildPrompt: v => `Der Waldweg zum Wasserfall ist <strong>${formatDE(v)} km</strong> lang. Wie viele Meter (m) sind das?`
        },
        {
          domain: 'weight',
          fromVal: pick([1.25, 0.75, 2.5, 0.45]),
          fromUnit: 't',
          toUnit: 'kg',
          factor: 1000,
          op: 'mul',
          buildPrompt: v => `Für den Winter bestellt der Reitstall <strong>${formatDE(v)} t</strong> Heu. Wie viele Kilogramm (kg) werden geliefert?`
        },
        {
          domain: 'time',
          fromVal: pick([1.5, 0.75, 1.25, 2.5]),
          fromUnit: 'h',
          toUnit: 'min',
          factor: 60,
          op: 'mul',
          buildPrompt: v => `Das Springtraining mit Anne dauert <strong>${formatDE(v)} h</strong>. Wie viele Minuten (min) sind das?`
        }
      ];
      const sc = pick(stories);
      const ans = roundTo(sc.op === 'mul' ? sc.fromVal * sc.factor : sc.fromVal / sc.factor, 6);
      const opSym = sc.op === 'mul' ? '·' : ':';
      return {
        category: CATEGORIES.WORD_PROBLEMS,
        subCategory: CATEGORIES.UNITS_CONVERT,
        inputType: 'decimal',
        unitLabel: sc.toUnit,
        promptHTML: sc.buildPrompt(sc.fromVal),
        answer: ans,
        displayAnswerHTML: `${formatDE(ans)} ${sc.toUnit}`,
        hint: getUnitConvertHint(sc.domain, sc.fromUnit, sc.toUnit, sc.factor, sc.op),
        explanation: `${formatDE(sc.fromVal)} ${sc.fromUnit} ${opSym} ${sc.factor} = ${formatDE(ans)} ${sc.toUnit}.`,
        raw: {
          domain: sc.domain,
          fromVal: sc.fromVal,
          fromUnit: sc.fromUnit,
          toUnit: sc.toUnit,
          factor: sc.factor,
          op: sc.op
        }
      };
    }

    // FRACTIONS_REDUCE als Textaufgabe
    const basePairs = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6]];
    const [baseNum, baseDen] = pick(basePairs);
    const mult = difficulty === 'easy' ? pick([2, 3, 4]) : pick([3, 4, 5, 6]);
    const num = baseNum * mult;
    const den = baseDen * mult;
    const story = pick([
      `Beim Springturnier in Silverglade gibt es ${den} Hindernisse. Starshine überspringt ${num} davon fehlerfrei. Gib den Anteil als vollständig gekürzten Bruch an!`,
      `Im Stall stehen ${den} Pferde. Davon sind ${num} Pferde bereits gestriegelt. Welcher Anteil ist schon fertig? (Vollständig kürzen!)`
    ]);
    return {
      category: CATEGORIES.WORD_PROBLEMS,
      subCategory: CATEGORIES.FRACTIONS_REDUCE,
      inputType: 'fraction',
      allowUnreduced: false,
      promptHTML: story,
      answer: { num: baseNum, den: baseDen },
      displayAnswerHTML: fracHTML(baseNum, baseDen),
      hint: `Schreibe zuerst ${num} über ${den} als Bruch und kürze Zähler und Nenner durch ihre gemeinsame Zahl (${mult}).`,
      explanation: `Anteil: ${num} von ${den}. Beide Zahlen lassen sich durch ${mult} teilen: (${num} : ${mult}) über (${den} : ${mult}) = ${baseNum}/${baseDen}.`,
      raw: { num, den, baseNum, baseDen, mult }
    };
  }

  // =========================================================================
  // Haupt-Generator & Antwort-Prüfung
  // =========================================================================
  function generateTask(activeCategories, difficulty = 'normal', categoryWeights = null) {
    const pool = Array.isArray(activeCategories) && activeCategories.length > 0
      ? activeCategories
      : Object.values(CATEGORIES);

    const cat = categoryWeights ? pickWeightedCategory(pool, categoryWeights) : pick(pool);
    switch (cat) {
      case CATEGORIES.FRACTIONS_OPS: return generateFractionOps(difficulty);
      case CATEGORIES.FRACTIONS_UNITS: return generateFractionUnits(difficulty);
      case CATEGORIES.SIGNED_MUL_DIV: return generateSignedMulDiv(difficulty);
      case CATEGORIES.BRACKETS_ORDER: return generateBracketsOrder(difficulty);
      case CATEGORIES.FRACTIONS_REDUCE: return generateFractionReduce(difficulty);
      case CATEGORIES.DECIMALS_OPS: return generateDecimalsOps(difficulty);
      case CATEGORIES.DECIMALS_CONVERT: return generateDecimalsConvert(difficulty);
      case CATEGORIES.UNITS_CONVERT: return generateUnitsConvert(difficulty);
      case CATEGORIES.WORD_PROBLEMS: return generateWordProblem(difficulty);
      default: return generateFractionOps(difficulty);
    }
  }

  /**
   * Prüft eine Antwort.
   * Rückgabe: { status: 'correct' | 'partial_reduce' | 'unreduced_ok' | 'wrong', message?: string }
   */
  function checkAnswer(task, userInput) {
    if (task.inputType === 'integer') {
      const val = parseInt(String(userInput.value).trim(), 10);
      if (Number.isNaN(val)) return { status: 'invalid' };
      return val === task.answer ? { status: 'correct' } : { status: 'wrong' };
    }

    if (task.inputType === 'decimal') {
      const val = parseDecimalInput(userInput.value);
      if (Number.isNaN(val)) return { status: 'invalid' };
      return Math.abs(val - task.answer) < 1e-9 ? { status: 'correct' } : { status: 'wrong' };
    }

    // Bruch-Eingabe (leerer Nenner wird bei ganzzahligem Zähler als 1 gewertet)
    const rawNum = String(userInput.num ?? '').trim();
    const rawDen = String(userInput.den ?? '').trim();
    const uNum = parseInt(rawNum, 10);
    const uDen = rawDen === '' && rawNum !== '' ? 1 : parseInt(rawDen, 10);
    if (Number.isNaN(uNum) || Number.isNaN(uDen) || uDen === 0) {
      return { status: 'invalid' };
    }

    const normUser = simplify(uNum, uDen);
    const isEquivalent = normUser.num === task.answer.num && normUser.den === task.answer.den;

    if (!isEquivalent) {
      return { status: 'wrong' };
    }

    const userGcd = gcd(uNum, uDen);
    const isFullyReduced = userGcd === 1 && uDen > 0;

    if (task.allowUnreduced) {
      if (!isFullyReduced) {
        return {
          status: 'unreduced_ok',
          message: `Richtig gerechnet! Kleiner Tipp: ${uNum}/${uDen} lässt sich sogar noch zu ${task.answer.num}/${task.answer.den} kürzen.`
        };
      }
      return { status: 'correct' };
    } else {
      // Kategorie 5: Kürzen von Brüchen -> muss vollständig gekürzt sein!
      if (!isFullyReduced) {
        return {
          status: 'partial_reduce',
          message: 'Schon gut gekürzt, aber da geht noch mehr!'
        };
      }
      return { status: 'correct' };
    }
  }

  // =========================================================================
  // Spielmodus 2: "Der Jorvik-Fehler-Detektiv" (Lukas aus Moorland)
  // =========================================================================
  const LUKAS_COMMENTS_FIXED = [
    'Oh Mann, danke! Ich hab echt nicht richtig hingeschaut!',
    'Uff, voll in die Falle getappt! Gut, dass du ein Adlerauge hast!',
    'Haha, stimmt! Mein Pony Keks hat mich beim Rechnen abgelenkt!',
    'Danke, Frau Reitlehrerin! Den Trick merk ich mir für die nächste Arbeit!'
  ];

  const LUKAS_COMMENTS_CORRECT = [
    'Yes! Die Aufgabe hab ich doch super gelöst, oder?',
    'Puh, wenigstens bei der hab ich voll aufgepasst!'
  ];

  function createMistakeForTask(task) {
    const cat = task.subCategory || task.category;

    if (cat === CATEGORIES.SIGNED_MUL_DIV) {
      const { a, b } = task.raw;
      // Typischer Fehler: Vorzeichen-Falle (Minus mal Minus = Minus, oder Vorzeichen vergessen)
      const wrongAns = -task.answer;
      return {
        lukasAnswerHTML: `${wrongAns}`,
        isCorrect: false,
        mistakeReason: 'Vorzeichen-Falle!',
        reasonOptions: ['Vorzeichen-Falle!', 'Einmaleins verrechnet!', 'Klammer übersehen!', 'Nullen vergessen!'],
        lukasComment: pick(LUKAS_COMMENTS_FIXED)
      };
    }

    if (cat === CATEGORIES.FRACTIONS_OPS) {
      const { n1, d1, n2, d2, op } = task.raw;
      let wrongNum, wrongDen, reason;
      if (op === '+' || op === '-') {
        // Zähler + Zähler und Nenner + Nenner (oder -)
        wrongNum = op === '+' ? n1 + n2 : Math.abs(n1 - n2) || 1;
        wrongDen = op === '+' ? d1 + d2 : Math.abs(d1 - d2) || (d1 + d2);
        reason = 'Zähler und Nenner einfach addiert/subtrahiert!';
      } else if (op === ':') {
        // Kehrwert vergessen -> einfach multipliziert
        wrongNum = n1 * n2;
        wrongDen = d1 * d2;
        reason = 'Kehrwert beim Teilen vergessen!';
      } else {
        // Zähler falsch oder nicht richtig malgenommen
        wrongNum = n1 + n2;
        wrongDen = d1 * d2;
        reason = 'Zähler addiert statt multipliziert!';
      }
      // Sicherstellen, dass Lukas' falsches Ergebnis nicht zufällig äquivalent zur Lösung ist
      const sWrong = simplify(wrongNum, wrongDen);
      if (sWrong.num === task.answer.num && sWrong.den === task.answer.den) {
        wrongNum += 1;
      }
      return {
        lukasAnswerHTML: fracHTML(wrongNum, wrongDen),
        isCorrect: false,
        mistakeReason: reason,
        reasonOptions: [
          'Zähler und Nenner einfach addiert/subtrahiert!',
          'Kehrwert beim Teilen vergessen!',
          'Vorzeichen-Falle!',
          'Zähler addiert statt multipliziert!'
        ],
        lukasComment: pick(LUKAS_COMMENTS_FIXED)
      };
    }

    if (cat === CATEGORIES.FRACTIONS_UNITS) {
      // Typischer Fehler: Nullen vergessen (z.B. 800 : 4 = 2 oder Faktor 10 daneben)
      const wrongAns = task.answer >= 100 ? Math.round(task.answer / 10) : task.answer * 10;
      return {
        lukasAnswerHTML: `${wrongAns} ${task.raw.toUnit}`,
        isCorrect: false,
        mistakeReason: 'Nullen vergessen / falsch umgerechnet!',
        reasonOptions: [
          'Nullen vergessen / falsch umgerechnet!',
          'Vorzeichen-Falle!',
          'Zähler und Nenner vertauscht!',
          'Klammer übersehen!'
        ],
        lukasComment: pick(LUKAS_COMMENTS_FIXED)
      };
    }

    if (cat === CATEGORIES.FRACTIONS_REDUCE) {
      // Typischer Fehler: Nur den Zähler gekürzt oder nicht vollständig gekürzt
      const { num, den, baseNum, baseDen } = task.raw;
      const onlyNumDiv = Math.random() < 0.5;
      if (onlyNumDiv) {
        return {
          lukasAnswerHTML: fracHTML(baseNum, den),
          isCorrect: false,
          mistakeReason: 'Nur den Zähler gekürzt!',
          reasonOptions: [
            'Nur den Zähler gekürzt!',
            'Nicht vollständig gekürzt!',
            'Vorzeichen-Falle!',
            'Kehrwert gebildet!'
          ],
          lukasComment: pick(LUKAS_COMMENTS_FIXED)
        };
      } else {
        return {
          lukasAnswerHTML: fracHTML(baseNum * 2, baseDen * 2),
          isCorrect: false,
          mistakeReason: 'Nicht vollständig gekürzt!',
          reasonOptions: [
            'Nicht vollständig gekürzt!',
            'Nur den Zähler gekürzt!',
            'Nullen vergessen!',
            'Vorzeichen-Falle!'
          ],
          lukasComment: pick(LUKAS_COMMENTS_FIXED)
        };
      }
    }

    if (cat === CATEGORIES.DECIMALS_OPS) {
      const { op } = task.raw;
      let wrongAns = roundTo(task.answer * 10, 4);
      if (Math.abs(wrongAns - task.answer) < 1e-9) {
        wrongAns = roundTo(task.answer + 0.1, 4);
      }
      let reason = 'Komma falsch gesetzt!';
      if (op === '·') reason = 'Nachkommastellen beim Malnehmen verzählt!';
      if (op === ':') reason = 'Komma beim Teilen vergessen!';
      const unitSuffix = task.unitLabel ? ` ${task.unitLabel}` : '';
      return {
        lukasAnswerHTML: `${formatDE(wrongAns)}${unitSuffix}`,
        isCorrect: false,
        mistakeReason: reason,
        reasonOptions: [
          'Komma falsch gesetzt!',
          'Nachkommastellen beim Malnehmen verzählt!',
          'Komma beim Teilen vergessen!',
          'Vorzeichen-Falle!'
        ],
        lukasComment: pick(LUKAS_COMMENTS_FIXED)
      };
    }

    if (cat === CATEGORIES.DECIMALS_CONVERT) {
      if (task.inputType === 'decimal') {
        const { num, den } = task.raw;
        let wrongVal = parseFloat(`0.${num}${den}`);
        if (Number.isNaN(wrongVal) || Math.abs(wrongVal - task.answer) < 1e-9) {
          wrongVal = roundTo(task.answer * 10, 4);
        }
        return {
          lukasAnswerHTML: formatDE(wrongVal),
          isCorrect: false,
          mistakeReason: 'Zähler und Nenner einfach hinter das Komma geschrieben!',
          reasonOptions: [
            'Zähler und Nenner einfach hinter das Komma geschrieben!',
            'Komma falsch gesetzt!',
            'Nicht vollständig gekürzt!',
            'Vorzeichen-Falle!'
          ],
          lukasComment: pick(LUKAS_COMMENTS_FIXED)
        };
      }
      const { baseNum, baseDen } = task.raw;
      return {
        lukasAnswerHTML: fracHTML(baseNum * 2, baseDen * 2),
        isCorrect: false,
        mistakeReason: 'Nicht vollständig gekürzt!',
        reasonOptions: [
          'Nicht vollständig gekürzt!',
          'Zähler und Nenner einfach hinter das Komma geschrieben!',
          'Komma falsch gesetzt!',
          'Nur den Zähler gekürzt!'
        ],
        lukasComment: pick(LUKAS_COMMENTS_FIXED)
      };
    }

    if (cat === CATEGORIES.UNITS_CONVERT) {
      const { domain, fromVal, factor, op } = task.raw;
      let wrongVal;
      let reason;

      if (domain === 'area') {
        const linearFactor = Math.round(Math.sqrt(factor));
        wrongVal = roundTo(op === 'mul' ? fromVal * linearFactor : fromVal / linearFactor, 6);
        reason = 'Bei Flächeneinheiten mit Faktor 10 statt 100 gerechnet!';
      } else if (domain === 'time') {
        const decFactor = factor === 60 ? 100 : 10;
        wrongVal = roundTo(op === 'mul' ? fromVal * decFactor : fromVal / decFactor, 6);
        reason = factor === 60
          ? 'Bei Zeiteinheiten mit 100 statt 60 gerechnet!'
          : 'Bei Tagen/Stunden mit Faktor 10 statt 24 gerechnet!';
      } else {
        wrongVal = task.answer >= 1
          ? roundTo(task.answer / 10, 6)
          : roundTo(task.answer * 10, 6);
        reason = 'Komma beim Umrechnen um eine Stelle verrutscht!';
      }

      if (wrongVal < 1e-6 || Math.abs(wrongVal - task.answer) < 1e-9) {
        wrongVal = roundTo(task.answer * 10, 6);
      }

      return {
        lukasAnswerHTML: `${formatDE(wrongVal)} ${task.unitLabel}`,
        isCorrect: false,
        mistakeReason: reason,
        reasonOptions: [
          reason,
          reason === 'Komma beim Umrechnen um eine Stelle verrutscht!'
            ? 'Bei Flächeneinheiten mit Faktor 10 statt 100 gerechnet!'
            : 'Komma beim Umrechnen um eine Stelle verrutscht!',
          'Malnehmen und Teilen verwechselt!',
          'Nullen vergessen / falsch umgerechnet!'
        ].filter((v, idx, arr) => arr.indexOf(v) === idx),
        lukasComment: pick(LUKAS_COMMENTS_FIXED)
      };
    }

    // BRACKETS_ORDER
    const wrongAns = task.answer + pick([-10, -6, 8, 12]);
    return {
      lukasAnswerHTML: `${wrongAns}`,
      isCorrect: false,
      mistakeReason: 'Klammer oder Punkt-vor-Strich übersehen!',
      reasonOptions: [
        'Klammer oder Punkt-vor-Strich übersehen!',
        'Vorzeichen-Falle!',
        'Nicht vollständig gekürzt!',
        'Nullen vergessen!'
      ],
      lukasComment: pick(LUKAS_COMMENTS_FIXED)
    };
  }

  /**
   * Erstellt eine Klassenarbeit von "Lukas aus Moorland" mit 6 Aufgaben:
   * 4 davon mit typischen Flüchtigkeitsfehlern, 2 komplett richtig (gemischt).
   */
  function generateLukasExam(activeCategories) {
    const items = [];
    // 4 falsche + 2 richtige Aufgaben
    const flags = [false, false, false, false, true, true];
    // Fisher-Yates shuffle
    for (let i = flags.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flags[i], flags[j]] = [flags[j], flags[i]];
    }

    for (let i = 0; i < 6; i++) {
      const task = generateTask(activeCategories, 'normal');
      const shouldBeCorrect = flags[i];

      if (shouldBeCorrect) {
        items.push({
          id: i + 1,
          task,
          lukasAnswerHTML: task.displayAnswerHTML,
          isCorrect: true,
          mistakeReason: null,
          reasonOptions: [],
          lukasComment: pick(LUKAS_COMMENTS_CORRECT)
        });
      } else {
        const mistake = createMistakeForTask(task);
        items.push({
          id: i + 1,
          task,
          ...mistake
        });
      }
    }
    return items;
  }

  // =========================================================================
  // Spielmodus 3 / Zahlenblick: Disjunkte Ergebnis-Profile, Runen & Strategie-Pool
  // =========================================================================
  const RUNE_CONDITIONS = {
    LT10: {
      id: 'LT10',
      shortLabel: '< 10',
      label: '< 10',
      icon: '🟢',
      colorClass: 'profile-lt10',
      dimension: 'size'
    },
    GE10: {
      id: 'GE10',
      shortLabel: '≥ 10',
      label: '≥ 10',
      icon: '🟣',
      colorClass: 'profile-ge10',
      dimension: 'size'
    },
    NEG: {
      id: 'NEG',
      shortLabel: '< 0',
      label: '< 0',
      icon: '❄️',
      colorClass: 'profile-neg',
      dimension: 'size'
    },
    EVEN: {
      id: 'EVEN',
      shortLabel: '2·4·6',
      label: '2·4·6 (gerade)',
      icon: '🔵',
      colorClass: 'profile-even',
      dimension: 'kind'
    },
    ODD: {
      id: 'ODD',
      shortLabel: '1·3·5',
      label: '1·3·5 (ungerade)',
      icon: '🟠',
      colorClass: 'profile-odd',
      dimension: 'kind'
    },
    FRAC: {
      id: 'FRAC',
      shortLabel: '½ · 0,5',
      label: '½ · 0,5 (Bruch/Komma)',
      icon: '💧',
      colorClass: 'profile-frac',
      dimension: 'kind'
    }
  };

  const RESULT_PROFILES = {
    NEG: {
      id: 'NEG',
      shortLabel: '< 0',
      label: 'Negativ (< 0)',
      icon: '❄️',
      colorClass: 'profile-neg'
    },
    FRAC_LOW: {
      id: 'FRAC_LOW',
      shortLabel: '0 bis ½',
      label: 'Bruch/Komma 0 bis ½',
      icon: '💧',
      colorClass: 'profile-frac-low'
    },
    FRAC_HIGH: {
      id: 'FRAC_HIGH',
      shortLabel: '½ bis 1',
      label: 'Bruch/Komma ½ bis 1',
      icon: '🌿',
      colorClass: 'profile-frac-high'
    },
    DEC_GT1: {
      id: 'DEC_GT1',
      shortLabel: 'Bruch/Komma > 1',
      label: 'Bruch/Komma > 1',
      icon: '🌊',
      colorClass: 'profile-dec-gt1'
    },
    SMALL_EVEN: {
      id: 'SMALL_EVEN',
      shortLabel: 'Gerade < 10',
      label: 'Gerade & < 10',
      icon: '⚡',
      colorClass: 'profile-small-even'
    },
    SMALL_ODD: {
      id: 'SMALL_ODD',
      shortLabel: 'Ungerade < 10',
      label: 'Ungerade & < 10',
      icon: '🔥',
      colorClass: 'profile-small-odd'
    },
    BIG_EVEN: {
      id: 'BIG_EVEN',
      shortLabel: 'Gerade ≥ 10',
      label: 'Gerade & ≥ 10',
      icon: '🌕',
      colorClass: 'profile-big-even'
    },
    BIG_ODD: {
      id: 'BIG_ODD',
      shortLabel: 'Ungerade ≥ 10',
      label: 'Ungerade & ≥ 10',
      icon: '☀️',
      colorClass: 'profile-big-odd'
    }
  };

  function getTaskNumericValue(task) {
    if (!task) return NaN;
    if (task.inputType === 'fraction' && task.answer) {
      return task.answer.num / task.answer.den;
    }
    return Number(task.answer);
  }

  function isTaskWholeNumber(task) {
    if (!task) return false;
    if (task.inputType === 'integer') return true;
    if (task.inputType === 'fraction' && task.answer) {
      return task.answer.den === 1;
    }
    const val = Number(task.answer);
    return Number.isFinite(val) && Math.abs(val - Math.round(val)) < 1e-9;
  }

  function classifyTaskResult(task) {
    const val = getTaskNumericValue(task);
    const isWhole = isTaskWholeNumber(task);
    if (val < -1e-9) return 'NEG';
    if (!isWhole) {
      if (val <= 0.5 + 1e-9) return 'FRAC_LOW';
      if (val < 1 - 1e-9) return 'FRAC_HIGH';
      return 'DEC_GT1';
    }
    const rounded = Math.round(val);
    const isEven = Math.abs(rounded) % 2 === 0;
    if (rounded < 10) {
      return isEven ? 'SMALL_EVEN' : 'SMALL_ODD';
    }
    return isEven ? 'BIG_EVEN' : 'BIG_ODD';
  }

  function getConditionMeta(condId) {
    return RUNE_CONDITIONS[condId] || RESULT_PROFILES[condId] || null;
  }

  function getMatchingRuneIds(task) {
    const val = getTaskNumericValue(task);
    if (!Number.isFinite(val)) return [];
    const isWhole = isTaskWholeNumber(task);
    const matches = [];
    if (val < -1e-9) {
      matches.push('NEG');
    } else if (val < 10 - 1e-9) {
      matches.push('LT10');
    } else {
      matches.push('GE10');
    }
    if (!isWhole) {
      matches.push('FRAC');
    } else {
      const rounded = Math.round(val);
      matches.push(Math.abs(rounded) % 2 === 0 ? 'EVEN' : 'ODD');
    }
    return matches;
  }

  function doesTaskMatchCondition(task, condId) {
    if (!task || !condId) return false;
    if (RUNE_CONDITIONS[condId]) {
      return getMatchingRuneIds(task).includes(condId);
    }
    if (condId === 'NEG_EVEN' || condId === 'NEG_ODD') {
      const runes = getMatchingRuneIds(task);
      const parity = condId === 'NEG_EVEN' ? 'EVEN' : 'ODD';
      return runes.includes('NEG') && runes.includes(parity);
    }
    if (condId === 'GE10_FRAC') {
      const runes = getMatchingRuneIds(task);
      return runes.includes('GE10') && runes.includes('FRAC');
    }
    return classifyTaskResult(task) === condId;
  }

  function getComboIntersectionProfile(runeA, runeB) {
    if (!runeA || !runeB || runeA === runeB) return null;
    const pair = new Set([runeA, runeB]);
    if (pair.has('LT10') && pair.has('EVEN')) return 'SMALL_EVEN';
    if (pair.has('LT10') && pair.has('ODD')) return 'SMALL_ODD';
    if (pair.has('GE10') && pair.has('EVEN')) return 'BIG_EVEN';
    if (pair.has('GE10') && pair.has('ODD')) return 'BIG_ODD';
    if (pair.has('LT10') && pair.has('FRAC')) return pick(['FRAC_LOW', 'FRAC_HIGH']);
    if (pair.has('GE10') && pair.has('FRAC')) return 'GE10_FRAC';
    if (pair.has('NEG') && pair.has('EVEN')) return 'NEG_EVEN';
    if (pair.has('NEG') && pair.has('ODD')) return 'NEG_ODD';
    return null;
  }

  function getCategoryWeights(activeCategories, topicPerf = {}) {
    const cats = Array.isArray(activeCategories) && activeCategories.length > 0
      ? activeCategories
      : Object.values(CATEGORIES);
    const weights = {};
    for (const cat of cats) {
      const perf = topicPerf && topicPerf[cat] ? topicPerf[cat] : null;
      const ema = perf && typeof perf.recentErrorEMA === 'number' ? perf.recentErrorEMA : 0.25;
      const errors = perf && typeof perf.errors === 'number' ? perf.errors : 0;
      const solved = perf && typeof perf.solved === 'number' ? perf.solved : 0;
      weights[cat] = 1 + 3 * ema + Math.min(2, errors / Math.max(1, solved + 2));
    }
    return weights;
  }

  function pickWeightedCategory(activeCategories, categoryWeights) {
    const pool = Array.isArray(activeCategories) && activeCategories.length > 0
      ? activeCategories
      : Object.values(CATEGORIES);
    if (!categoryWeights) return pick(pool);
    let total = 0;
    for (const cat of pool) {
      const w = Number(categoryWeights[cat]);
      total += Number.isFinite(w) && w > 0 ? w : 1;
    }
    if (total <= 0) return pick(pool);
    let r = Math.random() * total;
    for (const cat of pool) {
      const w = Number(categoryWeights[cat]);
      const weight = Number.isFinite(w) && w > 0 ? w : 1;
      r -= weight;
      if (r <= 0) return cat;
    }
    return pool[pool.length - 1];
  }

  function createFallbackTaskForProfile(profileId) {
    if (profileId === 'NEG') {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      const ans = -a * b;
      return {
        category: CATEGORIES.SIGNED_MUL_DIV,
        inputType: 'integer',
        promptHTML: `${signedHTML(-a)} <span class="op">·</span> ${signedHTML(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: `${ans}`,
        hint: 'Ungleiche Vorzeichen (Minus mal Plus) ergeben immer MINUS (−)!',
        explanation: `(-${a}) · (+${b}) = ${ans}.`
      };
    }
    if (profileId === 'FRAC_LOW') {
      const bases = [[1, 4], [1, 3], [1, 5], [2, 5], [1, 2], [3, 8]];
      const [bn, bd] = pick(bases);
      const mult = randInt(3, 8);
      return {
        category: CATEGORIES.FRACTIONS_REDUCE,
        inputType: 'fraction',
        allowUnreduced: false,
        promptHTML: `Kürze vollständig: ${fracHTML(bn * mult, bd * mult)} <span class="eq">=</span>`,
        answer: { num: bn, den: bd },
        displayAnswerHTML: fracHTML(bn, bd),
        hint: `Teile Zähler und Nenner durch ${mult}.`,
        explanation: `(${bn * mult} : ${mult}) über (${bd * mult} : ${mult}) = ${bn} über ${bd}.`
      };
    }
    if (profileId === 'FRAC_HIGH') {
      const bases = [[2, 3], [3, 4], [3, 5], [4, 5], [5, 6], [5, 8], [7, 8]];
      const [bn, bd] = pick(bases);
      const mult = randInt(3, 7);
      return {
        category: CATEGORIES.FRACTIONS_REDUCE,
        inputType: 'fraction',
        allowUnreduced: false,
        promptHTML: `Kürze vollständig: ${fracHTML(bn * mult, bd * mult)} <span class="eq">=</span>`,
        answer: { num: bn, den: bd },
        displayAnswerHTML: fracHTML(bn, bd),
        hint: `Teile Zähler und Nenner durch ${mult}.`,
        explanation: `(${bn * mult} : ${mult}) über (${bd * mult} : ${mult}) = ${bn} über ${bd}.`
      };
    }
    if (profileId === 'DEC_GT1') {
      const a = randInt(11, 49) / 10;
      const b = randInt(11, 39) / 10;
      const ans = roundTo(a + b, 2);
      const adjusted = Math.abs(ans - Math.round(ans)) < 1e-9 ? roundTo(ans + 0.3, 2) : ans;
      const bAdj = roundTo(adjusted - a, 2);
      return {
        category: CATEGORIES.DECIMALS_OPS,
        inputType: 'decimal',
        unitLabel: '',
        promptHTML: `${formatDE(a)} + ${formatDE(bAdj)} <span class="eq">=</span>`,
        answer: adjusted,
        displayAnswerHTML: formatDE(adjusted),
        hint: 'Schreibe Komma unter Komma und addiere stellenweise.',
        explanation: `${formatDE(a)} + ${formatDE(bAdj)} = ${formatDE(adjusted)}.`
      };
    }
    if (profileId === 'SMALL_EVEN') {
      const pairs = [[-2, -2], [-2, -3], [-2, -4], [-1, -4], [-1, -6], [-1, -8]];
      const [a, b] = pick(pairs);
      const ans = a * b;
      return {
        category: CATEGORIES.SIGNED_MUL_DIV,
        inputType: 'integer',
        promptHTML: `${signedHTML(a)} <span class="op">·</span> ${signedHTML(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: `${ans}`,
        hint: 'Minus mal Minus ergibt Plus (+)!',
        explanation: `(${a}) · (${b}) = ${ans}.`
      };
    }
    if (profileId === 'SMALL_ODD') {
      const a = randInt(3, 8);
      const b = pick([1, 3, 5, 7, 9]);
      const left = a + b;
      return {
        category: CATEGORIES.BRACKETS_ORDER,
        inputType: 'integer',
        promptHTML: `(${left} − ${a}) <span class="op">·</span> 1 <span class="eq">=</span>`,
        answer: b,
        displayAnswerHTML: `${b}`,
        hint: 'Rechne zuerst die Klammer aus.',
        explanation: `(${left} − ${a}) · 1 = ${b}.`
      };
    }
    if (profileId === 'BIG_EVEN') {
      const pairs = [[-2, -6], [-2, -8], [-3, -4], [-4, -4], [-4, -5], [-4, -6], [-5, -6]];
      const [a, b] = pick(pairs);
      const ans = a * b;
      return {
        category: CATEGORIES.SIGNED_MUL_DIV,
        inputType: 'integer',
        promptHTML: `${signedHTML(a)} <span class="op">·</span> ${signedHTML(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: `${ans}`,
        hint: 'Gleiche Vorzeichen (Minus mal Minus) ergeben Plus (+).',
        explanation: `(${a}) · (${b}) = ${ans}.`
      };
    }
    if (profileId === 'NEG_EVEN') {
      const pairs = [[-2, 3], [-2, 4], [-2, 7], [-4, 3], [-4, 5], [-6, 3]];
      const [a, b] = pick(pairs);
      const ans = a * b;
      return {
        category: CATEGORIES.SIGNED_MUL_DIV,
        inputType: 'integer',
        promptHTML: `${signedHTML(a)} <span class="op">·</span> ${signedHTML(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: `${ans}`,
        hint: 'Minus mal Plus ergibt Minus (−), und das Ergebnis ist eine gerade Zahl.',
        explanation: `(${a}) · (+${b}) = ${ans}.`
      };
    }
    if (profileId === 'NEG_ODD') {
      const pairs = [[-3, 3], [-3, 5], [-3, 7], [-5, 3], [-5, 5], [-7, 3]];
      const [a, b] = pick(pairs);
      const ans = a * b;
      return {
        category: CATEGORIES.SIGNED_MUL_DIV,
        inputType: 'integer',
        promptHTML: `${signedHTML(a)} <span class="op">·</span> ${signedHTML(b)} <span class="eq">=</span>`,
        answer: ans,
        displayAnswerHTML: `${ans}`,
        hint: 'Minus mal Plus ergibt Minus (−), und das Ergebnis ist eine ungerade Zahl.',
        explanation: `(${a}) · (+${b}) = ${ans}.`
      };
    }
    if (profileId === 'GE10_FRAC') {
      const a = randInt(55, 95) / 10;
      const b = randInt(55, 85) / 10;
      const ans = roundTo(a + b, 2);
      const adjusted = Math.abs(ans - Math.round(ans)) < 1e-9 ? roundTo(ans + 0.4, 2) : ans;
      const bAdj = roundTo(adjusted - a, 2);
      return {
        category: CATEGORIES.DECIMALS_OPS,
        inputType: 'decimal',
        unitLabel: '',
        promptHTML: `${formatDE(a)} + ${formatDE(bAdj)} <span class="eq">=</span>`,
        answer: adjusted,
        displayAnswerHTML: formatDE(adjusted),
        hint: 'Schreibe Komma unter Komma und addiere stellenweise.',
        explanation: `${formatDE(a)} + ${formatDE(bAdj)} = ${formatDE(adjusted)}.`
      };
    }
    if (profileId === 'LT10') {
      return createFallbackTaskForProfile(pick(['SMALL_EVEN', 'SMALL_ODD']));
    }
    if (profileId === 'GE10') {
      return createFallbackTaskForProfile(pick(['BIG_EVEN', 'BIG_ODD']));
    }
    if (profileId === 'EVEN') {
      return createFallbackTaskForProfile(pick(['SMALL_EVEN', 'BIG_EVEN']));
    }
    if (profileId === 'ODD') {
      return createFallbackTaskForProfile(pick(['SMALL_ODD', 'BIG_ODD']));
    }
    if (profileId === 'FRAC') {
      return createFallbackTaskForProfile(pick(['FRAC_LOW', 'FRAC_HIGH', 'DEC_GT1']));
    }

    // BIG_ODD
    const pairs = [[-3, -5], [-3, -7], [-3, -9], [-5, -5], [-5, -7], [-5, -9]];
    const [a, b] = pick(pairs);
    const ans = a * b;
    return {
      category: CATEGORIES.SIGNED_MUL_DIV,
      inputType: 'integer',
      promptHTML: `${signedHTML(a)} <span class="op">·</span> ${signedHTML(b)} <span class="eq">=</span>`,
      answer: ans,
      displayAnswerHTML: `${ans}`,
      hint: 'Gleiche Vorzeichen (Minus mal Minus) ergeben Plus (+).',
      explanation: `(${a}) · (${b}) = ${ans}.`
    };
  }

  function generateTaskForProfile(profileId, activeCategories, difficulty = 'normal', categoryWeights = null) {
    const pool = Array.isArray(activeCategories) && activeCategories.length > 0
      ? activeCategories
      : Object.values(CATEGORIES);

    for (let i = 0; i < 140; i++) {
      const t = generateTask(pool, difficulty, categoryWeights);
      if (doesTaskMatchCondition(t, profileId)) {
        return t;
      }
    }

    const allCats = Object.values(CATEGORIES);
    for (let i = 0; i < 80; i++) {
      const t = generateTask(allCats, difficulty, categoryWeights);
      if (doesTaskMatchCondition(t, profileId)) {
        return t;
      }
    }

    return createFallbackTaskForProfile(profileId);
  }

  function generateStrategicTaskPool(requiredProfileIds, activeCategories, difficulty = 'normal', categoryWeights = null, count = 4) {
    const allProfileIds = Object.keys(RESULT_PROFILES);
    const uniqueReq = [];
    const seenReq = new Set();
    if (Array.isArray(requiredProfileIds)) {
      for (const id of requiredProfileIds) {
        if ((RUNE_CONDITIONS[id] || RESULT_PROFILES[id]) && !seenReq.has(id)) {
          seenReq.add(id);
          uniqueReq.push(id);
        }
      }
    }
    const targets = uniqueReq.slice(0, count);
    const tasks = [];
    const seenPrompts = new Set();

    function addUniqueTask(producerFn) {
      let candidate = null;
      for (let attempt = 0; attempt < 15; attempt++) {
        const t = producerFn();
        if (!seenPrompts.has(t.promptHTML)) {
          candidate = t;
          break;
        }
        candidate = t;
      }
      if (candidate) {
        seenPrompts.add(candidate.promptHTML);
        tasks.push(candidate);
      }
    }

    // Prüfe zuerst, ob zwei der ersten benötigten Runen über ein Kombo-Ergebnis gemeinsam gelöst werden können
    let comboTarget = null;
    for (let i = 0; i < targets.length && !comboTarget; i++) {
      for (let j = i + 1; j < targets.length && !comboTarget; j++) {
        if (RUNE_CONDITIONS[targets[i]] && RUNE_CONDITIONS[targets[j]]) {
          comboTarget = getComboIntersectionProfile(targets[i], targets[j]);
        }
      }
    }
    if (comboTarget && tasks.length < count) {
      addUniqueTask(() => generateTaskForProfile(comboTarget, activeCategories, difficulty, categoryWeights));
    }

    for (const profileId of targets) {
      if (tasks.length >= count) break;
      const alreadyCovered = tasks.some(t => doesTaskMatchCondition(t, profileId));
      if (!alreadyCovered) {
        addUniqueTask(() => generateTaskForProfile(profileId, activeCategories, difficulty, categoryWeights));
      }
    }

    const distractorProfiles = allProfileIds.filter(id => !seenReq.has(id));
    for (let i = distractorProfiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [distractorProfiles[i], distractorProfiles[j]] = [distractorProfiles[j], distractorProfiles[i]];
    }

    let dIdx = 0;
    while (tasks.length < count) {
      if (dIdx < distractorProfiles.length) {
        const pId = distractorProfiles[dIdx++];
        addUniqueTask(() => generateTaskForProfile(pId, activeCategories, difficulty, categoryWeights));
      } else {
        addUniqueTask(() => generateTask(activeCategories, difficulty, categoryWeights));
      }
    }

    for (let i = tasks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    }

    return tasks;
  }

  return {
    CATEGORIES,
    CATEGORY_LABELS,
    RUNE_CONDITIONS,
    RESULT_PROFILES,
    gcd,
    simplify,
    fracHTML,
    getTaskNumericValue,
    getConditionMeta,
    getMatchingRuneIds,
    doesTaskMatchCondition,
    getComboIntersectionProfile,
    classifyTaskResult,
    getCategoryWeights,
    generateTask,
    generateTaskForProfile,
    generateStrategicTaskPool,
    checkAnswer,
    generateLukasExam
  };
}));
