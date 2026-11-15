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
    WORD_PROBLEMS: 'word_problems'
  };

  const CATEGORY_LABELS = {
    fractions_ops: 'Bruchrechnen',
    fractions_units: 'Brüche & Einheiten',
    signed_mul_div: 'Vorzeichen (· und :)',
    brackets_order: 'Klammern & Punkt-vor-Strich',
    fractions_reduce: 'Brüche kürzen',
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
    if (op === '+' || op === '-') {
      hint = d1 === d2
        ? `Beide Brüche haben schon den gleichen Nenner ${d1}. Du kannst die Zähler direkt ${op === '+' ? 'addieren' : 'subtrahieren'}.`
        : `Suche zuerst den gemeinsamen Hauptnenner von ${d1} und ${d2} (z. B. ${commonDen}) und erweitere beide Brüche.`;
    } else if (op === '·') {
      hint = `Bei der Multiplikation rechnest du Zähler mal Zähler (${n1} · ${n2}) und Nenner mal Nenner (${d1} · ${d2}). Tipp: Du darfst auch über Kreuz kürzen!`;
    } else {
      hint = `Durch einen Bruch teilt man, indem man mit dem Kehrwert malnimmt: drehe den zweiten Bruch um (${d2} nach oben, ${n2} nach unten) und multipliziere.`;
    }

    return {
      category: CATEGORIES.FRACTIONS_OPS,
      inputType: 'fraction',
      allowUnreduced: true,
      promptHTML: `${fracHTML(n1, d1)} <span class="op">${op}</span> ${fracHTML(n2, d2)} <span class="eq">=</span>`,
      answer: { num: simplified.num, den: simplified.den },
      displayAnswerHTML: simplified.den === 1 ? `${simplified.num}` : fracHTML(simplified.num, simplified.den),
      hint,
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

    return {
      category: CATEGORIES.FRACTIONS_UNITS,
      inputType: 'integer',
      unitLabel: tpl.toUnit,
      promptHTML: `${fracHTML(num, den)} von <strong>${amount} ${fromLabel}</strong> sind <span class="blank-unit">? ${tpl.toUnit}</span>`,
      answer: answerVal,
      displayAnswerHTML: `${answerVal} ${tpl.toUnit}`,
      hint,
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

    return {
      category: CATEGORIES.SIGNED_MUL_DIV,
      inputType: 'integer',
      promptHTML: `${signedHTML(a)} <span class="op">${op}</span> ${signedHTML(b)} <span class="eq">=</span>`,
      answer,
      displayAnswerHTML: `${answer}`,
      hint,
      raw: { a, b, op }
    };
  }

  // =========================================================================
  // 4. Rechnen mit Klammern (Punkt-vor-Strich & Vorzeichen)
  // =========================================================================
  function generateBracketsOrder(difficulty = 'normal') {
    const pattern = difficulty === 'easy' ? randInt(1, 2) : randInt(1, 4);
    let promptHTML, answer, hint;

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
    }

    return {
      category: CATEGORIES.BRACKETS_ORDER,
      inputType: 'integer',
      promptHTML,
      answer,
      displayAnswerHTML: `${answer}`,
      hint,
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
      raw: { num, den, baseNum, baseDen, mult }
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
      CATEGORIES.FRACTIONS_REDUCE
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
  function generateTask(activeCategories, difficulty = 'normal') {
    const pool = Array.isArray(activeCategories) && activeCategories.length > 0
      ? activeCategories
      : Object.values(CATEGORIES);

    const cat = pick(pool);
    switch (cat) {
      case CATEGORIES.FRACTIONS_OPS: return generateFractionOps(difficulty);
      case CATEGORIES.FRACTIONS_UNITS: return generateFractionUnits(difficulty);
      case CATEGORIES.SIGNED_MUL_DIV: return generateSignedMulDiv(difficulty);
      case CATEGORIES.BRACKETS_ORDER: return generateBracketsOrder(difficulty);
      case CATEGORIES.FRACTIONS_REDUCE: return generateFractionReduce(difficulty);
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

    // Bruch-Eingabe
    const uNum = parseInt(String(userInput.num).trim(), 10);
    const uDen = parseInt(String(userInput.den).trim(), 10);
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

  return {
    CATEGORIES,
    CATEGORY_LABELS,
    gcd,
    simplify,
    fracHTML,
    generateTask,
    checkAnswer,
    generateLukasExam
  };
}));
