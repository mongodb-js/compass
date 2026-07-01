import Target from './lib/target';
import { runInfoCommand as generateBuildInfo } from './commands/info';
import { runReleaseCommand as packageCompass } from './commands/release';

export { Target, generateBuildInfo, packageCompass };
