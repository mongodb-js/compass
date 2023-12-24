export { LocalSigningClient } from './local-signing-client';
export { RemoteSigningClient } from './remote-signing-client';

export interface SigningClient {
  sign(file: string): Promise<void>;
}
