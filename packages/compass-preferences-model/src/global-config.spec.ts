import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  parseAndValidateGlobalPreferences,
  getHelpText,
} from './global-config';
import { expect } from 'chai';

describe('Global config file handling', function () {
  let tmpdir: string;
  let i = 0;

  beforeEach(async function () {
    tmpdir = path.join(os.tmpdir(), `global-config-test-${Date.now()}-${i++}`);
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    await fs.rm(tmpdir, { recursive: true });
  });

  it('parses command line options', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--no-enable-maps'],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: { enableMaps: false },
      preferenceParseErrors: [],
    });
  });

  it('parses positional command line options', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--no-enable-maps', 'mongodb://localhost/'],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: { enableMaps: false, positionalArguments: ['mongodb://localhost/'] },
      preferenceParseErrors: [],
    });
  });

  it('ignores startup with --squirrel-firstrun', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--squirrel-firstrun'],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: {},
      preferenceParseErrors: [],
    });
  });

  it('parses global config files (YAML)', async function () {
    const file = path.join(tmpdir, 'config');
    await fs.writeFile(file, 'enableMaps: false\n');
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [file],
      argv: [],
    });
    expect(result).to.deep.equal({
      global: { enableMaps: false },
      cli: {},
      preferenceParseErrors: [],
    });
  });

  it('parses complex global config files (YAML)', async function () {
    const file = path.join(tmpdir, 'config');
    await fs.writeFile(
      file,
      `
forceConnectionOptions:
- readPreference: secondary
- readPreferenceTags: nodeType:ANALYTICS
- readPreferenceTags: nodeType:READ_ONLY`
    );
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [file],
      argv: [],
    });
    expect(result).to.deep.equal({
      global: {
        forceConnectionOptions: [
          ['readPreference', 'secondary'],
          ['readPreferenceTags', 'nodeType:ANALYTICS'],
          ['readPreferenceTags', 'nodeType:READ_ONLY'],
        ],
      },
      cli: {},
      preferenceParseErrors: [],
    });
  });

  it('parses global config files (EJSON)', async function () {
    const file = path.join(tmpdir, 'config');
    await fs.writeFile(file, '{ "enableMaps": false }\n');
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [file],
      argv: [],
    });
    expect(result).to.deep.equal({
      global: { enableMaps: false },
      cli: {},
      preferenceParseErrors: [],
    });
  });

  it('returns an error for an invalid cli option', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--unknown-option'],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: {},
      preferenceParseErrors: [
        'Unknown option "unknownOption" (while validating preferences from: Command line)',
      ],
    });
  });

  it('knows the expected types of cli options', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--enable-maps=true', '--theme'],
    });
    expect(result.cli).to.deep.equal({ enableMaps: true, theme: 'LIGHT' });
  });

  it('knows the expected types of cli options when followed by an extra positional argument', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--showed-network-opt-in', 'about:blank'],
    });
    expect(result.cli).to.deep.equal({
      positionalArguments: ['about:blank'],
      showedNetworkOptIn: true,
    });
  });

  it('ignores CLI options that should be ignored', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: [
        '--no-sandbox',
        '--disable-gpu',
        '--invalid-option',
        '--enable-maps=true',
      ],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: { enableMaps: true },
      preferenceParseErrors: [
        'Unknown option "invalidOption" (while validating preferences from: Command line)',
      ],
    });
  });

  it('returns an error for an invalid global config file option', async function () {
    const file = path.join(tmpdir, 'config');
    await fs.writeFile(file, '{ "unknownOption": false }\n');
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [file],
      argv: [],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: {},
      preferenceParseErrors: [
        `Unknown option "unknownOption" (while validating preferences from: Global config file: ${file})`,
      ],
    });
  });

  it('returns an error for a wrongly typed global config file option', async function () {
    const file = path.join(tmpdir, 'config');
    await fs.writeFile(file, '{ "enableMaps": "maybe" }\n');
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [file],
      argv: [],
    });
    expect(result).to.deep.equal({
      global: {},
      cli: {},
      preferenceParseErrors: [
        `enableMaps: Expected boolean, received string (while validating preferences from: Global config file: ${file})`,
      ],
    });
  });

  it('uses only the contents of the first available config file', async function () {
    const file1 = path.join(tmpdir, 'config1');
    const file2 = path.join(tmpdir, 'config2');
    await fs.writeFile(file1, 'enableMaps: false\n');
    await fs.writeFile(file2, 'networkTraffic: false\n');
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [file1, file2],
      argv: [],
    });
    expect(result).to.deep.equal({
      global: { enableMaps: false },
      cli: {},
      preferenceParseErrors: [],
    });
  });

  it('can provide help text based on the options definitions', function () {
    const helpText = getHelpText();
    expect(helpText).to.include('Available options:');
    expect(helpText).to.match(/--theme \(\*\)\s*Compass UI Theme/);
    expect(helpText).to.match(/--help\s*Show Compass Options/);
    expect(helpText).to.include(
      'Options marked with (*) are also configurable through the global configuration file.'
    );
    expect(helpText).to.include(
      'The following global configuration file paths will be searched:'
    );
    expect(helpText).to.include(
      'See the MongoDB Compass documentation for more details.'
    );
  });

  it('allows empty theme option and defaults to LIGHT', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--theme='],
    });
    expect(result.cli).to.deep.equal({ theme: 'LIGHT' });
  });

  it('allows lowercase theme value', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--theme=dark'],
    });
    expect(result.cli).to.deep.equal({ theme: 'DARK' });
  });

  it('allows empty optional string value', async function () {
    const result = await parseAndValidateGlobalPreferences({
      globalConfigPaths: [],
      argv: ['--username', '--password'],
    });
    expect(result.cli).to.deep.equal({ username: '', password: '' });
  });
});
