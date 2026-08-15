// Game engine: owns the canvas, the RAF loop, spawning, collisions, HUD, and
// the animated neon grid that fills the whole viewport.

import { Player, Bullet, Enemy, Particle } from './entities.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { norm, dist2, rand } from './vec.js';

export class Game {
  constructor(canvas, cfg) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = cfg;
    this.input = new Input();
    this.sfx = new Sfx();
    this.best = Number(this._loadBest()) || 0;

    this._resize = this._resize.bind(this);
    this._frame = this._frame.bind(this);
    window.addEventListener('resize', this._resize);

    // Resume audio on the first real gesture (keeps autoplay policy happy).
    const gesture = () => this.sfx.resume();
    window.addEventListener('keydown', gesture, { once: true });
    window.addEventListener('pointerdown', gesture, { once: true });

    this._resize();
    this.reset();
    this.last = 0;
  }

  _loadBest() {
    try { return localStorage.getItem('gridrunner_best'); } catch { return 0; }
  }

  _saveBest() {
    try { localStorage.setItem('gridrunner_best', String(this.best)); } catch { /* ignore */ }
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  reset() {
    this.player = new Player(this.w, this.h);
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.score = 0;
    this.wave = 1;
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.over = false;
    this.t = 0;
  }

  start() {
    requestAnimationFrame(this._frame);
  }

  _frame(ts) {
    const dt = Math.min(0.05, this.last ? (ts - this.last) / 1000 : 0.016);
    this.last = ts;
    this.t += dt;
    if (this.over) {
      if (this.input.pressed(' ')) this.reset();
    } else {
      this.update(dt);
    }
    this.render();
    requestAnimationFrame(this._frame);
  }

  update(dt) {
    const [ax, ay] = this.input.axis();
    this.player.update(dt, ax, ay, this.w, this.h);

    // Auto-fire at the nearest enemy — the ship always defends itself.
    if (this.player.cooldown <= 0) {
      const target = this._nearest();
      if (target) {
        const [dx, dy] = norm(target.x - this.player.x, target.y - this.player.y);
        this.bullets.push(new Bullet(this.player.x, this.player.y, dx, dy, this.cfg.bulletSpeed));
        this.player.cooldown = this.cfg.fireCooldown;
        this.sfx.shoot();
      }
    }

    // Spawning + wave escalation.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < this.cfg.maxEnemies) {
      this._spawn();
      this.spawnTimer = Math.max(0.25, this.cfg.spawnInterval - this.wave * 0.05);
    }
    this.waveTimer += dt;
    if (this.waveTimer > this.cfg.waveSeconds) {
      this.wave += 1;
      this.waveTimer = 0;
    }

    for (const b of this.bullets) b.update(dt);
    for (const e of this.enemies) e.update(dt, this.player.x, this.player.y);
    for (const p of this.particles) p.update(dt);

    // Bullet vs enemy.
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (dist2(b.x, b.y, e.x, e.y) < (b.r + e.r) ** 2) {
          b.dead = true;
          e.hp -= 1;
          this._burst(b.x, b.y, '#ffd93b', 4);
          if (e.hp <= 0) {
            e.dead = true;
            this.score += 10;
            this._burst(e.x, e.y, '#ff5c8a', 14);
            this.sfx.explode();
          } else {
            this.sfx.hit();
          }
          break;
        }
      }
    }

    // Enemy vs player.
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist2(e.x, e.y, this.player.x, this.player.y) < (e.r + this.player.r) ** 2) {
        e.dead = true;
        this.player.hp -= this.cfg.enemyDamage;
        this._burst(e.x, e.y, '#ff2d6f', 12);
        this.sfx.hit();
        if (this.player.hp <= 0) this._gameover();
      }
    }

    // Cull.
    this.bullets = this.bullets.filter(
      (b) => !b.dead && b.x > -20 && b.x < this.w + 20 && b.y > -20 && b.y < this.h + 20,
    );
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  _nearest() {
    let best = null;
    let bd = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist2(e.x, e.y, this.player.x, this.player.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  _spawn() {
    const edge = Math.floor(rand(0, 4));
    let x;
    let y;
    if (edge === 0) { x = rand(0, this.w); y = -20; }
    else if (edge === 1) { x = this.w + 20; y = rand(0, this.h); }
    else if (edge === 2) { x = rand(0, this.w); y = this.h + 20; }
    else { x = -20; y = rand(0, this.h); }
    const speed = rand(this.cfg.enemySpeedMin, this.cfg.enemySpeedMax) + this.wave * 4;
    const hp = 1 + Math.floor(this.wave / 4);
    this.enemies.push(new Enemy(x, y, speed, hp));
  }

  _burst(x, y, color, n) {
    for (let i = 0; i < n; i++) this.particles.push(new Particle(x, y, color));
  }

  _gameover() {
    this.over = true;
    if (this.score > this.best) {
      this.best = this.score;
      this._saveBest();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, this.w, this.h);
    this._grid(ctx);

    for (const p of this.particles) p.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    this.player.draw(ctx, this.t);
    this._hpBar(ctx);

    const score = document.getElementById('score');
    if (score) score.textContent = 'SCORE ' + this.score;
    const wave = document.getElementById('wave');
    if (wave) wave.textContent = 'WAVE ' + this.wave;
    const best = document.getElementById('best');
    if (best) best.textContent = 'BEST ' + this.best;

    if (this.over) this._overlay(ctx);
  }

  _grid(ctx) {
    ctx.strokeStyle = 'rgba(45, 111, 255, 0.16)';
    ctx.lineWidth = 1;
    const step = 46;
    const off = (this.t * 22) % step;
    ctx.beginPath();
    for (let x = off; x < this.w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.h);
    }
    for (let y = off; y < this.h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.w, y);
    }
    ctx.stroke();
  }

  _hpBar(ctx) {
    const w = 240;
    const h = 12;
    const x = 20;
    const y = this.h - 34;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x, y, w, h);
    const frac = Math.max(0, this.player.hp / this.player.maxHp);
    ctx.fillStyle = frac > 0.4 ? '#39f8ff' : '#ff5c8a';
    ctx.fillRect(x, y, w * frac, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeRect(x, y, w, h);
  }

  _overlay(ctx) {
    ctx.fillStyle = 'rgba(3, 5, 12, 0.72)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dfcff';
    ctx.font = '700 64px ui-monospace, monospace';
    ctx.fillText('GRID DOWN', this.w / 2, this.h / 2 - 18);
    ctx.font = '400 22px ui-monospace, monospace';
    ctx.fillStyle = '#cfe9ff';
    ctx.fillText('score ' + this.score + '  ·  press SPACE to re-enter the grid', this.w / 2, this.h / 2 + 26);
    ctx.textAlign = 'left';
  }
}
