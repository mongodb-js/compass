import type { ClientType, ClientOptions } from './utils';
import { assertRequiredVars, getSigningClient, debug } from './utils';

export async function sign<T extends ClientType>(
  file: string,
  client: T,
  options: ClientOptions<T> = {}
): Promise<void> {
  assertRequiredVars();
  try {
    const signingClient = await getSigningClient(client, options);
    await signingClient.sign(file);
  } catch (err) {
    debug(err);
  }
}
