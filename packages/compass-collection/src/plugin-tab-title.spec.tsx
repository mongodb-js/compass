import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  renderWithActiveConnection,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { CollectionPluginTitleComponent } from './plugin-tab-title';

const tabCoreProps = {
  tabId: 'tab-1',
  subTab: 'Documents' as const,
  isSelected: true,
  isDragging: false,
  onSelect: (): void => {},
  onDuplicate: (): void => {},
  onClose: (): void => {},
  onCloseAllOthers: (): void => {},
  tabContentId: 'test-collection-tab',
};

const connection: ConnectionInfo = {
  id: 'conn-1',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: { name: 'Local' },
};

function createMockCollectionStore(
  overrides: {
    documentsTabSavedQueryName?: string;
    aggregationsPipelineName?: string;
  } = {}
) {
  return createStore(() => ({
    metadata: {
      isTimeSeries: false,
      isReadonly: false,
      sourceName: null,
    },
    documentsTabSavedQueryName: overrides.documentsTabSavedQueryName ?? '',
    aggregationsPipelineName: overrides.aggregationsPipelineName ?? '',
  }));
}

async function renderTabTitle(
  ui: React.ReactElement,
  store = createMockCollectionStore()
) {
  return renderWithActiveConnection(
    <Provider store={store}>{ui}</Provider>,
    connection,
    { connections: [connection] }
  );
}

describe('CollectionPluginTitleComponent', function () {
  afterEach(function () {
    cleanup();
  });

  it('adds My Query line on Documents when query bar matched a favorite (not only from My Queries)', async function () {
    const store = createMockCollectionStore({
      documentsTabSavedQueryName: 'Orders filter',
    });
    await renderTabTitle(
      <CollectionPluginTitleComponent {...tabCoreProps} namespace="db.coll" />,
      store
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.include('My Query:');
    expect(tooltip.textContent).to.include('Orders filter');
  });

  it('does not add a My Query row when there is no saved query/pipeline name', async function () {
    await renderTabTitle(
      <CollectionPluginTitleComponent {...tabCoreProps} namespace="db.coll" />
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.not.include('My Query:');
  });

  it('does not add My Query row on Schema even when Documents has a name', async function () {
    const store = createMockCollectionStore({
      documentsTabSavedQueryName: 'Should not show on Schema',
    });
    await renderTabTitle(
      <CollectionPluginTitleComponent
        {...tabCoreProps}
        subTab="Schema"
        namespace="db.coll"
      />,
      store
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.not.include('My Query:');
  });

  it('adds My Query line on Aggregations from pipeline name state', async function () {
    const store = createMockCollectionStore({
      aggregationsPipelineName: 'My pipeline',
    });
    await renderTabTitle(
      <CollectionPluginTitleComponent
        {...tabCoreProps}
        subTab="Aggregations"
        namespace="db.coll"
      />,
      store
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.include('My Query:');
    expect(tooltip.textContent).to.include('My pipeline');
  });
});
