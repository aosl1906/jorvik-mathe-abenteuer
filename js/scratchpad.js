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
    let activePointerId = null;
    let lastPenTime = 0;

    function applyStrokeStyle(e) {
      ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : currentColor;
      if (isEraser) {
        ctx.lineWidth = 18;
      } else {
        ctx.lineWidth = (e && e.pointerType === 'pen' && e.pressure > 0)
          ? 1.8 + e.pressure * 2.2
          : 2.6;
      }
    }

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
      if (e.pointerType === 'pen') {
        lastPenTime = Date.now();
      } else if (e.pointerType === 'touch' && Date.now() - lastPenTime < 600) {
        return;
      }
      if (activePointerId !== null && activePointerId !== e.pointerId) return;

      e.preventDefault();
      if (window.getSelection) {
        const sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }
      drawing = true;
      activePointerId = e.pointerId;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      applyStrokeStyle(e);
      ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
      ctx.stroke();
      canvasEl.setPointerCapture(e.pointerId);
    }

    function moveDraw(e) {
      if (!drawing || e.pointerId !== activePointerId) return;
      if (e.pointerType === 'pen') lastPenTime = Date.now();
      e.preventDefault();
      const pos = getPos(e);
      applyStrokeStyle(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function endDraw(e) {
      if (!drawing || (e && e.pointerId !== activePointerId)) return;
      drawing = false;
      activePointerId = null;
      ctx.closePath();
      if (e && canvasEl.hasPointerCapture && canvasEl.hasPointerCapture(e.pointerId)) {
        canvasEl.releasePointerCapture(e.pointerId);
      }
    }

    function clear() {
      const rect = canvasEl.getBoundingClientRect();
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.restore();
    }

    canvasEl.addEventListener('pointerdown', startDraw);
    canvasEl.addEventListener('pointermove', moveDraw);
    canvasEl.addEventListener('pointerup', endDraw);
    canvasEl.addEventListener('pointercancel', endDraw);
    canvasEl.addEventListener('selectstart', e => e.preventDefault());
    canvasEl.addEventListener('contextmenu', e => e.preventDefault());
    canvasEl.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    canvasEl.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    if (canvasEl.parentElement) {
      canvasEl.parentElement.addEventListener('selectstart', e => e.preventDefault());
      canvasEl.parentElement.addEventListener('contextmenu', e => e.preventDefault());
    }

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
