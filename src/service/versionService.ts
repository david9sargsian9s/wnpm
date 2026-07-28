import { config } from '../config/config';

export function versionService(): void {
    console.log(`wnpm version: ${config.version}`);
}