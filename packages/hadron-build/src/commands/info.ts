import _ from 'lodash';
import Target from '../lib/target';
import Table from 'cli-table';
import * as yaml from 'js-yaml';
import { inspect } from 'util';
import { flatten } from 'flatnest';
import fs from 'fs/promises';
import path from 'path';
import type { CommandModule, Argv } from 'yargs';
import type {
  BuilderCallbackParsedArgs,
  ExcludeYargsRequiredArgs,
} from './utils';

type InfoArgv = BuilderCallbackParsedArgs<typeof buildInfoCommandOptions>;
function buildInfoCommandOptions(yargs: Argv) {
  return yargs.options({
    format: {
      choices: ['table', 'yaml', 'json'] as const,
      description: 'What output format would you like?',
      default: 'table' as const,
    },
    flatten: {
      description: 'Flatten the config object into dot notation',
      boolean: true,
      default: false,
    },
    dir: {
      description: 'Project root directory',
      default: process.cwd(),
    },
    version: {
      description: 'Target version',
      type: 'string' as const,
      default: undefined,
    },
    platform: {
      description: 'Target platform',
      type: 'string' as const,
      default: undefined,
    },
    arch: {
      description: 'Target arch',
      type: 'string' as const,
      default: undefined,
    },
    out: {
      description: 'Output file path',
      type: 'string' as const,
      default: undefined,
    },
    print: {
      description: 'Print output to console',
      boolean: true,
      default: true,
    },
  });
}

export function serialize(
  target: Record<string, unknown>
): Record<string, unknown> {
  return _.omitBy(target, function (value) {
    return _.isFunction(value) || _.isRegExp(value) || _.isUndefined(value);
  });
}

function toTable(target: Record<string, unknown>): string {
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

export const runInfoCommand = async (
  argv: ExcludeYargsRequiredArgs<InfoArgv>
): Promise<string> => {
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
    await fs.writeFile(path.resolve(process.cwd(), argv.out), output);
  } else if (argv.print) {
    // eslint-disable-next-line no-console
    console.log(output);
  }
  return output;
};

export const infoCommand: CommandModule<unknown, InfoArgv> = {
  command: 'info',
  describe: 'Display project info.',
  builder: buildInfoCommandOptions,
  handler: async function handler(argv): Promise<void> {
    await runInfoCommand(argv);
  },
};
