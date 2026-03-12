/**
 * Close Nova Bot / Electron before build.
 * Prevents "Access is denied" when electron-builder writes files.
 */
import { execSync } from "child_process";

try {
  execSync('taskkill /IM "Nova Bot.exe" /F', { stdio: "ignore" });
} catch (_) {}
try {
  execSync('taskkill /IM "electron.exe" /F', { stdio: "ignore" });
} catch (_) {}

await new Promise((r) => setTimeout(r, 800));
