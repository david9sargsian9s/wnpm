import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Checks for the existence of the .env file based on the operating system.
 * Logs a success message if found, or throws an error if missing.
 */
export function checkEnvFile(): void {
    const homeDir = os.homedir();
    const isWindows = process.platform === 'win32';
    const pathsToCheck: string[] = [];

    // Determine paths based on the system type
    if (isWindows) {
        // Windows path: %APPDATA%\wnpm\.env
        const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
        pathsToCheck.push(path.join(appData, 'wnpm', '.env'));
    } else {
        // Linux/macOS paths: ~/.config/wnpm/.env and /tmp/wnpm-debug/.env
        pathsToCheck.push(path.join(homeDir, '.config', 'wnpm', '.env'));
        pathsToCheck.push(path.join('/tmp', 'wnpm-debug', '.env'));
    }

    // Flag to track if the file is found anywhere
    let fileExists = false;

    // Scan the determined paths
    for (const envPath of pathsToCheck) {
        if (fs.existsSync(envPath)) {
            fileExists = true;
            break; // Stop searching once the first match is found
        }
    }

    // Handle the final result
    if (!fileExists) {
        throw new Error('permission deined. env file not defined');
    } else {
        console.log("The file is found, let's move on to the next step.");
    }
}
