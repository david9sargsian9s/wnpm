import readline from 'node:readline';
import { getDriveUser } from './driveAuth.config';

export async function askCloudStoragePrompt(): Promise<boolean> {
  const user = getDriveUser();
  
  // If the user is not registered in Drive, skip the questions.
  if (!user) {
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('☁️  [wnpm] Do you want to install packages on cloud storage? (yes/no)? ', (answer) => {
      rl.close();
      const formatted = answer.trim().toLowerCase();
      resolve(formatted === 'yes' || formatted === 'y');
    });
  });
}