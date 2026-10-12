export async function shareNativeBackup(value) {
  const { registerPlugin } = await import("./vendor/capacitor.js?v=b5ce4ff7252e4568");
  const files = registerPlugin("HotelFiles");
  return files.exportBackup({ json: JSON.stringify(value, null, 2) });
}
