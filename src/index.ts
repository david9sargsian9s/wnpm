#!/usr/bin/env node

import process from 'node:process';
import { versionService } from "./service/versionService";
import { installService } from "./service/installService";
import { getDriveUser, registerGoogleDrive, unregisterGoogleDrive } from "./config/nativeBuild/driveAuth.config";
export { FastBuildEngine, IFastBuildFile } from './fastBuild/fastBuild';

/**
 * Unified wnpm command handler for Web OS and CLI
 */
export async function handleWnpmCommand(args: string[]): Promise<string> {
  const command = args[0];

  switch (command) {
    case '-v':
    case '--version': {
      await versionService();
      return 'wnpm version command executed.';
    }

    case 'i':
    case 'install': {
      const packages = args.slice(1);
      // Pass isNativeEnvironment: true
      await installService(packages, { isNativeEnvironment: true });
      return 'Native installation completed.';
    }

    case 'drive': {
      const subCommand = args[1];
      if (subCommand === 'register') {
        await registerGoogleDrive();
        return 'Google Drive register initiated.';
      } else if (subCommand === 'unregister' || subCommand === 'logout' || subCommand === 'delete') {
        await unregisterGoogleDrive();
        return 'Google Drive unregistered successfully.';
      } else {
        return `❌ [wnpm] Unknown subcommand for drive: ${subCommand}\n   Available subcommands: register, unregister (or logout)`;
      }
    }

    case 'config': {
      const user = getDriveUser();
      const configKey = args[1];

      if (configKey === 'Uname') {
        return user?.name ? `Uname: ${user.name}` : '⚠️ [wnpm] Google Drive account is not registered. Run: wnpm drive register';
      } else if (configKey === 'Umail') {
        return user?.email ? `Umail: ${user.email}` : '⚠️ [wnpm] Google Drive account is not registered. Run: wnpm drive register';
      } else {
        return `unknown config key: ${configKey}`;
      }
    }

    case undefined:
    case 'help':
      return 'wnpm: Webit node package manager. Enter the command (for example: wnpm -v or wnpm install <pkg>)';

    default:
      return `unknown command: ${command}`;
  }
}

// Running directly via Node CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  handleWnpmCommand(args).then((output) => console.log(output));
}