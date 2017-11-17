import * as path from 'path';
import * as fs from 'fs-extra';

import { replaceInString, replaceToFile } from '../../src/utils/replace';

test('replaceInString() actually replaces in a string', () => {
  const input = '{{Test}} {{Test2}} {{Test}}';
  const replacements = {
    '{{Test}}': 'Water',
    '{{Test2}}': 'Fire'
  }
  const expected = 'Water Fire Water';

  expect(replaceInString(input, replacements)).toEqual(expected);
});

test('replaceToFile() actually replaces and writes to file', async () => {
  const input = '{{Test}} {{Test2}} {{Test}}';
  const replacements = {
    '{{Test}}': 'Water',
    '{{Test2}}': 'Fire'
  }
  const expected = 'Water Fire Water';
  const testFile = path.join(__dirname, '__testfile');

  await replaceToFile(input, testFile, replacements);

  expect(await fs.readFile(testFile, 'utf-8')).toEqual(expected);
  await fs.unlink(testFile);
});
