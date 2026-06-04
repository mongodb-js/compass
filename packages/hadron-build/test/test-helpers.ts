import path from 'path';
import Target from '../src/lib/target';

/**
 * Currently when creating a new Target.ts instance, it takes two args: dir and argv.
 * The dir is where it expects to find package.json, and argv can be used to:
 * 1. override package.json values - version
 * 2. define argv values - platform, arch, distribution
 *
 * This helper will create a Target instance for the current platform and architecture
 * using the package.json from the mongodb-compass package. We are using that within
 * tests, so that anything that changes on that side, our tests catch it.
 */

export function getTarget(argv?: Record<string, any>): Target {
  const dir = path.dirname(require.resolve('mongodb-compass/package.json'));
  return new Target(dir, { distribution: 'compass', ...argv });
}
