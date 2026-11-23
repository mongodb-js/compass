import { expect } from 'chai';
import {
  deserializeFolders,
  mergeImportedFolders,
} from './import-export-folders';

describe('mergeImportedFolders', function () {
  const imported = {
    folders: [
      { id: 'file-work', name: 'Work' },
      { id: 'file-new', name: 'New' },
    ],
    folderAssignments: { c1: 'file-work', c2: 'file-new', c3: 'missing' },
  };

  it('reuses same-name folders, creates the rest, and drops unknown folder references', function () {
    const merged = mergeImportedFolders(
      {
        folders: [{ id: 'local-work', name: 'Work' }],
        assignments: { c0: 'local-work' },
      },
      imported,
      ['c1', 'c2', 'c3']
    );

    const newFolder = merged.folders.find(({ name }) => name === 'New');
    expect(merged.folders).to.have.lengthOf(2);
    expect(newFolder?.id).to.not.equal('file-new');
    expect({ ...merged.assignments }).to.deep.equal({
      c0: 'local-work',
      c1: 'local-work',
      c2: newFolder?.id,
    });
  });

  it('reuses a folder whose name differs only by case', function () {
    const merged = mergeImportedFolders(
      {
        folders: [{ id: 'local-work', name: 'work' }],
        assignments: {},
      },
      imported,
      ['c1']
    );

    expect(merged.folders).to.have.lengthOf(1);
    expect({ ...merged.assignments }).to.deep.equal({ c1: 'local-work' });
  });

  it('clears the local assignment when the file leaves the connection uncategorized', function () {
    const merged = mergeImportedFolders(
      {
        folders: [{ id: 'local-home', name: 'Home' }],
        assignments: { c3: 'local-home' },
      },
      imported,
      ['c3']
    );

    expect({ ...merged.assignments }).to.deep.equal({});
  });

  it('only assigns the imported connections', function () {
    const merged = mergeImportedFolders(
      { folders: [], assignments: {} },
      imported,
      ['c1']
    );
    expect(merged.folders.map(({ name }) => name)).to.deep.equal(['Work']);
    expect(Object.keys(merged.assignments)).to.deep.equal(['c1']);
  });
});

describe('deserializeFolders', function () {
  for (const [name, content] of Object.entries({
    'folders is not an array': { folders: {} },
    'a folder has no name': { folders: [{ id: 'f1' }] },
    'an assignment is not a string': { folderAssignments: { c1: 1 } },
  })) {
    it(`throws when ${name}`, function () {
      expect(() => deserializeFolders(JSON.stringify(content))).to.throw(
        'Input file contains invalid folders'
      );
    });
  }
});
