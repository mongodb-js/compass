import React from 'react';
import { expect } from 'chai';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspacesPlugin, { WorkspacesProvider } from './index';
import Sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import type { AnyWorkspaceComponent } from './components/workspaces-provider';

function mockWorkspace(name: string) {
  return {
    name,
    component: function Component() {
      return <>{name}</>;
    },
  } as unknown as AnyWorkspaceComponent;
}

describe('WorkspacesPlugin', function () {
  const sandbox = Sinon.createSandbox();
  const globalAppRegistry = sandbox.spy(new AppRegistry());
  const instance = { on() {}, removeListener() {} } as any;
  const Plugin = WorkspacesPlugin.withMockServices(
    {
      globalAppRegistry,
      instance,
    },
    { disableChildPluginRendering: true }
  );
  const onTabChangeSpy = sandbox.spy();

  function renderPlugin() {
    return render(
      <WorkspacesProvider
        value={[
          mockWorkspace('My Queries'),
          mockWorkspace('Databases'),
          mockWorkspace('Performance'),
          mockWorkspace('Collections'),
          mockWorkspace('Collection'),
        ]}
      >
        <Plugin onActiveWorkspaceTabChange={onTabChangeSpy}></Plugin>
      </WorkspacesProvider>
    );
  }

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  const tabs = [
    ['My Queries', ['open-instance-workspace']],
    ['Databases', ['open-instance-workspace', 'Databases']],
    ['Performance', ['open-instance-workspace', 'Performance']],
    ['db', ['select-database', 'db']],
    ['db > coll', ['select-namespace', { namespace: 'db.coll' }]],
    ['db > coll', ['open-namespace-in-new-tab', { namespace: 'db.coll' }]],
  ] as const;

  for (const suite of tabs) {
    const [tabName, event] = suite;
    it(`should open "${tabName}" tab on ${event[0]} event`, function () {
      renderPlugin();
      globalAppRegistry.emit(event[0], event[1]);
      expect(screen.getByRole('tab', { name: tabName })).to.exist;
    });
  }

  it('should switch tabs when tab is clicked', async function () {
    renderPlugin();

    expect(onTabChangeSpy).to.have.been.calledWith(null);

    globalAppRegistry.emit('open-namespace-in-new-tab', {
      namespace: 'db.coll1',
    });
    globalAppRegistry.emit('open-namespace-in-new-tab', {
      namespace: 'db.coll2',
    });
    globalAppRegistry.emit('open-namespace-in-new-tab', {
      namespace: 'db.coll3',
    });

    expect(screen.getByRole('tab', { name: 'db > coll3' })).to.have.attribute(
      'aria-selected',
      'true'
    );

    userEvent.click(screen.getByRole('tab', { name: 'db > coll1' }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'db > coll3' })).to.have.attribute(
        'aria-selected',
        'false'
      );
      expect(screen.getByRole('tab', { name: 'db > coll1' })).to.have.attribute(
        'aria-selected',
        'true'
      );
    });

    expect(onTabChangeSpy).to.have.been.calledWithMatch({
      type: 'Collection',
      namespace: 'db.coll1',
    });
  });
});
