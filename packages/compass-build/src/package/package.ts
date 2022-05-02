import { compile } from './compile';
import { preparePackagerSrc } from './prepare';
import { packageDarwin } from './platforms/darwin';

import { readConfig } from '../config/product-config';
import type { PackageOptions } from './package-options';
import { packageLinux } from './platforms/linux';

export async function packageCompass(options: PackageOptions): Promise<void> {
  console.log({ options });
  const config = await readConfig(options.paths.src, options);

  if (options.compile) {
    await compile(options.paths.src, {
      version: productConfig.version,
      channel: productConfig.channel,
      distribution: options.distribution,
      name: productConfig.packageName,
      productName: productConfig.productName,
      autoUpdateEndpoint: productConfig.autoUpdateEndpoint,
    });
  }

  if (options.prepare) {
    await preparePackagerSrc(options, config);
  }

  if (options.platform === 'darwin') {
    await packageDarwin(options, config);
  } else if (options.platform === 'win32') {
    // await packageWin32(options, config);
  } else if (options.platform === 'linux') {
    await packageLinux(options, config);
  } else {
    throw new Error(`Unknown platform '${options.platform as string}'`);
  }
}
