import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import _ from 'lodash';
import jsYaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';

import { Target } from '../lib/target';

export default {
  command: 'evergreen-expansions',
  describe:
    'Generates evergreen expansions from the configuration used for build tasks',
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

    const expansionKeys = [
      'name',
      'author',
      'packagerOptions.name',
      'appPath',
      'app_archive_name',
      'packagerOptions.name',
      'linux_deb_filename',
      'linux_rpm_filename',
      'linux_tar_filename',
      'osx_dmg_filename',
      'osx_zip_filename',
      'rhel_tar_filename',
      'windows_msi_filename',
      'windows_nupkg_full_filename',
      'windows_releases_filename',
      'windows_setup_filename',
      'windows_zip_filename',
    ];

    const expansions = Object.fromEntries(
      expansionKeys
        .map((key: string) => [key, _.get(target, key)])
        .filter(([, v]) => Boolean(v))
    );

    const yaml = jsYaml.dump(expansions);

    if (argv.out) {
      await fs.writeFile(path.resolve(process.cwd(), argv.out), yaml);
    } else {
      // eslint-disable-next-line no-console
      console.info(yaml);
    }
  },
} as CommandModule;
