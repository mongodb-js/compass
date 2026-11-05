import { expect } from 'chai';
import Sinon from 'sinon';

import {
  CompassRendererFolderStorage,
  CompassRendererFolderAssignmentStorage,
} from './compass-renderer-folder-storage';

// The renderer stores are thin IPC wrappers, and the channel and method names
// they use have to match what the main process registers. These tests pin both
// down so a rename on one side cannot silently break the other.
function createFakeIpcRenderer() {
  const invoke = {
    loadAll: Sinon.stub().resolves([]),
    save: Sinon.stub().resolves(),
    delete: Sinon.stub().resolves(),
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

    await storage.loadAll();

    Sinon.assert.calledWithExactly(createInvoke, 'FolderStorage', [
      'loadAll',
      'save',
      'delete',
    ]);
    Sinon.assert.calledOnce(invoke.loadAll);
  });

  it('should forward loadAll options', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);
    const options = { signal: new AbortController().signal };

    await storage.loadAll(options);

    Sinon.assert.calledWithExactly(invoke.loadAll, options);
  });

  it('should forward a folder to save', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);
    const folder = { id: 'a-folder-id', name: 'Production' };

    await storage.save({ folder });

    Sinon.assert.calledWithExactly(invoke.save, { folder });
  });

  it('should forward an id to delete', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);

    await storage.delete({ id: 'a-folder-id' });

    Sinon.assert.calledWithExactly(invoke.delete, { id: 'a-folder-id' });
  });

  it('should only create the IPC proxy once', async function () {
    const { createInvoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderStorage({ createInvoke } as never);

    await storage.loadAll();
    await storage.loadAll();

    Sinon.assert.calledOnce(createInvoke);
  });

  it('should throw if there is no ipcRenderer', function () {
    const storage = new CompassRendererFolderStorage();
    expect(() => storage.loadAll()).to.throw('IPC not available');
  });
});

describe('CompassRendererFolderAssignmentStorage', function () {
  afterEach(function () {
    Sinon.restore();
  });

  it('should invoke the FolderAssignmentStorage channel', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderAssignmentStorage({
      createInvoke,
    } as never);

    await storage.loadAll();

    Sinon.assert.calledWithExactly(createInvoke, 'FolderAssignmentStorage', [
      'loadAll',
      'save',
      'delete',
    ]);
    Sinon.assert.calledOnce(invoke.loadAll);
  });

  it('should forward an assignment to save', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderAssignmentStorage({
      createInvoke,
    } as never);
    const assignment = {
      itemType: 'connection',
      itemId: 'a-connection-id',
      folderId: 'a-folder-id',
    } as const;

    await storage.save({ assignment });

    Sinon.assert.calledWithExactly(invoke.save, { assignment });
  });

  it('should forward the item to delete', async function () {
    const { createInvoke, invoke } = createFakeIpcRenderer();
    const storage = new CompassRendererFolderAssignmentStorage({
      createInvoke,
    } as never);

    await storage.delete({
      itemType: 'connection',
      itemId: 'a-connection-id',
    });

    Sinon.assert.calledWithExactly(invoke.delete, {
      itemType: 'connection',
      itemId: 'a-connection-id',
    });
  });

  it('should throw if there is no ipcRenderer', function () {
    const storage = new CompassRendererFolderAssignmentStorage();
    expect(() => storage.loadAll()).to.throw('IPC not available');
  });
});
