export async function shareNativeBackup(value) {
  const { registerPlugin } = await import("./vendor/capacitor.js?v=907998017151e85d");
  const files = registerPlugin("HotelFiles");
  return files.exportBackup({ json: JSON.stringify(value, null, 2) });
}
