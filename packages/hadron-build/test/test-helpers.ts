import path from 'path';
import Target from '../src/lib/target';

export function getTarget(argv?: Record<string, any>): Target {
  // <monorepo>/packages/compass
  const dir = path.resolve(__dirname, '..', '..', 'compass');
  return new Target(dir, { distribution: 'compass', ...argv });
}
