import { expect } from 'chai';
import sinon from 'sinon';
import type {
  RenderResult,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import { useImportConnections } from './use-import';
import type { ImportExportResult } from './common';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

type UseImportConnectionsProps = Parameters<typeof useImportConnections>[0];
type UseImportConnectionsResult = ReturnType<typeof useImportConnections>;
const exampleFileContents = '{"a":"b"}';

describe('useImportConnections', function () {
  let sandbox: sinon.SinonSandbox;
  let finish: sinon.SinonStub;
  let finishedPromise: Promise<ImportExportResult>;
  let importConnections: sinon.SinonStub;
  let deserializeConnections: sinon.SinonStub;
  let defaultProps: UseImportConnectionsProps;
  let renderHookResult: RenderHookResult<
    Partial<UseImportConnectionsProps>,
    UseImportConnectionsResult
  >;
  let result: RenderResult<UseImportConnectionsResult>;
  let rerender: (props: Partial<UseImportConnectionsProps>) => void;
  let tmpdir: string;
  let exampleFile: string;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    finishedPromise = new Promise<ImportExportResult>((resolve) => {
      finish = sinon.stub().callsFake(resolve);
    });
    importConnections = sinon.stub();
    deserializeConnections = sinon.stub();
    defaultProps = {
      finish,
      open: true,
      favoriteConnections: [],
      trackingProps: { context: 'Tests' },
    };
    renderHookResult = renderHook(
      (props: Partial<UseImportConnectionsProps> = {}) => {
        return useImportConnections(
          { ...defaultProps, ...props },
          importConnections,
          deserializeConnections
        );
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
    exampleFile = path.join(tmpdir, 'connections.json');
    await fs.writeFile(exampleFile, exampleFileContents);
  });

  afterEach(async function () {
    sandbox.restore();
    await fs.rm(tmpdir, { recursive: true });
  });

  it('updates filename if changed', async function () {
    deserializeConnections.callsFake(function ({
      content,
      options,
    }: {
      content: string;
      options: any;
    }) {
      expect(content).to.equal(exampleFileContents);
      expect(options.passphrase).to.equal('');
      return [
        {
          id: 'id1',
          favorite: { name: 'name1' },
        },
      ];
    });

    act(() => {
      result.current.onChangeFilename(exampleFile);
    });
    expect(result.current.state.filename).to.equal(exampleFile);
    expect(result.current.state.error).to.equal('');
    expect(result.current.state.connectionList).to.deep.equal([]);
    await renderHookResult.waitForValueToChange(
      () => result.current.state.connectionList.length
    );

    expect(deserializeConnections).to.have.been.calledOnce;
    expect(result.current.state.connectionList).to.deep.equal([
      { id: 'id1', name: 'name1', selected: true, isExistingFavorite: false },
    ]);
  });

  it('updates passphrase if changed', async function () {
    deserializeConnections
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
        return [
          {
            id: 'id1',
            favorite: { name: 'name1' },
          },
        ];
      });

    act(() => {
      result.current.onChangeFilename(exampleFile);
      result.current.onChangePassphrase('wrong');
    });
    expect(result.current.state.passphrase).to.equal('wrong');

    expect(result.current.state.error).to.equal('');
    await renderHookResult.waitForValueToChange(
      () => result.current.state.error
    );
    expect(result.current.state.error).to.equal('wrong password');
    expect(result.current.state.passphraseRequired).to.equal(true);

    act(() => {
      result.current.onChangePassphrase('s3cr3t');
    });
    expect(result.current.state.passphrase).to.equal('s3cr3t');

    await renderHookResult.waitForValueToChange(
      () => result.current.state.error
    );

    expect(result.current.state.error).to.equal('');
    expect(result.current.state.passphraseRequired).to.equal(true);
    expect(result.current.state.connectionList).to.have.lengthOf(1);
  });

  it('does not select existing favorites by default', async function () {
    deserializeConnections.callsFake(
      ({ content, options }: { content: string; options: any }) => {
        expect(content).to.equal(exampleFileContents);
        expect(options.passphrase).to.equal('');
        return [
          {
            id: 'id1',
            favorite: { name: 'name1' },
          },
          {
            id: 'id2',
            favorite: { name: 'name2' },
          },
        ];
      }
    );

    rerender({
      favoriteConnections: [{ id: 'id1', favorite: { name: 'name1' } }],
    });
    act(() => {
      result.current.onChangeFilename(exampleFile);
    });

    await renderHookResult.waitForValueToChange(
      () => result.current.state.connectionList.length
    );
    expect(result.current.state.connectionList).to.deep.equal([
      { id: 'id1', name: 'name1', selected: false, isExistingFavorite: true },
      { id: 'id2', name: 'name2', selected: true, isExistingFavorite: false },
    ]);

    rerender({
      favoriteConnections: [
        { id: 'id1', favorite: { name: 'name1' } },
        { id: 'id2', favorite: { name: 'name2' } },
      ],
    });
    expect(result.current.state.connectionList).to.deep.equal([
      { id: 'id1', name: 'name1', selected: false, isExistingFavorite: true },
      { id: 'id2', name: 'name2', selected: true, isExistingFavorite: true },
    ]);
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
    deserializeConnections.callsFake(() => connections);
    importConnections.callsFake(({ content }: { content: string }) => {
      expect(content).to.equal(exampleFileContents);
      return connections;
    });
    act(() => {
      result.current.onChangeFilename(exampleFile);
    });
    await renderHookResult.waitForValueToChange(
      () => result.current.state.fileContents
    );

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
    expect(importConnections).to.have.been.calledOnce;
    const arg = importConnections.firstCall.args[0];
    expect(arg.options.trackingProps).to.deep.equal({ context: 'Tests' });
    expect(arg.options.saveConnections).to.equal(undefined);
    expect(arg.options.filterConnectionIds).to.deep.equal(['id2']);
  });
});
