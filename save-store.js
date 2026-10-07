import { loadSave, writeSave, SAVE_KEY } from "./saves.js";

// SaveStore contract: load(), raw(), write(value, expectedRaw), preserve(value).
// Native atomic-file storage is a later device-validation milestone.
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
  preserve(value) {
    this.scoped.setItem("palm-house-before-restore", JSON.stringify(value));
  }
}
