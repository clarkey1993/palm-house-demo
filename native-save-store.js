import { parseSave, SaveConflictError } from "./saves.js?v=1ecb862b7b9ddad2";

export class NativeSaveStore {
  constructor(files, legacy) {
    this.files = files;
    this.legacy = legacy;
    this.native = true;
    this.current = null;
  }
  async load() {
    const result = await this.files.loadSave();
    if (result.raw != null) {
      const value = parseSave(result.raw);
      if (!value) throw Error("Unrecognised native save. Files kept.");
      this.current = result.raw;
      return { value, recovered: !!result.recovered };
    }
    const old = this.legacy.load();
    if (!old.value && this.legacy.raw?.() != null)
      throw Error("Existing app save could not be read. Migration stopped.");
    if (old.value) {
      // Never clear the browser copy. It remains an independent migration backup.
      const json = JSON.stringify(old.value);
      await this.files.preserveSave({ json, reason: "migration" });
      await this.write(old.value, null);
    }
    return old;
  }
  raw() {
    return this.current;
  }
  async write(value, expectedRaw) {
    const json = JSON.stringify(value);
    if (!parseSave(json)) throw Error("Invalid hotel save");
    if (json === expectedRaw) return json;
    try {
      await this.files.writeSave({ json, expectedRaw });
    } catch (error) {
      if (error.code === "SAVE_CONFLICT")
        throw new SaveConflictError(error.message);
      throw error;
    }
    this.current = json;
    return json;
  }
  async preserve(value) {
    await this.files.preserveSave({
      json: JSON.stringify(value),
      reason: "restore",
    });
  }
  async restart(value, previous, expectedRaw) {
    await this.files.preserveSave({
      json: JSON.stringify(previous),
      reason: "restart",
    });
    return this.write(value, expectedRaw);
  }
}
export async function createNativeSaveStore(legacy) {
  const { registerPlugin } = await import("./vendor/capacitor.js?v=1ecb862b7b9ddad2");
  return new NativeSaveStore(registerPlugin("HotelFiles"), legacy);
}
