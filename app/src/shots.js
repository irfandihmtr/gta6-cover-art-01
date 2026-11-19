// Neon Nights — deterministic scenes for screenshots.
// A scene pins the layout, grade, size and the sample photo in every
// panel, so a screenshot taken from a ?shot= URL always shows the
// same poster.

export const SAMPLES = [
  { file: 'boulevard.jpg', label: 'Boulevard (photo)' },
  { file: 'pier.jpg', label: 'Pier (photo)' },
  { file: 'skyline.jpg', label: 'Skyline (art)' },
  { file: 'neon.jpg', label: 'Neon street (art)' },
];

// Which sample sits in which panel for each layout.
export const SCENE_PANELS = {
  grid: ['boulevard.jpg', 'pier.jpg', 'skyline.jpg'],
  comic: ['neon.jpg', 'boulevard.jpg', 'pier.jpg'],
  magazine: ['boulevard.jpg', 'pier.jpg'],
};

// The hero photograph's subject sits high in the frame; with cover-fit
// the face is cut unless the hero is panned down. Measured fix, in
// export pixels: ox -40, oy +300. Applied to panel 0 of every scene.
export const HERO_PAN = { ox: -40, oy: 300 };

export function scenePanels(layout) {
  return (SCENE_PANELS[layout] || SCENE_PANELS.grid).slice();
}
