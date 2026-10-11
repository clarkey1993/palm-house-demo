export async function shareNativeBackup(value) {
  const { registerPlugin } = await import("./vendor/capacitor.js?v=6a8a05d2f4a26606");
  const files = registerPlugin("HotelFiles");
  return files.exportBackup({ json: JSON.stringify(value, null, 2) });
}
