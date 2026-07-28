import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { getDriveUser, enforceValidToken } from './driveAuth.config';

export async function uploadToGoogleDrive(filePath: string): Promise<boolean> {
  // 1. Strict validation of token presence and expiration before starting
  if (!enforceValidToken()) {
    if (fs.existsSync(filePath)) {
      console.log(`🧹 [wnpm] Cleaning up temporary local file: ${path.basename(filePath)}`);
      fs.unlinkSync(filePath);
    }
    return false;
  }

  const user = getDriveUser();

  if (!fs.existsSync(filePath)) {
    console.error(`❌ [wnpm] File not found for upload: ${filePath}`);
    return false;
  }

  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;

  console.log(`☁️ [wnpm] Uploading ${fileName} (${fileSize} bytes) to Google Drive...`);

  return new Promise((resolve) => {
    const readStream = fs.createReadStream(filePath);

    const req = https.request(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user!.accessToken}`,
          'Content-Type': 'application/gzip',
          'Content-Length': fileSize,
        },
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          // Always purge local file upon completion (success or failure)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✨ [wnpm] Upload complete for ${fileName}!`);
            console.log(`🧹 [wnpm] Cleaned up temporary local file.`);
            resolve(true);
          } else {
            console.error(`❌ [wnpm] Google Drive API upload failed (${res.statusCode}): ${responseData}`);
            console.log(`🧹 [wnpm] Cleaned up failed local download.`);
            resolve(false);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`❌ [wnpm] Network error during upload: ${err.message}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      resolve(false);
    });

    readStream.pipe(req);
  });
}