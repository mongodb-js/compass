import { SpawnOptions } from 'child_process';
import * as fs from 'graceful-fs';
import * as mockFs from 'mock-fs';
import * as os from 'os';
import * as path from 'path';

import { MSICreator, UIOptions } from '../src/creator';
import { getMockFileSystem, numberOfFiles, root } from './mocks/mock-fs';
import { MockSpawn } from './mocks/mock-spawn';

const mockPassedFs = fs;
const mockSpawnArgs = {
  name: '',
  args: [],
  options: {}
};

beforeAll(() => {
  jest.mock('child_process', () => ({
    execSync(name: string) {
      if (name === 'node -v') {
        return new Buffer('8.0.0');
      }

      if (name === 'light -?' || name === 'candle -?' && mockWixInstalled) {
        return new Buffer(' version 3.11.0.1701');
      }

      throw new Error('Command not found');
    },
    spawn(name: string, args: Array<string>, options: SpawnOptions) {
      mockSpawnArgs.name = name;
      mockSpawnArgs.args = args;
      mockSpawnArgs.options = options;
      return new MockSpawn(name, args, options, mockPassedFs);
    }
  }));

  mockFs(getMockFileSystem());
});

afterAll(() => {
  mockFs.restore();
  jest.unmock('child_process');
});

afterEach(() => {
  mockWixInstalled = true;
  mockSpawnArgs.name = '';
  mockSpawnArgs.args = [];
  mockSpawnArgs.options = {};
});

const defaultOptions = {
  appDirectory: root,
  description: 'ACME is the best company ever',
  exe: 'acme',
  name: 'Acme',
  manufacturer: 'Acme Technologies',
  version: '1.0.0',
  outputDirectory: path.join(os.tmpdir(), 'electron-wix-msi-test')
};

const testIncludes = (title: string, ...content: Array<string>) => {
  return test(`.wxs file includes ${title}`, () => {
    if (Array.isArray(content)) {
      content.forEach((innerContent) => {
        expect(wxsContent.includes(innerContent)).toBeTruthy();
      });
    }
  });
};

let wxsContent = '';
let mockWixInstalled = true;

test('MSICreator() can be constructed without errors', () => {
  expect(new MSICreator(defaultOptions)).toBeTruthy();
});

test('MSICreator create() creates a basic Wix file', async () => {
  const msiCreator = new MSICreator(defaultOptions);

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
});

test('.wxs file has content', () => {
  expect(wxsContent.length).toBeGreaterThan(50);
});

testIncludes('the root element', '<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">');

testIncludes('a package element', '<Package');

testIncludes('an APPLICATIONROOTDIRECTORY', '<Directory Id="APPLICATIONROOTDIRECTORY"');

testIncludes('an ApplicationProgramsFolder', '<Directory Id="ApplicationProgramsFolder"');

testIncludes('a default appUserModelId', 'Key="System.AppUserModel.ID" Value="com.squirrel.Acme.acme"');

test('.wxs file has as many components as we have files', () => {
  // Files + Shortcut
  const count = wxsContent.split('</Component>').length - 1;
  expect(count).toEqual(numberOfFiles + 1);
});

test('MSICreator create() creates Wix file with UI properties', async () => {
  const ui: UIOptions = {
    images: {
      background: 'resources/background.bmp',
      banner: 'resources/banner.bmp',
      exclamationIcon: 'resources/exclamationIcon.bmp',
      infoIcon: 'resources/infoIcon.bmp',
      newIcon: 'resources/newIcon.bmp',
      upIcon: 'resources/upIcon.bmp'
    }
  };

  const msiCreator = new MSICreator({ ...defaultOptions, ui });

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
});

testIncludes('a background definition', 'Id="WixUIDialogBmp" Value="resources/background.bmp" />');

testIncludes('a banner definition', 'Id="WixUIBannerBmp" Value="resources/banner.bmp" />');

testIncludes('a exclamationIcon definition', 'Id="WixUIExclamationIco" Value="resources/exclamationIcon.bmp" />');

testIncludes('a infoIcon definition', 'Id="WixUIInfoIco" Value="resources/infoIcon.bmp" />');

testIncludes('a newIcon definition', 'Id="WixUINewIco" Value="resources/newIcon.bmp" />');

testIncludes('a banupIconner definition', 'Id="WixUIUpIco" Value="resources/upIcon.bmp" />');

test('.wxs file contains as many component refs as components', () => {
  const comoponentCount = wxsContent.split('</Component>').length - 1;
  const refCount = wxsContent.split('<ComponentRef').length - 1;

  expect(comoponentCount).toEqual(refCount);
});

test('MSICreator create() does not throw if properties are weird', async () => {
  const ui: any = {
    images: {
      nope: 'resources/background.bmp'
    }
  };

  const msiCreator = new MSICreator({ ...defaultOptions, ui });

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
});

test('MSICreator create() does not throw if UI is just true', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, ui: true });

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
});

test('MSICreator create() does not throw if UI is just false', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, ui: true });

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
});

test('MSICreator create() does not throw if UI is just an object', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, ui: { chooseDirectory: true } });

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
});

test('MSICreator create() sets the appUserModelId', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, appUserModelId: 'Hi' });

  const { wxsFile } = await msiCreator.create();
  wxsContent = fs.readFileSync(wxsFile, 'utf-8');
  expect(wxsFile).toBeTruthy();
  expect(wxsContent.includes(`Key="System.AppUserModel.ID" Value="Hi"`)).toBeTruthy();
});

test('MSICreator compile() throws if candle/light are not installed', async () => {
  mockWixInstalled = false;
  const msiCreator = new MSICreator(defaultOptions);
  expect(msiCreator.compile()).rejects.toEqual(new Error('Could not find light.exe or candle.exe'));
});

test('MSICreator compile() throws if there is no wxsFile', async () => {
  const msiCreator = new MSICreator(defaultOptions);
  expect(msiCreator.compile()).rejects.toEqual(new Error('wxsFile not found. Did you run create() yet?'));
});

test('MSICreator compile() creates a wixobj and msi file', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, ui: false });
  await msiCreator.create();

  const { wixobjFile, msiFile } = await msiCreator.compile();

  expect(wixobjFile).toBeTruthy();
  expect(fs.existsSync(wixobjFile)).toBeTruthy();

  expect(msiFile).toBeTruthy();
  expect(fs.existsSync(msiFile)).toBeTruthy();
});

test('MSICreator compile() creates a wixobj and msi file with ui extensions', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, ui: true });

  await msiCreator.create();
  await msiCreator.compile();

  expect(mockSpawnArgs.args).toContain('WixUIExtension');
});

test('MSICreator compile() throws if candle or light fail', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, exe: 'fail-code-candle' });
  const err = 'A bit of error';
  const out = 'A bit of data';
  const expectedErr = new Error(`Could not create wixobj file. Code: 1 StdErr: ${err} StdOut: ${out}`);

  await msiCreator.create();
  await expect(msiCreator.compile()).rejects.toEqual(expectedErr);
});

test('MSICreator compile() throws if candle does not create a file', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, exe: 'fail-candle' });
  const err = 'A bit of error';
  const out = 'A bit of data';
  const expectedErr = new Error(`Could not create wixobj file. Code: 0 StdErr: ${err} StdOut: ${out}`);

  await msiCreator.create();
  await expect(msiCreator.compile()).rejects.toEqual(expectedErr);
});

test('MSICreator compile() throws if light does not create a file', async () => {
  const msiCreator = new MSICreator({ ...defaultOptions, exe: 'fail-light' });
  const err = 'A bit of error';
  const out = 'A bit of data';
  const expectedErr = new Error(`Could not create msi file. Code: 0 StdErr: ${err} StdOut: ${out}`);

  await msiCreator.create();
  await expect(msiCreator.compile()).rejects.toEqual(expectedErr);
});

test('MSICreator compile() tries to sign the MSI with default options', async () => {
  const certOptions = { certificateFile: 'path/to/file', certificatePassword: 'hi' };
  const msiCreator = new MSICreator({ ...defaultOptions, ...certOptions });

  await msiCreator.create();
  await msiCreator.compile();

  const expectedCert = path.join(process.cwd(), 'path/to/file');
  const expectedMsi = path.join(defaultOptions.outputDirectory, 'acme.msi');
  const expectedArgs = ['sign', '/a', '/f', `"${expectedCert}"`, '/p', '"hi"', `"${expectedMsi}"`];

  expect(mockSpawnArgs.name.endsWith('signtool.exe')).toBeTruthy();
  expect(mockSpawnArgs.args).toEqual(expectedArgs);
});

test('MSICreator compile() tries to sign the MSI with custom options', async () => {
  const certOptions = { signWithParams: 'hello "how are you"'};
  const msiCreator = new MSICreator({ ...defaultOptions, ...certOptions });

  await msiCreator.create();
  await msiCreator.compile();

  const expectedMsi = path.join(defaultOptions.outputDirectory, 'acme.msi');
  const expectedArgs = ['sign', 'hello', '"how are you"', `"${expectedMsi}"`];

  expect(mockSpawnArgs.name.endsWith('signtool.exe')).toBeTruthy();
  expect(mockSpawnArgs.args).toEqual(expectedArgs);
});


test('MSICreator compile() throws if signing throws', async () => {
  const certOptions = { signWithParams: 'hello "how are you"'};
  const msiCreator = new MSICreator({ ...defaultOptions, exe: 'fail-code-signtool', ...certOptions });
  const expectedErr = new Error(`Signtool exited with code 1. Stderr: A bit of error. Stdout: A bit of data`);

  await msiCreator.create();
  await expect(msiCreator.compile()).rejects.toEqual(expectedErr);
});
