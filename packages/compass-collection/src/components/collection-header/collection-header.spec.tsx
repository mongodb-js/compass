import { expect } from 'chai';
import type { ComponentProps } from 'react';
import React from 'react';
import {
  act,
  renderWithConnections,
  screen,
  cleanup,
  within,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import CollectionHeader from './collection-header';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import { MockDataGeneratorSteps } from '../mock-data-generator-modal/types';

import Sinon from 'sinon';

function renderCollectionHeader(
  props: Partial<ComponentProps<typeof CollectionHeader>> = {},
  workspaceService: Partial<WorkspacesService> = {},
  stateOverrides: any = {}
) {
  const defaultState = {
    mockDataGenerator: {
      isModalOpen: false,
      currentStep: MockDataGeneratorSteps.SCHEMA_CONFIRMATION,
    },
    ...stateOverrides,
  };

  const mockStore = createStore(() => defaultState);

  return renderWithConnections(
    <Provider store={mockStore}>
      <WorkspacesServiceProvider value={workspaceService as WorkspacesService}>
        <CollectionHeader
          isAtlas={false}
          isReadonly={false}
          isTimeSeries={false}
          isClustered={false}
          isFLE={false}
          namespace="test.test"
          {...props}
        />
      </WorkspacesServiceProvider>
    </Provider>
  );
}

describe('CollectionHeader [Component]', function () {
  afterEach(cleanup);

  context('when the collection is not readonly', function () {
    beforeEach(function () {
      renderCollectionHeader();
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('collection-header')).to.exist;
    });

    it('renders breadcrumbs', function () {
      expect(screen.getByTestId('breadcrumbs')).to.exist;
    });

    it('does not render the readonly badge', function () {
      expect(screen.queryByTestId('collection-badge-readonly')).to.not.exist;
    });

    it('does not render the time series badge', function () {
      expect(screen.queryByTestId('collection-badge-timeseries')).to.not.exist;
    });

    it('does not render the view badge', function () {
      expect(screen.queryByTestId('collection-badge-view')).to.not.exist;
    });

    it('renders the collection header actions', function () {
      expect(screen.getByTestId('collection-header-actions')).to.exist;
    });
  });

  context('when the collection is readonly', function () {
    beforeEach(function () {
      renderCollectionHeader({ isReadonly: true, sourceName: 'orig.coll' });
    });

    afterEach(cleanup);

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('collection-header')).to.exist;
    });

    it('renders breadcrumbs', function () {
      expect(screen.getByTestId('breadcrumbs')).to.exist;
    });

    it('renders the readonly badge', function () {
      expect(screen.getByTestId('collection-badge-readonly')).to.exist;
    });

    it('renders the view badge', function () {
      expect(screen.getByTestId('collection-badge-view')).to.exist;
    });
  });

  context('when the collection is readonly but not a view', function () {
    beforeEach(function () {
      renderCollectionHeader({ isReadonly: true, sourceName: undefined });
    });

    it('renders the readonly badge', function () {
      expect(screen.getByTestId('collection-badge-readonly')).to.exist;
    });

    it('does not render the view badge', function () {
      expect(screen.queryByTestId('collection-badge-view')).to.not.exist;
    });
  });

  context('when the collection is a time-series collection', function () {
    beforeEach(function () {
      renderCollectionHeader({ isTimeSeries: true });
    });

    it('does not render the readonly badge', function () {
      expect(screen.queryByTestId('collection-badge-readonly')).to.not.exist;
    });

    it('renders the time-series badge', function () {
      expect(screen.getByTestId('collection-badge-timeseries')).to.exist;
    });
  });

  context('when the collection is a clustered collection', function () {
    beforeEach(function () {
      renderCollectionHeader({ isClustered: true });
    });

    it('does not render the readonly badge', function () {
      expect(screen.queryByTestId('collection-badge-readonly')).to.not.exist;
    });

    it('does not render the time-series badge', function () {
      expect(screen.queryByTestId('collection-badge-timeseries')).to.not.exist;
    });

    it('renders the clustered badge', function () {
      expect(screen.getByTestId('collection-badge-clustered')).to.exist;
    });
  });

  context('when the collection is a fle collection', function () {
    beforeEach(function () {
      renderCollectionHeader({ isFLE: true });
    });

    it('renders the fle badge', function () {
      expect(screen.getByTestId('collection-badge-fle')).to.exist;
    });
  });

  describe('insights', function () {
    it('should show an insight when $text is used in the pipeline source', function () {
      renderCollectionHeader({
        sourcePipeline: [{ $match: { $text: {} } }],
      });
      expect(screen.getByTestId('insight-badge-button')).to.exist;
      userEvent.click(screen.getByTestId('insight-badge-button'));
      expect(screen.getByText('Alternate text search options available')).to
        .exist;
    });

    it('should show an insight when $regex is used in the pipeline source', function () {
      renderCollectionHeader({
        sourcePipeline: [{ $match: { $regex: {} } }],
      });
      expect(screen.getByTestId('insight-badge-button')).to.exist;
      userEvent.click(screen.getByTestId('insight-badge-button'));
      expect(screen.getByText('Alternate text search options available')).to
        .exist;
    });

    it('should show an insight when $lookup is used in the pipeline source', function () {
      renderCollectionHeader({
        sourcePipeline: [{ $lookup: {} }],
      });
      expect(screen.getByTestId('insight-badge-button')).to.exist;
      userEvent.click(screen.getByTestId('insight-badge-button'));
      expect(screen.getByText('$lookup usage')).to.exist;
    });
  });

  context('breadcrumbs', function () {
    let sandbox: Sinon.SinonSandbox;
    beforeEach(function () {
      sandbox = Sinon.createSandbox();
    });
    afterEach(function () {
      sandbox.restore();
    });

    function assertBreadcrumbText(items: string[]) {
      const crumbs: any[] = [];
      screen.getByTestId('breadcrumbs').childNodes.forEach((item) => {
        crumbs.push(item.textContent);
      });
      expect(crumbs.filter(Boolean).join('.').toLowerCase()).to.equal(
        `localhost:27020.${items.join('.').toLowerCase()}`
      );
    }

    function assertLastItemIsNotClickable(stub: Sinon.SinonStub) {
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      const lastItem = breadcrumbs.lastElementChild;
      if (!lastItem) {
        throw new Error('No last item');
      }
      expect(stub.called).to.be.false;
      userEvent.click(lastItem);
      expect(stub.called).to.be.false;
    }

    context('renders correclty', function () {
      it('for a collection', function () {
        renderCollectionHeader({ namespace: 'db.coll1' });
        assertBreadcrumbText(['db', 'coll1']);
      });

      it('for a view', function () {
        renderCollectionHeader({
          namespace: 'db.coll1',
          sourceName: 'db.coll2',
        });
        // For view: connection-db-sourceCollectionName-viewName
        assertBreadcrumbText(['db', 'coll2', 'coll1']);
      });

      it('for a view when its being edited', function () {
        renderCollectionHeader({
          namespace: 'db.coll3',
          editViewName: 'db.coll1',
        });
        // For view: connection-db-sourceCollectionName-viewName
        assertBreadcrumbText(['db', 'coll3', 'coll1']);
      });
    });

    // Symbols of the loaded-favorite bridge — duplicated verbatim
    // from `use-loaded-favorite.ts`. The bridge is wired so that
    // anything emitting on the workspace tab's localAppRegistry under
    // these keys ends up in the breadcrumb. We assert that contract
    // here, on the rendered DOM, because both sides of the bridge are
    // useless if the actual segment doesn't reach the user's screen.
    const LOADED_FAVORITE_EVENT = 'query-bar:loaded-favorite-changed';

    context('loaded-favorite chip', function () {
      it('appears next to the breadcrumbs when the bridge emits a name', async function () {
        const { localAppRegistry } = renderCollectionHeader({
          namespace: 'db.coll1',
        });
        // Initially: no loaded favorite, no chip.
        expect(
          screen.queryByTestId('collection-header-loaded-favorite-chip')
        ).to.equal(null);

        act(() => {
          localAppRegistry.emit(LOADED_FAVORITE_EVENT, {
            name: 'Trips to station 470',
            isDirty: false,
          });
        });

        await waitFor(() => {
          expect(
            screen.getByTestId('collection-header-loaded-favorite-chip')
              .textContent
          ).to.contain('Trips to station 470');
        });
      });

      it('shows a dirty dot when the bridge reports dirty', async function () {
        const { localAppRegistry } = renderCollectionHeader({
          namespace: 'db.coll1',
        });
        act(() => {
          localAppRegistry.emit(LOADED_FAVORITE_EVENT, {
            name: 'Active customers',
            isDirty: true,
          });
        });
        await waitFor(() => {
          expect(
            screen.getByTestId('collection-header-loaded-favorite-dirty-dot')
          ).to.exist;
        });
      });

      // The sticky-on-mount path is exercised in
      // `use-loaded-favorite.spec.tsx`. Inline-rename behavior is
      // exercised in `loaded-favorite-breadcrumb-chip.spec.tsx`.
    });

    context('calls onClick correclty', function () {
      it('for a collection', function () {
        const openCollectionsWorkspaceStub = sandbox.stub();
        const openCollectionWorkspaceStub = sandbox.stub();
        renderCollectionHeader(
          { namespace: 'db.coll1' },
          {
            openCollectionsWorkspace: openCollectionsWorkspaceStub,
            openCollectionWorkspace: openCollectionWorkspaceStub,
          }
        );

        assertLastItemIsNotClickable(openCollectionWorkspaceStub);

        const breadcrumbs = screen.getByTestId('breadcrumbs');
        const item = within(breadcrumbs).getByText(/db/i);
        expect(openCollectionsWorkspaceStub.called).to.be.false;
        userEvent.click(item);
        expect(openCollectionsWorkspaceStub.calledOnce).to.be.true;
        expect(openCollectionsWorkspaceStub.firstCall.args).to.deep.equal([
          'TEST',
          'db',
        ]);
      });

      it('for a view, opens source collection', function () {
        const openCollectionWorkspaceStub = sandbox.stub();
        renderCollectionHeader(
          { namespace: 'db.coll1', sourceName: 'db.coll2' },
          {
            openCollectionWorkspace: openCollectionWorkspaceStub,
          }
        );

        assertLastItemIsNotClickable(openCollectionWorkspaceStub);

        const breadcrumbs = screen.getByTestId('breadcrumbs');
        const item = within(breadcrumbs).getByText(/coll2/i);
        expect(openCollectionWorkspaceStub.called).to.be.false;
        userEvent.click(item);
        expect(openCollectionWorkspaceStub.calledOnce).to.be.true;
        expect(openCollectionWorkspaceStub.firstCall.args).to.deep.equal([
          'TEST',
          'db.coll2',
        ]);
      });
    });
  });

  it('should handle undefined schemaAnalysis gracefully and render collection header successfully', function () {
    // Create a store with undefined schemaAnalysis to simulate initial state
    const mockStoreWithUndefinedSchema = createStore(() => ({
      mockDataGenerator: {
        isModalOpen: false,
        currentStep: MockDataGeneratorSteps.SCHEMA_CONFIRMATION,
      },
      // schemaAnalysis not provided
    }));

    expect(() => {
      renderWithConnections(
        <Provider store={mockStoreWithUndefinedSchema}>
          <WorkspacesServiceProvider value={{} as WorkspacesService}>
            <CollectionHeader
              isAtlas={false}
              isReadonly={false}
              isTimeSeries={false}
              isClustered={false}
              isFLE={false}
              namespace="test.test"
            />
          </WorkspacesServiceProvider>
        </Provider>
      );
    }).to.not.throw();

    expect(screen.getByTestId('collection-header')).to.exist;
    expect(screen.getByTestId('collection-header-actions')).to.exist;
  });
});
