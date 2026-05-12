import Target from './lib/target';
import path from 'path';

export const getConfig = (argv?: Record<string, unknown>) => {
  const src = path.join(__dirname, '..', 'test', 'fixtures', 'hadron-app');
  process.env.HADRON_DISTRIBUTION = 'compass';
  return new Target(src, argv);
};
