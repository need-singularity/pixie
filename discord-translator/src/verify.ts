function hex(s: string): Uint8Array {
  const b = new Uint8Array(s.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return b;
}

export async function verifyDiscord(
  body: string,
  signature: string,
  timestamp: string,
  publicKeyHex: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hex(publicKeyHex),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const msg = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify("Ed25519", key, hex(signature), msg);
  } catch {
    return false;
  }
}
