import { loadSave, writeSave, SAVE_KEY, SaveConflictError } from "./saves.js?v=b5ce4ff7252e4568";

// SaveStore contract: load(), raw(), write(value, expectedRaw), preserve(value).
// The native implementation uses this browser store only for one-time migration.
export class BrowserSaveStore {
  constructor(storage, namespace = "") {
    this.storage = storage;
    this.prefix = namespace ? namespace + ":" : "";
    this.key = this.prefix + SAVE_KEY;
    this.scoped = {
      getItem: (key) => storage.getItem(this.prefix + key),
      setItem: (key, value) => storage.setItem(this.prefix + key, value),
    };
  }
  load() {
    return loadSave(this.scoped);
  }
  raw() {
    return this.scoped.getItem(SAVE_KEY);
  }
  write(value, expectedRaw) {
    return writeSave(this.scoped, value, { expectedRaw });
  }
  restart(value, previous, expectedRaw) {
    if (this.raw() !== expectedRaw)
      throw new SaveConflictError("Hotel updated in another tab");
    // Keep one recoverable pre-restart hotel, separate from rotating autosaves.
    this.scoped.setItem("palm-house-before-restart", JSON.stringify(previous));
    return this.write(value, expectedRaw);
  }
  preserve(value) {
    this.scoped.setItem("palm-house-before-restore", JSON.stringify(value));
  }
}
