/**
 * Jorvik Mathe-Abenteuer – Strategisches Licht-Labyrinth Engine
 * UMD-kompatibel: funktioniert direkt im Browser (window.LabyrinthEngine) und in Node.js (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./mathGenerator.js'));
  } else {
    root.LabyrinthEngine = factory(root.MathGenerator);
  }
}(typeof self !== 'undefined' ? self : this, function (MG) {
  'use strict';

  const DELTA = {
    U: { dr: -1, dc: 0 },
    D: { dr: 1, dc: 0 },
    L: { dr: 0, dc: -1 },
    R: { dr: 0, dc: 1 }
  };

  const PERP_DIRS = {
    U: ['L', 'R'],
    D: ['L', 'R'],
    L: ['U', 'D'],
    R: ['U', 'D']
  };

  const REFLECT = {
    '/': { R: 'U', U: 'R', L: 'D', D: 'L' },
    '\\': { R: 'D', D: 'R', L: 'U', U: 'L' }
  };

  const THEME_TITLES = [
    { title: 'Die Kristallkammer von Valedale', subtitle: 'Lichtstrahl-Prüfung • Runenpfad' },
    { title: 'Der Sonnentempel der Druiden', subtitle: 'Spiegel-Labyrinth • Uralte Magie' },
    { title: 'Das Leuchtfeuer von Fort Pinta', subtitle: 'Kristall-Tore & Prismen • Strategie' },
    { title: 'Die Sternengrotte im Hollow Woods', subtitle: 'Magische Umlenkung • Zahlenblick' }
  ];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function keyOf(r, c) {
    return `${r},${c}`;
  }

  function getReflectSlash(inDir, outDir) {
    if (REFLECT['/'][inDir] === outDir) return '/';
    if (REFLECT['\\'][inDir] === outDir) return '\\';
    return null;
  }

  /**
   * Simuliert den Lichtstrahl durch das aktuelle Spielfeld.
   */
  function traceBeam(level) {
    const { rows, cols, emitter, target, walls, obstacles } = level;
    const wallSet = new Set((walls || []).map(w => keyOf(w.r, w.c)));
    const obsMap = new Map();
    for (const obs of (obstacles || [])) {
      obsMap.set(keyOf(obs.r, obs.c), obs);
    }

    const points = [{ r: emitter.r, c: emitter.c }];
    const visited = new Set();
    const hitObstacleIds = [];
    const hitObstacleSet = new Set();

    let r = emitter.r;
    let c = emitter.c;
    let dir = emitter.dir;
    let hitTarget = false;
    let stoppedBy = 'edge';
    let blockedByObstacleId = null;

    const maxSteps = rows * cols * 4 + 10;
    for (let step = 0; step < maxSteps; step++) {
      const d = DELTA[dir];
      const nextR = r + d.dr;
      const nextC = c + d.dc;

      if (nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) {
        points.push({ r: r + 0.5 * d.dr, c: c + 0.5 * d.dc });
        stoppedBy = 'edge';
        break;
      }

      r = nextR;
      c = nextC;

      const stateKey = `${r},${c},${dir}`;
      if (visited.has(stateKey)) {
        points.push({ r, c });
        stoppedBy = 'loop';
        break;
      }
      visited.add(stateKey);

      if (r === target.r && c === target.c) {
        points.push({ r, c });
        hitTarget = true;
        stoppedBy = 'target';
        break;
      }

      const cellKey = keyOf(r, c);
      if (wallSet.has(cellKey)) {
        points.push({ r, c });
        stoppedBy = 'wall';
        break;
      }

      const obs = obsMap.get(cellKey);
      if (obs) {
        if (!hitObstacleSet.has(obs.id)) {
          hitObstacleSet.add(obs.id);
          hitObstacleIds.push(obs.id);
        }

        if (obs.type === 'mirror') {
          points.push({ r, c });
          dir = REFLECT[obs.state][dir];
        } else if (obs.type === 'gate') {
          if (obs.state === 'closed') {
            points.push({ r, c });
            stoppedBy = 'gate';
            blockedByObstacleId = obs.id;
            break;
          }
          // 'open' -> Strahl geht geradeaus durch
        } else if (obs.type === 'prism') {
          if (obs.state === 'reflect') {
            points.push({ r, c });
            dir = REFLECT[obs.deflectSlash][dir];
          }
          // 'pass' -> Strahl geht geradeaus durch
        }
      }
    }

    return {
      points,
      hitTarget,
      stoppedBy,
      blockedByObstacleId,
      hitObstacleIds
    };
  }

  /**
   * Ermittelt geeignete visuelle Mathe-Runen basierend auf den aktiven Mathe-Themen
   * und stellt sicher, dass an Position 0 & 1 ein echtes 2er-Kombo-Paar steht.
   */
  function pickOrderedConditionIds(activeCategories) {
    const sizeRunes = ['LT10', 'GE10', 'NEG'];
    const kindRunes = ['EVEN', 'ODD', 'FRAC'];
    const allIds = [...sizeRunes, ...kindRunes];

    const isComboPair = (s, k) => {
      if (MG && MG.getComboIntersectionProfile) {
        return Boolean(MG.getComboIntersectionProfile(s, k));
      }
      return !(s === 'NEG' && k === 'FRAC');
    };

    if (!MG || !MG.generateTask || !MG.getMatchingRuneIds) {
      return ['LT10', 'EVEN', 'GE10', 'ODD', 'FRAC', 'NEG'];
    }

    const counts = new Map();
    for (const id of allIds) counts.set(id, 0);

    for (let i = 0; i < 64; i++) {
      const t = MG.generateTask(activeCategories, 'normal');
      const runeIds = MG.getMatchingRuneIds(t);
      for (const rId of runeIds) {
        if (counts.has(rId)) {
          counts.set(rId, counts.get(rId) + 1);
        }
      }
    }

    const activeSizes = shuffle(sizeRunes.filter(id => counts.get(id) > 0));
    const activeKinds = shuffle(kindRunes.filter(id => counts.get(id) > 0));
    const otherSizes = shuffle(sizeRunes.filter(id => counts.get(id) === 0));
    const otherKinds = shuffle(kindRunes.filter(id => counts.get(id) === 0));

    let firstPair = null;
    for (const s of activeSizes) {
      for (const k of activeKinds) {
        if (isComboPair(s, k)) {
          firstPair = [s, k];
          break;
        }
      }
      if (firstPair) break;
    }
    if (!firstPair) {
      const poolS = activeSizes.concat(otherSizes);
      const poolK = activeKinds.concat(otherKinds);
      for (const s of poolS) {
        for (const k of poolK) {
          if (isComboPair(s, k)) {
            firstPair = [s, k];
            break;
          }
        }
        if (firstPair) break;
      }
    }
    if (!firstPair) {
      firstPair = ['LT10', 'EVEN'];
    }

    const activeRest = shuffle(
      allIds.filter(id => counts.get(id) > 0 && id !== firstPair[0] && id !== firstPair[1])
    );
    const otherRest = shuffle(
      allIds.filter(id => counts.get(id) === 0 && id !== firstPair[0] && id !== firstPair[1])
    );
    return [...firstPair, ...activeRest, ...otherRest];
  }

  /**
   * Konstruiert einen kreuzungsfreien orthogonalen Pfad mit numTurns 90°-Knickpunkten.
   */
  function buildSelfAvoidingPath(rows, cols, numTurns) {
    const edgeStarts = [];
    for (let r = 1; r < rows - 1; r++) {
      edgeStarts.push({ r, c: 0, dir: 'R' });
      edgeStarts.push({ r, c: cols - 1, dir: 'L' });
    }
    for (let c = 1; c < cols - 1; c++) {
      edgeStarts.push({ r: 0, c, dir: 'D' });
      edgeStarts.push({ r: rows - 1, c, dir: 'U' });
    }

    for (let attempt = 0; attempt < 120; attempt++) {
      const start = pick(edgeStarts);
      const visited = new Set([keyOf(start.r, start.c)]);
      const vertices = [{ r: start.r, c: start.c }];
      const segments = [];
      let curR = start.r;
      let curC = start.c;
      let curDir = start.dir;
      let ok = true;

      for (let segIdx = 0; segIdx <= numTurns; segIdx++) {
        const d = DELTA[curDir];
        const candidates = [];
        let scanR = curR;
        let scanC = curC;
        const segCells = [];

        for (let step = 1; step < Math.max(rows, cols); step++) {
          scanR += d.dr;
          scanC += d.dc;
          if (scanR < 0 || scanR >= rows || scanC < 0 || scanC >= cols) break;
          const k = keyOf(scanR, scanC);
          if (visited.has(k)) break;
          segCells.push({ r: scanR, c: scanC });

          // Endpunkte am Rand für Zwischen-Ecken vermeiden, damit Spielbrett luftig bleibt
          const isFinal = segIdx === numTurns;
          if (isFinal) {
            if (step >= 1) {
              candidates.push({ step, cells: segCells.slice() });
            }
          } else {
            const onOuterEdge = scanR === 0 || scanR === rows - 1 || scanC === 0 || scanC === cols - 1;
            if (!onOuterEdge || step >= 2) {
              candidates.push({ step, cells: segCells.slice() });
            }
          }
        }

        if (candidates.length === 0) {
          ok = false;
          break;
        }

        // Bevorzuge Schritte >= 2, damit Platz für ein Kristall-Tor (gate) entsteht
        const longCandidates = candidates.filter(c => c.step >= 2);
        const chosen = longCandidates.length > 0 && Math.random() < 0.75
          ? pick(longCandidates)
          : pick(candidates);

        for (const cell of chosen.cells) {
          visited.add(keyOf(cell.r, cell.c));
        }

        const endCell = chosen.cells[chosen.cells.length - 1];
        segments.push({
          inDir: curDir,
          cells: chosen.cells,
          end: endCell
        });
        vertices.push(endCell);
        curR = endCell.r;
        curC = endCell.c;

        if (segIdx < numTurns) {
          const nextDirs = shuffle(PERP_DIRS[curDir]);
          let pickedNext = null;
          for (const nd of nextDirs) {
            const ndDelta = DELTA[nd];
            const nr = curR + ndDelta.dr;
            const nc = curC + ndDelta.dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(keyOf(nr, nc))) {
              pickedNext = nd;
              break;
            }
          }
          if (!pickedNext) {
            ok = false;
            break;
          }
          curDir = pickedNext;
        }
      }

      if (!ok) continue;

      const hasRoomForGate = segments.some(s => s.cells.length >= 2);
      if (!hasRoomForGate) continue;

      return {
        emitter: start,
        target: vertices[vertices.length - 1],
        vertices,
        segments,
        visited
      };
    }

    return null;
  }

  /**
   * Deterministischer Fallback-Pfad, falls die Zufallssuche keinen Pfad fand.
   */
  function buildFallbackPath(rows, cols, numTurns) {
    const start = { r: 1, c: 0, dir: 'R' };
    const pts = numTurns >= 4
      ? [
          { r: 1, c: 0 },
          { r: 1, c: cols - 2 },
          { r: rows - 2, c: cols - 2 },
          { r: rows - 2, c: 2 },
          { r: 3, c: 2 },
          { r: 3, c: cols - 1 }
        ]
      : numTurns === 3
        ? [
            { r: 1, c: 0 },
            { r: 1, c: cols - 2 },
            { r: rows - 2, c: cols - 2 },
            { r: rows - 2, c: 1 },
            { r: 2, c: 1 }
          ]
        : [
            { r: 1, c: 0 },
            { r: 1, c: cols - 2 },
            { r: rows - 2, c: cols - 2 },
            { r: rows - 2, c: 1 }
          ];

    const visited = new Set([keyOf(pts[0].r, pts[0].c)]);
    const segments = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dr = Math.sign(b.r - a.r);
      const dc = Math.sign(b.c - a.c);
      const inDir = dr === -1 ? 'U' : dr === 1 ? 'D' : dc === -1 ? 'L' : 'R';
      const cells = [];
      let r = a.r;
      let c = a.c;
      while (r !== b.r || c !== b.c) {
        r += dr;
        c += dc;
        visited.add(keyOf(r, c));
        cells.push({ r, c });
      }
      segments.push({ inDir, cells, end: b });
    }

    return {
      emitter: start,
      target: pts[pts.length - 1],
      vertices: pts,
      segments,
      visited
    };
  }

  function createObstaclesAndDecorations(rows, cols, pathData, sizeMode, activeCategories) {
    const { emitter, target, segments, visited } = pathData;
    const conditionPool = pickOrderedConditionIds(activeCategories);
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    let condIdx = 0;
    let labelIdx = 0;

    const obstacles = [];
    const numTurns = segments.length - 1;

    // 1. Knickpunkte auf dem Lösungspfad als Mirror oder Prism
    const prismTurnIndex = numTurns >= 2 ? randInt(1, numTurns - 1) : 0;
    for (let i = 0; i < numTurns; i++) {
      const turnCell = segments[i].end;
      const inDir = segments[i].inDir;
      const outDir = segments[i + 1].inDir;
      const solvedSlash = getReflectSlash(inDir, outDir);
      const usePrism = i === prismTurnIndex;

      if (usePrism) {
        obstacles.push({
          id: `obs_${labelIdx + 1}`,
          label: labels[labelIdx++],
          type: 'prism',
          r: turnCell.r,
          c: turnCell.c,
          state: 'pass',
          solvedState: 'reflect',
          deflectSlash: solvedSlash,
          conditionId: conditionPool[condIdx++],
          pathOrder: i,
          locked: false,
          isGuard: false,
          isDecoy: false
        });
      } else {
        obstacles.push({
          id: `obs_${labelIdx + 1}`,
          label: labels[labelIdx++],
          type: 'mirror',
          r: turnCell.r,
          c: turnCell.c,
          state: solvedSlash === '/' ? '\\' : '/',
          solvedState: solvedSlash,
          conditionId: conditionPool[condIdx++],
          pathOrder: i,
          locked: false,
          isGuard: false,
          isDecoy: false
        });
      }
    }

    // 2. Ein Kristall-Tor (gate) auf einem geraden Pfad-Zwischenfeld platzieren
    // Bei >= 3 Knickpunkten startet es als offenes Wächter-Tor (taktische Vermeidung)
    const gateSegIndices = [];
    for (let si = 0; si < segments.length; si++) {
      if (segments[si].cells.length >= 2) gateSegIndices.push(si);
    }
    if (gateSegIndices.length > 0) {
      const segIdx = pick(gateSegIndices);
      const seg = segments[segIdx];
      // Zwischenzelle (nicht der Endpunkt, da dort die Ecke oder das Ziel liegt)
      const midIdx = randInt(0, seg.cells.length - 2);
      const gateCell = seg.cells[midIdx];
      const isGuard = numTurns >= 3;
      obstacles.push({
        id: `obs_${labelIdx + 1}`,
        label: labels[labelIdx++],
        type: 'gate',
        r: gateCell.r,
        c: gateCell.c,
        state: isGuard ? 'open' : 'closed',
        solvedState: 'open',
        conditionId: conditionPool[condIdx++],
        pathOrder: segIdx - 0.5,
        locked: false,
        isGuard,
        isDecoy: false
      });
    }

    // Freie Zellen abseits des Lösungspfads sammeln
    const freeCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visited.has(keyOf(r, c))) {
          freeCells.push({ r, c });
        }
      }
    }
    const freeSet = new Set(freeCells.map(fc => keyOf(fc.r, fc.c)));
    const preferredDecoyCells = [];
    for (let i = 0; i < numTurns; i++) {
      const turnCell = segments[i].end;
      const inDir = segments[i].inDir;
      const outDir = segments[i + 1].inDir;
      const solvedSlash = getReflectSlash(inDir, outDir);
      const wrongSlash = solvedSlash === '/' ? '\\' : '/';
      const probeDirs = i === prismTurnIndex
        ? [inDir, REFLECT[wrongSlash][inDir]]
        : [REFLECT[wrongSlash][inDir], inDir];
      for (const pDir of probeDirs) {
        const pd = DELTA[pDir];
        for (let step = 1; step <= 2; step++) {
          const pr = turnCell.r + pd.dr * step;
          const pc = turnCell.c + pd.dc * step;
          if (pr < 0 || pr >= rows || pc < 0 || pc >= cols) break;
          if (freeSet.has(keyOf(pr, pc))) {
            preferredDecoyCells.push({ r: pr, c: pc });
          } else {
            break;
          }
        }
      }
    }
    const shuffledFree = shuffle(freeCells);

    // 3. Ein Ablenkungs-Bauteil (Decoy) bevorzugt in Strahlverlängerung abseits des Lösungspfads
    if (shuffledFree.length > 0 && condIdx < conditionPool.length && labelIdx < labels.length) {
      let decoyCell = null;
      if (preferredDecoyCells.length > 0) {
        decoyCell = pick(preferredDecoyCells);
        const remIdx = shuffledFree.findIndex(fc => fc.r === decoyCell.r && fc.c === decoyCell.c);
        if (remIdx >= 0) shuffledFree.splice(remIdx, 1);
      } else {
        decoyCell = shuffledFree.shift();
      }
      const decoyType = pick(['mirror', 'gate']);
      obstacles.push({
        id: `obs_${labelIdx + 1}`,
        label: labels[labelIdx++],
        type: decoyType,
        r: decoyCell.r,
        c: decoyCell.c,
        state: decoyType === 'mirror' ? pick(['/', '\\']) : 'closed',
        solvedState: decoyType === 'mirror' ? '/' : 'closed',
        conditionId: conditionPool[condIdx++],
        pathOrder: null,
        locked: false,
        isGuard: false,
        isDecoy: true
      });
    }

    // Labels und IDs nach Gitter-Koordinaten vergeben, damit Buchstaben nicht den Pfad verraten
    obstacles.sort((a, b) => (a.r * cols + a.c) - (b.r * cols + b.c));
    obstacles.forEach((obs, idx) => {
      obs.id = `obs_${idx + 1}`;
      obs.label = labels[idx] || String(idx + 1);
    });

    // 4. 3–5 Felsen (walls) abseits des Lösungspfads
    const wallCount = Math.min(shuffledFree.length, sizeMode === 'master' ? randInt(4, 5) : randInt(3, 4));
    const walls = shuffledFree.slice(0, wallCount);

    const theme = pick(THEME_TITLES);
    return {
      sizeMode,
      rows,
      cols,
      title: theme.title,
      subtitle: theme.subtitle,
      emitter,
      target,
      walls,
      obstacles,
      moves: 0
    };
  }

  function cloneSolvedLevel(level) {
    return {
      ...level,
      obstacles: level.obstacles.map(o => ({
        ...o,
        state: o.isDecoy ? o.state : o.solvedState
      }))
    };
  }

  /**
   * Generiert ein garantiert lösbares Licht-Labyrinth.
   */
  function generateLevel(sizeMode = 'compact', activeCategories = null) {
    const isMaster = sizeMode === 'master';
    const rows = isMaster ? 7 : 6;
    const cols = isMaster ? 7 : 6;

    for (let attempt = 0; attempt < 25; attempt++) {
      const numTurns = isMaster ? 4 : pick([2, 3]);
      const pathData = buildSelfAvoidingPath(rows, cols, numTurns) || buildFallbackPath(rows, cols, numTurns);
      const level = createObstaclesAndDecorations(rows, cols, pathData, sizeMode, activeCategories);

      const startTrace = traceBeam(level);
      const solvedTrace = traceBeam(cloneSolvedLevel(level));

      if (!startTrace.hitTarget && solvedTrace.hitTarget) {
        return level;
      }
    }

    // Garantierter Fallback
    const numTurns = isMaster ? 4 : 3;
    const fallbackPath = buildFallbackPath(rows, cols, numTurns);
    return createObstaclesAndDecorations(rows, cols, fallbackPath, sizeMode, activeCategories);
  }

  /**
   * Schaltet ein Bauteil um und simuliert den neuen Strahl.
   */
  function toggleObstacle(level, obstacleId) {
    const obs = (level.obstacles || []).find(o => o.id === obstacleId);
    if (!obs) {
      return { obstacle: null, trace: traceBeam(level) };
    }

    if (obs.type === 'mirror') {
      obs.state = obs.state === '/' ? '\\' : '/';
    } else if (obs.type === 'gate') {
      obs.state = obs.state === 'open' ? 'closed' : 'open';
    } else if (obs.type === 'prism') {
      obs.state = obs.state === 'pass' ? 'reflect' : 'pass';
    }

    level.moves = (level.moves || 0) + 1;
    return {
      obstacle: obs,
      trace: traceBeam(level)
    };
  }

  /**
   * Findet alle aktuell ungelösten Pfad-Bauteilepaare, die sich über eine einzige
   * Kombo-Aufgabe gleichzeitig lösen lassen.
   */
  function findComboPairs(level) {
    if (!level || !Array.isArray(level.obstacles)) return [];
    const unsolved = level.obstacles
      .filter(o => !o.isDecoy && !o.locked && o.state !== o.solvedState)
      .slice()
      .sort((a, b) => (typeof a.pathOrder === 'number' ? a.pathOrder : 99) - (typeof b.pathOrder === 'number' ? b.pathOrder : 99));

    const pairs = [];
    for (let i = 0; i < unsolved.length; i++) {
      for (let j = i + 1; j < unsolved.length; j++) {
        const obsA = unsolved[i];
        const obsB = unsolved[j];
        const profileId = MG && MG.getComboIntersectionProfile
          ? MG.getComboIntersectionProfile(obsA.conditionId, obsB.conditionId)
          : null;
        if (profileId) {
          pairs.push({
            obsA,
            obsB,
            profileId,
            runeIds: [obsA.conditionId, obsB.conditionId]
          });
        }
      }
    }
    return pairs;
  }

  /**
   * Schaltet alle nicht eingerasteten Bauteile um, deren Rune zu matchingRuneIds passt.
   * Gelöste Pfad-Bauteile rasten dauerhaft ein (locked = true); Wächter-Tore werden
   * nur einmalig ausgelöst und rasten beim Wiederöffnen ebenfalls ein.
   */
  function applyTaskToLevel(level, matchingRuneIds) {
    if (!level || !Array.isArray(level.obstacles)) {
      return {
        switchedObstacles: [],
        newlySolved: [],
        trippedGuards: [],
        isCombo: false,
        trace: level ? traceBeam(level) : null
      };
    }

    const runeSet = new Set(Array.isArray(matchingRuneIds) ? matchingRuneIds : []);
    const switchedObstacles = [];
    const newlySolved = [];
    const trippedGuards = [];

    for (const obs of level.obstacles) {
      if (obs.locked || !runeSet.has(obs.conditionId)) continue;

      if (!obs.isDecoy && obs.state !== obs.solvedState) {
        obs.state = obs.solvedState;
        obs.locked = true;
        obs.isGuard = false;
        newlySolved.push(obs);
        switchedObstacles.push(obs);
      } else if (!obs.isDecoy && obs.isGuard && obs.state === obs.solvedState) {
        if (obs.type === 'gate') {
          obs.state = 'closed';
        } else if (obs.type === 'mirror') {
          obs.state = obs.state === '/' ? '\\' : '/';
        } else if (obs.type === 'prism') {
          obs.state = 'pass';
        }
        obs.isGuard = false;
        trippedGuards.push(obs);
        switchedObstacles.push(obs);
      } else if (obs.isDecoy) {
        if (obs.type === 'mirror') {
          obs.state = obs.state === '/' ? '\\' : '/';
        } else if (obs.type === 'gate') {
          obs.state = obs.state === 'open' ? 'closed' : 'open';
        } else if (obs.type === 'prism') {
          obs.state = obs.state === 'pass' ? 'reflect' : 'pass';
        }
        switchedObstacles.push(obs);
      }
    }

    if (switchedObstacles.length > 0) {
      level.moves = (level.moves || 0) + 1;
    }

    const trace = traceBeam(level);
    if (trace.hitTarget) {
      for (const obs of level.obstacles) {
        if (!obs.isDecoy && obs.state === obs.solvedState) {
          obs.locked = true;
          obs.isGuard = false;
        }
      }
    }

    return {
      switchedObstacles,
      newlySolved,
      trippedGuards,
      isCombo: newlySolved.length >= 2,
      trace
    };
  }

  /**
   * Liefert die priorisierten Runen-Bedingungen für das aktuelle Brett
   * (erstes Kombo-Paar vorne, dann übrige ungelöste Bauteile, dann Wächter/Decoys).
   */
  function getRequiredProfileIds(level) {
    if (!level || !Array.isArray(level.obstacles)) return [];
    const trace = traceBeam(level);
    const hitSet = new Set(trace.hitObstacleIds || []);
    const comboPairs = findComboPairs(level);
    const comboIds = comboPairs.length > 0
      ? [comboPairs[0].obsA.conditionId, comboPairs[0].obsB.conditionId]
      : [];

    const beamUnsolved = level.obstacles
      .filter(o => !o.isDecoy && !o.locked && o.state !== o.solvedState && hitSet.has(o.id))
      .map(o => o.conditionId);
    const otherUnsolved = level.obstacles
      .filter(o => !o.isDecoy && !o.locked && o.state !== o.solvedState && !hitSet.has(o.id))
      .map(o => o.conditionId);
    const others = level.obstacles
      .filter(o => o.isDecoy || o.locked || o.state === o.solvedState)
      .map(o => o.conditionId);
    return [...new Set([...comboIds, ...beamUnsolved, ...otherUnsolved, ...others])];
  }

  return {
    DELTA,
    REFLECT,
    traceBeam,
    generateLevel,
    toggleObstacle,
    findComboPairs,
    applyTaskToLevel,
    getRequiredProfileIds
  };
}));
