import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { PersistentStorage } from './preferences-persistent-storage';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import { expect } from 'chai';
import {
  proxyOptionsToProxyPreference,
  proxyPreferenceToProxyOptions,
} from './utils';
import type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';

const getPreferencesFolder = (tmpDir: string) => {
  return path.join(tmpDir, 'AppPreferences');
};

const getPreferencesFile = (tmpDir: string) => {
  return path.join(getPreferencesFolder(tmpDir), 'General.json');
};

describe('PersistentStorage', function () {
  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'compass-preferences-storage')
    );
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('sets up the storage', async function () {
    // When user starts compass first time, it creates AppPreferences folder with
    // General.json to store default preferences.

    const storage = new PersistentStorage(tmpDir);

    const preferencesDir = getPreferencesFolder(tmpDir);
    const preferencesFile = getPreferencesFile(tmpDir);

    expect(async () => await fs.access(preferencesDir)).to.throw();
    expect(async () => await fs.access(preferencesFile)).to.throw();

    await storage.setup();

    expect(async () => await fs.access(preferencesDir)).to.not.throw();
    expect(async () => await fs.access(preferencesFile)).to.not.throw();

    expect(
      JSON.parse(await fs.readFile(preferencesFile, 'utf8'))
    ).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('when invalid json is stored, it sets the defaults', async function () {
    const storage = new PersistentStorage(tmpDir);

    const preferencesFile = getPreferencesFile(tmpDir);
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(preferencesFile, '{}}', 'utf-8');

    // Ensure it exists
    expect(async () => await fs.access(preferencesFile)).to.not.throw();

    await storage.setup();

    expect(
      JSON.parse(await fs.readFile(preferencesFile, 'utf8'))
    ).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('updates preferences', async function () {
    const storage = new PersistentStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ currentUserId: '123456789' });

    const newPreferences = storage.getPreferences();

    expect(newPreferences).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: '123456789',
    });
  });

  it('returns default preference values if its not stored on disk', async function () {
    const storage = new PersistentStorage(tmpDir);

    // manually setup the file with no content
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(getPreferencesFile(tmpDir), JSON.stringify({}), 'utf-8');

    await storage.updatePreferences({
      currentUserId: '123456789',
    });

    expect(storage.getPreferences()).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: '123456789',
    });
  });

  it('does not save random props', async function () {
    const storage = new PersistentStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ someThingNotSupported: 'abc' } as any);

    const newPreferences = storage.getPreferences();

    expect(newPreferences).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('strips unknown props when reading from disk', async function () {
    const storage = new PersistentStorage(tmpDir);

    // manually setup the file with default props and unknown prop
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(
      getPreferencesFile(tmpDir),
      JSON.stringify({
        ...getDefaultsForStoredPreferences(),
        somethingUnknown: true,
      }),
      'utf-8'
    );

    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
  });

  it('encrypts and decrypts sensitive fields', async function () {
    const storage = new PersistentStorage(tmpDir, {
      encryptString: (str: string) =>
        crypto
          .createCipheriv('aes-256-gcm', 'asdf'.repeat(8), '0'.repeat(32))
          .update(str),
      decryptString: (str: Buffer) =>
        crypto
          .createDecipheriv('aes-256-gcm', 'asdf'.repeat(8), '0'.repeat(32))
          .update(str)
          .toString('utf8'),
    });
    await storage.setup();

    const proxyOptions: DevtoolsProxyOptions = {
      proxy: 'socks5://AzureDiamond:hunter2@example.com/',
      sshOptions: {
        identityKeyFile: 'asdf',
        identityKeyPassphrase: 's3cr3t',
      },
    };

    await storage.updatePreferences({
      proxy: proxyOptionsToProxyPreference(proxyOptions),
    });

    const newPreferences = storage.getPreferences();

    expect(proxyPreferenceToProxyOptions(newPreferences.proxy)).to.deep.equal(
      proxyOptions
    );

    const preferencesFile = getPreferencesFile(tmpDir);
    const onDisk = JSON.parse(await fs.readFile(preferencesFile, 'utf8')).proxy;

    // Non-secrets are visible, secrets are not
    expect(onDisk).to.be.a('string');
    expect(onDisk).to.include('AzureDiamond');
    expect(onDisk).to.include('example.com');
    expect(onDisk).to.include('asdf');
    expect(onDisk).not.to.include('hunter2');
    expect(onDisk).not.to.include('s3cr3t');
  });
});
