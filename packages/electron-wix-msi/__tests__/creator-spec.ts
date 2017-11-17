import { Component } from '../src/interfaces';
import { Component } from '../lib/interfaces';
import * as fs from 'graceful-fs';
import * as mockFs from 'mock-fs';
import * as path from 'path';
import * as os from 'os';

import { getMockFileSystem, root, numberOfFiles } from './fixture/mock-fs';
import { MSICreator } from '../src/creator';

beforeAll(() => {
  mockFs(getMockFileSystem());
});

afterAll(() => {
  mockFs.restore();
});

test('MSICreator() can be constructed without errors', () => {
  const msiCreator = new MSICreator({
    appDirectory: root,
    description: 'ACME is the best company ever',
    exe: 'acme',
    name: 'Acme',
    manufacturer: 'Acme Technologies',
    version: '1.0.0',
    outputDirectory: path.join(os.tmpdir(), 'electron-wix-msi-test')
  });

  expect(msiCreator).toBeTruthy();
});

let wxsContent = '';
const testIncludes = (title: string, ...content: Array<string>) => {
  return test(`.wxs file includes ${title}`, () => {
    if (Array.isArray(content)) {
      content.forEach((innerContent) => {
        expect(wxsContent.includes(innerContent)).toBeTruthy();
      });
    }
  });
}

test('MSICreator create() creates a basic Wix file', async () => {
  const msiCreator = new MSICreator({
    appDirectory: root,
    description: 'ACME is the best company ever',
    exe: 'acme',
    name: 'Acme',
    manufacturer: 'Acme Technologies',
    version: '1.0.0',
    outputDirectory: path.join(os.tmpdir(), 'electron-wix-msi-test')
  });

  const { wxs } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxs, 'utf-8');
  expect(wxs).toBeTruthy();
});

test('.wxs file has content', () => {
  expect(wxsContent.length).toBeGreaterThan(50);
});

testIncludes('the root element', '<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">');

testIncludes('a package element', '<Package');

testIncludes('an APPLICATIONROOTDIRECTORY', '<Directory Id="APPLICATIONROOTDIRECTORY"');

testIncludes('an ApplicationProgramsFolder', '<Directory Id="ApplicationProgramsFolder"')

test('.wxs file has as many components as we have files', () => {
  // Files + Shortcut
  const count = wxsContent.split('</Component>').length - 1;
  expect(count).toEqual(numberOfFiles + 1);
});

test('.wxs file contains as many component refs as components', () => {
  const comoponentCount = wxsContent.split('</Component>').length - 1;
  const refCount = wxsContent.split('<ComponentRef').length - 1;

  expect(comoponentCount).toEqual(refCount);
});
