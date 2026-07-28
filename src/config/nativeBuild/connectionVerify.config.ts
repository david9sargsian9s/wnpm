import https from 'node:https';

export function verifyConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('📡 [wnpm] Checking network connection to NPM registry...');
    
    const req = https.get('https://registry.npmjs.org', { timeout: 3000 }, (res) => {
      if (res.statusCode && res.statusCode < 400) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}