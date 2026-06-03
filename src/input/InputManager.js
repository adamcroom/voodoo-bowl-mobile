export class InputManager {
  constructor(canvas, events) {
    this.events = events;
    this.queue = [];

    this._onKey = this._onKey.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this.touchStart = null;

    document.addEventListener('keydown', this._onKey);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('click', () => this.queue.push('tap'));
  }

  _onKey(e) {
    const map = {
      ArrowUp: 'dodgeUp',
      ArrowDown: 'dodgeDown',
      ArrowRight: 'sprint',
      ArrowLeft: 'hesitate',
      ' ': 'tap',
      Enter: 'tap',
    };
    const action = map[e.key];
    if (action) {
      e.preventDefault();
      this.queue.push(action);
    }
  }

  _onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  _onTouchEnd(e) {
    e.preventDefault();
    if (!this.touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - this.touchStart.time;
    this.touchStart = null;

    if (elapsed > 300) return;

    if (dist < 15) {
      this.queue.push('tap');
      return;
    }

    if (dist < 20) return;

    const ratio = Math.min(Math.abs(dx), Math.abs(dy)) / Math.max(Math.abs(dx), Math.abs(dy));
    if (ratio > 0.7) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.queue.push(dx > 0 ? 'sprint' : 'hesitate');
    } else {
      this.queue.push(dy < 0 ? 'dodgeUp' : 'dodgeDown');
    }
  }

  poll() {
    const actions = [...this.queue];
    this.queue = [];
    return actions;
  }
}
