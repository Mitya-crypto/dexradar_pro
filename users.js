import fs from "fs";
import path from "path";

const FILE = path.resolve("./users.json");

function ensure() { if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}, null, 2)); }
export function readUsers() { ensure(); return JSON.parse(fs.readFileSync(FILE, "utf-8")); }
export function setPlan(userId, plan = "dexradar_pro") {
  ensure(); const u = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  u[userId] = plan; fs.writeFileSync(FILE, JSON.stringify(u, null, 2));
}
