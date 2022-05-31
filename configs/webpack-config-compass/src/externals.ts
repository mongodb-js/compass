export const sharedExternals: string[] = [
  // Native Modules are very hard to bundle correctly with Webpack (and there is
  // not much reason to do so) so to make our lives easier, we will always
  // externalize them from the bulid
  // TODO: It would be nice to automate that so we don't need to maintain this
  // list ourselves
  'keytar',
  'kerberos',
  'interruptor',
  'os-dns-native',
  'system-ca',
  'win-export-certificate-and-key',
  'macos-export-certificate-and-key',
  'mongodb-client-encryption',
  // We externalize react as we want to avoid multiple instances of it.
  'react',
  // MongoDB Node.js Driver stuff that is optional, but fails webpack builds
  // with "missing dependency" if not installed due to how driver imports those
  'bson-ext',
  'snappy',
  'snappy/package.json',
];
