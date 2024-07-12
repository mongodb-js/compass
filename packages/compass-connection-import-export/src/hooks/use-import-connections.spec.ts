import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import type {
  RenderResult,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import { useImportConnections } from './use-import-connections';
import type { ImportExportResult } from './common';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import {
  type ConnectionInfo,
  type ConnectionStorage,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionStorageProvider } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  ConnectionStatus,
  useConnectionRepository,
} from '@mongodb-js/compass-connections/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

type UseImportConnectionsProps = Parameters<typeof useImportConnections>[0];
type UseImportConnectionsResult = ReturnType<typeof useImportConnections>;
type UseConnectionRepositoryResult = ReturnType<typeof useConnectionRepository>;
type HookResults = {
  connectionRepository: UseConnectionRepositoryResult;
  importConnections: UseImportConnectionsResult;
};
const exampleFileContents = '{"a":"b"}';

describe('useImportConnections', function () {
  let sandbox: sinon.SinonSandbox;
  let finish: sinon.SinonStub;
  let finishedPromise: Promise<ImportExportResult>;
  let defaultProps: UseImportConnectionsProps;
  let renderHookResult: RenderHookResult<
    Partial<UseImportConnectionsProps>,
    HookResults
  >;
  let result: RenderResult<HookResults>;
  let rerender: (props: Partial<UseImportConnectionsProps>) => void;
  let tmpdir: string;
  let exampleFile: string;
  let connectionStorage: ConnectionStorage;
  let connectionsManager: ConnectionsManager;

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
    connectionsManager = new ConnectionsManager({} as any);
    const wrapper: React.FC = ({ children }) =>
      React.createElement(ConnectionStorageProvider, {
        value: connectionStorage,
        children: [
          React.createElement(ConnectionsManagerProvider, {
            value: connectionsManager,
            children,
          }),
        ],
      });
    renderHookResult = renderHook(
      (props: Partial<UseImportConnectionsProps> = {}) => {
        return {
          connectionRepository: useConnectionRepository(),
          importConnections: useImportConnections({
            ...defaultProps,
            ...props,
          }),
        };
      },
      { wrapper }
    );
    ({ result, rerender } = renderHookResult);
    tmpdir = path.join(
      os.tmpdir(),
      `compass-export-connections-ui-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
    exampleFile = path.join(tmpdir, 'connections.json');
    await fs.writeFile(exampleFile, exampleFileContents);
  });

  afterEach(async function () {
    sandbox.restore();
    await fs.rm(tmpdir, { recursive: true });
  });

  it('updates filename if changed', async function () {
    const deserializeStub = sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .callsFake(function ({
        content,
        options,
      }: {
        content: string;
        options: any;
      }) {
        expect(content).to.equal(exampleFileContents);
        expect(options.passphrase).to.equal('');
        return Promise.resolve([
          {
            id: 'id1',
            favorite: { name: 'name1' },
          } as ConnectionInfo,
        ]);
      });

    act(() => {
      result.current.importConnections.onChangeFilename(exampleFile);
    });
    expect(result.current.importConnections.state.filename).to.equal(
      exampleFile
    );
    expect(result.current.importConnections.state.error).to.equal('');
    expect(result.current.importConnections.state.connectionList).to.deep.equal(
      []
    );
    await renderHookResult.waitForValueToChange(
      () => result.current.importConnections.state.connectionList.length
    );

    expect(deserializeStub).to.have.been.calledOnce;
    expect(result.current.importConnections.state.connectionList).to.deep.equal(
      [
        {
          id: 'id1',
          name: 'name1',
          selected: true,
          isExistingConnection: false,
        },
      ]
    );
  });

  it('updates passphrase if changed', async function () {
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .onFirstCall()
      .callsFake(function ({
        content,
        options,
      }: {
        content: string;
        options: any;
      }) {
        expect(content).to.equal(exampleFileContents);
        expect(options.passphrase).to.equal('wrong');
        throw Object.assign(new Error('wrong password'), {
          passphraseRequired: true,
        });
      })
      .onSecondCall()
      .callsFake(function ({
        content,
        options,
      }: {
        content: string;
        options: any;
      }) {
        expect(content).to.equal(exampleFileContents);
        expect(options.passphrase).to.equal('s3cr3t');
        return Promise.resolve([
          {
            id: 'id1',
            favorite: { name: 'name1' },
          } as ConnectionInfo,
        ]);
      });

    act(() => {
      result.current.importConnections.onChangeFilename(exampleFile);
      result.current.importConnections.onChangePassphrase('wrong');
    });
    expect(result.current.importConnections.state.passphrase).to.equal('wrong');

    expect(result.current.importConnections.state.error).to.equal('');
    await renderHookResult.waitForValueToChange(
      () => result.current.importConnections.state.error
    );
    expect(result.current.importConnections.state.error).to.equal(
      'wrong password'
    );
    expect(result.current.importConnections.state.passphraseRequired).to.equal(
      true
    );

    act(() => {
      result.current.importConnections.onChangePassphrase('s3cr3t');
    });
    expect(result.current.importConnections.state.passphrase).to.equal(
      's3cr3t'
    );

    await renderHookResult.waitForValueToChange(
      () => result.current.importConnections.state.error
    );

    expect(result.current.importConnections.state.error).to.equal('');
    expect(result.current.importConnections.state.passphraseRequired).to.equal(
      true
    );
    expect(
      result.current.importConnections.state.connectionList
    ).to.have.lengthOf(1);
  });

  it('does not select existing favorites by default', async function () {
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .callsFake(({ content, options }: { content: string; options: any }) => {
        expect(content).to.equal(exampleFileContents);
        expect(options.passphrase).to.equal('');
        return Promise.resolve([
          {
            id: 'id1',
            favorite: { name: 'name1' },
          },
          {
            id: 'id2',
            favorite: { name: 'name2' },
          },
        ] as ConnectionInfo[]);
      });

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
    act(() => {
      result.current.importConnections.onChangeFilename(exampleFile);
    });

    await renderHookResult.waitForValueToChange(
      () => result.current.importConnections.state.connectionList.length
    );
    expect(result.current.importConnections.state.connectionList).to.deep.equal(
      [
        {
          id: 'id1',
          name: 'name1',
          selected: false,
          isExistingConnection: true,
        },
        {
          id: 'id2',
          name: 'name2',
          selected: true,
          isExistingConnection: false,
        },
      ]
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

    rerender({});
    expect(result.current.importConnections.state.connectionList).to.deep.equal(
      [
        {
          id: 'id1',
          name: 'name1',
          selected: false,
          isExistingConnection: true,
        },
        {
          id: 'id2',
          name: 'name2',
          selected: true,
          isExistingConnection: true,
        },
      ]
    );
  });

  it('handles actual import', async function () {
    const connections = [
      {
        id: 'id1',
        favorite: { name: 'name1' },
      },
      {
        id: 'id2',
        favorite: { name: 'name2' },
      },
    ];
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves(connections as ConnectionInfo[]);
    const importConnectionsStub = sandbox
      .stub(connectionStorage, 'importConnections')
      .callsFake(({ content }: { content: string }) => {
        expect(content).to.equal(exampleFileContents);
        return Promise.resolve();
      });
    act(() => {
      result.current.importConnections.onChangeFilename(exampleFile);
    });
    await renderHookResult.waitForValueToChange(
      () => result.current.importConnections.state.fileContents
    );

    act(() => {
      result.current.importConnections.onChangeConnectionList([
        { id: 'id1', name: 'name1', selected: false },
        { id: 'id2', name: 'name2', selected: true },
      ]);
    });

    act(() => {
      result.current.importConnections.onSubmit();
    });

    expect(await finishedPromise).to.equal('succeeded');
    expect(importConnectionsStub).to.have.been.calledOnce;
    const arg = importConnectionsStub.firstCall.args[0];
    expect(arg?.options?.trackingProps).to.deep.equal({
      context: 'Tests',
      connection_ids: ['id2'],
      active_connections_count: 0,
      inactive_connections_count: 1,
    });
    expect(arg?.options?.filterConnectionIds).to.deep.equal(['id2']);
  });

  context('when multiple connections is enabled', function () {
    beforeEach(async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableNewMultipleConnectionSystem: true,
      });
      const wrapper: React.FC = ({ children }) =>
        React.createElement(PreferencesProvider, {
          value: preferences,
          children: React.createElement(ConnectionStorageProvider, {
            value: connectionStorage,
            children,
          }),
        });
      renderHookResult = renderHook(
        (props: Partial<UseImportConnectionsProps> = {}) => {
          return {
            connectionRepository: useConnectionRepository(),
            importConnections: useImportConnections({
              ...defaultProps,
              ...props,
            }),
          };
        },
        { wrapper }
      );
      ({ result, rerender } = renderHookResult);
    });
    it('does not select existing connections (including non-favorites) by default', async function () {
      sandbox
        .stub(connectionStorage, 'deserializeConnections')
        .callsFake(
          ({ content, options }: { content: string; options: any }) => {
            expect(content).to.equal(exampleFileContents);
            expect(options.passphrase).to.equal('');
            // we're expecting both these non-favorite connections to be taken into
            // account when performing the diff
            return Promise.resolve([
              {
                id: 'id1',
                favorite: { name: 'name1' },
                savedConnectionType: 'recent',
              },
              {
                id: 'id2',
                favorite: { name: 'name2' },
                savedConnectionType: 'recent',
              },
            ] as ConnectionInfo[]);
          }
        );

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
      act(() => {
        result.current.importConnections.onChangeFilename(exampleFile);
      });

      await renderHookResult.waitForValueToChange(
        () => result.current.importConnections.state.connectionList.length
      );
      expect(
        result.current.importConnections.state.connectionList
      ).to.deep.equal([
        {
          id: 'id1',
          name: 'name1',
          selected: false,
          isExistingConnection: true,
        },
        {
          id: 'id2',
          name: 'name2',
          selected: true,
          isExistingConnection: false,
        },
      ]);

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

      rerender({});
      expect(
        result.current.importConnections.state.connectionList
      ).to.deep.equal([
        {
          id: 'id1',
          name: 'name1',
          selected: false,
          isExistingConnection: true,
        },
        {
          id: 'id2',
          name: 'name2',
          selected: true,
          isExistingConnection: true,
        },
      ]);
    });
  });
});
