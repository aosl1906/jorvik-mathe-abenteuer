/**
 * Schmierzettel-Modus: Einfaches Zeichenfeld/Notizblock für Nebenrechnungen
 * Unterstützt Maus, Touch und Stift (Pointer Events).
 */
window.Scratchpad = (function () {
  'use strict';

  function init(canvasEl, controls) {
    if (!canvasEl) return null;
    const ctx = canvasEl.getContext('2d');
    let drawing = false;
    let currentColor = '#2c221e';
    let isEraser = false;

    function resizeCanvas() {
      const rect = canvasEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      // Inhalt sichern
      const snapshot = canvasEl.width > 0 ? canvasEl.toDataURL() : null;
      canvasEl.width = Math.floor(rect.width * dpr);
      canvasEl.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (snapshot) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = snapshot;
      }
    }

    function getPos(e) {
      const rect = canvasEl.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      canvasEl.setPointerCapture(e.pointerId);
    }

    function moveDraw(e) {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.strokeStyle = isEraser ? '#fdf8ec' : currentColor;
      ctx.lineWidth = isEraser ? 16 : 2.6;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function endDraw(e) {
      if (!drawing) return;
      drawing = false;
      ctx.closePath();
      if (e && canvasEl.hasPointerCapture && canvasEl.hasPointerCapture(e.pointerId)) {
        canvasEl.releasePointerCapture(e.pointerId);
      }
    }

    function clear() {
      const rect = canvasEl.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    canvasEl.addEventListener('pointerdown', startDraw);
    canvasEl.addEventListener('pointermove', moveDraw);
    canvasEl.addEventListener('pointerup', endDraw);
    canvasEl.addEventListener('pointercancel', endDraw);

    if (controls && controls.clearBtn) {
      controls.clearBtn.addEventListener('click', clear);
    }
    if (controls && controls.colorButtons) {
      controls.colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          controls.colorButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (btn.dataset.eraser === 'true') {
            isEraser = true;
          } else {
            isEraser = false;
            currentColor = btn.dataset.color || '#2c221e';
          }
        });
      });
    }

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 50);

    return { clear, resizeCanvas };
  }

  return { init };
})();
