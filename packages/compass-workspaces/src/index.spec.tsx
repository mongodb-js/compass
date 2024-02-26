import React from 'react';
import { expect } from 'chai';
import {
  render,
  cleanup,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspacesPlugin, { WorkspacesProvider } from './index';
import Sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import type { AnyWorkspaceComponent } from './components/workspaces-provider';
import { useOpenWorkspace, useWorkspaceBreadcrumbs } from './provider';
import { Breadcrumbs } from '@mongodb-js/compass-components';

function mockWorkspace(name: string) {
  return {
    name,
    component: function Component() {
      const items = useWorkspaceBreadcrumbs();
      return (
        <>
          <Breadcrumbs items={items} />
          <div data-testid="workspace-content">{name}</div>
        </>
      );
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

  context('list of breadcrumbs', function () {
    function assertBreadcrumbText(items: string[]) {
      const crumbs: any[] = [];
      screen.getByTestId('breadcrumbs').childNodes.forEach((item) => {
        crumbs.push(item.textContent);
      });
      expect(crumbs.filter(Boolean).join('.').toLowerCase()).to.equal(
        items.join('.').toLowerCase()
      );
    }

    function assertBreadcrumbNavigates({
      text,
      from,
      to,
    }: {
      text: string;
      from: string;
      to: string;
    }) {
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      const item = within(breadcrumbs).getByText(new RegExp(text, 'i'));
      expect(screen.getByTestId('workspace-content')).to.have.text(from);
      userEvent.click(item);
      expect(screen.getByTestId('workspace-content')).to.have.text(to);
    }

    function assertLastItemIsNotClickable() {
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      const lastItem = breadcrumbs.lastElementChild;
      if (!lastItem) {
        throw new Error('No last item');
      }
      const currentWorkspace = screen.getByTestId('workspace-content');
      userEvent.click(lastItem);
      expect(screen.getByTestId('workspace-content')).to.equal(
        currentWorkspace
      );
    }

    context('renders correclty', function () {
      it('for the databases screen', function () {
        renderPlugin();
        openFns.openDatabasesWorkspace();
        assertBreadcrumbText(['cluster']);
      });

      it('for collections screen', function () {
        renderPlugin();
        openFns.openCollectionsWorkspace('db.coll1');
        assertBreadcrumbText(['cluster', 'db']);
      });

      it('for a collection', function () {
        renderPlugin();
        openFns.openCollectionWorkspace('db.coll1');
        assertBreadcrumbText(['cluster', 'db', 'coll1']);
      });

      it('for a view', function () {
        renderPlugin();
        openFns.openCollectionWorkspace('db.coll1', { sourceName: 'db.coll2' });
        // For view: connection-db-sourceCollectionName-viewName
        assertBreadcrumbText(['cluster', 'db', 'coll2', 'coll1']);
      });

      it('for a view when its being edited', function () {
        renderPlugin();
        openFns.openEditViewWorkspace('db.coll3', {
          sourceName: 'db.coll1',
          sourcePipeline: [],
        });
        // For view: connection-db-sourceCollectionName-viewName
        assertBreadcrumbText(['cluster', 'db', 'coll1', 'coll3']);
      });
    });

    context('navigates correclty', function () {
      it('when on databases screen', function () {
        renderPlugin();
        openFns.openDatabasesWorkspace();
        assertLastItemIsNotClickable();
      });

      it('for collections screen', function () {
        renderPlugin();
        openFns.openCollectionsWorkspace('db.coll1');

        assertLastItemIsNotClickable();
        assertBreadcrumbNavigates({
          text: 'cluster',
          from: 'Collections',
          to: 'Databases',
        });
      });

      it('for a collection', function () {
        renderPlugin();
        openFns.openCollectionWorkspace('db.coll1');

        assertLastItemIsNotClickable();
        assertBreadcrumbNavigates({
          text: 'db',
          from: 'Collection',
          to: 'Collections',
        });
      });

      it('for a view, opens source collection', function () {
        renderPlugin();
        openFns.openCollectionWorkspace('db.coll1', { sourceName: 'db.coll2' });

        assertLastItemIsNotClickable();
        assertBreadcrumbNavigates({
          text: 'coll2',
          from: 'Collection',
          to: 'Collection',
        });
      });
    });
  });
});
