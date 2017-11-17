import * as path from 'path';
import * as os from 'os';

import { MSICreator } from '../src/creator';

test('MSICreator() can be constructed without errors', () => {
  const msiCreator = new MSICreator({
    appDirectory: path.join(__dirname, './fixture/walkable'),
    description: 'ACME is the best company ever',
    exe: 'acme',
    name: 'Acme',
    manufacturer: 'Acme Technologies',
    version: '1.0.0',
    outputDirectory: path.join(os.tmpdir(), 'electron-wix-msi-test')
  });

  expect(msiCreator).toBeTruthy();
});
