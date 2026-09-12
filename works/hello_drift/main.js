(() => {
  'use strict';
  const canvas = document.querySelector('#field');
  const ctx = canvas.getContext('2d', { alpha: false });
  const button = document.querySelector('#pause');
  const icon = document.querySelector('#pause-icon');
  const label = document.querySelector('#pause-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const IDLE_DELAY = 1200;
  const DRIFT_SECONDS = 19;
  let paused = reducedMotion.matches;
  let points = [], width = 0, height = 0, dotSize = 2;
  let spread = 0, lastActivity = performance.now(), lastFrame = lastActivity;
  let frame = 0, lastPointer = null;

  // Every dot gets one of eight fixed directions, interleaved across the grid.
  const diagonal = Math.SQRT1_2;
  const directions = [
    [1, 0], [diagonal, diagonal], [0, 1], [-diagonal, diagonal],
    [-1, 0], [-diagonal, -diagonal], [0, -1], [diagonal, -diagonal]
  ];
  const directionOrder = [0, 4, 2, 6, 5, 1, 7, 3];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sample a large glyph mask so the small square dots retain a crisp outline.
    const mask = document.createElement('canvas');
    mask.width = 1600;
    mask.height = 600;
    const m = mask.getContext('2d', { willReadFrequently: true });
    m.font = '700 520px Arial, Helvetica, sans-serif';
    m.textAlign = 'center';
    m.textBaseline = 'alphabetic';
    m.fillText('Hello', 800, 475);
    const pixels = m.getImageData(0, 0, mask.width, mask.height).data;
    let minX = 1600, maxX = 0, minY = 600, maxY = 0;
    for (let y = 0; y < 600; y++) {
      for (let x = 0; x < 1600; x++) {
        if (pixels[(y * 1600 + x) * 4 + 3] > 128) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }
    const glyphWidth = maxX - minX, glyphHeight = maxY - minY;
    const scale = Math.min(width * (width < 600 ? .86 : .64) / glyphWidth, height * .43 / glyphHeight);
    const step = Math.max(4, Math.round(Math.max(2.6, width / 300) / scale));
    dotSize = Math.max(.9, step * scale * .49);
    const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
    const travel = Math.hypot(width, height) + 64;
    points = [];
    for (let y = minY; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        if (pixels[(y * 1600 + x) * 4 + 3] < 128) continue;
        const bx = (x - midX) * scale;
        const by = (y - midY) * scale;
        const nx = bx / Math.max(1, glyphWidth * scale / 2);
        const ny = by / Math.max(1, glyphHeight * scale / 2);
        const column = Math.round((x - minX) / step);
        const row = Math.round((y - minY) / step);
        const directionIndex = directionOrder[(column + row * 3) % 8];
        const [dx, dy] = directions[directionIndex];
        // Outer dots move farther, widening the spacing without random jitter.
        // Even the shortest path ends beyond the viewport, including the dot size.
        const distance = travel * (1 + .65 * Math.hypot(nx, ny));
        points.push({ bx, by, dx, dy, distance });
      }
    }
    draw();
  }

  function draw() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#272727';
    const cx = width / 2, cy = height / 2 - (width < 600 ? 16 : 8);
    const half = dotSize / 2;
    for (const p of points) {
      const distance = p.distance * Math.pow(spread, 1.65);
      const x = p.bx + p.dx * distance;
      const y = p.by + p.dy * distance;
      ctx.fillRect(cx + x - half, cy + y - half, dotSize, dotSize);
    }
  }

  function tick(now) {
    const dt = Math.min((now - lastFrame) / 1000, .05);
    lastFrame = now;
    if (!paused) {
      if (now - lastActivity > IDLE_DELAY) {
        spread = Math.min(1, spread + dt / DRIFT_SECONDS);
      } else {
        spread *= Math.exp(-7.5 * dt);
        if (spread < .0001) spread = 0;
      }
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function activate() { lastActivity = performance.now(); }
  window.addEventListener('pointermove', event => {
    const next = [event.clientX, event.clientY];
    if (!lastPointer || Math.hypot(next[0] - lastPointer[0], next[1] - lastPointer[1]) > 0) activate();
    lastPointer = next;
  }, { passive: true });
  window.addEventListener('pointerdown', activate, { passive: true });
  window.addEventListener('keydown', event => {
    if (event.key.startsWith('Arrow')) { event.preventDefault(); activate(); }
  });

  function updatePause() {
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'アニメーションを再生' : 'アニメーションを一時停止');
    label.textContent = paused ? '再生' : '一時停止';
    icon.innerHTML = paused ? '<path d="M6 3.5v13l10-6.5z"/>' : '<path d="M5 4h3v12H5zm7 0h3v12h-3z"/>';
  }
  button.addEventListener('click', () => {
    paused = !paused;
    activate();
    updatePause();
  });
  reducedMotion.addEventListener('change', event => {
    paused = event.matches;
    if (paused) { spread = 0; draw(); }
    activate();
    updatePause();
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) {
      lastFrame = performance.now();
      activate();
      frame = requestAnimationFrame(tick);
    }
  });
  window.addEventListener('resize', resize);
  updatePause();
  resize();
  frame = requestAnimationFrame(tick);
})();
