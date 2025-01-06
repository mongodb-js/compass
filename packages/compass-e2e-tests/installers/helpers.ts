import { spawn } from 'child_process';
import type { SpawnOptions } from 'child_process';

export function execute(
  command: string,
  args: string[],
  options?: SpawnOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(command, ...args);
    const p = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    p.on('error', (err: any) => {
      reject(err);
    });
    p.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
      if (code !== null) {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`${command} ${args.join(' ')} exited with code ${code}`)
          );
        }
      } else {
        if (signal !== null) {
          reject(
            new Error(
              `${command} ${args.join(' ')} exited with signal ${signal}`
            )
          );
        } else {
          // shouldn't happen
          reject(
            new Error(
              `${command} ${args.join(' ')} exited with no code or signal`
            )
          );
        }
      }
    });
  });
}
