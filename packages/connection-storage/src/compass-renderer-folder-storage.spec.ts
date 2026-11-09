import { expect } from 'chai';
import Sinon from 'sinon';

import { CompassRendererFolderStorage } from './compass-renderer-folder-storage';
import type { FolderOrganization } from './folder-storage';

// The renderer store is a thin IPC wrapper, and the channel and method names
// it uses have to match what the main process registers. These tests pin both
// down so a rename on one side cannot silently break the other.
function createFakeIpcRenderer() {
  const invoke = {
    load: Sinon.stub().resolves({ folders: [], assignments: {} }),
    save: Sinon.stub().resolves(),
  };
  const createInvoke = Sinon.stub().returns(invoke);
  return { createInvoke, invoke };
}

describe('CompassRendererFolderStorage', function () {
  afterEach(function () {
    Sinon.restore();
  });

  it('should invoke the FolderStorage channel', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);

    await storage.load();

    Sinon.assert.calledWithExactly(createInvoke, 'FolderStorage', [
      'load',
      'save',
    ]);
    Sinon.assert.calledOnce(invoke.load);
  });

  it('should forward the folder organization to save', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);
    const folderOrganization: FolderOrganization = {
      folders: [],
      assignments: {},
    };

    await storage.save({ folderOrganization });

    Sinon.assert.calledWithExactly(invoke.save, { folderOrganization });
  });

  it('should only create the IPC proxy once', async function () {
    const { createInvoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);

    await storage.load();
    await storage.load();

    Sinon.assert.calledOnce(createInvoke);
  });

  it('should throw if there is no ipcRenderer', function () {
    const storage = new CompassRendererFolderStorage();
    expect(() => storage.load()).to.throw('IPC not available');
  });
});
