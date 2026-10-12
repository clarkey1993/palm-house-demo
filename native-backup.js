export async function shareNativeBackup(value) {
  const { registerPlugin } = await import("./vendor/capacitor.js?v=6934bbf7d168eb53");
  const files = registerPlugin("HotelFiles");
  return files.exportBackup({ json: JSON.stringify(value, null, 2) });
}
