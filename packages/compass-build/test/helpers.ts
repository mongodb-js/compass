import type { TargetOptions } from '../src/lib/target';
import { Target } from '../src/lib/target';
import path from 'path';

export const getTestTarget = (targetOptions?: TargetOptions): Target => {
  const src = path.join(__dirname, 'fixtures', 'app');
  return new Target(src, targetOptions);
};
