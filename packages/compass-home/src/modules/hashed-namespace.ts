const HashedNamespace = new Map<string, Promise<string>>();

export async function getHashedNamespace(ns: string): Promise<string> {
  if (HashedNamespace.has(ns)) {
    // We just checked that the property exists
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return HashedNamespace.get(ns)!;
  }
  const hashPromise = (async () => {
    const buffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ns)
    );
    return Array.from(new Uint8Array(buffer), (d) => {
      return d.toString(16).padStart(2, '0');
    }).join('');
  })();
  HashedNamespace.set(ns, hashPromise);
  return hashPromise;
}
