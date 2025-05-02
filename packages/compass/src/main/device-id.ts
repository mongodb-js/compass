import { createHmac } from 'crypto';

/**
 * TODO: This hashing function should eventually be moved to devtools-shared.
 * @returns A hashed, unique identifier for the running device or `"unknown"` if not known.
 */
export async function getDeviceId({
  onError,
}: {
  onError?: (error: Error) => void;
} = {}): Promise<string | 'unknown'> {
  try {
    // Create a hashed format from the all uppercase version of the machine ID
    // to match it exactly with the denisbrodbeck/machineid library that Atlas CLI uses.
    const originalId: string =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      await require('native-machine-id').getMachineId({
        raw: true,
      });

    if (!originalId) {
      return 'unknown';
    }
    const hmac = createHmac('sha256', originalId);

    /** This matches the message used to create the hashes in Atlas CLI */
    const DEVICE_ID_HASH_MESSAGE = 'atlascli';

    hmac.update(DEVICE_ID_HASH_MESSAGE);
    return hmac.digest('hex');
  } catch (error) {
    onError?.(error as Error);
    return 'unknown';
  }
}
