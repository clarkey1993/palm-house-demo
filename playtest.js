// Explicit opt-in. Local only; no network, names, IDs, saved cash or free text.
const TYPES = new Set([
  "session",
  "step",
  "purchase",
  "chapter",
  "opening-complete",
  "error",
  "boundary",
  "restore",
]);
const safeSeconds = (n) =>
  Number.isFinite(n) ? Math.max(0, Math.min(n, 1e8)) : 0;
export class PlaytestLog {
  constructor(storage, key, version, { available = true } = {}) {
    this.storage = storage;
    this.key = key;
    this.version = version;
    this.available = available;
    this.enabled = false;
    this.events = [];
    this.seconds = 0;
    this.seen = new Set();
    this.session = 0;
    this.sessions = [];
    this.failed = false;
    if (!available) return;
    try {
      const data = JSON.parse(storage.getItem(key));
      if (data?.consent === true && Array.isArray(data.events)) {
        this.enabled = true;
        this.events = data.events
          .filter((e) => e && TYPES.has(e.type) && typeof e.id === "string")
          .slice(-2000)
          .map((e) => ({
            type: e.type,
            id: e.id.slice(0, 64),
            session: Number.isSafeInteger(e.session) ? e.session : 0,
            seconds: safeSeconds(e.seconds),
            day:
              typeof e.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.day)
                ? e.day
                : "unknown",
          }));
        this.session =
          Number.isSafeInteger(data.session) && data.session >= 0
            ? data.session
            : 0;
        this.sessions = Array.isArray(data.sessions)
          ? data.sessions
              .filter((s) => s && Number.isSafeInteger(s.id) && s.id > 0)
              .slice(-100)
              .map((s) => ({
                id: s.id,
                activeSeconds: safeSeconds(s.activeSeconds),
              }))
          : [];
        // Old exports only retained the latest session's duration. Recover that
        // known value; do not invent the missing older sessions' durations.
        if (!this.sessions.length && this.session > 0)
          this.sessions.push({
            id: this.session,
            activeSeconds: safeSeconds(data.activeSeconds),
          });
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
    this.sessions.push({ id: this.session, activeSeconds: 0 });
    this.sessions = this.sessions.slice(-100);
    this.record("session", "start");
  }
  consent(enabled) {
    if (!this.available || this.enabled === enabled) return;
    this.enabled = enabled;
    if (enabled) this.start();
    else {
      this.events = [];
      this.sessions = [];
      this.seen.clear();
      this.session = 0;
      this.seconds = 0;
      try {
        this.storage.removeItem(this.key);
        this.failed = false;
      } catch {
        this.failed = true;
      }
    }
  }
  tick(dt) {
    if (this.enabled && Number.isFinite(dt) && dt > 0) this.seconds += dt;
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
    const current = this.sessions.find((s) => s.id === this.session);
    if (current) current.activeSeconds = Math.round(this.seconds);
    return {
      schemaVersion: 2,
      version: this.version,
      consent: this.enabled,
      session: this.session,
      activeSeconds: Math.round(this.seconds),
      sessions: this.sessions.map((s) => ({ ...s })),
      events: this.events.map((e) => ({ ...e })),
    };
  }
  summary() {
    const data = this.data();
    return {
      sessions: data.sessions.length,
      activeSeconds: data.sessions.reduce((sum, s) => sum + s.activeSeconds, 0),
      purchases: data.events.filter((e) => e.type === "purchase").length,
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
