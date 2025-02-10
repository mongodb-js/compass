import assert from 'node:assert/strict';
import cp from 'node:child_process';

/**
 * Call apt to get the package name
 */
export function getPackageName(filepath: string) {
  const result = cp.spawnSync('apt', ['show', filepath], { encoding: 'utf8' });
  assert.equal(
    result.status,
    0,
    `Expected a clean exit, got status ${result.status || 'null'}`
  );
  const packageMatch = result.stdout.match(/Package: (?<name>.+)/);
  assert(packageMatch, 'Expected a line in the output with the package name');
  assert(packageMatch.groups);
  const { name } = packageMatch.groups;
  assert(typeof name === 'string');
  return name;
}
