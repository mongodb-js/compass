import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  act,
  cleanup,
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { useLocalAppRegistry } from '@mongodb-js/compass-app-registry';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { AllPreferences } from 'compass-preferences-model/provider';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import { ExperimentTestNames } from '@mongodb-js/compass-telemetry/provider';
import { WorkspaceTab, CollectionTabsProvider } from '..';
import CollectionTab from '../components/collection-tab';

const metadata: CollectionMetadata = {
  namespace: 'test.foo',
  isReadonly: false,
  isTimeSeries: false,
  isClustered: false,
  isFLE: false,
  isSearchIndexesSupported: false,
  isDataLake: false,
  isAtlas: false,
  serverVersion: '8.0.0',
};
const connection: ConnectionInfo = {
  id: 'test-connection',
  connectionOptions: { connectionString: 'mongodb://localhost:27017' },
};

// Exercise the collection plugin's public eligibility prop without loading the CRUD plugin.
function GeneratorEntry({
  isMockDataGeneratorEligibleAndSchemaReady,
}: CollectionMetadata & {
  isMockDataGeneratorEligibleAndSchemaReady?: boolean;
}) {
  const appRegistry = useLocalAppRegistry();
  return isMockDataGeneratorEligibleAndSchemaReady ? (
    <button onClick={() => appRegistry.emit('open-mock-data-generator-modal')}>
      Generate mock data script
    </button>
  ) : null;
}
const modals = [GeneratorEntry];
function QueryBar({ children }: React.PropsWithChildren<CollectionMetadata>) {
  return <>{children}</>;
}

describe('Collection tab mock data generator integration', function () {
  const sandbox = sinon.createSandbox();
  const sample = sandbox.stub();
  const collectionInfo = sandbox.stub();
  const fetchMetadata = sandbox.stub();
  const ensureAiFeatureAccess = sandbox.stub();
  const getMockDataSchema = sandbox.stub();
  const assignExperiment = sandbox.stub();
  const getAssignment = sandbox.stub();
  const openCollectionWorkspaceSubtab = sandbox.stub();
  const workspaces = {
    openCollectionWorkspaceSubtab,
  } as unknown as WorkspacesService;

  async function renderCollection(
    preferences: Partial<AllPreferences> = {},
    connectionInfo = connection
  ) {
    const helpers = createPluginTestHelpers(
      WorkspaceTab.provider.withMockServices({
        collection: {
          fetchMetadata,
          avg_document_size: 64,
        } as unknown as Collection,
        dataService: { sample, collectionInfo },
        atlasAiService: { ensureAiFeatureAccess, getMockDataSchema },
        experimentationServices: { assignExperiment, getAssignment },
        workspaces,
      }),
      { namespace: metadata.namespace, tabId: 'test-workspace' }
    );
    return await helpers.renderWithActiveConnection(
      <WorkspacesServiceProvider value={workspaces}>
        <CollectionTabsProvider modals={modals} queryBar={QueryBar}>
          <CollectionTab
            namespace={metadata.namespace}
            tabId="test-workspace"
            subTab="Documents"
          />
        </CollectionTabsProvider>
      </WorkspacesServiceProvider>,
      connectionInfo,
      {
        preferences: {
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          ...preferences,
        },
      }
    );
  }

  beforeEach(function () {
    sample.resolves([{ name: 'Ada', address: { city: 'London' } }]);
    collectionInfo.resolves({});
    fetchMetadata.resolves(metadata);
    ensureAiFeatureAccess.resolves();
    getMockDataSchema.resolves({ fields: [] });
    assignExperiment.resolves(null);
    getAssignment.resolves(null);
  });

  afterEach(function () {
    cleanup();
    sandbox.reset();
  });

  async function expectEntry() {
    return await screen.findByRole('button', {
      name: 'Generate mock data script',
    });
  }

  it('analyzes a desktop collection and opens the generator without experiment assignment', async function () {
    await renderCollection();
    userEvent.click(await expectEntry());
    await waitFor(
      () => expect(screen.getByTestId('generate-mock-data-modal')).to.be.open
    );
    expect(ensureAiFeatureAccess).to.have.been.calledOnce;
    expect(assignExperiment).not.to.have.been.called;
    expect(getAssignment).not.to.have.been.called;
    expect(sample).to.have.been.calledOnceWith(
      metadata.namespace,
      { size: 100 },
      sinon.match.has('maxTimeMS'),
      sinon.match({ fallbackReadPreference: 'secondaryPreferred' })
    );
  });

  it('keeps the generator closed when AI access is denied', async function () {
    ensureAiFeatureAccess.rejects(new Error('Access denied'));
    await renderCollection();
    userEvent.click(await expectEntry());
    await waitFor(() => expect(ensureAiFeatureAccess).to.have.been.calledOnce);
    expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed;
  });

  it('preserves Search Activation assignments on Atlas', async function () {
    await renderCollection(
      {},
      {
        ...connection,
        atlasMetadata: {
          clusterName: 'cluster',
          supports: { globalWrites: false, rollingIndexes: true },
        } as ConnectionInfo['atlasMetadata'],
      }
    );
    await expectEntry();
    expect(assignExperiment).to.have.been.calledTwice;
    for (const testName of [
      ExperimentTestNames.searchActivationProgramP1,
      ExperimentTestNames.searchActivationProgramP2,
    ]) {
      expect(assignExperiment).to.have.been.calledWith(testName, {
        team: 'Search Web Platform',
      });
    }
  });

  it('does not block the generator if Search Activation assignment fails', async function () {
    assignExperiment.rejects(new Error('Assignment failed'));
    await renderCollection(
      {},
      {
        ...connection,
        atlasMetadata: {
          clusterName: 'cluster',
          supports: { globalWrites: false, rollingIndexes: true },
        } as ConnectionInfo['atlasMetadata'],
      }
    );
    await expectEntry();
  });

  it('preserves subtab navigation from app events', async function () {
    const { localAppRegistry } = await renderCollection();
    await act(() => localAppRegistry.emit('open-create-index-modal'));
    expect(openCollectionWorkspaceSubtab).to.have.been.calledWith(
      'test-workspace',
      'Indexes'
    );
  });

  for (const [name, overrides] of [
    ['read-only', { isReadonly: true }],
    ['time-series', { isTimeSeries: true }],
    ['view', { sourceName: 'test.source' }],
  ] as const) {
    it(`does not sample or expose the generator for a ${name} collection`, async function () {
      fetchMetadata.resolves({ ...metadata, ...overrides });
      const { globalAppRegistry } = await renderCollection();
      await screen.findByTestId('collection');
      await act(() =>
        globalAppRegistry.emit(
          'document-inserted',
          { ns: metadata.namespace },
          { connectionId: connection.id }
        )
      );
      expect(sample).not.to.have.been.called;
      expect(
        screen.queryByRole('button', { name: 'Generate mock data script' })
      ).not.to.exist;
    });
  }

  for (const preferences of [
    { enableGenAIFeatures: false },
    { enableGenAIFeaturesAtlasOrg: false },
    { readOnly: true },
  ]) {
    it(`responds to eligibility preference changes: ${JSON.stringify(
      preferences
    )}`, async function () {
      const result = await renderCollection(preferences);
      await screen.findByTestId('collection');
      expect(sample).not.to.have.been.called;
      expect(
        screen.queryByRole('button', { name: 'Generate mock data script' })
      ).not.to.exist;
      await act(() =>
        result.preferences.savePreferences({
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          readOnly: false,
        })
      );
      await expectEntry();
      await act(() => result.preferences.savePreferences(preferences));
      expect(
        screen.queryByRole('button', { name: 'Generate mock data script' })
      ).not.to.exist;
      await act(() =>
        result.preferences.savePreferences({
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          readOnly: false,
        })
      );
      await expectEntry();
      expect(sample).to.have.been.calledOnce;
    });
  }

  for (const event of ['document-inserted', 'import-finished']) {
    for (const initialResult of ['empty', 'failed']) {
      it(`recovers from ${initialResult} analysis after a matching ${event} event`, async function () {
        if (initialResult === 'empty') sample.onFirstCall().resolves([]);
        else sample.onFirstCall().rejects(new Error('Sampling failed'));
        const { globalAppRegistry } = await renderCollection();
        await screen.findByTestId('collection');
        await waitFor(() => expect(sample).to.have.been.calledOnce);
        expect(
          screen.queryByRole('button', { name: 'Generate mock data script' })
        ).not.to.exist;
        for (const [ns, connectionId] of [
          ['other.collection', connection.id],
          [metadata.namespace, 'other-connection'],
        ]) {
          await act(() =>
            globalAppRegistry.emit(event, { ns }, { connectionId })
          );
        }
        expect(sample).to.have.been.calledOnce;
        await act(() =>
          globalAppRegistry.emit(
            event,
            { ns: metadata.namespace },
            { connectionId: connection.id }
          )
        );
        await expectEntry();
        expect(sample).to.have.been.calledTwice;
        await act(() =>
          globalAppRegistry.emit(
            event,
            { ns: metadata.namespace },
            { connectionId: connection.id }
          )
        );
        expect(sample).to.have.been.calledTwice;
      });
    }
  }

  it('does not expose collections that exceed the nesting depth limit', async function () {
    let resolveCollectionInfo!: (value: object) => void;
    collectionInfo.returns(
      new Promise((resolve) => {
        resolveCollectionInfo = resolve;
      })
    );
    sample.resolves([
      { a: { b: { c: { d: { e: { f: { g: { h: { i: 1 } } } } } } } } },
    ]);
    await renderCollection();
    await waitFor(() => expect(collectionInfo).to.have.been.calledOnce);
    await act(async () => {
      resolveCollectionInfo({});
      await Promise.resolve();
    });
    expect(screen.queryByRole('button', { name: 'Generate mock data script' }))
      .not.to.exist;
  });

  it('cancels sampling on disable and ignores the old result after re-enabling', async function () {
    let resolveSample!: (documents: unknown[]) => void;
    sample.onFirstCall().returns(
      new Promise((resolve) => {
        resolveSample = resolve;
      })
    );
    const result = await renderCollection();
    await waitFor(() => expect(sample).to.have.been.calledOnce);
    const signal = sample.firstCall.args[3].abortSignal as AbortSignal;
    await act(() =>
      result.globalAppRegistry.emit(
        'import-finished',
        { ns: metadata.namespace },
        { connectionId: connection.id }
      )
    );
    expect(sample).to.have.been.calledOnce;
    await act(() =>
      result.preferences.savePreferences({ enableGenAIFeatures: false })
    );
    expect(signal.aborted).to.equal(true);
    await act(() =>
      result.preferences.savePreferences({ enableGenAIFeatures: true })
    );
    await expectEntry();
    await act(async () => {
      resolveSample([]);
      await Promise.resolve();
    });
    await expectEntry();
    expect(sample).to.have.been.calledTwice;
  });

  it('cancels sampling when the collection workspace closes', async function () {
    sample.returns(new Promise(() => {}));
    const { unmount } = await renderCollection();
    await waitFor(() => expect(sample).to.have.been.calledOnce);
    const signal = sample.firstCall.args[3].abortSignal as AbortSignal;
    unmount();
    expect(signal.aborted).to.equal(true);
  });

  it('does not sample if metadata arrives after the workspace closes', async function () {
    let resolveMetadata!: (value: CollectionMetadata) => void;
    fetchMetadata.returns(
      new Promise((resolve) => {
        resolveMetadata = resolve;
      })
    );
    const { unmount } = await renderCollection();
    unmount();
    await act(async () => {
      resolveMetadata(metadata);
      await Promise.resolve();
    });
    expect(sample).not.to.have.been.called;
  });

  it('handles a metadata failure without starting sampling', async function () {
    fetchMetadata.rejects(new Error('Metadata unavailable'));
    await renderCollection();
    expect(sample).not.to.have.been.called;
    expect(screen.queryByRole('button', { name: 'Generate mock data script' }))
      .not.to.exist;
  });

  it('cancels generation when the collection workspace closes', async function () {
    getMockDataSchema.returns(new Promise(() => {}));
    const { unmount } = await renderCollection();
    userEvent.click(await expectEntry());
    await waitFor(
      () => expect(screen.getByTestId('generate-mock-data-modal')).to.be.open
    );
    userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(getMockDataSchema).to.have.been.calledOnce);
    const signal = getMockDataSchema.firstCall.args[0].signal as AbortSignal;
    unmount();
    expect(signal.aborted).to.equal(true);
  });
});
