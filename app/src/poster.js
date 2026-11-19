// Neon Nights — poster renderer.
// Pure canvas drawing: layouts, colour grades, lettering and export.
// No network, no libraries; everything is drawn from the panel photos
// the user (or a ?shot= scene) loaded into the panel state.

export const SIZES = {
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080×1350' },
  square: { w: 1080, h: 1080, label: 'Square 1080×1080' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920×1080' },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    bottom: 'rgba(214,32,110,0.55)',
    wash: 'rgba(255,110,60,0.10)',
    accent: '#ffd166',
    captionInk: '#ffffff',
    glow: 'rgba(255,90,40,0.55)',
  },
  neon: {
    label: 'Neon',
    bottom: 'rgba(255,32,150,0.50)',
    wash: 'rgba(40,200,255,0.10)',
    accent: '#3fe3ff',
    captionInk: '#ffffff',
    glow: 'rgba(255,32,150,0.65)',
  },
  midnight: {
    label: 'Midnight',
    bottom: 'rgba(12,8,44,0.60)',
    wash: 'rgba(90,70,200,0.10)',
    accent: '#c9a86a',
    captionInk: '#f6ead2',
    glow: 'rgba(90,70,220,0.45)',
  },
};

const PAPER = '#f4ead8';
const BAND = 'rgba(18,6,26,0.92)';
const INK = '#14081f';

// Panel rectangles per layout and size. Numbers are export pixels.
function gridGeometry(sizeKey) {
  if (sizeKey === 'portrait') {
    return {
      panels: [
        { x: 12, y: 12, w: 1056, h: 689 },
        { x: 12, y: 713, w: 522, h: 400 },
        { x: 546, y: 713, w: 522, h: 400 },
      ],
      caption: { x: 12, y: 1125, w: 1056, h: 213, align: 'center' },
    };
  }
  if (sizeKey === 'square') {
    return {
      panels: [
        { x: 12, y: 12, w: 1056, h: 548 },
        { x: 12, y: 572, w: 522, h: 316 },
        { x: 546, y: 572, w: 522, h: 316 },
      ],
      caption: { x: 12, y: 900, w: 1056, h: 168, align: 'center' },
    };
  }
  return {
    panels: [
      { x: 12, y: 12, w: 1164, h: 856 },
      { x: 1188, y: 12, w: 720, h: 422 },
      { x: 1188, y: 446, w: 720, h: 422 },
    ],
    caption: { x: 12, y: 880, w: 1896, h: 188, align: 'left' },
  };
}

function comicGeometry(size) {
  const { w, h } = size;
  const shift = w * 0.06;
  const bandH = h / 3;
  const panels = [0, 1, 2].map((i) => ({
    x: 0,
    y: i * bandH,
    w,
    h: bandH,
    clip: [
      [i === 0 ? 0 : -shift, i * bandH],
      [w, i * bandH + (i === 0 ? 0 : shift * 0.4)],
      [w, (i + 1) * bandH],
      [0, (i + 1) * bandH - shift * 0.4],
    ],
  }));
  return {
    panels,
    caption: { x: w * 0.07, y: h * 0.42, w: w * 0.86, h: h * 0.16, align: 'center', rotate: -0.05 },
  };
}

function magazineGeometry(size) {
  const { w, h } = size;
  const insetW = Math.round(w * 0.34);
  const insetH = Math.round(insetW * 0.78);
  return {
    panels: [
      { x: 0, y: 0, w, h },
      {
        x: w - insetW - Math.round(w * 0.045),
        y: h - insetH - Math.round(h * 0.05),
        w: insetW,
        h: insetH,
        polaroid: true,
        rotate: -0.035,
      },
    ],
    caption: { x: Math.round(w * 0.05), y: Math.round(h * 0.05), w: Math.round(w * 0.8), h: Math.round(h * 0.3), align: 'left', bare: true },
  };
}

export function geometry(layout, sizeKey, size) {
  if (layout === 'comic') return comicGeometry(size);
  if (layout === 'magazine') return magazineGeometry(size);
  return gridGeometry(sizeKey);
}

export function panelCount(layout) {
  return layout === 'magazine' ? 2 : 3;
}

// Draw one photo into a panel rectangle with cover-fit, zoom and pan.
// Pan offsets are export pixels from the centred cover position.
function drawPanel(ctx, panel, shot) {
  ctx.save();
  if (panel.clip) {
    ctx.beginPath();
    panel.clip.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    ctx.clip();
  } else if (panel.rotate) {
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(panel.rotate);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
  }

  if (panel.polaroid) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(panel.x - 14, panel.y - 14, panel.w + 28, panel.h + 42);
  }

  const img = shot.img;
  if (img && img.naturalWidth > 0) {
    const scale = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight) * (shot.zoom || 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = panel.x + (panel.w - dw) / 2 + (shot.ox || 0);
    const dy = panel.y + (panel.h - dh) / 2 + (shot.oy || 0);
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
    g.addColorStop(0, '#3a1454');
    g.addColorStop(1, '#d9206e');
    ctx.fillStyle = g;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `600 ${Math.round(panel.h * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
  }
  ctx.restore();

  if (panel.polaroid) {
    ctx.save();
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(panel.rotate);
    ctx.translate(-cx, -cy);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.strokeRect(panel.x - 7, panel.y - 7, panel.w + 14, panel.h + 14);
    ctx.restore();
  }
}

// Colour grade: warm wash, a coloured pool at the bottom of the frame
// and a soft vignette pulling the corners down.
function applyGrade(ctx, size, grade) {
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, size.w, size.h);
  const bottom = ctx.createLinearGradient(0, size.h * 0.45, 0, size.h);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(1, grade.bottom);
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, size.w, size.h);
  const cx = size.w / 2;
  const cy = size.h / 2;
  const r = Math.hypot(cx, cy);
  const vig = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  vig.addColorStop(0, 'rgba(10,4,18,0)');
  vig.addColorStop(1, 'rgba(10,4,18,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, size.w, size.h);
}

// Shrink the Anton face until the text fits maxWidth; returns the size.
function fitSize(ctx, text, maxWidth, start) {
  let size = start;
  while (size > 12) {
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

function lettered(ctx, text, cx, cy, size, grade, align) {
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = size * 0.22;
  ctx.lineWidth = size / 13;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = grade.captionInk;
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
}

function subLine(ctx, text, cx, cy, size, grade, align) {
  if (!text) return;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  try {
    ctx.letterSpacing = `${Math.round(size * 0.32)}px`;
  } catch {
    /* letterSpacing is a progressive enhancement */
  }
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.accent;
  ctx.fillText(text.toUpperCase(), cx, cy);
  try {
    ctx.letterSpacing = '0px';
  } catch {
    /* ignore */
  }
}

function drawCaption(ctx, geo, state, grade, size) {
  const band = geo.caption;
  const caption = (state.caption || '').toUpperCase();
  const sub = state.sub || '';

  if (band.bare) {
    // Magazine: huge two-line lettering straight onto the hero photo.
    const words = caption.split(/\s+/).filter(Boolean);
    const half = Math.ceil(words.length / 2);
    const lines = words.length > 1
      ? [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean)
      : [caption];
    const start = Math.round(size.h * 0.115);
    const fitted = Math.min(...lines.map((line) => fitSize(ctx, line, band.w, start)));
    lines.forEach((line, i) => {
      lettered(ctx, line, band.x, band.y + fitted * (i + 0.55), fitted, grade, 'left');
    });
    subLine(ctx, sub, band.x + 4, band.y + fitted * lines.length + fitted * 0.42, Math.round(fitted * 0.24), grade, 'left');
    return;
  }

  ctx.save();
  if (band.rotate) {
    const cx = band.x + band.w / 2;
    const cy = band.y + band.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(band.rotate);
    ctx.translate(-cx, -cy);
  }
  ctx.fillStyle = BAND;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(band.x, band.y, band.w, 5);

  const pad = Math.round(band.w * 0.035);
  const left = band.align === 'left';
  const tx = left ? band.x + pad : band.x + band.w / 2;
  const align = left ? 'left' : 'center';
  const mainSize = fitSize(ctx, caption, band.w - pad * 2, Math.round(band.h * 0.5));
  lettered(ctx, caption, tx, band.y + band.h * 0.42, mainSize, grade, align);
  subLine(ctx, sub, tx, band.y + band.h * 0.8, Math.round(band.h * 0.125), grade, align);
  ctx.restore();
}

// Render the whole poster described by state onto ctx at export size.
export function drawPoster(ctx, state) {
  const size = SIZES[state.size];
  const grade = GRADES[state.grade];
  const geo = geometry(state.layout, state.size, size);

  ctx.fillStyle = state.layout === 'magazine' ? INK : PAPER;
  if (state.layout === 'comic') ctx.fillStyle = INK;
  ctx.fillRect(0, 0, size.w, size.h);

  const count = panelCount(state.layout);
  for (let i = 0; i < count; i += 1) {
    drawPanel(ctx, geo.panels[i], state.panels[i]);
  }

  applyGrade(ctx, size, grade);
  drawCaption(ctx, geo, state, grade, size);

  // Cream keyline frame, inset 6px.
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, size.w - 12, size.h - 12);
}

// Render onto an offscreen canvas and hand back a PNG blob.
export function exportPNG(state) {
  const size = SIZES[state.size];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawPoster(canvas.getContext('2d'), state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
