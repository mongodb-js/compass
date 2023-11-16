import { expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import { getMonorepoRoot } from './monorepo';

describe('getMonorepoRoot', function () {
  it('getMonorepoRoot', async function () {
    const root = getMonorepoRoot();
    const packageJson = JSON.parse(
      await fs.readFile(path.resolve(root, 'package.json'), 'utf-8')
    );

    expect(packageJson.name === 'compass-monorepo');
  });
});
