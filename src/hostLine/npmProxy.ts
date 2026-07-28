import { spawn } from "child_process";

export function runNativeNpm(args: string[]): void {
    console.log('🔗 [hostLine] Calling native npm...');

    // On Windows, you need to call npm.cmd; on Linux/macOS, call npm.
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const child = spawn(npmCmd, args, {
      stdio: 'inherit', // Redirect stdin/stdout/stderr directly to the user's terminal
      shell: false
    });

    child.on('error', (err) => {
      console.error('Error running native npm:', err.message);
    });

    child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ [wnpm] Native npm completed successfully.');
    } else {
      console.error(`❌ [wnpm] npm exited with code: ${code}`);
    }
  });
}