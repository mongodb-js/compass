import { expect } from 'chai';
import React, { type ComponentProps } from 'react';
import {
  renderWithActiveConnection,
  screen,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { ExperimentTestName } from '@mongodb-js/compass-telemetry/provider';
import { CompassExperimentationProvider } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

import CollectionHeaderActions from '../collection-header-actions';

describe('CollectionHeaderActions [Component]', function () {
  let preferences: PreferencesAccess;
  let mockUseAssignment: sinon.SinonStub;
  let mockGetAssignment: sinon.SinonStub;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    mockUseAssignment = sinon.stub();
    mockGetAssignment = sinon.stub();
    mockUseAssignment.returns({
      assignment: {
        assignmentData: {
          variant: 'mockDataGeneratorControl',
        },
      },
    });
    mockGetAssignment.returns({
      assignmentData: {
        variant: 'mockDataGeneratorControl',
      },
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  const renderCollectionHeaderActions = (
    props: Partial<ComponentProps<typeof CollectionHeaderActions>> = {},
    workspaceService: Partial<WorkspacesService> = {},
    connectionInfo?: ConnectionInfo
  ) => {
    return renderWithActiveConnection(
      <CompassExperimentationProvider
        useAssignment={mockUseAssignment}
        assignExperiment={sinon.stub()}
        getAssignment={mockGetAssignment}
      >
        <WorkspacesServiceProvider
          value={workspaceService as WorkspacesService}
        >
          <PreferencesProvider value={preferences}>
            <CollectionHeaderActions
              namespace="test.test"
              isReadonly={false}
              onOpenMockDataModal={sinon.stub()}
              {...props}
            />
          </PreferencesProvider>
        </WorkspacesServiceProvider>
      </CompassExperimentationProvider>,
      connectionInfo
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

    afterEach(cleanup);

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
    it('does not render edit view buttons when in readonly mode', async function () {
      await preferences.savePreferences({ readOnly: true });

      await renderCollectionHeaderActions({
        isReadonly: true,
        namespace: 'db.coll2',
        sourceName: 'db.someSource',
        sourcePipeline: [{ $match: { a: 1 } }],
      });

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

    afterEach(cleanup);

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

    afterEach(cleanup);

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

    it('should not show Mock Data Generator button when user is in control group', async function () {
      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'mockDataGeneratorControl',
          },
        },
      });

      await renderCollectionHeaderActions(
        {
          namespace: 'test.collection',
          isReadonly: false,
        },
        {},
        atlasConnectionInfo
      );

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });

    it('should not show Mock Data Generator button when not in Atlas', async function () {
      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'treatment',
          },
        },
      });

      await renderCollectionHeaderActions({
        namespace: 'test.collection',
        isReadonly: false,
        // Don't pass atlasConnectionInfo, to simulate not being in Atlas
      });

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });

    it('should not show Mock Data Generator button for readonly collections', async function () {
      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'treatment',
          },
        },
      });

      await renderCollectionHeaderActions(
        {
          namespace: 'test.collection',
          isReadonly: true,
        },
        {},
        atlasConnectionInfo
      );

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });

    it('should not show Mock Data Generator button for views (sourceName present)', async function () {
      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'treatment',
          },
        },
      });

      await renderCollectionHeaderActions(
        {
          namespace: 'test.collection',
          isReadonly: false,
          sourceName: 'source-collection',
        },
        {},
        atlasConnectionInfo
      );

      expect(
        screen.queryByTestId('collection-header-generate-mock-data-button')
      ).to.not.exist;
    });

    it('should show Mock Data Generator button when user is in treatment group and in Atlas', async function () {
      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'mockDataGeneratorVariant',
          },
        },
      });

      await renderCollectionHeaderActions(
        {
          namespace: 'test.collection',
          isReadonly: false,
        },
        {},
        atlasConnectionInfo
      );

      expect(
        screen.getByTestId('collection-header-generate-mock-data-button')
      ).to.exist;
    });

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

    it('should call onOpenMockDataModal when CTA button is clicked', async function () {
      const onOpenMockDataModal = sinon.stub();

      mockUseAssignment.returns({
        assignment: {
          assignmentData: {
            variant: 'mockDataGeneratorVariant',
          },
        },
      });

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
  });
});
