import { expect } from 'chai';
import sinon from 'sinon';
import { useImportConnections } from './use-import-connections';
import type { ImportExportResult } from './common';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import type { RenderConnectionsOptions } from '@mongodb-js/testing-library-compass';
import {
  renderHookWithConnections,
  waitFor,
  act,
} from '@mongodb-js/testing-library-compass';

const exampleFileContents = '{"a":"b"}';

describe('useImportConnections', function () {
  let sandbox: sinon.SinonSandbox;
  let finish: sinon.SinonStub;
  let finishedPromise: Promise<ImportExportResult>;
  let tmpdir: string;
  let exampleFile: string;

  function renderUseImportConnectionsHook(
    props?: Partial<Parameters<typeof useImportConnections>[0]>,
    options?: RenderConnectionsOptions
  ) {
    return renderHookWithConnections(() => {
      return useImportConnections({
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
      finish = sinon.stub().callsFake(resolve);
    });
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
    const { result, connectionStorage } = renderUseImportConnectionsHook();

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
      result.current.onChangeFilename(exampleFile);
    });
    expect(result.current.state.filename).to.equal(exampleFile);
    expect(result.current.state.error).to.equal('');
    expect(result.current.state.connectionList).to.deep.equal([]);
    await waitFor(() => {
      expect(result.current.state.connectionList).to.deep.equal([
        {
          id: 'id1',
          name: 'name1',
          selected: true,
          isExistingConnection: false,
        },
      ]);
    });
    expect(deserializeStub).to.have.been.calledOnce;
  });

  it('updates passphrase if changed', async function () {
    const { result, connectionStorage } = renderUseImportConnectionsHook();

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
      result.current.onChangeFilename(exampleFile);
      result.current.onChangePassphrase('wrong');
    });
    expect(result.current.state.passphrase).to.equal('wrong');

    expect(result.current.state.error).to.equal('');
    await waitFor(() => {
      expect(result.current.state.error).to.equal('wrong password');
    });
    expect(result.current.state.passphraseRequired).to.equal(true);

    act(() => {
      result.current.onChangePassphrase('s3cr3t');
    });
    expect(result.current.state.passphrase).to.equal('s3cr3t');

    await waitFor(() => {
      expect(result.current.state.error).to.equal('');
    });

    expect(result.current.state.passphraseRequired).to.equal(true);
    expect(result.current.state.connectionList).to.have.lengthOf(1);
  });

  it('does not select existing favorites by default', async function () {
    const { result, connectionStorage, connectionsStore } =
      renderUseImportConnectionsHook(
        {},
        {
          connections: [
            {
              id: 'id1',
              connectionOptions: {
                connectionString: 'mongodb://localhost:2020',
              },
              favorite: {
                name: 'name1',
              },
              savedConnectionType: 'favorite',
            },
          ],
        }
      );

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

    act(() => {
      result.current.onChangeFilename(exampleFile);
    });

    await waitFor(() => {
      expect(result.current.state.connectionList).to.deep.equal([
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
    });

    await connectionStorage.save?.({
      connectionInfo: {
        id: 'id2',
        connectionOptions: { connectionString: 'mongodb://localhost:2020' },
        favorite: {
          name: 'name2',
        },
        savedConnectionType: 'favorite',
      },
    });

    await connectionsStore.actions.refreshConnections();

    await waitFor(() => {
      expect(result.current.state.connectionList).to.deep.equal([
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

  it('handles actual import', async function () {
    const { result, connectionStorage } = renderUseImportConnectionsHook();

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
      .resolves(connections as any);
    const importConnectionsStub = sandbox
      .stub(connectionStorage, 'importConnections')
      .callsFake(({ content }: { content: string }) => {
        expect(content).to.equal(exampleFileContents);
        return Promise.resolve();
      });
    act(() => {
      result.current.onChangeFilename(exampleFile);
    });
    await waitFor(() => {
      expect(result.current.state.fileContents).to.eq(exampleFileContents);
    });

    act(() => {
      result.current.onChangeConnectionList([
        { id: 'id1', name: 'name1', selected: false },
        { id: 'id2', name: 'name2', selected: true },
      ]);
    });

    act(() => {
      result.current.onSubmit();
    });

    expect(await finishedPromise).to.equal('succeeded');
    expect(importConnectionsStub).to.have.been.calledOnce;
    const arg = importConnectionsStub.firstCall.args[0];
    expect(arg?.options?.trackingProps).to.deep.equal({
      context: 'Tests',
      connection_ids: ['id2'],
    });
    expect(arg?.options?.filterConnectionIds).to.deep.equal(['id2']);
  });

  context('when multiple connections is enabled', function () {
    it('does not select existing connections (including non-favorites) by default', async function () {
      const { result, connectionStorage } = renderUseImportConnectionsHook(
        {},
        {
          connections: [
            {
              id: 'id1',
              connectionOptions: {
                connectionString: 'mongodb://localhost:2020',
              },
              favorite: {
                name: 'name1',
              },
              savedConnectionType: 'recent',
            },
          ],
        }
      );

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

      act(() => {
        result.current.onChangeFilename(exampleFile);
      });

      await waitFor(() => {
        expect(result.current.state.connectionList).to.deep.equal([
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
      });
    });
  });
});
