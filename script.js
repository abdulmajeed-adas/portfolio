// ── Project image gallery switcher ──
function switchImg(mainId, thumb) {
  document.getElementById(mainId).src = thumb.src;
  thumb.closest('.gallery-thumbs').querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

// ── Lightbox ──
let lightboxImgs = [];
let lightboxIndex = 0;

function openLightbox(thumbsId) {
  const thumbs = document.querySelectorAll(`#${thumbsId} .thumb`);
  lightboxImgs = Array.from(thumbs).map(t => t.src);
  lightboxIndex = Array.from(thumbs).findIndex(t => t.classList.contains('active'));
  document.getElementById('lightbox-img').src = lightboxImgs[lightboxIndex];
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lightboxNav(dir, e) {
  e.stopPropagation();
  lightboxIndex = (lightboxIndex + dir + lightboxImgs.length) % lightboxImgs.length;
  document.getElementById('lightbox-img').src = lightboxImgs[lightboxIndex];
}

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxNav(1, { stopPropagation: () => {} });
  if (e.key === 'ArrowLeft') lightboxNav(-1, { stopPropagation: () => {} });
});

// ── Conway's Game of Life ──
(function () {
  let running = false;
  let grid, nextGrid;
  let rows, cols;
  const CELL = 12;
  let animId = null;
  let lastTime = 0;
  let speed = 8;
  let isMouseDown = false;
  let drawValue = 1;

  const modal    = document.getElementById('game-modal');
  const canvas   = document.getElementById('game-canvas');
  const ctx      = canvas.getContext('2d');
  const playBtn  = document.getElementById('game-play-btn');
  const speedSlider = document.getElementById('game-speed-slider');
  const speedVal    = document.getElementById('game-speed-val');

  speedSlider.addEventListener('input', function () {
    speed = +this.value;
    speedVal.textContent = this.value;
  });

  function idx(r, c) { return r * cols + c; }

  function initGrid() {
    const maxW = Math.min(modal.offsetWidth - 48, 850);
    const maxH = Math.min(window.innerHeight * 0.55, 520);
    cols = Math.floor(maxW / CELL);
    rows = Math.floor(maxH / CELL);
    canvas.width  = cols * CELL;
    canvas.height = rows * CELL;
    grid     = new Uint8Array(rows * cols);
    nextGrid = new Uint8Array(rows * cols);
  }

  function step() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            n += grid[idx((r + dr + rows) % rows, (c + dc + cols) % cols)];
          }
        }
        const alive = grid[idx(r, c)];
        nextGrid[idx(r, c)] = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      }
    }
    [grid, nextGrid] = [nextGrid, grid];
  }

  function draw() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3b82f6';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[idx(r, c)]) ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }
  }

  function loop(ts) {
    if (running && ts - lastTime >= 1000 / speed) {
      step();
      lastTime = ts;
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      r: Math.floor(((clientY - rect.top)  * scaleY) / CELL),
      c: Math.floor(((clientX - rect.left) * scaleX) / CELL)
    };
  }

  function paintCell(e) {
    const { r, c } = getPos(e);
    if (r >= 0 && r < rows && c >= 0 && c < cols) grid[idx(r, c)] = drawValue;
  }

  canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    const { r, c } = getPos(e);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      drawValue = grid[idx(r, c)] ? 0 : 1;
      grid[idx(r, c)] = drawValue;
    }
  });
  canvas.addEventListener('mousemove', (e) => { if (isMouseDown) paintCell(e); });
  window.addEventListener('mouseup', () => { isMouseDown = false; });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMouseDown = true;
    const { r, c } = getPos(e);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      drawValue = grid[idx(r, c)] ? 0 : 1;
      grid[idx(r, c)] = drawValue;
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (isMouseDown) paintCell(e); }, { passive: false });
  canvas.addEventListener('touchend', () => { isMouseDown = false; });

  const PRESETS = {
    glider: [[0,1],[1,2],[2,0],[2,1],[2,2]],
    blinker: [[0,0],[0,1],[0,2],[3,0],[3,1],[3,2],[6,0],[6,1],[6,2]],
    beacon: [[0,0],[0,1],[1,0],[1,1],[2,2],[2,3],[3,2],[3,3]],
    spaceship: [[0,1],[0,2],[0,3],[0,4],[1,0],[1,4],[2,4],[3,0],[3,3]],
    pulsar: [
      [0,2],[0,3],[0,4],[0,8],[0,9],[0,10],
      [2,0],[2,5],[2,7],[2,12],[3,0],[3,5],[3,7],[3,12],[4,0],[4,5],[4,7],[4,12],
      [5,2],[5,3],[5,4],[5,8],[5,9],[5,10],
      [7,2],[7,3],[7,4],[7,8],[7,9],[7,10],
      [8,0],[8,5],[8,7],[8,12],[9,0],[9,5],[9,7],[9,12],[10,0],[10,5],[10,7],[10,12],
      [12,2],[12,3],[12,4],[12,8],[12,9],[12,10]
    ]
  };

  function loadPreset(name) {
    grid.fill(0);
    const cells = PRESETS[name];
    if (!cells) return;
    const minR = Math.min(...cells.map(([r]) => r));
    const maxR = Math.max(...cells.map(([r]) => r));
    const minC = Math.min(...cells.map(([, c]) => c));
    const maxC = Math.max(...cells.map(([, c]) => c));
    const offR = Math.floor((rows - (maxR - minR + 1)) / 2) - minR;
    const offC = Math.floor((cols - (maxC - minC + 1)) / 2) - minC;
    cells.forEach(([r, c]) => {
      const nr = r + offR, nc = c + offC;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) grid[idx(nr, nc)] = 1;
    });
  }

  window.openGame = function () {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    initGrid();
    loadPreset('glider');
    running = false;
    playBtn.textContent = '▶ Play';
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  };

  window.closeGame = function () {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    running = false;
  };

  window.toggleGamePlay = function () {
    running = !running;
    playBtn.textContent = running ? '⏸ Pause' : '▶ Play';
  };

  window.stepGame = function () {
    running = false;
    playBtn.textContent = '▶ Play';
    step();
    draw();
  };

  window.resetGame = function () {
    running = false;
    playBtn.textContent = '▶ Play';
    grid.fill(0);
  };

  window.randomizeGame = function () {
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.3 ? 1 : 0;
  };

  window.loadPreset = loadPreset;

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') window.closeGame();
    if (e.key === ' ') { e.preventDefault(); window.toggleGamePlay(); }
  });
})();

// ── Conway's Game of Life — card preview ──
(function () {
  const CELL = 6;
  const FPS  = 12;
  let pRows, pCols, pGrid, pNext, pAnimId, pLastTime = 0;

  const canvas = document.getElementById('conway-preview');
  const ctx    = canvas.getContext('2d');

  function pIdx(r, c) { return r * pCols + c; }

  function pResize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    pCols = Math.max(1, Math.floor(w / CELL));
    pRows = Math.max(1, Math.floor(h / CELL));
    canvas.width  = pCols * CELL;
    canvas.height = pRows * CELL;
    pGrid = new Uint8Array(pRows * pCols);
    pNext = new Uint8Array(pRows * pCols);
    pSeed();
  }

  function pSeed() {
    for (let i = 0; i < pGrid.length; i++) pGrid[i] = Math.random() < 0.32 ? 1 : 0;
  }

  function pStep() {
    let alive = 0;
    for (let r = 0; r < pRows; r++) {
      for (let c = 0; c < pCols; c++) {
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            n += pGrid[pIdx((r + dr + pRows) % pRows, (c + dc + pCols) % pCols)];
          }
        }
        const cell = pGrid[pIdx(r, c)];
        pNext[pIdx(r, c)] = cell ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
        alive += pNext[pIdx(r, c)];
      }
    }
    [pGrid, pNext] = [pNext, pGrid];
    if (alive < 15) pSeed();
  }

  function pDraw() {
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#60a5fa';
    for (let r = 0; r < pRows; r++) {
      for (let c = 0; c < pCols; c++) {
        if (pGrid[pIdx(r, c)]) ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }
  }

  function pLoop(ts) {
    if (ts - pLastTime >= 1000 / FPS) { pStep(); pLastTime = ts; }
    pDraw();
    pAnimId = requestAnimationFrame(pLoop);
  }

  requestAnimationFrame(() => {
    pResize();
    pAnimId = requestAnimationFrame(pLoop);
  });

  window.addEventListener('resize', pResize);
})();

// ── Mouse-tracking background animation ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let particles = [];
const PARTICLE_COUNT = 60;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Particle {
  constructor() { this.reset(); }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.baseX = this.x;
    this.baseY = this.y;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.4 + 0.1;
  }

  update() {
    // Drift slowly
    this.x += this.speedX;
    this.y += this.speedY;

    // Mouse repulsion
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repelRadius = 120;

    if (dist < repelRadius) {
      const force = (repelRadius - dist) / repelRadius;
      this.x += (dx / dist) * force * 3;
      this.y += (dy / dist) * force * 3;
    }

    // Wrap around edges
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(37, 99, 235, ${this.opacity})`;
    ctx.fill();
  }
}

// Init particles
for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push(new Particle());
}

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(37, 99, 235, ${0.12 * (1 - dist / 130)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animate);
}

animate();

// ── Smooth nav highlight on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 80) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.style.color = link.getAttribute('href') === `#${current}` ? '#2563eb' : '';
  });
});

// ── Fade-in on scroll ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.project-card, .about-card, .skill-group').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);
});
