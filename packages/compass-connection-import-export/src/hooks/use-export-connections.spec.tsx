import { expect } from 'chai';
import sinon from 'sinon';
import { useExportConnections } from './use-export-connections';
import type { ImportExportResult } from './common';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import type { RenderConnectionsOptions } from '@mongodb-js/compass-connections/test';
import {
  renderHookWithConnections,
  act,
  cleanup,
  createDefaultConnectionInfo,
  waitFor,
} from '@mongodb-js/compass-connections/test';

describe('useExportConnections', function () {
  let sandbox: sinon.SinonSandbox;
  let finish: sinon.SinonStub;
  let finishedPromise: Promise<ImportExportResult>;
  let tmpdir: string;

  function renderUseExportConnectionsHook(
    props?: Partial<Parameters<typeof useExportConnections>[0]>,
    options?: RenderConnectionsOptions
  ) {
    return renderHookWithConnections(() => {
      return useExportConnections({
        finish,
        open: true,
        trackingProps: { context: 'Tests' },
        ...props,
      });
    }, options);
  }

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    finishedPromise = new Promise<ImportExportResult>((resolve) => {
      finish = sandbox.stub().callsFake(resolve);
    });
    tmpdir = path.join(
      os.tmpdir(),
      `compass-export-connections-ui-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    cleanup();
    sandbox.restore();
    await fs.rm(tmpdir, { recursive: true });
  });

  // Security-relevant test -- description is in the protect-connection-strings e2e test.
  it('sets removeSecrets if protectConnectionStrings is set', function () {
    const { result } = renderUseExportConnectionsHook();

    expect(result.current.state.removeSecrets).to.equal(false);
    act(() => {
      result.current.onChangeRemoveSecrets({
        target: { checked: true },
      } as any);
    });
    expect(result.current.state.removeSecrets).to.equal(true);
    cleanup();

    const { result: resultInProtectedMode } = renderUseExportConnectionsHook(
      {},
      { preferences: { protectConnectionStrings: true } }
    );

    expect(resultInProtectedMode.current.state.removeSecrets).to.equal(true);
    act(() => {
      resultInProtectedMode.current.onChangeRemoveSecrets({
        target: { checked: false },
      } as any);
    });
    expect(resultInProtectedMode.current.state.removeSecrets).to.equal(true);
  });

  it('responds to changes in the connectionList', async function () {
    const connectionInfo1 = createDefaultConnectionInfo();
    const connectionInfo2 = createDefaultConnectionInfo();

    const { result, connectionsStore, connectionStorage } =
      renderUseExportConnectionsHook({}, { connections: [connectionInfo1] });

    await act(async () => {
      await connectionsStore.actions.saveEditedConnection({
        ...connectionInfo1,
        favorite: {
          name: 'name1',
        },
        savedConnectionType: 'favorite',
      });
    });

    expect(result.current.state.connectionList).to.deep.equal(
      [
        {
          id: connectionInfo1.id,
          name: 'name1',
          selected: true,
        },
      ],
      'expected name of connection 1 to get updated after save'
    );

    act(() => {
      result.current.onChangeConnectionList([
        { id: connectionInfo1.id, name: 'name1', selected: false },
      ]);
    });

    expect(result.current.state.connectionList).to.deep.equal(
      [{ id: connectionInfo1.id, name: 'name1', selected: false }],
      'expected selected status of connection 1 to change'
    );

    await act(async () => {
      await connectionStorage.save?.({
        connectionInfo: {
          ...connectionInfo2,
          favorite: {
            name: 'name2',
          },
          savedConnectionType: 'favorite',
        },
      });
      await connectionsStore.actions.refreshConnections();
    });

    expect(result.current.state.connectionList).to.deep.equal([
      { id: connectionInfo1.id, name: 'name1', selected: false },
      { id: connectionInfo2.id, name: 'name2', selected: true },
    ]);
  });

  it('updates filename if changed', function () {
    const { result } = renderUseExportConnectionsHook();

    act(() => {
      result.current.onChangeFilename('filename1234');
    });
    expect(result.current.state.filename).to.equal('filename1234');
  });

  it('handles actual export', async function () {
    const { result, connectionStorage } = renderUseExportConnectionsHook(
      {},
      {
        connections: [
          {
            id: 'id1',
            connectionOptions: {
              connectionString: 'mongodb://localhost:2020',
            },
            savedConnectionType: 'favorite',
            favorite: {
              name: 'name1',
            },
          },
          {
            id: 'id2',
            connectionOptions: {
              connectionString: 'mongodb://localhost:2021',
            },
            savedConnectionType: 'favorite',
            favorite: {
              name: 'name1',
            },
          },
        ],
      }
    );

    act(() => {
      result.current.onChangeConnectionList([
        { id: 'id1', name: 'name1', selected: false },
        { id: 'id2', name: 'name2', selected: true },
      ]);
    });

    const filename = path.join(tmpdir, 'connections.json');
    const fileContents = '{"connections":[1,2,3]}';
    const exportConnectionStub = sandbox
      .stub(connectionStorage, 'exportConnections')
      .resolves(fileContents);

    act(() => {
      result.current.onChangeFilename(filename);
      result.current.onChangePassphrase('s3cr3t');
    });

    act(() => {
      result.current.onSubmit();
    });

    expect(await finishedPromise).to.equal('succeeded');
    expect(await fs.readFile(filename, 'utf8')).to.equal(fileContents);
    expect(exportConnectionStub).to.have.been.calledOnce;
    const arg = exportConnectionStub.firstCall.firstArg;
    expect(arg?.options?.passphrase).to.equal('s3cr3t');
    expect(arg?.options?.filterConnectionIds).to.deep.equal(['id2']);
    expect(arg?.options?.trackingProps).to.deep.equal({ context: 'Tests' });
    expect(arg?.options?.removeSecrets).to.equal(false);
  });

  it('resets errors if filename changes', async function () {
    const { result, connectionStorage } = renderUseExportConnectionsHook();

    const filename = path.join(tmpdir, 'nonexistent', 'connections.json');
    const exportConnectionsStub = sandbox
      .stub(connectionStorage, 'exportConnections')
      .resolves('');

    act(() => {
      result.current.onChangeFilename(filename);
    });

    expect(result.current.state.inProgress).to.equal(false);
    act(() => {
      result.current.onSubmit();
    });

    expect(result.current.state.inProgress).to.equal(true);
    expect(result.current.state.error).to.equal('');
    await waitFor(() => {
      expect(result.current.state.inProgress).to.equal(false);
    });
    expect(result.current.state.error).to.include('ENOENT');

    expect(exportConnectionsStub).to.have.been.calledOnce;
    expect(finish).to.not.have.been.called;

    act(() => {
      result.current.onChangeFilename(filename + '-changed');
    });

    expect(result.current.state.error).to.equal('');
  });

  context('when multiple connections is enabled', function () {
    it('includes also the non-favorites connections in the export list', function () {
      const { result } = renderUseExportConnectionsHook(
        {},
        {
          preferences: { enableNewMultipleConnectionSystem: true },
          connections: [
            {
              id: 'id1',
              connectionOptions: {
                connectionString: 'mongodb://localhost:2020',
              },
              favorite: {
                name: 'name1',
              },
              // expecting to include the non-favorite connections as well
              savedConnectionType: 'recent',
            },
          ],
        }
      );

      expect(result.current.state.connectionList).to.deep.equal([
        { id: 'id1', name: 'name1', selected: true },
      ]);
    });
  });
});
