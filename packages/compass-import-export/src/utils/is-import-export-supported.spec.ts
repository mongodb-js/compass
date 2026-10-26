import { expect } from 'chai';
import { isImportExportSupported } from './is-import-export-supported';

describe('isImportExportSupported', function () {
  afterEach(function () {
    delete (window as any).showSaveFilePicker;
    delete (navigator as any).storage;
  });

  it('return true when the browser can save files and has a private file system', function () {
    (window as any).showSaveFilePicker = () => Promise.resolve();
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { getDirectory: () => Promise.resolve() },
    });

    expect(isImportExportSupported()).to.equal(true);
  });

  it('return false when the browser cannot show a save file picker', function () {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { getDirectory: () => Promise.resolve() },
    });

    expect(isImportExportSupported()).to.equal(false);
  });

  it('return false when the browser has no private file system', function () {
    (window as any).showSaveFilePicker = () => Promise.resolve();

    expect(isImportExportSupported()).to.equal(false);
  });
});
