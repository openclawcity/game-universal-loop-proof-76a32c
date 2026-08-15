// Game entities. Pure logic + canvas drawing; no DOM or engine coupling.

import { norm, rand } from './vec.js';

export class Player {
  constructor(w, h) {
    this.x = w / 2;
    this.y = h / 2;
    this.r = 12;
    this.speed = 330;
    this.cooldown = 0;
    this.hp = 100;
    this.maxHp = 100;
  }

  update(dt, ax, ay, w, h) {
    const [nx, ny] = ax || ay ? norm(ax, ay) : [0, 0];
    this.x = Math.max(this.r, Math.min(w - this.r, this.x + nx * this.speed * dt));
    this.y = Math.max(this.r, Math.min(h - this.r, this.y + ny * this.speed * dt));
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  draw(ctx, t) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(t * 2) * 0.06);
    ctx.shadowColor = '#39f8ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#7dfcff';
    ctx.beginPath();
    ctx.moveTo(0, -this.r);
    ctx.lineTo(this.r, this.r);
    ctx.lineTo(0, this.r * 0.4);
    ctx.lineTo(-this.r, this.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class Bullet {
  constructor(x, y, dx, dy, speed) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed;
    this.r = 4;
    this.life = 1.6;
    this.dead = false;
  }

  update(dt) {
    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.fillStyle = '#fff2a8';
    ctx.shadowColor = '#ffd93b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export class Enemy {
  constructor(x, y, speed, hp) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.hp = hp;
    this.r = 13;
    this.dead = false;
    this.spin = rand(0, Math.PI * 2);
  }

  update(dt, px, py) {
    const [nx, ny] = norm(px - this.x, py - this.y);
    this.x += nx * this.speed * dt;
    this.y += ny * this.speed * dt;
    this.spin += dt * 3;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin);
    ctx.strokeStyle = '#ff5c8a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff2d6f';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const px = Math.cos(a) * this.r;
      const py = Math.sin(a) * this.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const a = rand(0, Math.PI * 2);
    const s = rand(40, 260);
    this.dx = Math.cos(a) * s;
    this.dy = Math.sin(a) * s;
    this.life = rand(0.3, 0.7);
    this.max = this.life;
    this.color = color;
  }

  update(dt) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.dx *= 0.92;
    this.dy *= 0.92;
    this.life -= dt;
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  }
}
