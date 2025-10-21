import { expect } from 'chai';
import React, { type ComponentProps } from 'react';
import {
  renderWithActiveConnection,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import { ExperimentTestName } from '@mongodb-js/compass-telemetry/provider';
import { CompassExperimentationProvider } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

import CollectionHeaderActions from '../collection-header-actions';

describe('CollectionHeaderActions [Component]', function () {
  let mockUseAssignment: sinon.SinonStub;

  beforeEach(function () {
    mockUseAssignment = sinon.stub();
    mockUseAssignment.returns({
      assignment: {
        assignmentData: {
          variant: 'mockDataGeneratorControl',
        },
      },
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  const renderCollectionHeaderActions = (
    props: Partial<ComponentProps<typeof CollectionHeaderActions>> = {},
    workspaceService: Partial<WorkspacesService> = {},
    connectionInfo?: ConnectionInfo,
    preferences?: Record<string, boolean>
  ) => {
    return renderWithActiveConnection(
      <CompassExperimentationProvider
        useAssignment={mockUseAssignment}
        useTrackInSample={sinon.stub()}
        assignExperiment={sinon.stub()}
        getAssignment={sinon.stub().resolves(null)}
      >
        <WorkspacesServiceProvider
          value={workspaceService as WorkspacesService}
        >
          <CollectionHeaderActions
            namespace="test.test"
            isReadonly={false}
            onOpenMockDataModal={sinon.stub()}
            hasSchemaAnalysisData={true}
            analyzedSchemaDepth={2}
            schemaAnalysisStatus="complete"
            schemaAnalysisError={null}
            {...props}
          />
        </WorkspacesServiceProvider>
      </CompassExperimentationProvider>,
      connectionInfo,
      { preferences }
    );
  };

  context('when the collection is not readonly', function () {
    beforeEach(async function () {
      await renderCollectionHeaderActions({
        isReadonly: false,
        namespace: 'db.coll2',
        sourceName: 'db.coll',
      });
    });

    it('does not render any buttons', function () {
      expect(
        screen.queryByTestId('collection-header-actions-edit-button')
      ).to.not.exist;
      expect(
        screen.queryByTestId('collection-header-actions-return-to-view-button')
      ).to.not.exist;
    });
  });

  context('Compass readonly mode', function () {
    it('does not render edit view buttons when in ReadWrite mode', async function () {
      await renderCollectionHeaderActions(
        {
          isReadonly: true,
          namespace: 'db.coll2',
          sourceName: 'db.someSource',
          sourcePipeline: [{ $match: { a: 1 } }],
        },
        undefined,
        undefined,
        { readWrite: true }
      );

      expect(
        screen.queryByTestId('collection-header-actions-edit-button')
      ).to.not.exist;
      expect(
        screen.queryByTestId('collection-header-actions-return-to-view-button')
      ).to.not.exist;
    });

    it('renders edit view buttons when not in readonly mode', async function () {
      await renderCollectionHeaderActions({
        isReadonly: true,
        namespace: 'db.coll2',
        sourceName: 'db.someSource',
        sourcePipeline: [{ $match: { a: 1 } }],
      });

      expect(
        screen.getByTestId('collection-header-actions-edit-button')
      ).to.be.visible;
    });
  });

  context('when the collection is a view', function () {
    let openEditViewWorkspaceStub: sinon.SinonStub;
    beforeEach(async function () {
      openEditViewWorkspaceStub = sinon.stub();
      await renderCollectionHeaderActions(
        {
          isReadonly: true,
          namespace: 'db.coll2',
          sourceName: 'db.someSource',
          sourcePipeline: [{ $match: { a: 1 } }],
        },
        {
          openEditViewWorkspace: openEditViewWorkspaceStub,
        }
      );
    });

    it('shows a button to edit the view pipeline', function () {
      expect(
        screen.getByTestId('collection-header-actions-edit-button')
      ).to.exist;
    });
    it('calls openEditViewWorkspace when the edit button is clicked', function () {
      expect(openEditViewWorkspaceStub).to.not.have.been.called;
      const button = screen.getByTestId(
        'collection-header-actions-edit-button'
      );
      button.click();
      expect(openEditViewWorkspaceStub).to.have.been.calledOnceWith(
        'TEST',
        'db.coll2',
        {
          sourceName: 'db.someSource',
          sourcePipeline: [{ $match: { a: 1 } }],
        }
      );
    });
  });

  context('when the collection is editing a view', function () {
    let openCollectionWorkspaceStub: sinon.SinonStub;
    beforeEach(async function () {
      openCollectionWorkspaceStub = sinon.stub();
      await renderCollectionHeaderActions(
        {
          isReadonly: false,
          namespace: 'db.coll2',
          editViewName: 'db.editing',
        },
        {
          openCollectionWorkspace: openCollectionWorkspaceStub,
        }
      );
    });
    it('shows a button to return to the view', function () {
      expect(
        screen.getByTestId('collection-header-actions-return-to-view-button')
      ).to.exist;
    });
    it('calls openCollectionWorkspace when the return to view button is clicked', function () {
      expect(openCollectionWorkspaceStub).to.not.have.been.called;
      const button = screen.getByTestId(
        'collection-header-actions-return-to-view-button'
      );
      button.click();
      expect(openCollectionWorkspaceStub).to.have.been.calledOnceWith(
        'TEST',
        'db.editing'
      );
    });
  });

  context('Mock Data Generator Button', function () {
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

    it('should call useAssignment with correct parameters', async function () {
      await renderCollectionHeaderActions({
        namespace: 'test.collection',
        isReadonly: false,
      });

      expect(mockUseAssignment).to.have.been.calledWith(
        ExperimentTestName.mockDataGenerator,
        true // trackIsInSample - Experiment viewed analytics event
      );
    });

    context('when in the mock data generator treatment variant', function () {
      beforeEach(function () {
        mockUseAssignment.returns({
          assignment: {
            assignmentData: {
              variant: 'mockDataGeneratorVariant',
            },
          },
        });
      });

      it('should send a track event when the button is viewed', async function () {
        const result = await renderCollectionHeaderActions(
          {
            namespace: 'test.collection',
            isReadonly: false,
          },
          {},
          atlasConnectionInfo
        );

        await waitFor(() => {
          expect(result.track).to.have.been.calledWith(
            'Mock Data Generator CTA Button Viewed',
            {
              button_enabled: true,
              gen_ai_features_enabled: false,
              send_sample_values_enabled: false,
            }
          );
        });
      });

      it('should call onOpenMockDataModal when CTA button is clicked', async function () {
        const onOpenMockDataModal = sinon.stub();
        await renderCollectionHeaderActions(
          {
            namespace: 'test.collection',
            isReadonly: false,
            onOpenMockDataModal,
          },
          {},
          atlasConnectionInfo
        );

        const button = screen.getByTestId(
          'collection-header-generate-mock-data-button'
        );
        button.click();

        expect(onOpenMockDataModal).to.have.been.calledOnce;
      });

      it('sends a track event when CTA button is clicked', async function () {
        const onOpenMockDataModal = sinon.stub();

        const result = await renderCollectionHeaderActions(
          {
            namespace: 'test.collection',
            isReadonly: false,
            onOpenMockDataModal,
          },
          {},
          atlasConnectionInfo
        );

        const button = screen.getByTestId(
          'collection-header-generate-mock-data-button'
        );
        button.click();

        await waitFor(() => {
          expect(result.track).to.have.been.calledWith(
            'Mock Data Generator Opened',
            {
              gen_ai_features_enabled: false,
              send_sample_values_enabled: false,
            }
          );
        });
      });

      it('should disable button for deeply nested collections', async function () {
        await renderCollectionHeaderActions(
          {
            namespace: 'test.collection',
            isReadonly: false,
            hasSchemaAnalysisData: true,
            analyzedSchemaDepth: 5, // Exceeds MAX_COLLECTION_NESTING_DEPTH (3)
            schemaAnalysisStatus: 'complete',
            onOpenMockDataModal: sinon.stub(),
          },
          {},
          atlasConnectionInfo
        );

        const button = screen.getByTestId(
          'collection-header-generate-mock-data-button'
        );
        expect(button).to.exist;
        expect(button).to.have.attribute('aria-disabled', 'true');
      });

      it('should show an error banner when the schema is in an unsupported state', async function () {
        await renderCollectionHeaderActions(
          {
            namespace: 'test.collection',
            isReadonly: false,
            hasSchemaAnalysisData: false,
            schemaAnalysisStatus: 'error',
            schemaAnalysisError: {
              errorType: 'unsupportedState',
              errorMessage: 'Unsupported state',
            },
            onOpenMockDataModal: sinon.stub(),
          },
          {},
          atlasConnectionInfo
        );

        const button = screen.getByTestId(
          'collection-header-generate-mock-data-button'
        );
        expect(button).to.exist;
        expect(button).to.have.attribute('aria-disabled', 'true');
      });
    });
  });
});
