import cp from 'node:child_process';

type RegistryEntry = {
  key: string;
  type: string;
  value: string;
};

function isRegistryEntry(value: unknown): value is RegistryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    typeof value.key === 'string' &&
    'type' in value &&
    typeof value.type === 'string' &&
    'value' in value &&
    typeof value.value === 'string'
  );
}

/**
 * Parse the putput of a "reg query" call.
 */
function parseQueryRegistryOutput(output: string): RegistryEntry[] {
  const result = output.matchAll(
    /^\s*(?<key>\w+) +(?<type>\w+) *(?<value>.*)$/gm
  );
  return [...result].map(({ groups }) => groups).filter(isRegistryEntry);
}

/**
 * Query the Windows registry by key.
 */
export function query(key: string) {
  const result = cp.spawnSync('reg', ['query', key], { encoding: 'utf8' });
  if (result.status === 0) {
    const entries = parseQueryRegistryOutput(result.stdout);
    return Object.fromEntries(entries.map(({ key, value }) => [key, value]));
  } else if (
    result.status === 1 &&
    result.stderr.trim() ===
      'ERROR: The system was unable to find the specified registry key or value.'
  ) {
    return null;
  } else {
    throw Error(
      `Expected either an entry or status code 1, got status ${
        result.status ?? '?'
      }: ${result.stderr}`
    );
  }
}
