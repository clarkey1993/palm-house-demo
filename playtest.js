// Explicit opt-in. Local only; no network, names, IDs, saved cash or free text.
const TYPES = new Set([
  "session",
  "step",
  "purchase",
  "chapter",
  "opening-complete",
  "error",
  "boundary",
]);
export class PlaytestLog {
  constructor(storage, key, version) {
    this.storage = storage;
    this.key = key;
    this.version = version;
    this.enabled = false;
    this.events = [];
    this.seconds = 0;
    this.seen = new Set();
    this.session = 0;
    this.failed = false;
    try {
      const data = JSON.parse(storage.getItem(key));
      if (data?.consent === true && Array.isArray(data.events)) {
        this.enabled = true;
        this.events = data.events.filter((e) => TYPES.has(e.type)).slice(-2000);
        this.session = Number.isSafeInteger(data.session) ? data.session : 0;
        this.seen = new Set(
          this.events
            .filter((e) => e.type === "step" || e.type === "opening-complete")
            .map((e) => e.type + ":" + e.id),
        );
      }
    } catch {}
    if (this.enabled) this.start();
  }
  start() {
    this.session++;
    this.seconds = 0;
    this.record("session", "start");
  }
  consent(enabled) {
    this.enabled = enabled;
    if (enabled) this.start();
    else {
      this.events = [];
      this.seen.clear();
      try {
        this.storage.removeItem(this.key);
      } catch {
        this.failed = true;
      }
    }
  }
  tick(dt) {
    if (this.enabled) this.seconds += dt;
  }
  record(type, id = "", once = false) {
    if (!this.enabled || !TYPES.has(type)) return;
    id = String(id).slice(0, 64);
    const key = type + ":" + id;
    if (once && this.seen.has(key)) return;
    this.seen.add(key);
    this.events.push({
      type,
      id,
      session: this.session,
      seconds: Math.round(this.seconds),
      day: new Date().toISOString().slice(0, 10),
    });
    this.events = this.events.slice(-2000);
    this.flush();
  }
  data() {
    return {
      version: this.version,
      consent: this.enabled,
      session: this.session,
      activeSeconds: Math.round(this.seconds),
      events: this.events,
    };
  }
  flush() {
    if (!this.enabled) return;
    try {
      this.storage.setItem(this.key, JSON.stringify(this.data()));
      this.failed = false;
    } catch {
      this.failed = true;
    }
  }
}
