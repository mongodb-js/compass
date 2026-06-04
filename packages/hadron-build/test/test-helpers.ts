import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import Target from '../src/lib/target';

const ICON = {
  dev: 'resources/icon.ico',
  beta: 'resources/icon.ico',
  stable: 'resources/icon.ico',
};

/**
 * Currently when creating a new Target.ts instance, it takes two args: dir and argv.
 * The dir is where it expects to find package.json, and argv can be used to:
 * 1. override package.json values - version
 * 2. define argv values - platform, arch, distribution
 *
 * This is the current minimun package.json that's within packages/compass (the most
 * important part is the "config.hadron" section) which is used for building platform
 * specific installers/archives.
 */
export const BASE_PKG = {
  name: 'mongodb-compass',
  version: '0.0.1-dev.0',
  description: 'The MongoDB GUI',
  license: 'SSPL',
  author: {
    name: 'MongoDB Inc',
    email: 'compass@mongodb.com',
  },
  productName: 'MongoDB Compass',
  repository: {
    type: 'git',
    url: 'https://github.com/mongodb-js/compass.git',
  },
  config: {
    hadron: {
      endpoint: 'https://compass.mongodb.com',
      protocols: [
        {
          name: 'MongoDB Protocol',
          schemes: ['mongodb'],
        },
        {
          name: 'MongoDB+SRV Protocol',
          schemes: ['mongodb+srv'],
        },
      ],
      distributions: {
        compass: {
          name: 'mongodb-compass',
          productName: 'MongoDB Compass',
          bundleId: 'com.mongodb.compass',
          'plugins-directory': '.mongodb/compass/plugins',
          upgradeCode: '0152273D-2F9F-4913-B67F-0FCD3557FFD1',
        },
        'compass-readonly': {
          name: 'mongodb-compass-readonly',
          productName: 'MongoDB Compass Readonly',
          bundleId: 'com.mongodb.compass.readonly',
          'plugins-directory': '.mongodb/compass-readonly/plugins',
          upgradeCode: '2176EC1D-EF71-49D4-B3B4-9E15B289D79A',
          readonly: true,
        },
        'compass-isolated': {
          name: 'mongodb-compass-isolated',
          productName: 'MongoDB Compass Isolated Edition',
          bundleId: 'com.mongodb.compass.isolated',
          'plugins-directory': '.mongodb/compass-isolated/plugins',
          upgradeCode: '516F2BE1-4417-4F31-BAA1-364A59404775',
          isolated: true,
        },
      },
      build: {
        win32: {
          icon: ICON,
          favicon_url: 'https://compass.mongodb.com/favicon.ico',
          loading_gif: 'app-icons/win32/mongodb-compass-installer-loading.gif',
          background: 'app-icons/win32/background.jpg',
          banner: 'app-icons/win32/banner.jpg',
        },
        darwin: {
          icon: ICON,
          dmg_background: 'app-icons/darwin/background.png',
          app_category_type: 'public.app-category.productivity',
          extra_plist_options: './scripts/macos-plist-options.xml',
        },
        linux: {
          icon: ICON,
          deb_section: 'Databases',
          rpm_categories: [
            'Office',
            'Database',
            'Building',
            'Debugger',
            'IDE',
            'GUIDesigner',
            'Profiling',
          ],
        },
      },
      asar: {
        unpack: [
          '**/@mongosh/node-runtime-worker-thread/**',
          '**/interruptor/**',
          '**/kerberos/**',
          '**/snappy/**',
          '**/mongodb-client-encryption/index.js',
          '**/mongodb-client-encryption/package.json',
          '**/mongodb-client-encryption/lib/**',
          '**/mongodb-client-encryption/build/**',
          '**/socks/**',
          '**/smart-buffer/**',
          '**/ip/**',
          '**/bl/**',
          '**/nan/**',
          '**/node_modules/bindings/**',
          '**/file-uri-to-path/**',
          '**/bson/**',
          '**/os-dns-native/**',
          '**/debug/**',
          '**/ms/**',
          '**/bindings/**',
          '**/ipv6-normalize/**',
          '**/node-addon-api/**',
          '**/win-export-certificate-and-key/**',
          '**/macos-export-certificate-and-key/**',
          '**/system-ca/**',
          '**/node-forge/**',
          '**/mongo_crypt_v1.*',
        ],
      },
      rebuild: {
        onlyModules: [
          'interruptor',
          'keytar',
          'kerberos',
          'os-dns-native',
          'native-machine-id',
          'win-export-certificate-and-key',
          'macos-export-certificate-and-key',
        ],
      },
      macosEntitlements: './scripts/macos-entitlements.xml',
    },
  },
};

type BasePackageJson = typeof BASE_PKG;

async function createPkgDir(pkg: BasePackageJson = BASE_PKG): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hadron-build-test-'));
  await fs.writeFile(
    path.join(tmpDir, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );
  return tmpDir;
}

export async function getTarget(argv?: Record<string, any>): Promise<Target> {
  const dir = await createPkgDir(BASE_PKG);
  try {
    return new Target(dir, { distribution: 'compass', ...argv });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
