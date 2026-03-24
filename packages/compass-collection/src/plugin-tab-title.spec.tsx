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

const mockStore = createStore(() => ({
  metadata: {
    isTimeSeries: false,
    isReadonly: false,
    sourceName: null,
  },
}));

async function renderTabTitle(ui: React.ReactElement) {
  return renderWithActiveConnection(
    <Provider store={mockStore}>{ui}</Provider>,
    connection,
    { connections: [connection] }
  );
}

describe('CollectionPluginTitleComponent', function () {
  afterEach(function () {
    cleanup();
  });

  it('adds saved item name to the tab tooltip when opened from My Queries', async function () {
    await renderTabTitle(
      <CollectionPluginTitleComponent
        {...tabCoreProps}
        namespace="db.coll"
        savedItemName="My saved query"
      />
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.include('Connection:');
    expect(tooltip.textContent).to.include('Local');
    expect(tooltip.textContent).to.include('Database:');
    expect(tooltip.textContent).to.include('db');
    expect(tooltip.textContent).to.include('Collection:');
    expect(tooltip.textContent).to.include('coll');
    expect(tooltip.textContent).to.include('My Query:');
    expect(tooltip.textContent).to.include('My saved query');
  });

  it('does not add a My Query row when there is no saved item name', async function () {
    await renderTabTitle(
      <CollectionPluginTitleComponent {...tabCoreProps} namespace="db.coll" />
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.not.include('My Query:');
  });

  it('does not add My Query row on Schema when savedItemName is set', async function () {
    await renderTabTitle(
      <CollectionPluginTitleComponent
        {...tabCoreProps}
        subTab="Schema"
        namespace="db.coll"
        savedItemName="Should not show"
      />
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.not.include('My Query:');
  });

  it('adds My Query row on Aggregations when saved from My Queries', async function () {
    await renderTabTitle(
      <CollectionPluginTitleComponent
        {...tabCoreProps}
        subTab="Aggregations"
        namespace="db.coll"
        savedItemName="My pipeline"
      />
    );

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.include('My Query:');
    expect(tooltip.textContent).to.include('My pipeline');
  });
});
