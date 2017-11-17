import * as path from 'path';

import { getDirectoryStructure } from '../../src/utils/walker';

test('getDirectoryStructure() actually returns files and folders', async () => {
  const fixturePath = path.join(__dirname, '../fixture/walkable');
  const { files, directories } = await getDirectoryStructure(fixturePath);

  const expectedFiles = [
    path.join(fixturePath, 'testfile'),
    path.join(fixturePath, '@hithere', 'deeper', 'another-file.txt')
  ];

  const expectedDirectories = [
    path.join(fixturePath, '@hithere'),
    path.join(fixturePath, 'a-folder'),
    path.join(fixturePath, '@hithere', 'deeper')
  ];

  expect(files).toEqual(expectedFiles);
  expect(directories).toEqual(expectedDirectories);
});

test('getDirectoryStructure() throws if the folder does not exist', async () => {
  await expect(getDirectoryStructure('nope')).rejects.toEqual(new Error('App directory nope does not exist'));
});
