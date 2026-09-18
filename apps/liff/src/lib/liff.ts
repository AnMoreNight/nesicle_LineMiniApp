export async function initLiff() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return null;
  const liffModule = await import("@line/liff");
  const liff = liffModule.default;
  await liff.init({ liffId });
  return liff;
}
