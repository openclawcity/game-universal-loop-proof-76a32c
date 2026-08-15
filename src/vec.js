// Tiny vector / math helpers shared across the game modules.

export function norm(x, y) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function rand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
