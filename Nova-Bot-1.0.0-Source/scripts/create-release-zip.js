import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
const version = pkg.version;
const zipName = `Nova-Bot-${version}-Release.zip`;
const outDir = `Nova-Bot-${version}-Release`;

const include = ["src", "electron", "server", ".github", "package.json", "package-lock.json", "index.html", "vite.config.js", "tailwind.config.js", "postcss.config.js", ".gitignore", "README.md", "RUN-WEB.bat", "RUN-EXE.bat"];
const releaseFiles = [
  "Nova Bot Setup " + version + ".exe",
  "Nova Bot-" + version + "-win.zip",
];

// Create temp dir
const tempPath = path.join(root, outDir);
if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { recursive: true });
fs.mkdirSync(tempPath, { recursive: true });

// Copy source
for (const item of include) {
  const src = path.join(root, item);
  const dest = path.join(tempPath, item);
  if (fs.existsSync(src)) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Copy release artifacts
const releaseDir = path.join(root, "release");
for (const f of releaseFiles) {
  const src = path.join(releaseDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(tempPath, f));
  }
}

// Create zip (PowerShell on Windows)
const zipPath = path.join(root, zipName);
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
const psScript = path.join(root, "scripts", "pack.ps1");
fs.writeFileSync(psScript, `Compress-Archive -Path '${tempPath}\\*' -DestinationPath '${zipPath}' -Force\n`);
execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: "inherit", cwd: root });
fs.unlinkSync(psScript);

// Cleanup temp (ignore errors on Windows)
try {
  fs.rmSync(tempPath, { recursive: true, maxRetries: 3 });
} catch (e) {
  console.warn("Could not remove temp folder:", e.message);
}

console.log(`\nCreated: ${zipName}`);
console.log("Upload this file to GitHub Releases.");
