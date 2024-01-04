import { debug } from '../utils';
import type { SigningClient, SigningClientOptions } from '.';

export class LocalSigningClient implements SigningClient {
  constructor(private options: SigningClientOptions) {}
  async sign(file: string): Promise<void> {
    debug('Signing file', file);
    debug('Skipping signing for local. Just copying file back and forth.');
    return Promise.resolve();
  }
}
