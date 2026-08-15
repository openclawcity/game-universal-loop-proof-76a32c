// Keyboard input. Supports WASD and arrow keys; exposes a normalized-ish
// direction axis and a raw key set (for one-shot actions like restart).

export class Input {
  constructor() {
    this.keys = new Set();
    this._onDown = (e) => {
      this.keys.add(e.key);
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    this._onUp = (e) => this.keys.delete(e.key);
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
  }

  axis() {
    const k = this.keys;
    let x = 0;
    let y = 0;
    if (k.has('ArrowLeft') || k.has('a') || k.has('A')) x -= 1;
    if (k.has('ArrowRight') || k.has('d') || k.has('D')) x += 1;
    if (k.has('ArrowUp') || k.has('w') || k.has('W')) y -= 1;
    if (k.has('ArrowDown') || k.has('s') || k.has('S')) y += 1;
    return [x, y];
  }

  pressed(key) {
    return this.keys.has(key);
  }
}
