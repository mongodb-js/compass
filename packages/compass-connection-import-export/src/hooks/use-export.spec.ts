import { expect } from 'chai';
import sinon from 'sinon';
import type {
  RenderResult,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import { useExportConnections } from './use-export';
import type { ImportExportResult } from './common';
import preferences from 'compass-preferences-model';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

type UseExportConnectionsProps = Parameters<typeof useExportConnections>[0];
type UseExportConnectionsResult = ReturnType<typeof useExportConnections>;

describe('useExportConnections', function () {
  let sandbox: sinon.SinonSandbox;
  let finish: sinon.SinonStub;
  let finishedPromise: Promise<ImportExportResult>;
  let exportConnections: sinon.SinonStub;
  let defaultProps: UseExportConnectionsProps;
  let renderHookResult: RenderHookResult<
    Partial<UseExportConnectionsProps>,
    UseExportConnectionsResult
  >;
  let result: RenderResult<UseExportConnectionsResult>;
  let rerender: (props: Partial<UseExportConnectionsProps>) => void;
  let tmpdir: string;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    finishedPromise = new Promise<ImportExportResult>((resolve) => {
      finish = sinon.stub().callsFake(resolve);
    });
    exportConnections = sinon.stub();
    defaultProps = {
      finish,
      favoriteConnections: [],
      open: true,
      trackingProps: { context: 'Tests' },
    };
    renderHookResult = renderHook(
      (props: Partial<UseExportConnectionsProps> = {}) => {
        return useExportConnections(
          { ...defaultProps, ...props },
          exportConnections
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
  });

  afterEach(async function () {
    sandbox.restore();
    await fs.rm(tmpdir, { recursive: true });
  });

  it('sets removeSecrets if protectConnectionStrings is set', function () {
    expect(result.current.state.removeSecrets).to.equal(false);
    act(() => {
      result.current.onChangeRemoveSecrets({
        target: { checked: true },
      } as any);
    });
    expect(result.current.state.removeSecrets).to.equal(true);

    sandbox
      .stub(preferences, 'getPreferences')
      .returns({ protectConnectionStrings: true } as any);
    const resultInProtectedMode = renderHook(() => {
      return useExportConnections(defaultProps, exportConnections);
    }).result;

    expect(resultInProtectedMode.current.state.removeSecrets).to.equal(true);
    act(() => {
      resultInProtectedMode.current.onChangeRemoveSecrets({
        target: { checked: false },
      } as any);
    });
    expect(resultInProtectedMode.current.state.removeSecrets).to.equal(true);
  });

  it('responds to changes in the connectionList specified via props', function () {
    expect(result.current.state.connectionList).to.deep.equal([]);

    rerender({
      favoriteConnections: [{ id: 'id1', favorite: { name: 'name1' } }],
    });
    expect(result.current.state.connectionList).to.deep.equal([
      { id: 'id1', name: 'name1', selected: true },
    ]);

    act(() => {
      result.current.onChangeConnectionList([
        { id: 'id1', name: 'name1', selected: false },
      ]);
    });
    expect(result.current.state.connectionList).to.deep.equal([
      { id: 'id1', name: 'name1', selected: false },
    ]);

    rerender({
      favoriteConnections: [
        { id: 'id1', favorite: { name: 'name1' } },
        { id: 'id2', favorite: { name: 'name2' } },
      ],
    });

    expect(result.current.state.connectionList).to.deep.equal([
      { id: 'id1', name: 'name1', selected: false },
      { id: 'id2', name: 'name2', selected: true },
    ]);
  });

  it('updates filename if changed', function () {
    act(() => {
      result.current.onChangeFilename('filename1234');
    });
    expect(result.current.state.filename).to.equal('filename1234');
  });

  it('handles actual export', async function () {
    rerender({
      favoriteConnections: [
        { id: 'id1', favorite: { name: 'name1' } },
        { id: 'id2', favorite: { name: 'name2' } },
      ],
    });
    act(() => {
      result.current.onChangeConnectionList([
        { id: 'id1', name: 'name1', selected: false },
        { id: 'id2', name: 'name2', selected: true },
      ]);
    });

    const filename = path.join(tmpdir, 'connections.json');
    const fileContents = '{"connections":[1,2,3]}';
    exportConnections.resolves(fileContents);

    act(() => {
      result.current.onChangeFilename(filename);
      result.current.onChangePassphrase('s3cr3t');
    });

    act(() => {
      result.current.onSubmit();
    });

    expect(await finishedPromise).to.equal('succeeded');
    expect(await fs.readFile(filename, 'utf8')).to.equal(fileContents);
    expect(exportConnections).to.have.been.calledOnce;
    const arg = exportConnections.firstCall.args[0];
    expect(arg.options.passphrase).to.equal('s3cr3t');
    expect(arg.options.filterConnectionIds).to.deep.equal(['id2']);
    expect(arg.options.trackingProps).to.deep.equal({ context: 'Tests' });
    expect(arg.options.removeSecrets).to.equal(false);
  });

  it('resets errors if filename changes', async function () {
    const filename = path.join(tmpdir, 'nonexistent', 'connections.json');
    exportConnections.resolves('');

    act(() => {
      result.current.onChangeFilename(filename);
    });

    expect(result.current.state.inProgress).to.equal(false);
    act(() => {
      result.current.onSubmit();
    });

    expect(result.current.state.inProgress).to.equal(true);
    expect(result.current.state.error).to.equal('');
    await renderHookResult.waitForValueToChange(
      () => result.current.state.inProgress
    );
    expect(result.current.state.inProgress).to.equal(false);
    expect(result.current.state.error).to.include('ENOENT');

    expect(exportConnections).to.have.been.calledOnce;
    expect(finish).to.not.have.been.called;

    act(() => {
      result.current.onChangeFilename(filename + '-changed');
    });

    expect(result.current.state.error).to.equal('');
  });
});
