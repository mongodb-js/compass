import path from 'path';
import { promises as fs } from 'fs';
import { EJSON } from 'bson';
import yaml from 'js-yaml';
import type { Options as YargsOptions } from 'yargs-parser';
import yargsParser from 'yargs-parser';
import { kebabCase } from 'lodash';
import type { AmpersandType, AllPreferences } from './preferences';
import { allPreferencesProps } from './preferences';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-PREFERENCES');

function getGlobalConfigPaths(): string[] {
  const paths = [];

  if (process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING) {
    paths.push(process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING);
  }

  switch (process.platform) {
    case 'win32':
      if (process.execPath === process.argv[1]) {
        paths.push(path.resolve(process.execPath, '..', 'mongodb-compass.cfg'));
      }
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
function getCliPropNamesByType(type: AmpersandType<any>): string[] {
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
  const obj = { ...((_obj ?? {}) as Partial<AllPreferences>) };

  for (const [key, value] of Object.entries(obj) as [
    keyof AllPreferences,
    unknown
  ][]) {
    if (!allPreferencesProps[key]) {
      error(`Unknown option "${key}"`);
      delete obj[key];
      continue;
    }
    if (!allPreferencesProps[key][source]) {
      error(`Setting option "${key}" not allowed in this context`);
      delete obj[key];
      continue;
    }
    // `typeof` is good enough for everything we need right now, but we can of course expand this check over time
    if (typeof value !== allPreferencesProps[key].type) {
      error(
        `Type for option "${key}" mismatches: expected ${
          allPreferencesProps[key].type
        }, received ${typeof value}`
      );
      delete obj[key];
      continue;
    }
  }
  return [obj as AllPreferences, errors];
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

export async function parseAndValidateGlobalPreferences(
  sources: GlobalPreferenceSources = {}
): Promise<ParsedGlobalPreferencesResult> {
  const [globalPreferences, file] = await loadGlobalPreferences(
    sources.globalConfigPaths ?? getGlobalConfigPaths()
  );
  let argv = sources.argv;
  if (!argv) {
    // See https://github.com/electron/electron/issues/4690
    const argvStartIndex =
      process.versions.electron && !process.defaultApp ? 1 : 2;
    argv = process.argv.slice(argvStartIndex);
  }
  const cliPreferences = parseCliArgs(argv);
  if (cliPreferences && typeof cliPreferences === 'object') {
    // Remove positional arguments and common Electron/Chromium flags
    // that we want to allow.
    // TODO(COMPASS-6069): We will handle a positional argument later.
    const ignoreFlags = ['_', 'disableGpu', 'sandbox'];
    for (const flag of ignoreFlags) {
      delete (cliPreferences as Record<string, unknown>)[flag];
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
  let line = '';
  const descriptor = allPreferencesProps[key];
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
  for (const path of getGlobalConfigPaths()) {
    text += `  ${path}\n`;
  }
  text += '\nSee the MongoDB Compass documentation for more details.\n';
  return text;
}
