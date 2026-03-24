import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  renderWithConnections,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { PluginTabTitleComponent } from './plugin-tab-title';

const tabCoreProps = {
  isSelected: true,
  isDragging: false,
  onSelect: (): void => {},
  onDuplicate: (): void => {},
  onClose: (): void => {},
  onCloseAllOthers: (): void => {},
  tabContentId: 'test-my-queries-tab',
};

function connectionWithName(name: string): ConnectionInfo {
  return {
    id: `id-${name}`,
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
    favorite: { name },
  };
}

describe('PluginTabTitleComponent (My Queries tab)', function () {
  afterEach(function () {
    cleanup();
  });

  it('shows a Connections tooltip listing active connections in sorted order', async function () {
    const alpha = connectionWithName('Alpha');
    const beta = connectionWithName('Beta');
    const { connectionsStore } = renderWithConnections(
      <PluginTabTitleComponent {...tabCoreProps} />,
      { connections: [beta, alpha] }
    );

    await connectionsStore.actions.connect(beta);
    await connectionsStore.actions.connect(alpha);

    const tabButton = await screen.findByTestId('workspace-tab-button');
    userEvent.hover(tabButton);

    const tooltip = await screen.findByTestId('workspace-tab-tooltip');
    expect(tooltip.textContent).to.include('Alpha');
    expect(tooltip.textContent).to.include('Beta');
    expect(tooltip.textContent?.indexOf('Alpha')).to.be.lessThan(
      tooltip.textContent?.indexOf('Beta') ?? -1
    );
  });

  it('sets data-connection-name when exactly one active connection', async function () {
    const only = connectionWithName('Solo');
    const { connectionsStore } = renderWithConnections(
      <PluginTabTitleComponent {...tabCoreProps} />,
      { connections: [only] }
    );

    await connectionsStore.actions.connect(only);

    const tabButton = await screen.findByTestId('workspace-tab-button');
    expect(tabButton.getAttribute('data-connection-name')).to.equal('Solo');
  });
});
