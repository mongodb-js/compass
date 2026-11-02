import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { expect } from 'chai';
import sinon from 'sinon';
import type { AtlasServiceLike } from '@mongodb-js/compass-user-data';
import type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';
import { createLocalUserDataFetch } from '@mongodb-js/compass-user-data/local';
import {
  type PreferencesSecretsCodec,
  UserDataPreferencesStorage,
} from './preferences-user-data-storage';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import {
  proxyOptionsToProxyPreference,
  proxyPreferenceToProxyOptions,
} from './utils';

const getPreferencesFolder = (tmpDir: string) => {
  return path.join(tmpDir, 'AppPreferences');
};

const getPreferencesFile = (tmpDir: string) => {
  return path.join(getPreferencesFolder(tmpDir), 'General.json');
};

const localStorage = (tmpDir: string, secrets?: PreferencesSecretsCodec) =>
  new UserDataPreferencesStorage(
    { kind: 'local', fetch: createLocalUserDataFetch({ basePath: tmpDir }) },
    { secrets }
  );

describe('UserDataPreferencesStorage with a local environment', function () {
  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'compass-preferences-storage')
    );
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('uses the defaults without storing them on first run', async function () {
    const storage = localStorage(tmpDir);

    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
    expect(storage.loadError).to.equal(undefined);
    const error = await fs
      .access(getPreferencesFile(tmpDir))
      .catch((e: unknown) => e);
    expect(error).to.have.property('code', 'ENOENT');
  });

  it('uses the defaults and reports why when stored preferences are not valid JSON', async function () {
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(getPreferencesFile(tmpDir), '{}}', 'utf-8');
    const storage = localStorage(tmpDir);

    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
    expect(storage.loadError).to.be.instanceOf(SyntaxError);
    expect(await fs.readFile(getPreferencesFile(tmpDir), 'utf8')).to.equal(
      '{}}'
    );
  });

  it('overwrites stored preferences that are not valid JSON on the next change', async function () {
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(getPreferencesFile(tmpDir), '{}}', 'utf-8');
    const storage = localStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ currentUserId: '123456789' });

    expect(storage.loadError).to.equal(undefined);
    expect(
      JSON.parse(await fs.readFile(getPreferencesFile(tmpDir), 'utf8'))
    ).to.include({ currentUserId: '123456789' });
  });

  it('updates preferences', async function () {
    const storage = localStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ currentUserId: '123456789' });

    const newPreferences = storage.getPreferences();

    expect(newPreferences).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: '123456789',
    });
  });

  it('returns default preference values if its not stored on disk', async function () {
    const storage = localStorage(tmpDir);

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
    const storage = localStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ someThingNotSupported: 'abc' } as any);

    const newPreferences = storage.getPreferences();

    expect(newPreferences).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('strips unknown props when reading from disk', async function () {
    const storage = localStorage(tmpDir);

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
    const key = 'asdf'.repeat(8);
    const iv = '0'.repeat(32);
    const storage = localStorage(tmpDir, {
      encrypt: (plainText) =>
        crypto
          .createCipheriv('aes-256-gcm', key, iv)
          .update(plainText)
          .toString('base64'),
      decrypt: (encrypted) =>
        crypto
          .createDecipheriv('aes-256-gcm', key, iv)
          .update(Buffer.from(encrypted, 'base64'))
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

const PREFERENCES_URL = 'https://cloud.mongodb.com/ui/userData/AppPreferences';

const mockResponse = (data: unknown) => ({
  json: () => Promise.resolve(data),
});

describe('UserDataPreferencesStorage with an Atlas environment', function () {
  let sandbox: sinon.SinonSandbox;
  let atlasService: AtlasServiceLike & {
    authenticatedFetch: sinon.SinonStub;
    userScopedUserDataEndpoint: sinon.SinonStub;
  };

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    atlasService = {
      userDataEndpoint: () => PREFERENCES_URL,
      userScopedUserDataEndpoint: sandbox.stub().returns(PREFERENCES_URL),
      authenticatedFetch: sandbox.stub(),
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('loads stored preferences from the user-scoped endpoint on setup', async function () {
    atlasService.authenticatedFetch.resolves(
      mockResponse({ data: JSON.stringify({ currentUserId: 'stored-user' }) })
    );

    const storage = new UserDataPreferencesStorage({
      kind: 'atlas',
      atlasService,
    });
    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: 'stored-user',
    });

    const [url, options] = atlasService.authenticatedFetch.firstCall.args;
    expect(url).to.equal(PREFERENCES_URL);
    expect(options.method).to.equal('GET');
  });

  it('falls back to the defaults when there is no stored document', async function () {
    atlasService.authenticatedFetch.rejects(
      Object.assign(new Error('Not found'), { statusCode: 404 })
    );

    const storage = new UserDataPreferencesStorage({
      kind: 'atlas',
      atlasService,
    });
    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
    expect(storage.loadError).to.equal(undefined);
  });

  it('uses the defaults and reports why when the request fails', async function () {
    atlasService.authenticatedFetch.rejects(new Error('Network down'));

    const storage = new UserDataPreferencesStorage({
      kind: 'atlas',
      atlasService,
    });
    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
    expect(storage.loadError)
      .to.be.instanceOf(Error)
      .with.property('message', 'Network down');
  });

  it('applies environment overrides over the schema/stored values so they stay non-configurable', async function () {
    atlasService.authenticatedFetch.resolves(
      mockResponse({ data: JSON.stringify({ enableImportExport: true }) })
    );

    const storage = new UserDataPreferencesStorage(
      { kind: 'atlas', atlasService },
      { overrides: { enableImportExport: false } }
    );
    await storage.setup();

    expect(storage.getPreferences().enableImportExport).to.equal(false);
  });

  it('persists merged preferences to the user-scoped endpoint and refreshes the cached value', async function () {
    let stored: { currentUserId?: string } = { currentUserId: 'old-user' };
    atlasService.authenticatedFetch.callsFake(
      (_url: string, options?: { method?: string; body?: string }) => {
        if (options?.method === 'PUT') {
          const payload = JSON.parse(options.body ?? '{}') as { data: string };
          stored = JSON.parse(payload.data) as { currentUserId?: string };
          return mockResponse({});
        }
        return mockResponse({ data: JSON.stringify(stored) });
      }
    );

    const storage = new UserDataPreferencesStorage({
      kind: 'atlas',
      atlasService,
    });
    await storage.setup();
    expect(storage.getPreferences().currentUserId).to.equal('old-user');

    await storage.updatePreferences({ currentUserId: 'new-user' });

    expect(stored.currentUserId).to.equal('new-user');
    expect(storage.getPreferences().currentUserId).to.equal('new-user');

    const putCall = atlasService.authenticatedFetch.getCalls().find((call) => {
      const options = call.args[1] as { method?: string } | undefined;
      return options?.method === 'PUT';
    });
    expect(putCall).to.be.ok;
    expect(putCall?.args[0]).to.equal(PREFERENCES_URL);
  });
});
