import { execSync } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { packager } = require("@electron/packager");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RELEASE_DIR = path.join(ROOT, "release-out");

console.log("=== Nova Bot Build ===\n");

// Step 1: Build frontend
console.log("[1/3] Building frontend...");
execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });

// Step 2: Package with electron-packager
console.log("\n[2/3] Packaging Electron app...");

try {
  const appPaths = await packager({
    dir: ROOT,
    name: "Nova Bot",
    platform: "win32",
    arch: "x64",
    out: RELEASE_DIR,
    overwrite: true,
    asar: false,
    prune: true,
    derefSymlinks: true,
    ignore: [
      /^\/src($|\/)/,
      /^\/server($|\/)/,
      /^\/data($|\/)/,
      /^\/scripts($|\/)/,
      /^\/public($|\/)/,
      /^\/test_/,
      /^\/run\.bat$/,
      /^\/build\.bat$/,
      /^\/vite\.config/,
      /^\/tailwind\.config/,
      /^\/postcss\.config/,
      /^\/release-out($|\/)/,
      /^\/.gemini($|\/)/,
      /^\/.git($|\/)/,
      /^\/.agent($|\/)/,
      /^\/node_modules\/\.cache($|\/)/,
    ],
  });

  console.log("Packaged to:", appPaths[0]);

  // Step 3: Create zip
  console.log("\n[3/3] Creating zip archive...");
  const appDir = appPaths[0];
  const zipPath = path.join(RELEASE_DIR, "Nova-Bot-win64.zip");

  execSync(
    `powershell -Command "Compress-Archive -Path '${appDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: "inherit" }
  );

  console.log(`\n✅ Build complete!`);
  console.log(`   Folder: ${appDir}`);
  console.log(`   Zip:    ${zipPath}`);
} catch (err) {
  console.error("❌ Build failed:", err.message);
  console.error(err.stack);
  process.exit(1);
}
