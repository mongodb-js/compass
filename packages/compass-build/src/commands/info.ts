import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import _ from 'lodash';
import { flatten } from 'flat';
import jsYaml from 'js-yaml';

import { Target } from '../lib/target';

const serialize = (target: any) => {
  const res = _.omitBy(target, function (value) {
    return _.isFunction(value) || _.isRegExp(value) || _.isUndefined(value);
  });

  return JSON.parse(JSON.stringify(res));
};

export default {
  command: 'info',
  describe: 'Display information about the application',
  builder: {
    dir: {
      type: 'string',
      description: 'Project root directory',
    },
    version: {
      description: 'Target version',
      default: undefined,
      type: 'string',
    },
    platform: {
      description: 'Target platform',
      default: undefined,
      type: 'string',
    },
    arch: {
      description: 'Target arch',
      default: undefined,
      type: 'string',
    },
    out: {
      description: 'Output file path',
      default: undefined,
      type: 'string',
    },
  },

  handler: (
    argv: ArgumentsCamelCase<{
      dir?: string;
      version?: string;
      platform?: string;
      arch?: string;
      out?: string;
    }>
  ) => {
    const target = new Target(argv.dir ?? process.cwd(), {
      version: argv.version,
      platform: argv.platform ?? process.platform,
      arch: argv.arch ?? process.arch,
    });

    const flattened = flatten(serialize(target));
    const yaml = jsYaml.dump(flattened);

    // eslint-disable-next-line no-console
    console.info(yaml);
  },
} as CommandModule;
