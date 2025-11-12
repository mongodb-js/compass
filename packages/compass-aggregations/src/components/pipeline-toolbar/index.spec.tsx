import React from 'react';
import {
  cleanup,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { renderWithStore } from '../../../test/configure-store';
import { PipelineToolbar } from './index';
import { createElectronPipelineStorage } from '@mongodb-js/my-queries-storage/electron';
import { CompassExperimentationProvider } from '@mongodb-js/compass-telemetry';
import { ExperimentTestGroup } from '@mongodb-js/compass-telemetry/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

describe('PipelineToolbar', function () {
  describe('renders with setting row - visible', function () {
    let toolbar: HTMLElement;
    beforeEach(async function () {
      await renderWithStore(
        <PipelineToolbar
          isBuilderView
          showExportButton
          showRunButton
          showExplainButton
        />,
        { pipeline: [{ $match: { _id: 1 } }] },
        undefined,
        {
          pipelineStorage: {
            getStorage: () =>
              createElectronPipelineStorage({ basepath: '/tmp/test' }),
          },
        }
      );
      toolbar = screen.getByTestId('pipeline-toolbar');
    });

    afterEach(cleanup);

    it('renders toolbar', function () {
      expect(toolbar, 'should render toolbar').to.exist;
    });

    it('renders toolbar header', function () {
      const header = within(toolbar).getByTestId('pipeline-header');
      expect(header).to.exist;

      expect(
        within(header).getByTestId('pipeline-toolbar-open-pipelines-button'),
        'shows open saved pipelines button'
      ).to.exist;

      expect(
        within(header).getByTestId('toolbar-pipeline-stages'),
        'shows pipeline stages'
      ).to.exist;

      expect(
        within(header).getByTestId('pipeline-toolbar-run-button'),
        'shows run pipeline button'
      ).to.exist;
      expect(
        within(header).getByTestId('pipeline-toolbar-options-button'),
        'shows options button'
      ).to.exist;
    });

    it('renders toolbar options', function () {
      // Click the options toggle
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-options-button')
      );
      const options = within(toolbar).getByTestId('pipeline-options');
      expect(options).to.exist;

      expect(
        within(options).getByTestId('collation-toolbar-input-label'),
        'shows collation'
      ).to.exist;
    });

    it('renders toolbar settings', function () {
      const settings = within(toolbar).getByTestId('pipeline-settings');
      expect(settings).to.exist;

      expect(within(settings).getByTestId('pipeline-name'), 'shows name').to
        .exist;

      expect(
        within(settings)
          .getByTestId('pipeline-name')
          ?.textContent?.trim()
          .toLowerCase(),
        'shows untitled as default name'
      ).to.equal('untitled');

      expect(
        within(settings).getByTestId('save-menu-show-actions'),
        'shows save menu'
      ).to.exist;

      expect(
        within(settings).getByTestId('pipeline-toolbar-create-new-button'),
        'shows create-new button'
      ).to.exist;
      expect(
        within(settings).getByTestId('pipeline-toolbar-export-button'),
        'shows export to language button'
      ).to.exist;

      expect(
        within(settings).getByTestId('pipeline-toolbar-preview-toggle'),
        'shows auto-preview toggle'
      ).to.exist;
      expect(
        within(settings).getByTestId('pipeline-toolbar-settings-button'),
        'shows settings button'
      ).to.exist;
    });

    it('renders menus', function () {
      const settings = within(toolbar).getByTestId('pipeline-settings');

      userEvent.click(within(settings).getByTestId('save-menu-show-actions'));
      const saveMenuContent = screen.getByTestId('save-menu');
      expect(saveMenuContent.childNodes[0].textContent).to.equal('Save');
      expect(saveMenuContent.childNodes[1].textContent).to.equal('Save as');
      expect(saveMenuContent.childNodes[2].textContent).to.equal('Create view');
    });
  });

  describe('renders with setting row - hidden', function () {
    it('does not render toolbar settings', async function () {
      await renderWithStore(
        <PipelineToolbar
          isBuilderView
          showExplainButton
          showExportButton
          showRunButton
        />
      );
      const toolbar = screen.getByTestId('pipeline-toolbar');
      // TODO
      //expect(within(toolbar).queryByTestId('pipeline-settings')).to.not.exist;
    });
  });

  // @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
  describe('Atlas Skills Banner', function () {
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
    });

    // Helper function to render PipelineToolbar with mocked experimentation provider
    async function renderPipelineToolbarWithExperimentation(experimentationOptions?: {
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

      // Configure the mock based on experiment options
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

      return await renderWithStore(
        <CompassExperimentationProvider
          useAssignment={mockUseAssignment}
          useTrackInSample={mockUseTrackInSample}
          assignExperiment={mockAssignExperiment}
          getAssignment={mockGetAssignment}
        >
          <PipelineToolbar
            isBuilderView
            showRunButton
            showExportButton
            showExplainButton
          />
        </CompassExperimentationProvider>,
        { pipeline: [] }, // Initial state
        undefined, // Connection info
        {
          preferences,
        }
      );
    }

    it('should show skills banner when user is in experiment and in variant', async function () {
      await renderPipelineToolbarWithExperimentation({
        isInExperiment: true,
        isInVariant: true,
      });

      expect(
        screen.getByText(
          'Learn how to build aggregation pipelines to process, transform, and analyze data efficiently.'
        )
      ).to.be.visible;
      expect(screen.getByRole('link', { name: /go to skills/i })).to.be.visible;
      expect(screen.getByLabelText('Award Icon')).to.be.visible;
    });

    it('should not show skills banner when user is in experiment but not in variant', async function () {
      await renderPipelineToolbarWithExperimentation({
        isInExperiment: true,
        isInVariant: false,
      });

      expect(
        screen.queryByText(
          'Learn how to build aggregation pipelines to process, transform, and analyze data efficiently.'
        )
      ).to.not.exist;
      expect(screen.queryByRole('link', { name: /go to skills/i })).to.not
        .exist;
    });

    it('should not show skills banner by default when user is not in experiment', async function () {
      await renderPipelineToolbarWithExperimentation({
        isInExperiment: false,
        isInVariant: false,
      });

      expect(
        screen.queryByText(
          'Learn how to build aggregation pipelines to process, transform, and analyze data efficiently.'
        )
      ).to.not.exist;
      expect(screen.queryByRole('link', { name: /go to skills/i })).to.not
        .exist;
    });

    it('should dismiss banner when close button is clicked', async function () {
      await renderPipelineToolbarWithExperimentation({
        isInExperiment: true,
        isInVariant: true,
      });

      const closeButton = screen.getByRole('button', {
        name: 'Dismiss Skills Banner',
      });

      expect(closeButton).to.be.visible;
      userEvent.click(closeButton);

      expect(
        screen.queryByText(
          'Learn how to build aggregation pipelines to process, transform, and analyze data efficiently.'
        )
      ).to.not.exist;
    });
  });
});
