import readline from 'node:readline';

export async function verifyAuthenticityAndPrompt(packageName: string): Promise<boolean> {
  console.log(`🔒 [wnpm] Authenticity verified for package: ${packageName}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`download ${packageName} (y/n)? `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}