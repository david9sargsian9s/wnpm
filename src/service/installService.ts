import { runNativeBuild } from '../nativeBuild/Nbuilding.prompt';
import { runNativeNpm } from '../hostLine/npmProxy';
import { FastBuildEngine } from '../fastBuild/fastBuild';

export interface IInstallOptions {
    isNativeEnvironment?: boolean; // true = CLI terminal, false = Web OS
}

export async function installService(
    args: string[], 
    options: IInstallOptions = { isNativeEnvironment: true }
): Promise<string | void> {
    const isHostMode = args.includes('--host') || args.includes('-h');
    
    // Extract package names by filtering out CLI flags
    const packages = args.filter(arg => !arg.startsWith('-'));

    if (packages.length === 0) {
        const errorMsg = '❌ Specify the package name to download (e.g., wnpm install lodash)';
        console.log(errorMsg);
        return errorMsg;
    }

    // =========================================================================
    // CONTEXT 1: WEB OS / BROWSER ENVIRONMENT (ISOLATED IN-MEMORY & VFS SYNC)
    // =========================================================================
    if (!options.isNativeEnvironment) {
        let logs = '⚡ [wnpm] Web OS Package Installation started...\n';

        for (const pkg of packages) {
            logs += `📦 Downloading package "${pkg}" into RAM...\n`;
            try {
                // Fetch and extract tarball directly in memory
                const files = await FastBuildEngine.fetchAndExtract(pkg, 'latest');
                logs += `✅ Extracted ${files.length} files for "${pkg}".\n`;
                
                // Return status and unpacked files payload for VfsService
                return logs + `🎉 Package "${pkg}" successfully downloaded for Web OS storage.`;
            } catch (err: any) {
                logs += `❌ [wnpm ERROR] Installation failed for ${pkg}: ${err.message || err}\n`;
            }
        }

        return logs;
    }

    // =========================================================================
    // CONTEXT 2: NATIVE SYSTEM CLI (HOST ENVIRONMENT OPERATIONS)
    // =========================================================================
    if (isHostMode) {
        console.log('🔗 [wnpm] HostLine mode: starting standard native npm...');
        runNativeNpm(['install', ...packages]);
        return;
    }

    console.log('🚀 [wnpm] Starting native archive download (.tgz)...');
    for (const pkg of packages) {
        await runNativeBuild(pkg);
    }
}