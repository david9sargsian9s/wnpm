import process from 'node:process';

export function getTargetDirectory(): string {
  // Download it directly to where you are in the terminal (for example, Desktop)
  return process.cwd();
}