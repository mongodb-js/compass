import React from 'react';
import { expect } from 'chai';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspacesPlugin, { WorkspacesProvider } from './index';
import Sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import type { AnyWorkspaceComponent } from './components/workspaces-provider';
import { useOpenWorkspace } from './provider';

function mockWorkspace(name: string) {
  return {
    name,
    component: function Component() {
      return <>{name}</>;
    },
  } as unknown as AnyWorkspaceComponent;
}

describe('WorkspacesPlugin', function () {
  let openFns: ReturnType<typeof useOpenWorkspace>;
  const sandbox = Sinon.createSandbox();
  const globalAppRegistry = sandbox.spy(new AppRegistry());
  const instance = {
    on() {},
    removeListener() {},
    getNamespace() {
      return Promise.resolve(null);
    },
  } as any;
  const dataService = {} as any;
  const Plugin = WorkspacesPlugin.withMockServices(
    {
      globalAppRegistry,
      instance,
      dataService,
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
        <Plugin
          onActiveWorkspaceTabChange={onTabChangeSpy}
          renderModals={() => {
            openFns = useOpenWorkspace();
            return null;
          }}
        ></Plugin>
      </WorkspacesProvider>
    );
  }

  afterEach(function () {
    (openFns as any) = null;
    sandbox.resetHistory();
    cleanup();
  });

  const tabs = [
    ['My Queries', () => openFns.openMyQueriesWorkspace()],
    ['Databases', () => openFns.openDatabasesWorkspace()],
    ['Performance', () => openFns.openPerformanceWorkspace()],
    ['db', () => openFns.openCollectionsWorkspace('db')],
    ['db > coll', () => openFns.openCollectionWorkspace('db.coll')],
  ] as const;

  for (const suite of tabs) {
    const [tabName, fn] = suite;
    it(`should open "${tabName}" tab when corresponding open method is called`, function () {
      renderPlugin();
      fn();
      expect(screen.getByRole('tab', { name: tabName })).to.exist;
    });
  }

  it('should switch tabs when tab is clicked', async function () {
    renderPlugin();

    expect(onTabChangeSpy).to.have.been.calledWith(null);

    openFns.openCollectionWorkspace('db.coll1', { newTab: true });
    openFns.openCollectionWorkspace('db.coll2', { newTab: true });
    openFns.openCollectionWorkspace('db.coll3', { newTab: true });

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
