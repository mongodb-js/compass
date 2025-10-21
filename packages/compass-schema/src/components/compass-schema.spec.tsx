import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  screen,
  renderWithConnections,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import { CompassExperimentationProvider } from '@mongodb-js/compass-telemetry';
import { ExperimentTestGroup } from '@mongodb-js/compass-telemetry/provider';
import QueryBarPlugin from '@mongodb-js/compass-query-bar';
import {
  createElectronFavoriteQueryStorage,
  createElectronRecentQueryStorage,
} from '@mongodb-js/my-queries-storage/electron';

import CompassSchema from './compass-schema';
import { configureStore } from '../stores/store';

// Mock services for the store
const mockServices = {
  dataService: {
    sampleCursor: () => Promise.resolve([]),
  },
  connectionInfoRef: { current: { id: 'test' } },
  localAppRegistry: {
    on: sinon.stub(),
    emit: sinon.stub(),
    removeListener: sinon.stub(),
  },
  globalAppRegistry: {
    on: sinon.stub(),
    emit: sinon.stub(),
    removeListener: sinon.stub(),
  },
  logger: { log: sinon.stub() },
  track: sinon.stub(),
  preferences: { getPreferences: () => ({}) },
  fieldStoreService: {},
  queryBar: {},
} as any;

const MockQueryBarPlugin = QueryBarPlugin.withMockServices({
  dataService: {
    sample() {
      return Promise.resolve([]);
    },
    getConnectionString() {
      return { hosts: [] } as any;
    },
  },
  instance: { on() {}, removeListener() {} } as any,
  favoriteQueryStorageAccess: {
    getStorage: () =>
      createElectronFavoriteQueryStorage({ basepath: '/tmp/test' }),
  },
  recentQueryStorageAccess: {
    getStorage: () =>
      createElectronRecentQueryStorage({ basepath: '/tmp/test' }),
  },
  atlasAiService: {} as any,
});

describe('CompassSchema Component', function () {
  let store: ReturnType<typeof configureStore>;

  beforeEach(function () {
    store = configureStore(mockServices, 'test.collection');
  });

  afterEach(function () {
    sinon.restore();
  });

  // Helper function to render CompassSchema with mocked experimentation provider
  function renderCompassSchemaWithExperimentation(experimentationOptions?: {
    isInExperiment?: boolean;
    isInVariant?: boolean;
  }) {
    const mockUseAssignment = sinon.stub();
    const mockUseTrackInSample = sinon.stub();
    const mockAssignExperiment = sinon.stub();
    const mockGetAssignment = sinon.stub();

    const commonAsyncStatus = {
      asyncStatus: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
    };

    if (experimentationOptions?.isInExperiment) {
      if (experimentationOptions?.isInVariant) {
        mockUseAssignment.returns({
          assignment: {
            assignmentData: {
              variant: ExperimentTestGroup.atlasSkillsVariant,
            },
          },
          ...commonAsyncStatus,
        });
      } else {
        mockUseAssignment.returns({
          assignment: {
            assignmentData: {
              variant: ExperimentTestGroup.atlasSkillsControl,
            },
          },
          ...commonAsyncStatus,
        });
      }
    } else {
      mockUseAssignment.returns({
        assignment: null,
        ...commonAsyncStatus,
      });
    }

    mockUseTrackInSample.returns(commonAsyncStatus);
    mockAssignExperiment.returns(Promise.resolve(null));
    mockGetAssignment.returns(Promise.resolve(null));

    renderWithConnections(
      <CompassExperimentationProvider
        useAssignment={mockUseAssignment}
        useTrackInSample={mockUseTrackInSample}
        assignExperiment={mockAssignExperiment}
        getAssignment={mockGetAssignment}
      >
        <MockQueryBarPlugin
          namespace="test.collection"
          isReadonly={false}
          isTimeSeries={false}
          isClustered={false}
          isSearchIndexesSupported={false}
          sourceName=""
          editViewName=""
          isFLE={false}
          isDataLake={false}
          isAtlas={false}
          serverVersion="6.0.0"
        >
          <Provider store={store}>
            <CompassSchema />
          </Provider>
        </MockQueryBarPlugin>
      </CompassExperimentationProvider>
    );

    return { store };
  }

  describe('Atlas Skills Banner', function () {
    it('should show skills banner when user is in experiment and in variant', function () {
      renderCompassSchemaWithExperimentation({
        isInExperiment: true,
        isInVariant: true,
      });

      expect(
        screen.getByText(
          'Learn how to add schema validation in this skill badge'
        )
      ).to.be.visible;

      expect(screen.getByRole('link', { name: /go to skills/i })).to.be.visible;
      expect(
        screen.getByText(
          'Learn how to add schema validation in this skill badge'
        )
      ).to.be.visible;

      const goToSkillsButton = screen.getByRole('link', {
        name: /go to skills/i,
      });

      expect(goToSkillsButton).to.be.visible;
      expect(goToSkillsButton.getAttribute('href')).to.equal(
        'https://learn.mongodb.com/skills?team=growth&openTab=data+modeling'
      );
    });

    it('should not show skills banner when user is in experiment but not in variant', function () {
      renderCompassSchemaWithExperimentation({
        isInExperiment: true,
        isInVariant: false,
      });

      expect(
        screen.queryByText(
          'Learn how to add schema validation in this skill badge'
        )
      ).to.not.exist;
      expect(screen.queryByRole('link', { name: /go to skills/i })).to.not
        .exist;
    });

    it('should not show skills banner by default when user is not in experiment', function () {
      renderCompassSchemaWithExperimentation({
        isInExperiment: false,
        isInVariant: false,
      });

      expect(
        screen.queryByText(
          'Learn how to add schema validation in this skill badge'
        )
      ).to.not.exist;
      expect(screen.queryByRole('link', { name: /go to skills/i })).to.not
        .exist;
    });

    it('should not show skills banner when experiment assignment is null', function () {
      renderCompassSchemaWithExperimentation({
        isInExperiment: false,
        isInVariant: false,
      });

      expect(
        screen.queryByText(
          'Learn how to add schema validation in this skill badge'
        )
      ).to.not.exist;
      expect(screen.queryByRole('link', { name: /go to skills/i })).to.not
        .exist;
    });

    it('should dismiss banner when close button is clicked', async function () {
      renderCompassSchemaWithExperimentation({
        isInExperiment: true,
        isInVariant: true,
      });

      expect(
        screen.getByText(
          'Learn how to add schema validation in this skill badge'
        )
      ).to.be.visible;

      const closeButton = screen.getByRole('button', {
        name: 'Dismiss Skills Banner',
      });
      userEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText(
            'Learn how to add schema validation in this skill badge'
          )
        ).to.not.exist;
      });
    });
  });
});
