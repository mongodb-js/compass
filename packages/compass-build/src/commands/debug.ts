import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { promises as fs } from 'fs';
import path from 'path';

import { Target } from '../lib/target';

export default {
  command: 'debug',
  describe:
    'Print debug information about the configuration used for build tasks',
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

  handler: async (
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

    const json = JSON.stringify(target, null, 2);

    if (argv.out) {
      await fs.writeFile(path.resolve(process.cwd(), argv.out), json);
    } else {
      // eslint-disable-next-line no-console
      console.info(json);
    }
  },
} as CommandModule;
