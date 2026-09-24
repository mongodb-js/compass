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

function cursorOf(documents: unknown[]) {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        next(): Promise<IteratorResult<unknown>> {
          return Promise.resolve(
            index < documents.length
              ? { done: false, value: documents[index++] }
              : { done: true, value: undefined }
          );
        },
      };
    },
  };
}

// Exercise the collection plugin's public eligibility prop without loading the CRUD plugin.
function GeneratorEntry({
  isMockDataGeneratorEligible,
}: CollectionMetadata & {
  isMockDataGeneratorEligible?: boolean;
}) {
  const appRegistry = useLocalAppRegistry();
  return isMockDataGeneratorEligible ? (
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
  const sampleCursor = sandbox.stub();
  const fetchMetadata = sandbox.stub();
  const ensureAiFeatureAccess = sandbox.stub();
  const getMockDataSchema = sandbox.stub();
  const assignExperiment = sandbox.stub();
  const getAssignment = sandbox.stub();
  const openCollectionWorkspaceSubtab = sandbox.stub();
  const workspaces = {
    openCollectionWorkspaceSubtab,
  } as unknown as WorkspacesService;
  const collectionModel = {
    fetchMetadata,
    avg_document_size: 64,
    validation: { validator: { $jsonSchema: { bsonType: 'object' } } },
  };

  async function renderCollection(
    preferences: Partial<AllPreferences> = {},
    connectionInfo = connection
  ) {
    const helpers = createPluginTestHelpers(
      WorkspaceTab.provider.withMockServices({
        collection: collectionModel,
        dataService: { sampleCursor },
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
          enableMockDataGenerator: true,
          ...preferences,
        },
      }
    );
  }

  beforeEach(function () {
    sampleCursor.returns(
      cursorOf([{ name: 'Ada', address: { city: 'London' } }])
    );
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

  async function openGenerator() {
    userEvent.click(await expectEntry());
    await waitFor(
      () => expect(screen.getByTestId('generate-mock-data-modal')).to.be.open
    );
  }

  it('does not analyze when a collection opens and shows the menu item on eligibility alone', async function () {
    await renderCollection();
    await expectEntry();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(sampleCursor).not.to.have.been.called;
    expect(assignExperiment).not.to.have.been.called;
    expect(getAssignment).not.to.have.been.called;
  });

  it('analyzes when the generator opens without experiment assignment', async function () {
    await renderCollection();
    await openGenerator();
    expect(ensureAiFeatureAccess).to.have.been.calledOnce;
    expect(assignExperiment).not.to.have.been.called;
    expect(getAssignment).not.to.have.been.called;
    expect(sampleCursor).to.have.been.calledOnceWith(
      metadata.namespace,
      { size: 100 },
      sinon.match.has('maxTimeMS'),
      sinon.match({
        fallbackReadPreference: 'secondaryPreferred',
        abortSignal: sinon.match.instanceOf(AbortSignal),
      })
    );
    await waitFor(() => {
      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
    });
    expect(screen.queryByTestId('schema-analysis-error-banner')).not.to.exist;
  });

  it('reuses completed analysis when the generator reopens', async function () {
    await renderCollection();
    await openGenerator();
    await waitFor(() => expect(sampleCursor).to.have.been.calledOnce);
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(
      () => expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed
    );
    userEvent.click(await expectEntry());
    await waitFor(
      () => expect(screen.getByTestId('generate-mock-data-modal')).to.be.open
    );
    expect(sampleCursor).to.have.been.calledOnce;
  });

  it('keeps the generator closed and does not sample when AI access is denied', async function () {
    ensureAiFeatureAccess.rejects(new Error('Access denied'));
    await renderCollection();
    userEvent.click(await expectEntry());
    await waitFor(() => expect(ensureAiFeatureAccess).to.have.been.calledOnce);
    expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed;
    expect(sampleCursor).not.to.have.been.called;
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
    it(`does not expose the generator for a ${name} collection`, async function () {
      fetchMetadata.resolves({ ...metadata, ...overrides });
      await renderCollection();
      await screen.findByTestId('collection');
      expect(
        screen.queryByRole('button', { name: 'Generate mock data script' })
      ).not.to.exist;
      expect(sampleCursor).not.to.have.been.called;
    });
  }

  it('does not sample on document-inserted or import-finished events', async function () {
    const { globalAppRegistry } = await renderCollection();
    await expectEntry();
    for (const event of ['document-inserted', 'import-finished']) {
      await act(() =>
        globalAppRegistry.emit(
          event,
          { ns: metadata.namespace },
          { connectionId: connection.id }
        )
      );
    }
    expect(sampleCursor).not.to.have.been.called;
  });

  for (const preferences of [
    { enableGenAIFeatures: false },
    { enableGenAIFeaturesAtlasOrg: false },
    { readOnly: true },
    { enableMockDataGenerator: false },
  ]) {
    it(`does not sample on eligibility preference changes: ${JSON.stringify(
      preferences
    )}`, async function () {
      const result = await renderCollection(preferences);
      await screen.findByTestId('collection');
      expect(
        screen.queryByRole('button', { name: 'Generate mock data script' })
      ).not.to.exist;
      await act(() =>
        result.preferences.savePreferences({
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          readOnly: false,
          enableMockDataGenerator: true,
        })
      );
      await expectEntry();
      expect(sampleCursor).not.to.have.been.called;
    });
  }

  it('cancels in-flight analysis when AI features are disabled', async function () {
    sampleCursor.returns({
      [Symbol.asyncIterator]: () => ({
        async next() {
          return new Promise<{ done: false }>(() => {});
        },
      }),
    });
    const result = await renderCollection();
    await openGenerator();
    await waitFor(() => expect(sampleCursor).to.have.been.calledOnce);
    const signal = sampleCursor.firstCall.args[3].abortSignal as AbortSignal;
    await act(() =>
      result.preferences.savePreferences({ enableGenAIFeatures: false })
    );
    expect(signal.aborted).to.equal(true);
    expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed;
  });

  it('shows an error in the modal when the collection is empty and recovers on retry', async function () {
    sampleCursor.onFirstCall().returns(cursorOf([]));
    await renderCollection();
    await openGenerator();
    await waitFor(() => {
      expect(screen.getByTestId('schema-analysis-error-banner')).to.exist;
    });
    expect(
      await screen.findByTestId('schema-analysis-error-banner')
    ).to.include.text('No documents found');
    userEvent.click(await screen.findByTestId('retry-analysis-button'));
    await waitFor(() => {
      expect(screen.queryByTestId('retry-analysis-button')).not.to.exist;
    });
    expect(sampleCursor).to.have.been.calledTwice;
  });

  it('shows an error in the modal when nesting depth exceeds the limit', async function () {
    sampleCursor.returns(
      cursorOf([
        { a: { b: { c: { d: { e: { f: { g: { h: { i: 1 } } } } } } } } },
      ])
    );
    await renderCollection();
    await openGenerator();
    await waitFor(() => {
      expect(screen.getByTestId('schema-analysis-error-banner')).to.exist;
    });
    expect(
      await screen.findByTestId('schema-analysis-error-banner')
    ).to.include.text('nesting depth');
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
    expect(sampleCursor).not.to.have.been.called;
  });

  it('handles a metadata failure without exposing the generator', async function () {
    fetchMetadata.rejects(new Error('Metadata unavailable'));
    await renderCollection();
    expect(screen.queryByRole('button', { name: 'Generate mock data script' }))
      .not.to.exist;
    expect(sampleCursor).not.to.have.been.called;
  });

  it('cancels sampling when the collection workspace closes', async function () {
    sampleCursor.returns({
      [Symbol.asyncIterator]: () => ({
        async next() {
          return new Promise<{ done: false }>(() => {});
        },
      }),
    });
    const { unmount } = await renderCollection();
    await openGenerator();
    await waitFor(() => expect(sampleCursor).to.have.been.calledOnce);
    const signal = sampleCursor.firstCall.args[3].abortSignal as AbortSignal;
    unmount();
    expect(signal.aborted).to.equal(true);
  });

  it('cancels generation when the collection workspace closes', async function () {
    getMockDataSchema.returns(new Promise(() => {}));
    const { unmount } = await renderCollection();
    await openGenerator();
    await waitFor(() => expect(sampleCursor).to.have.been.calledOnce);
    userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(getMockDataSchema).to.have.been.calledOnce);
    const signal = getMockDataSchema.firstCall.args[0].signal as AbortSignal;
    unmount();
    expect(signal.aborted).to.equal(true);
  });
});
