import { debug } from '../utils';
import type { SigningClient } from '.';

export class LocalSigningClient implements SigningClient {
  constructor(private rootDir: string) {}

  async sign(file: string): Promise<void> {
    debug('Signing file', file);
    debug('Skipping signing locally');
    await Promise.resolve();
    return;
  }
}
