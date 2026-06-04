import path from 'path';
import Target from '../src/lib/target';

// <monorepo>/packages/compass
const ROOT_DIR = path.resolve(__dirname, '..', '..', 'compass');

export function resolvePath(...args: string[]) {
  return path.resolve(ROOT_DIR, ...args);
}

export function getTarget(argv?: Record<string, any>): Target {
  return new Target(ROOT_DIR, { distribution: 'compass', ...argv });
}
