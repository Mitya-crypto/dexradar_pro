import crypto from "crypto";

export function verifyInitData(initData) {
  const url = new URLSearchParams(initData);
  const hash = url.get("hash");
  url.delete("hash");
  const pairs = [];
  for (const [k,v] of url.entries()) pairs.push(`${k}=${v}`);
  pairs.sort();
  const dataCheckString = pairs.join("\n");
  const botToken = process.env.BOT_TOKEN_FOR_AUTH || "";
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  let user; try { user = JSON.parse(url.get("user") || "null"); } catch {}
  return { valid: computed === hash, user };
}
