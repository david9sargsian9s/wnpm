import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

import { checkEnvFile } from '../config/nativeBuild/checkEnvFile';
import { verifyConnection } from '../config/nativeBuild/connectionVerify.config';
import { verifyAuthenticityAndPrompt } from '../config/nativeBuild/connectionAuthenticity.config';
import { getTargetDirectory } from '../config/nativeBuild/driveAndStorage.config';
import { askCloudStoragePrompt } from '../config/nativeBuild/cloudPrompt.config';
import { uploadToGoogleDrive } from '../config/nativeBuild/googleDriveUpload';

export async function runNativeBuild(
  packageName: string,
  version: string = 'latest',
  customTargetDir?: string
): Promise<string | null> {
  try {
    // 1. Checking for the presence of the .env file
    checkEnvFile();

    // 2. Checking the network connection
    const isConnected = await verifyConnection();
    if (!isConnected) {
      throw new Error('[wnpm] connection resource error: connect the virtual file system (on google drive, or your native resource)');
    }

    // 3. Ask user approval for downloading
    const approved = await verifyAuthenticityAndPrompt(packageName);
    if (!approved) {
      console.log('❌ [wnpm] Download cancelled by user.');
      return null;
    }

    // 4. Prompt for cloud storage option
    const useCloud = await askCloudStoragePrompt();
    
    // 5. Determine target directory
    let targetDir = customTargetDir;

    if (!targetDir) {
      if (useCloud) {
        targetDir = path.join(process.env.HOME || '~', '.wnpm', 'drive-cloud');
        console.log(`☁️ [wnpm] Target storage set to Google Drive cloud path: ${targetDir}`);
      } else {
        targetDir = getTargetDirectory();
        console.log(`💻 [wnpm] Target storage set to Local File System: ${targetDir}`);
      }
    }

    // Ensure the target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(`📦 [wnpm] Fetching package info for ${packageName}@${version}...`);

    // 6. Requesting package metadata from registry.npmjs.org
    const packageMeta = await fetchPackageMetadata(packageName, version);
    const tarballUrl = packageMeta.dist?.tarball;

    if (!tarballUrl) {
      throw new Error(`[wnpm] Tarball URL not found for ${packageName}`);
    }

    // 7. Download the .tgz archive
    const sanitizedPkgName = packageName.replace('/', '-');
    const archiveName = `${sanitizedPkgName}-${packageMeta.version}.tgz`;
    const outputPath = path.join(targetDir, archiveName);

    console.log(`⬇️ [wnpm] Downloading archive to ${outputPath}...`);
    await downloadFile(tarballUrl, outputPath);

    // 8. If Cloud Storage was selected, trigger Google Drive API Upload with cleanup
    if (useCloud) {
      const uploaded = await uploadToGoogleDrive(outputPath);
      if (!uploaded) {
        return null;
      }
    }

    console.log(`🎉 [wnpm] Successfully processed node archive: ${archiveName}`);

    return outputPath;

  } catch (err: any) {
    console.error(`❌ ${err.message}`);
    return null;
  }
}

function fetchPackageMetadata(pkg: string, ver: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${pkg}/${ver}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse package metadata'));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location!, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}