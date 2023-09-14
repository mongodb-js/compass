import path from 'path';
import { promises as fs } from 'fs';
import { EJSON } from 'bson';
import yaml from 'js-yaml';
import type { Options as YargsOptions } from 'yargs-parser';
import yargsParser from 'yargs-parser';
import { kebabCase } from 'lodash';
import type { AllPreferences } from './preferences';
import { allPreferencesProps } from './preferences';
import type { z } from '@mongodb-js/compass-user-data';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-PREFERENCES');

function getGlobalConfigPaths(): string[] {
  const paths = [];

  if (process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING) {
    paths.push(process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING);
  }

  switch (process.platform) {
    case 'win32':
      paths.push(
        path.resolve(process.execPath, '..', '..', 'mongodb-compass.cfg')
      );
      break;
    default:
      paths.push('/etc/mongodb-compass.conf');
      break;
  }
  return paths;
}

async function loadGlobalPreferences(
  globalConfigPaths: string[]
): Promise<[config: unknown, file: string]> {
  let file = '';
  let filename = '';
  let config: unknown;

  for (filename of globalConfigPaths) {
    try {
      file = await fs.readFile(filename, 'utf8');
      break;
    } catch (error: any) {
      log[error?.code === 'ENOENT' ? 'info' : 'warn'](
        mongoLogId(1_001_000_153),
        'preferences',
        'Skipping global configuration file due to error',
        {
          filename,
          error: error?.message,
          code: error?.code,
        }
      );
    }
  }

  if (!file) {
    return [{}, '<no global configuration file>'];
  }

  log.info(
    mongoLogId(1_001_000_154),
    'preferences',
    'Loading global configuration file',
    { filename }
  );

  try {
    if (file.trim().startsWith('{')) {
      config = EJSON.parse(file);
    } else {
      config = yaml.load(file);
    }
  } catch (error: any) {
    log.error(
      mongoLogId(1_001_000_155),
      'preferences',
      'Invalid global configuration file',
      {
        filename,
        error: error?.message,
      }
    );
  }

  return [config, filename];
}

const cliProps = Object.entries(allPreferencesProps).filter(
  ([, definition]) => definition.cli
);
type CliPropType = typeof cliProps[number][1]['type'];
function getCliPropNamesByType(type: CliPropType): string[] {
  return [
    ...new Set(
      cliProps
        .filter(([, definition]) => definition.type === type)
        .flatMap(([key]) => [key, kebabCase(key)])
    ),
  ];
}

const yargsOptions: YargsOptions = {
  string: getCliPropNamesByType('string'),
  boolean: getCliPropNamesByType('boolean'),
  number: getCliPropNamesByType('number'),
  configuration: {
    // It's not a numeric option unless we've explicitly said so above
    'parse-positional-numbers': false,
    'parse-numbers': false,
    // We validate options, so we don't want to keep --export-connections if we get --exportConnections
    'strip-dashed': true,
    'camel-case-expansion': true,
  },
};

function parseCliArgs(argv: string[]): unknown {
  const result = yargsParser(argv, yargsOptions);
  log.info(
    mongoLogId(1_001_000_158),
    'preferences',
    'Parsed command line flags',
    {
      options: Object.keys(result),
    }
  );
  if (result._.length > 0) {
    // Pick a nicer name than '_' for usage in the rest of the preferences code.
    result.positionalArguments = result._;
  }
  delete (result as any)._;
  for (const key of Object.keys(result)) {
    // Remove command line flags added by the Windows .exe installer.
    if (key.startsWith('squirrel')) delete (result as any)[key];
  }
  return result;
}

function validatePreferences(
  _obj: unknown,
  source: 'cli' | 'global',
  humanReadableSource: string
): [Partial<AllPreferences>, string[]] {
  const errors: string[] = [];
  const error = (message: string) =>
    errors.push(
      `${message} (while validating preferences from: ${humanReadableSource})`
    );

  if (_obj && typeof _obj !== 'object') {
    error('Invalid preferences structure');
    _obj = {};
  }
  const obj: Partial<AllPreferences> = {};

  for (const [key, rawValue] of Object.entries(_obj ?? {}) as [
    keyof AllPreferences,
    unknown
  ][]) {
    if (!allPreferencesProps[key]) {
      error(`Unknown option "${key}"`);
      continue;
    }
    if (!allPreferencesProps[key][source]) {
      error(`Setting option "${key}" not allowed in this context`);
      continue;
    }
    // Some options need to be brought into the right format in order to be used
    // as an option value, e.g. an object into an array of key-value pairs
    const process = allPreferencesProps[key].customPostProcess;
    const value = process ? process(rawValue, error) : rawValue;

    try {
      obj[key] = allPreferencesProps[key].validator.parse(value) as any;
    } catch (e) {
      // Show the first error
      error(`${key}: ${(e as z.ZodError).errors[0].message}`);
    }
  }
  return [obj, errors];
}

export interface GlobalPreferenceSources {
  argv?: string[];
  globalConfigPaths?: string[];
}

export interface ParsedGlobalPreferencesResult {
  cli: Partial<AllPreferences>;
  global: Partial<AllPreferences>;
  hardcoded?: Partial<AllPreferences>;
  preferenceParseErrors: string[];
}

// See https://github.com/electron/electron/issues/4690
const argvStartIndex = process.versions.electron && !process.defaultApp ? 1 : 2;
export async function parseAndValidateGlobalPreferences(
  sources: GlobalPreferenceSources = {}
): Promise<ParsedGlobalPreferencesResult> {
  const [globalPreferences, file] = await loadGlobalPreferences(
    sources.globalConfigPaths ?? getGlobalConfigPaths()
  );
  let argv = sources.argv;
  if (!argv) {
    argv = process.argv.slice(argvStartIndex);
  }
  const cliPreferences = parseCliArgs(argv);
  if (cliPreferences && typeof cliPreferences === 'object') {
    // Remove common Electron/Chromium/Installer flags that we want to allow.
    const ignoreFlags = /^(disableGpu$|sandbox$|squirrel)/;
    for (const key of Object.keys(cliPreferences)) {
      if (key.match(ignoreFlags)) {
        delete (cliPreferences as Record<string, unknown>)[key];
      }
    }
  }

  const [global, globalErrors] = validatePreferences(
    globalPreferences,
    'global',
    `Global config file: ${file}`
  );
  const [cli, cliErrors] = validatePreferences(
    cliPreferences,
    'cli',
    'Command line'
  );
  const preferenceParseErrors = [...globalErrors, ...cliErrors];

  const globalKeys = Object.keys(global);
  for (const key of Object.keys(cli) as (keyof AllPreferences)[]) {
    if (globalKeys.includes(key) && cli[key] !== global[key]) {
      preferenceParseErrors.push(
        `Cannot override property ${key} that has been set in the global configuration file at ${file}`
      );
      delete cli[key];
    }
  }

  return { global, cli, preferenceParseErrors };
}

function formatSingleOption(
  key: keyof AllPreferences,
  context: 'cli' | 'global'
): string {
  const descriptor = allPreferencesProps[key];
  if (descriptor.omitFromHelp) return '';
  let line = '';

  const addDescription = () => {
    if (!descriptor.description) return;
    line = line.padEnd(45);
    line += descriptor.description.short;
  };

  if (context === 'cli' && descriptor.cli) {
    line += `  --${key}`;
    if (descriptor.global) line += ' (*)';
    addDescription();
    line += '\n';
  }
  if (context === 'global' && descriptor.global && !descriptor.cli) {
    line += `  ${key}`;
    addDescription();
  }
  return line;
}

export function getHelpText(): string {
  let text = 'Available options:\n\n';
  for (const key of Object.keys(
    allPreferencesProps
  ) as (keyof AllPreferences)[]) {
    text += formatSingleOption(key, 'cli');
  }
  text +=
    '\nOptions marked with (*) are also configurable through the global configuration file.\n';
  text +=
    'Boolean options can be negated by using a `--no` prefix, e.g. `--no-networkTraffic`.\n';
  text += '\nOnly available in the global configuration file:\n\n';
  for (const key of Object.keys(
    allPreferencesProps
  ) as (keyof AllPreferences)[]) {
    text += formatSingleOption(key, 'global');
  }
  text +=
    '\nThe following global configuration file paths will be searched:\n\n';
  const globalConfigPaths = getGlobalConfigPaths();
  for (const path of globalConfigPaths) {
    text += `  ${path}\n`;
  }
  if (globalConfigPaths.length > 0) {
    text += '\nIf no global configuration file exists, running Compass as\n';
    text += `  ${escapeShell(process.execPath)}${
      argvStartIndex >= 2 ? ' ' + escapeShell(process.argv[1]) : ''
    } `;
    text += `--show-example-config > ${escapeShell(globalConfigPaths[0])}\n`;
    text += 'can be used to install one.\n';
  }
  text += '\nSee the MongoDB Compass documentation for more details.\n';
  return text;
}

// Naive shell escape function; not usable as a secure general-purpose escaping mechanism.
function escapeShell(str: string): string {
  const quote = process.platform === 'win32' ? '"' : "'";
  return /^[-_a-zA-Z0-9./\\]+$/.test(str) ? str : `${quote}${str}${quote}`;
}

export function getExampleConfigFile(): string {
  return `\
# Compass supports a number of configuration options.
# Run Compass with --help for a full list.

# Set this option to disable outgoing network traffic, other than to the
# database that Compass connects to.
# networkTraffic: false

# Set this option to disable editing or deleting database contents in Compass.
# readOnly: true

# Set this option to provide an upper limit for the timeout of long-running
# database operations in Compass.
# maxTimeMS: 10000

# Set this option to disable running Compass in developer mode.
# Note that enabling any of the options above will already imply this.
# enableDevTools: false

# Specify a set of connection options that cannot be overwritten by the user
# when starting Compass or through the connection form.
# forceConnectionOptions:
# - readPreference: secondary
# - readPreferenceTags: nodeType:ANALYTICS
# - readPreferenceTags: nodeType:READ_ONLY
`;
}
