import { expect } from 'chai';
import type { ComponentProps } from 'react';
import React from 'react';
import {
  renderWithConnections,
  renderWithActiveConnection,
  screen,
  cleanup,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import CollectionHeader from './collection-header';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import { MockDataGeneratorStep } from '../mock-data-generator-modal/types';
import { SCHEMA_ANALYSIS_STATE_COMPLETE } from '../../schema-analysis-types';
import { CompassExperimentationProvider } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

import Sinon from 'sinon';

function renderCollectionHeader(
  props: Partial<ComponentProps<typeof CollectionHeader>> = {},
  workspaceService: Partial<WorkspacesService> = {},
  stateOverrides: any = {}
) {
  const defaultState = {
    mockDataGenerator: {
      isModalOpen: false,
      currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
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
        currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
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

  describe('Mock Data Generator integration', function () {
    let mockUseAssignment: Sinon.SinonStub;

    beforeEach(function () {
      // Mock the useAssignment hook from compass-experimentation
      mockUseAssignment = Sinon.stub().returns({
        assignment: {
          assignmentData: {
            variant: 'mockDataGeneratorVariant',
          },
        },
      });
    });

    afterEach(function () {
      Sinon.restore();
    });

    const atlasConnectionInfo: ConnectionInfo = {
      id: 'test-atlas-connection',
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
      atlasMetadata: {
        orgId: 'test-org',
        projectId: 'test-project',
        clusterName: 'test-cluster',
        clusterUniqueId: 'test-cluster-unique-id',
        clusterType: 'REPLICASET',
        clusterState: 'IDLE',
        metricsId: 'test-metrics-id',
        metricsType: 'replicaSet',
        regionalBaseUrl: null,
        instanceSize: 'M10',
        supports: {
          globalWrites: false,
          rollingIndexes: true,
        },
      },
    };

    function renderCollectionHeaderWithExperimentation(
      props: Partial<ComponentProps<typeof CollectionHeader>> = {},
      workspaceService: Partial<WorkspacesService> = {},
      stateOverrides: any = {},
      connectionInfo?: ConnectionInfo
    ) {
      const defaultState = {
        mockDataGenerator: {
          isModalOpen: false,
          currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
        },
        ...stateOverrides,
      };

      const mockStore = createStore(() => defaultState);

      return renderWithActiveConnection(
        <CompassExperimentationProvider
          useAssignment={mockUseAssignment}
          assignExperiment={Sinon.stub()}
          getAssignment={Sinon.stub().resolves(null)}
        >
          <Provider store={mockStore}>
            <WorkspacesServiceProvider
              value={workspaceService as WorkspacesService}
            >
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
        </CompassExperimentationProvider>,
        connectionInfo
      );
    }

    it('should show Mock Data Generator button when all conditions are met', async function () {
      await renderCollectionHeaderWithExperimentation(
        {
          isAtlas: true, // Atlas environment
          isReadonly: false, // Not readonly
          namespace: 'test.collection',
        },
        {},
        {
          schemaAnalysis: {
            status: SCHEMA_ANALYSIS_STATE_COMPLETE,
            processedSchema: {
              field1: { type: 'String', sampleValues: ['value1'] },
            },
            schemaMetadata: {
              maxNestingDepth: 2, // Below the limit of 4
            },
          },
        },
        atlasConnectionInfo
      );

      expect(screen.getByTestId('collection-header-generate-mock-data-button'))
        .to.exist;
      expect(
        screen.getByTestId('collection-header-generate-mock-data-button')
      ).to.not.have.attribute('aria-disabled', 'true');
    });

    it('should disable Mock Data Generator button when collection has no schema analysis data', async function () {
      await renderCollectionHeaderWithExperimentation(
        {
          isAtlas: true,
          isReadonly: false,
          namespace: 'test.collection',
        },
        {},
        {
          schemaAnalysis: {
            status: SCHEMA_ANALYSIS_STATE_COMPLETE,
            processedSchema: {}, // Empty schema
            schemaMetadata: {
              maxNestingDepth: 2,
            },
          },
        },
        atlasConnectionInfo
      );

      const button = screen.getByTestId(
        'collection-header-generate-mock-data-button'
      );
      expect(button).to.exist;
      expect(button).to.have.attribute('aria-disabled', 'true');
    });

    it('should disable Mock Data Generator button for collections with excessive nesting depth', async function () {
      await renderCollectionHeaderWithExperimentation(
        {
          isAtlas: true,
          isReadonly: false,
          namespace: 'test.collection',
        },
        {},
        {
          schemaAnalysis: {
            status: SCHEMA_ANALYSIS_STATE_COMPLETE,
            processedSchema: {
              field1: { type: 'String', sampleValues: ['value1'] },
            },
            schemaMetadata: {
              maxNestingDepth: 4, // Exceeds the limit
            },
          },
        },
        atlasConnectionInfo
      );

      const button = screen.getByTestId(
        'collection-header-generate-mock-data-button'
      );
      expect(button).to.exist;
      expect(button).to.have.attribute('aria-disabled', 'true');
    });

    it('should not show Mock Data Generator button for readonly collections (views)', async function () {
      await renderCollectionHeaderWithExperimentation(
        {
          isAtlas: true,
          isReadonly: true, // Readonly (view)
          namespace: 'test.view',
        },
        {},
        {
          schemaAnalysis: {
            status: SCHEMA_ANALYSIS_STATE_COMPLETE,
            processedSchema: {
              field1: { type: 'String', sampleValues: ['value1'] },
            },
            schemaMetadata: {
              maxNestingDepth: 2,
            },
          },
        },
        atlasConnectionInfo
      );

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });

    it('should not show Mock Data Generator button in non-Atlas environments', async function () {
      await renderCollectionHeaderWithExperimentation(
        {
          isAtlas: false, // Not Atlas
          isReadonly: false,
          namespace: 'test.collection',
        },
        {},
        {
          schemaAnalysis: {
            status: SCHEMA_ANALYSIS_STATE_COMPLETE,
            processedSchema: {
              field1: { type: 'String', sampleValues: ['value1'] },
            },
            schemaMetadata: {
              maxNestingDepth: 2,
            },
          },
        }
        // Don't pass atlasConnectionInfo to simulate non-Atlas environment
      );

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });

    it('should not show Mock Data Generator button when not in treatment variant', async function () {
      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'control',
          },
        },
      });

      await renderCollectionHeaderWithExperimentation(
        {
          isAtlas: true,
          isReadonly: false,
          namespace: 'test.collection',
        },
        {},
        {
          schemaAnalysis: {
            status: SCHEMA_ANALYSIS_STATE_COMPLETE,
            processedSchema: {
              field1: { type: 'String', sampleValues: ['value1'] },
            },
            schemaMetadata: {
              maxNestingDepth: 2,
            },
          },
        },
        atlasConnectionInfo
      );

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });
  });
});
