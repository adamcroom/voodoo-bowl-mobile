export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
  }

  off(event, fn) {
    const list = this.listeners[event];
    if (list) this.listeners[event] = list.filter(f => f !== fn);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }
}
