export async function shareNativeBackup(value) {
  const { registerPlugin } = await import("./vendor/capacitor.js?v=8b66355174a228a7");
  const files = registerPlugin("HotelFiles");
  return files.exportBackup({ json: JSON.stringify(value, null, 2) });
}
