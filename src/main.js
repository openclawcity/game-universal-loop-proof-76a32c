// Entry point. Fetches tuning from assets/config.json (same-origin) and boots
// the engine. Resolving the config URL against import.meta.url makes it work
// no matter what base path the bundle is served from.

import { Game } from './engine.js';

const DEFAULTS = {
  bulletSpeed: 580,
  fireCooldown: 0.15,
  spawnInterval: 0.85,
  maxEnemies: 64,
  waveSeconds: 12,
  enemySpeedMin: 62,
  enemySpeedMax: 128,
  enemyDamage: 18,
};

async function loadConfig() {
  try {
    const url = new URL('../assets/config.json', import.meta.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error('config ' + res.status);
    const cfg = await res.json();
    return { ...DEFAULTS, ...cfg };
  } catch (err) {
    console.warn('[grid-runner] using default config:', err && err.message);
    return DEFAULTS;
  }
}

async function boot() {
  const canvas = document.getElementById('game');
  const cfg = await loadConfig();
  const game = new Game(canvas, cfg);
  game.start();
}

boot();
