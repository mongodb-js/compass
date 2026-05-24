import _ from 'lodash';
import Target from '../lib/target';
import Table from 'cli-table';
import * as yaml from 'js-yaml';
import { inspect } from 'util';
import { flatten } from 'flatnest';
import fs from 'fs';
import path from 'path';

export const command = 'info';

export const describe = 'Display project info.';

export const builder = {
  verbose: {
    describe:
      'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false,
  },
  format: {
    choices: ['table', 'yaml', 'json'],
    description: 'What output format would you like?',
    default: 'table',
  },
  flatten: {
    description: 'Flatten the config object into dot notation',
    type: 'boolean',
    default: false,
  },
  dir: {
    description: 'Project root directory',
    default: process.cwd(),
  },
  version: {
    description: 'Target version',
    default: undefined,
  },
  platform: {
    description: 'Target platform',
    default: undefined,
  },
  arch: {
    description: 'Target arch',
    default: undefined,
  },
  out: {
    description: 'Output file path',
    default: undefined,
  },
};

export function serialize(
  target: Record<string, unknown>
): Record<string, unknown> {
  return _.omitBy(target, function (value) {
    return _.isFunction(value) || _.isRegExp(value) || _.isUndefined(value);
  });
}

export function toTable(target: Record<string, unknown>): string {
  const configTable = new Table({
    head: ['Key', 'Value'],
  });
  _.forIn(target, function (value, key) {
    configTable.push([
      key,
      inspect(value, {
        depth: null,
        colors: true,
      }),
    ]);
  });
  return configTable.toString();
}

interface InfoArgv {
  dir: string;
  version?: string;
  platform?: string;
  arch?: string;
  flatten?: boolean;
  format: 'table' | 'yaml' | 'json';
  out?: string;
}

export const handler = (argv: InfoArgv): void => {
  // TODO: This info is only used for expansions.yml in evergreen.
  // Only write what we need and use a better way to get this done.
  let target: Record<string, unknown> = new Target(argv.dir, {
    version: argv.version,
    platform: argv.platform,
    arch: argv.arch,
  }) as unknown as Record<string, unknown>;

  if (argv.flatten) {
    target = flatten(target);
  }

  let output: string;

  if (argv.format === 'json') {
    output = JSON.stringify(serialize(target), null, 2);
  } else if (argv.format === 'yaml') {
    output = yaml.dump(serialize(target));
  } else {
    output = toTable(serialize(target));
  }

  if (argv.out) {
    fs.writeFileSync(path.resolve(process.cwd(), argv.out), output);
  } else {
    // eslint-disable-next-line no-console
    console.log(output);
  }
};
