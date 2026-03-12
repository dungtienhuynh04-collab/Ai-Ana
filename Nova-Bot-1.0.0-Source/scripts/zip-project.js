import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EXCLUDE = new Set([
  "node_modules",
  "release",
  "dist",
  "data",
  ".git",
  ".idea",
  ".vscode",
  "*.log",
  "Nova-Bot-*-Release.zip",
]);

function shouldExclude(name) {
  if (EXCLUDE.has(name)) return true;
  if (name.endsWith(".log")) return true;
  if (name === "pack.ps1" || name === "pack-zip.ps1") return true;
  if (name.startsWith("Nova-Bot-") && name.endsWith("-Source")) return true;
  if (name.endsWith(".zip")) return true;
  return false;
}

function getAllFiles(dir, base = "") {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(base, e.name);
    if (shouldExclude(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...getAllFiles(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
const zipName = `Nova-Bot-${pkg.version}-Source.zip`;
const tempDir = path.join(root, `Nova-Bot-${pkg.version}-Source`);

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const files = getAllFiles(root, "");
for (const rel of files) {
  const src = path.join(root, rel);
  const dest = path.join(tempDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const zipPath = path.join(root, zipName);
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const psScript = `
$tempDir = "${tempDir.replace(/\\/g, "\\\\")}"
$zipPath = "${zipPath.replace(/\\/g, "\\\\")}"
Compress-Archive -Path "$tempDir\\*" -DestinationPath $zipPath -Force
`;

const psFile = path.join(root, "scripts", "pack-zip.ps1");
fs.writeFileSync(psFile, psScript);

try {
  const { execSync } = await import("child_process");
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`, { stdio: "inherit", cwd: root });
} catch (e) {
  console.error("PowerShell failed, trying alternative...");
}

try {
  fs.unlinkSync(psFile);
  fs.rmSync(tempDir, { recursive: true, maxRetries: 3 });
} catch (_) {}

if (fs.existsSync(zipPath)) {
  console.log(`\nCreated: ${zipName}`);
  console.log("This zip contains the project source for Git.");
} else {
  console.error("Failed to create zip. Try running manually:");
  console.error(`  Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`);
}
