import { expect } from 'chai';
import { overrideProperty } from '../../test/override-property';
import { isImportExportSupported } from './is-import-export-supported';

describe('isImportExportSupported', function () {
  const showSaveFilePicker = () => Promise.resolve();
  const storage = { getDirectory: () => Promise.resolve() };
  let restores: (() => void)[];

  beforeEach(function () {
    restores = [];
  });

  afterEach(function () {
    for (const restore of restores.reverse()) {
      restore();
    }
  });

  it('return true when the browser can save files and has a private file system', function () {
    restores.push(
      overrideProperty(window, 'showSaveFilePicker', showSaveFilePicker),
      overrideProperty(navigator, 'storage', storage)
    );

    expect(isImportExportSupported()).to.equal(true);
  });

  it('return false when the browser cannot show a save file picker', function () {
    restores.push(
      overrideProperty(window, 'showSaveFilePicker', undefined),
      overrideProperty(navigator, 'storage', storage)
    );

    expect(isImportExportSupported()).to.equal(false);
  });

  it('return false when the browser has no private file system', function () {
    restores.push(
      overrideProperty(window, 'showSaveFilePicker', showSaveFilePicker),
      overrideProperty(navigator, 'storage', undefined)
    );

    expect(isImportExportSupported()).to.equal(false);
  });
});
