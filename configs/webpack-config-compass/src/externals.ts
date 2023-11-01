import { execSync } from 'child_process';

export const sharedExternals: string[] = [
  // Electron should always stay external. For electron webpack target this
  // happens automatically, for other targets we should never try to bundle it
  'electron',
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
  // MongoDB Node.js Driver stuff that is optional, but fails webpack builds
  // with "missing dependency" if not installed due to how driver imports those
  'bson-ext',
  'snappy',
  'snappy/package.json',
  // Only used by compass-shell, but in theory should stay external everywhere
  '@mongosh/node-runtime-worker-thread',
];

const monorepoWorkspaces = (
  JSON.parse(
    execSync('npx lerna list --all --json', {
      encoding: 'utf-8',

      stdio: ['ignore', 'pipe', 'ignore'],
    })
  ) as { name: string; location: string }[]
).map((ws) => ws.name);

export const pluginExternals: string[] = [
  // All monorepo dependencies should be externalized
  ...monorepoWorkspaces,
  // React needs to always stay external to avoid the chance of having multiple
  // react runtimes in one context
  'react',
  // Arbitrary external dependencies that would make sense to keep out of the
  // plugin bundles, feel free to update this as needed
  '@mongodb-js/mongodb-constants',
  'bson',
];
