import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const CONFIG_DIR = path.join(process.env.HOME || '~', '.config', 'wnpm');
const USER_CONFIG_PATH = path.join(CONFIG_DIR, 'drive-user.json');

export interface DriveUserInfo {
  name: string;
  email: string;
  accessToken?: string;
  updatedAt?: number; // Timestamp of token creation/update
}

// 1. Read credentials from disk
export function getDriveUser(): DriveUserInfo | null {
  if (!fs.existsSync(USER_CONFIG_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(USER_CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 2. Save credentials to disk with timestamp
export function saveDriveUser(user: DriveUserInfo): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Record timestamp whenever saving/updating credentials
  user.updatedAt = Date.now();

  fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(user, null, 2), 'utf8');
}

// 3. Interactive registration flow
export async function registerGoogleDrive(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  console.log('🌐 [wnpm] Google Drive Registration / Token Setup');
  const name = await question('👤 Enter your name (Uname): ');
  const email = await question('📧 Enter your Google Email (Umail): ');
  const token = await question('🔑 Enter your Google Drive OAuth Access Token (or press Enter to skip): ');

  saveDriveUser({
    name: name.trim(),
    email: email.trim(),
    accessToken: token.trim() || undefined
  });

  console.log('✅ [wnpm] Google Drive credentials saved!');
  rl.close();
}

// 4. Removing a Google Drive account from the system
export function unregisterGoogleDrive(): void {
  if (fs.existsSync(USER_CONFIG_PATH)) {
    fs.unlinkSync(USER_CONFIG_PATH);
    console.log('🗑️  [wnpm] Google Drive account credentials removed successfully.');
  } else {
    console.log('⚠️ [wnpm] No Google Drive account found to remove.');
  }
}

// 5. Check if token exceeds Google's 1-hour lifespan
export function isTokenExpired(user: DriveUserInfo): boolean {
  if (!user.updatedAt) return false;
  const ONE_HOUR_MS = 60 * 60 * 1000;
  return Date.now() - user.updatedAt > ONE_HOUR_MS;
}

// 6. Strict guard function called before operations requiring Google Drive
export function enforceValidToken(): boolean {
  const user = getDriveUser();

  if (!user || !user.accessToken) {
    console.error('❌ [wnpm] CRITICAL: Google Drive authentication required!');
    console.error('👉 Run `wnpm drive register` to configure your credentials.');
    return false;
  }

  if (isTokenExpired(user)) {
    console.error('\n🚨 ======================================================== 🚨');
    console.error('❌ [wnpm] YOUR OAUTH ACCESS TOKEN HAS EXPIRED!');
    console.error('   Google OAuth Access Tokens only live for 1 HOUR.');
    console.error('   You CANNOT proceed with cloud sync until you refresh it.');
    console.error('');
    console.error('📋 INSTRUCTIONS TO REFRESH TOKEN:');
    console.error('   1. Go to: https://developers.google.com/oauthplayground');
    console.error('   2. Select "Drive API v3" -> "https://www.googleapis.com/auth/drive.file"');
    console.error('   3. Click "Authorize APIs" -> "Exchange authorization code for tokens"');
    console.error('   4. Copy the NEW "access_token" (only the ya29... string)');
    console.error('   5. Execute: `wnpm drive register` to update your token');
    console.error('🚨 ======================================================== 🚨\n');
    return false;
  }

  return true;
}