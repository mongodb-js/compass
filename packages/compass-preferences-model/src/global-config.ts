import path from 'path';
import { promises as fs } from 'fs';
import { EJSON } from 'bson';
import yaml from 'js-yaml';
import type { Options as YargsOptions } from 'yargs-parser';
import yargsParser from 'yargs-parser';
import type { AmpersandType, GlobalPreferences } from './preferences';
import { allPreferencesProps } from './preferences';

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
    } catch (error) {
      // TODO
    }
  }

  if (!file) {
    return [{}, '<no global configuration file>'];
  }

  try {
    if (file.trim().startsWith('{')) {
      config = EJSON.parse(file);
    } else {
      config = yaml.load(file);
    }
  } catch (error) {
    // TODO
  }

  return [config, filename];
}

const cliProps = Object.entries(allPreferencesProps).filter(
  ([, definition]) => definition.cli
);
function getCliPropNamesByType(type: AmpersandType<any>): string[] {
  return cliProps
    .filter(([, definition]) => definition.type === type)
    .map(([key]) => key);
}

const yargsOptions: YargsOptions = {
  string: [...getCliPropNamesByType('string')],
  boolean: [...getCliPropNamesByType('boolean')],
  number: [...getCliPropNamesByType('number')],
  configuration: {
    // It's not a numeric option unless we've explicitly said so above
    'parse-positional-numbers': false,
    'parse-numbers': false,
    // We validate options, so we don't want to keep --export-connections if we get --exportConnections
    'strip-dashed': true,
  },
};

function parseCliArgs(argv: string[]): unknown {
  return yargsParser(argv, yargsOptions);
}

function validatePreferences(
  _obj: unknown,
  source: 'cli' | 'global',
  humanReadableSource: string
): [Partial<GlobalPreferences>, string[]] {
  const errors: string[] = [];
  const error = (message: string) =>
    errors.push(
      `${message} (while validating preferences from: ${humanReadableSource})`
    );

  if (_obj && typeof _obj !== 'object') {
    error('Invalid preferences structure');
    _obj = {};
  }
  const obj = { ...((_obj ?? {}) as Partial<GlobalPreferences>) };

  for (const [key, value] of Object.entries(obj) as [
    keyof GlobalPreferences,
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
  return [obj as GlobalPreferences, errors];
}

export interface GlobalPreferenceSources {
  argv?: string[];
  globalConfigPaths?: string[];
}

export interface ParsedGlobalPreferencesResult {
  cli: Partial<GlobalPreferences>;
  global: Partial<GlobalPreferences>;
  preferenceParseErrors: string[];
}

export async function parseAndValidateGlobalPreferences(
  sources: GlobalPreferenceSources = {}
): Promise<ParsedGlobalPreferencesResult> {
  const [globalPreferences, file] = await loadGlobalPreferences(
    sources.globalConfigPaths ?? getGlobalConfigPaths()
  );
  const cliPreferences = parseCliArgs(sources.argv ?? process.argv.slice(2));
  // TODO(COMPASS-6069): We will handle a positional argument later.
  if (cliPreferences && typeof cliPreferences === 'object') {
    delete (cliPreferences as Record<string, unknown>)._;
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
  for (const key of Object.keys(cli) as (keyof GlobalPreferences)[]) {
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
  key: keyof GlobalPreferences,
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
  ) as (keyof GlobalPreferences)[]) {
    text += formatSingleOption(key, 'cli');
  }
  text +=
    '\n(Options marked with (*) are also configurable through the global configuration file.)\n';
  text += '\nOnly available in the global configuration file:\n\n';
  for (const key of Object.keys(
    allPreferencesProps
  ) as (keyof GlobalPreferences)[]) {
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
