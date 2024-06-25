import type React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import type {
  RenderResult,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import { useExportConnections } from './use-export';
import type { ImportExportResult } from './common';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createElement } from 'react';
import {
  ConnectionStorageProvider,
  type ConnectionStorage,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { useConnectionRepository } from '@mongodb-js/compass-connections/provider';

type UseExportConnectionsProps = Parameters<typeof useExportConnections>[0];
type UseExportConnectionsResult = ReturnType<typeof useExportConnections>;
type UseConnectionRepositoryResult = ReturnType<typeof useConnectionRepository>;
type HookResults = {
  connectionRepository: UseConnectionRepositoryResult;
  exportConnections: UseExportConnectionsResult;
};

describe('useExportConnections', function () {
  let sandbox: sinon.SinonSandbox;
  let finish: sinon.SinonStub;
  let finishedPromise: Promise<ImportExportResult>;
  let defaultProps: UseExportConnectionsProps;
  let renderHookResult: RenderHookResult<
    Partial<UseExportConnectionsProps>,
    HookResults
  >;
  let result: RenderResult<HookResults>;
  let rerender: (props: Partial<UseExportConnectionsProps>) => void;
  let tmpdir: string;
  let connectionStorage: ConnectionStorage;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    finishedPromise = new Promise<ImportExportResult>((resolve) => {
      finish = sinon.stub().callsFake(resolve);
    });
    defaultProps = {
      finish,
      open: true,
      trackingProps: { context: 'Tests' },
    };
    connectionStorage = new InMemoryConnectionStorage();
    const wrapper: React.FC = ({ children }) =>
      createElement(ConnectionStorageProvider, {
        value: connectionStorage,
        children,
      });

    renderHookResult = renderHook(
      (props: Partial<UseExportConnectionsProps> = {}) => {
        return {
          connectionRepository: useConnectionRepository(),
          exportConnections: useExportConnections({
            ...defaultProps,
            ...props,
          }),
        };
      },
      {
        wrapper,
      }
    );
    ({ result, rerender } = renderHookResult);
    tmpdir = path.join(
      os.tmpdir(),
      `compass-export-connections-ui-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    sandbox.restore();
    await fs.rm(tmpdir, { recursive: true });
  });

  // Security-relevant test -- description is in the protect-connection-strings e2e test.
  it('sets removeSecrets if protectConnectionStrings is set', async function () {
    expect(result.current.exportConnections.state.removeSecrets).to.equal(
      false
    );
    act(() => {
      result.current.exportConnections.onChangeRemoveSecrets({
        target: { checked: true },
      } as any);
    });
    expect(result.current.exportConnections.state.removeSecrets).to.equal(true);

    const preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({ protectConnectionStrings: true });
    const resultInProtectedMode = renderHook(
      () => {
        return useExportConnections(defaultProps);
      },
      {
        wrapper: ({ children }) =>
          createElement(PreferencesProvider, { children, value: preferences }),
      }
    ).result;

    expect(resultInProtectedMode.current.state.removeSecrets).to.equal(true);
    act(() => {
      resultInProtectedMode.current.onChangeRemoveSecrets({
        target: { checked: false },
      } as any);
    });
    expect(resultInProtectedMode.current.state.removeSecrets).to.equal(true);
  });

  it('responds to changes in the connectionList', async function () {
    expect(result.current.exportConnections.state.connectionList).to.deep.equal(
      []
    );

    await act(async () => {
      await result.current.connectionRepository.saveConnection({
        id: 'id1',
        connectionOptions: { connectionString: 'mongodb://localhost:2020' },
        favorite: {
          name: 'name1',
        },
        savedConnectionType: 'favorite',
      });
    });
    rerender({});
    expect(result.current.exportConnections.state.connectionList).to.deep.equal(
      [{ id: 'id1', name: 'name1', selected: true }]
    );

    act(() => {
      result.current.exportConnections.onChangeConnectionList([
        { id: 'id1', name: 'name1', selected: false },
      ]);
    });
    expect(result.current.exportConnections.state.connectionList).to.deep.equal(
      [{ id: 'id1', name: 'name1', selected: false }]
    );

    await act(async () => {
      await result.current.connectionRepository.saveConnection({
        id: 'id2',
        connectionOptions: { connectionString: 'mongodb://localhost:2020' },
        favorite: {
          name: 'name2',
        },
        savedConnectionType: 'favorite',
      });
    });

    expect(result.current.exportConnections.state.connectionList).to.deep.equal(
      [
        { id: 'id1', name: 'name1', selected: false },
        { id: 'id2', name: 'name2', selected: true },
      ]
    );
  });

  it('updates filename if changed', function () {
    act(() => {
      result.current.exportConnections.onChangeFilename('filename1234');
    });
    expect(result.current.exportConnections.state.filename).to.equal(
      'filename1234'
    );
  });

  it('handles actual export', async function () {
    await act(async () => {
      await connectionStorage.save?.({
        connectionInfo: {
          id: 'id1',
          connectionOptions: {
            connectionString: 'mongodb://localhost:2020',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'name1',
          },
        },
      });
      await connectionStorage.save?.({
        connectionInfo: {
          id: 'id2',
          connectionOptions: {
            connectionString: 'mongodb://localhost:2021',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'name1',
          },
        },
      });
    });
    rerender({});
    act(() => {
      result.current.exportConnections.onChangeConnectionList([
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
      result.current.exportConnections.onChangeFilename(filename);
      result.current.exportConnections.onChangePassphrase('s3cr3t');
    });

    act(() => {
      result.current.exportConnections.onSubmit();
    });

    expect(await finishedPromise).to.equal('succeeded');
    expect(await fs.readFile(filename, 'utf8')).to.equal(fileContents);
    expect(exportConnectionStub).to.have.been.calledOnce;
    const arg = exportConnectionStub.firstCall.args[0];
    expect(arg?.options?.passphrase).to.equal('s3cr3t');
    expect(arg?.options?.filterConnectionIds).to.deep.equal(['id2']);
    expect(arg?.options?.trackingProps).to.deep.equal({ context: 'Tests' });
    expect(arg?.options?.removeSecrets).to.equal(false);
  });

  it('resets errors if filename changes', async function () {
    const filename = path.join(tmpdir, 'nonexistent', 'connections.json');
    const exportConnectionsStub = sandbox
      .stub(connectionStorage, 'exportConnections')
      .resolves('');

    act(() => {
      result.current.exportConnections.onChangeFilename(filename);
    });

    expect(result.current.exportConnections.state.inProgress).to.equal(false);
    act(() => {
      result.current.exportConnections.onSubmit();
    });

    expect(result.current.exportConnections.state.inProgress).to.equal(true);
    expect(result.current.exportConnections.state.error).to.equal('');
    await renderHookResult.waitForValueToChange(
      () => result.current.exportConnections.state.inProgress
    );
    expect(result.current.exportConnections.state.inProgress).to.equal(false);
    expect(result.current.exportConnections.state.error).to.include('ENOENT');

    expect(exportConnectionsStub).to.have.been.calledOnce;
    expect(finish).to.not.have.been.called;

    act(() => {
      result.current.exportConnections.onChangeFilename(filename + '-changed');
    });

    expect(result.current.exportConnections.state.error).to.equal('');
  });

  context('when multiple connections is enabled', function () {
    beforeEach(async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableNewMultipleConnectionSystem: true,
      });
      const wrapper: React.FC = ({ children }) =>
        createElement(PreferencesProvider, {
          value: preferences,
          children: createElement(ConnectionStorageProvider, {
            value: connectionStorage,
            children,
          }),
        });
      renderHookResult = renderHook(
        (props: Partial<UseExportConnectionsProps> = {}) => {
          return {
            connectionRepository: useConnectionRepository(),
            exportConnections: useExportConnections({
              ...defaultProps,
              ...props,
            }),
          };
        },
        { wrapper }
      );
      ({ result, rerender } = renderHookResult);
    });

    it('includes also the non-favorites connections in the export list', async function () {
      expect(
        result.current.exportConnections.state.connectionList
      ).to.deep.equal([]);

      // expecting to include the non-favorite connections as well
      await act(async () => {
        await result.current.connectionRepository.saveConnection({
          id: 'id1',
          connectionOptions: { connectionString: 'mongodb://localhost:2020' },
          favorite: {
            name: 'name1',
          },
          savedConnectionType: 'recent',
        });
      });

      rerender({});
      expect(
        result.current.exportConnections.state.connectionList
      ).to.deep.equal([{ id: 'id1', name: 'name1', selected: true }]);

      act(() => {
        result.current.exportConnections.onChangeConnectionList([
          { id: 'id1', name: 'name1', selected: false },
        ]);
      });
      expect(
        result.current.exportConnections.state.connectionList
      ).to.deep.equal([{ id: 'id1', name: 'name1', selected: false }]);

      await act(async () => {
        await result.current.connectionRepository.saveConnection({
          id: 'id2',
          connectionOptions: { connectionString: 'mongodb://localhost:2020' },
          favorite: {
            name: 'name2',
          },
          savedConnectionType: 'recent',
        });
      });

      expect(
        result.current.exportConnections.state.connectionList
      ).to.deep.equal([
        { id: 'id1', name: 'name1', selected: false },
        { id: 'id2', name: 'name2', selected: true },
      ]);
    });
  });
});
