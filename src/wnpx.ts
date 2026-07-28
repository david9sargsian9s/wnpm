#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { runNativeBuild } from './nativeBuild/Nbuilding.prompt';

async function main() {
  // 1. Get package name from terminal arguments
  const pkgName = process.argv[2];

  if (!pkgName) {
    console.log('❌ Please specify a package name for wnpx (e.g., wnpx express-generator my-app -e)');
    return;
  }

  const cacheDir = path.join('/tmp', 'wnpm-cache', pkgName);

  console.log(`🚀 [wnpx] Executing ${pkgName} in isolated environment...`);

  // 2. Download the .tgz archive directly into the cache directory
  const tgzPath = await runNativeBuild(pkgName, 'latest', cacheDir);

  if (!tgzPath || !fs.existsSync(tgzPath)) {
    console.log(`❌ [wnpx] Archive not found in ${cacheDir}`);
    return;
  }

  // 3. Extract the .tgz archive into a temporary folder
  const extractDir = path.join(cacheDir, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });

  console.log(`📦 [wnpx] Extracting archive...`);
  execSync(`tar -xzf "${tgzPath}" -C "${extractDir}"`);

  const pkgPath = path.join(extractDir, 'package');
  const pkgJsonPath = path.join(pkgPath, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    console.log(`❌ [wnpx] package.json not found inside the archive.`);
    return;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  // 4. Check and install package dependencies if needed
  const hasDeps = pkgJson.dependencies && Object.keys(pkgJson.dependencies).length > 0;
  const nodeModulesExists = fs.existsSync(path.join(pkgPath, 'node_modules'));

  if (hasDeps && !nodeModulesExists) {
    console.log(`📥 [wnpx] Installing required dependencies for ${pkgName}...`);
    execSync('npm install --omit=dev --no-audit --no-fund', {
      cwd: pkgPath,
      stdio: 'inherit'
    });
  }

  // 5. Resolve executable binary path from package.json
  let binPath: string | null = null;

  if (typeof pkgJson.bin === 'string') {
    binPath = pkgJson.bin;
  } else if (typeof pkgJson.bin === 'object' && pkgJson.bin !== null) {
    binPath = Object.values(pkgJson.bin)[0] as string;
  }

  if (!binPath) {
    console.log(`⚠️  [wnpx] Package "${pkgName}" does not provide an executable binary in package.json.`);
    return;
  }

  const fullBinPath = path.join(pkgPath, binPath);

  // 6. Collect extra CLI arguments
  const extraArgs = process.argv.slice(3).map(arg => `"${arg}"`).join(' ');

  console.log(`⚡ [wnpx] Running: ${pkgName} ${extraArgs}...`);

  // 7. Execute target script with Node
  try {
    execSync(`node "${fullBinPath}" ${extraArgs}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (err: any) {
    console.error(`❌ [wnpx] Execution error: ${err.message}`);
  }
}

main();