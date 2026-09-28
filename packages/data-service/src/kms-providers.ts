import type { AutoEncryptionOptions } from 'mongodb';

/**
 * Lives in its own module, separate from the instance/driver helpers, so that
 * renderer-side callers (telemetry) can reach it without pulling the driver
 * into their bundle. The `mongodb` dependency here is type-only.
 */
export function configuredKMSProviders(
  autoEncryption?: AutoEncryptionOptions
): (keyof NonNullable<AutoEncryptionOptions['kmsProviders']>)[] {
  const kmsProviders = autoEncryption?.kmsProviders ?? {};
  return Object.entries(kmsProviders)
    .filter(
      ([, kmsOptions]) =>
        Object.values(kmsOptions ?? {}).filter(Boolean).length > 0
    )
    .map(([kmsProviderName]) => kmsProviderName as any);
}
