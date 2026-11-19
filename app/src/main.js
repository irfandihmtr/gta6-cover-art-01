// Neon Nights — editor wiring.
// Owns the poster state, the control panel, drag-to-pan, uploads and
// the deterministic ?shot= scenes used for screenshots.

import { SIZES, drawPoster, exportPNG, panelCount } from './poster.js';
import { SAMPLES, HERO_PAN, scenePanels } from './shots.js';

const canvas = document.getElementById('poster');
const ctx = canvas.getContext('2d');

const state = {
  layout: 'grid',
  grade: 'sunset',
  size: 'portrait',
  caption: 'Neon Nights',
  sub: 'A sunset story',
  panels: [],
  selected: 0,
};

function freshPanel() {
  return { img: null, zoom: 1, ox: 0, oy: 0, ready: Promise.resolve() };
}

for (let i = 0; i < 3; i += 1) state.panels.push(freshPanel());

function loadInto(panel, src) {
  panel.ready = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      panel.img = img;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
  return panel.ready;
}

function applyScene(layout) {
  const files = scenePanels(layout);
  files.forEach((file, i) => {
    const panel = state.panels[i];
    panel.zoom = 1;
    panel.ox = i === 0 ? HERO_PAN.ox : 0;
    panel.oy = i === 0 ? HERO_PAN.oy : 0;
    loadInto(panel, `samples/${file}`).then(redraw);
    const select = document.querySelector(`#sample-${i}`);
    if (select) select.value = file;
  });
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  drawPoster(ctx, state);
}

// ---------- control panel ----------

function segmented(id, key, after) {
  const box = document.getElementById(id);
  box.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    box.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === button));
    state[key] = button.dataset.value;
    if (after) after(button.dataset.value);
    redraw();
  });
}

function buildPanelRows() {
  const host = document.getElementById('panelRows');
  host.innerHTML = '';
  const count = panelCount(state.layout);
  for (let i = 0; i < count; i += 1) {
    const row = document.createElement('div');
    row.className = `panel-row${i === state.selected ? ' selected' : ''}`;
    row.dataset.index = String(i);

    const title = document.createElement('h3');
    title.textContent = i === 0 ? 'Panel 1 — hero' : `Panel ${i + 1}`;
    row.appendChild(title);

    const sampleLabel = document.createElement('label');
    sampleLabel.textContent = 'Sample photo';
    const select = document.createElement('select');
    select.id = `sample-${i}`;
    for (const sample of SAMPLES) {
      const option = document.createElement('option');
      option.value = sample.file;
      option.textContent = sample.label;
      select.appendChild(option);
    }
    select.addEventListener('change', () => {
      state.panels[i].ox = i === 0 ? HERO_PAN.ox : 0;
      state.panels[i].oy = i === 0 ? HERO_PAN.oy : 0;
      loadInto(state.panels[i], `samples/${select.value}`).then(redraw);
    });
    sampleLabel.appendChild(select);
    row.appendChild(sampleLabel);

    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Your photo';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.addEventListener('change', () => {
      const picked = file.files && file.files[0];
      if (!picked) return;
      loadInto(state.panels[i], URL.createObjectURL(picked)).then(redraw);
    });
    fileLabel.appendChild(file);
    row.appendChild(fileLabel);

    const zoomLabel = document.createElement('label');
    zoomLabel.textContent = 'Zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.01';
    zoom.value = '1';
    zoom.addEventListener('input', () => {
      state.panels[i].zoom = Number(zoom.value);
      redraw();
    });
    zoomLabel.appendChild(zoom);
    row.appendChild(zoomLabel);

    row.addEventListener('click', () => {
      state.selected = i;
      host.querySelectorAll('.panel-row').forEach((r) => r.classList.toggle('selected', r === row));
    });

    host.appendChild(row);
  }
}

// Drag on the canvas pans the selected panel's photo. CSS pixels are
// converted to export pixels so the pan feels 1:1 at any display size.
let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  drag = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const kx = canvas.width / rect.width;
  const ky = canvas.height / rect.height;
  const panel = state.panels[state.selected];
  panel.ox += (event.clientX - drag.x) * kx;
  panel.oy += (event.clientY - drag.y) * ky;
  drag = { x: event.clientX, y: event.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});
canvas.addEventListener('pointercancel', () => {
  drag = null;
});

document.getElementById('captionInput').addEventListener('input', (event) => {
  state.caption = event.target.value;
  redraw();
});
document.getElementById('subInput').addEventListener('input', (event) => {
  state.sub = event.target.value;
  redraw();
});

document.getElementById('exportBtn').addEventListener('click', async () => {
  const blob = await exportPNG(state);
  if (!blob) return;
  window.__lastExportBytes = blob.size;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'neon-nights.png';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
});

// Test hook: render an export offscreen and report its byte size.
window.__exportPNG = async () => {
  const blob = await exportPNG(state);
  return blob ? blob.size : 0;
};

segmented('layoutPicker', 'layout', (layout) => {
  state.selected = 0;
  buildPanelRows();
  applyScene(layout);
});
segmented('gradePicker', 'grade');
segmented('sizePicker', 'size');

// ---------- boot + ?shot= scenes ----------

async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');

  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('size')) state.size = params.get('size');
  if (params.get('caption')) {
    state.caption = params.get('caption');
    document.getElementById('captionInput').value = state.caption;
  }
  if (params.get('sub')) {
    state.sub = params.get('sub');
    document.getElementById('subInput').value = state.sub;
  }

  for (const [id, key] of [['layoutPicker', 'layout'], ['gradePicker', 'grade'], ['sizePicker', 'size']]) {
    document.getElementById(id).querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset.value === state[key]);
    });
  }

  if (shot === 'cover') document.body.classList.add('shot-cover');

  buildPanelRows();
  applyScene(state.layout);
  redraw();

  await Promise.all(state.panels.map((p) => p.ready));
  try {
    await document.fonts.ready;
    await document.fonts.load('100px Anton');
  } catch {
    /* fonts are local; a failure still leaves the fallback face */
  }
  redraw();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

boot();
