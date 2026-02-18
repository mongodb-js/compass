import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import IndexActions from './index-actions';
import type { InProgressIndex } from '../../modules/regular-indexes';
import { mockRegularIndex } from '../../../test/helpers';

describe('IndexActions Component', function () {
  let onDeleteIndexClick: sinon.SinonSpy;
  let onDeleteFailedIndexClick: sinon.SinonSpy;
  let onHideIndexClick: sinon.SinonSpy;
  let onUnhideIndexClick: sinon.SinonSpy;

  beforeEach(function () {
    onDeleteIndexClick = sinon.spy();
    onDeleteFailedIndexClick = sinon.spy();
    onHideIndexClick = sinon.spy();
    onUnhideIndexClick = sinon.spy();
  });

  afterEach(cleanup);

  describe('Critical Boundary Cases', function () {
    describe('buildProgress transition boundaries', function () {
      it('boundary: active = false shows ready actions', function () {
        const readyIndex = mockRegularIndex({
          name: 'ready_index',
          buildProgress: { active: false },
        });

        render(
          <IndexActions
            index={readyIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should show ready actions, not building UI
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
        expect(screen.getByLabelText('Drop Index ready_index')).to.exist;
        expect(screen.getByLabelText('Hide Index ready_index')).to.exist;
      });

      it('boundary: active = true with progress = 0.000001 (just above 0) shows building UI', function () {
        const barelyBuildingIndex = mockRegularIndex({
          name: 'barely_building',
          buildProgress: { active: true, progress: 0.000001 },
        });

        render(
          <IndexActions
            index={barelyBuildingIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        // Should show building UI even for tiny progress
        expect(screen.getByTestId('index-building-spinner')).to.exist;
        expect(screen.getByText('Building… 0%')).to.exist; // Math.trunc rounds down
        expect(screen.getByLabelText('Cancel Index barely_building')).to.exist;
      });

      it('boundary: active = true with progress = 0.999999 (just below 1) shows building UI', function () {
        const almostCompleteIndex = mockRegularIndex({
          name: 'almost_complete',
          buildProgress: { active: true, progress: 0.999999 },
        });

        render(
          <IndexActions
            index={almostCompleteIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        // Should still show building UI
        expect(screen.getByTestId('index-building-spinner')).to.exist;
        expect(screen.getByText('Building… 99%')).to.exist; // Math.trunc rounds down
        expect(screen.getByLabelText('Cancel Index almost_complete')).to.exist;
      });

      it('boundary: active = false (completed) shows ready actions', function () {
        const completedIndex = mockRegularIndex({
          name: 'completed_index',
          buildProgress: { active: false },
        });

        render(
          <IndexActions
            index={completedIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should show ready actions, not building UI
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
        expect(screen.getByLabelText('Drop Index completed_index')).to.exist;
        expect(screen.getByLabelText('Hide Index completed_index')).to.exist;
      });
    });

    describe('Permission handling (currentOp unavailable)', function () {
      it('handles missing currentOp permission correctly (shows ready actions)', function () {
        // This simulates what happens when currentOp permission is not available
        // but $indexStats reports building: false
        const noPermissionIndex = mockRegularIndex({
          name: 'no_permission_index',
          buildProgress: { active: false, progressNotPermitted: true },
        });

        render(
          <IndexActions
            index={noPermissionIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should treat as ready index with full actions
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
        expect(screen.getByLabelText('Drop Index no_permission_index')).to
          .exist;
        expect(screen.getByLabelText('Hide Index no_permission_index')).to
          .exist;
      });
    });

    describe('Edge cases for buildProgress object', function () {
      it('handles active: true without progress property', function () {
        const activeNoProgress = mockRegularIndex({
          name: 'active_no_progress',
          buildProgress: { active: true },
        });

        render(
          <IndexActions
            index={activeNoProgress}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        // Should show building UI without percentage
        expect(screen.getByTestId('index-building-spinner')).to.exist;
        expect(screen.getByText('Building…')).to.exist;
        expect(screen.getByLabelText('Cancel Index active_no_progress')).to
          .exist;
      });

      it('handles active: true with secsRunning but no progress', function () {
        const activeWithTime = mockRegularIndex({
          name: 'active_with_time',
          buildProgress: { active: true, secsRunning: 120 },
        });

        render(
          <IndexActions
            index={activeWithTime}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        // Should show building UI with duration
        expect(screen.getByTestId('index-building-spinner')).to.exist;
        expect(screen.getByText(/Building For…/)).to.exist;
      });
    });
  });

  describe('Building State Tests', function () {
    const buildingIndexes = [
      { progress: 0.1, expectedPercent: '10' },
      { progress: 0.25, expectedPercent: '25' },
      { progress: 0.5, expectedPercent: '50' },
      { progress: 0.75, expectedPercent: '75' },
      { progress: 0.99, expectedPercent: '99' },
    ];

    buildingIndexes.forEach(({ progress, expectedPercent }) => {
      it(`shows building UI for progress ${progress} (${expectedPercent}%)`, function () {
        const buildingIndex = mockRegularIndex({
          name: 'building_index',
          buildProgress: { active: true, progress },
        });

        render(
          <IndexActions
            index={buildingIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        // Should show building UI
        const buildingSpinner = screen.getByTestId('index-building-spinner');
        expect(buildingSpinner).to.exist;

        // Should show progress percentage
        expect(screen.getByText(`Building… ${expectedPercent}%`)).to.exist;

        // Should show cancel button (destructive)
        const cancelButton = screen.getByLabelText(
          'Cancel Index building_index'
        );
        expect(cancelButton).to.exist;

        // Should NOT show hide/unhide actions for building indexes
        expect(screen.queryByLabelText('Hide Index building_index')).to.not
          .exist;
        expect(screen.queryByLabelText('Unhide Index building_index')).to.not
          .exist;
      });
    });
  });

  describe('In-Progress Index States', function () {
    describe('Creating State', function () {
      const creatingIndex: InProgressIndex = {
        id: 'creating-index-id',
        name: 'creating_index',
        status: 'creating',
        buildProgress: { active: true },
        fields: [{ field: 'test', value: 1 }],
      };

      it('shows building spinner for creating index', function () {
        render(
          <IndexActions
            index={creatingIndex}
            onDeleteIndexClick={onDeleteIndexClick}
            onDeleteFailedIndexClick={onDeleteFailedIndexClick}
          />
        );

        // Creating indexes should show building spinner
        expect(screen.getByTestId('index-building-spinner')).to.exist;
        expect(screen.getByText('Building…')).to.exist;
      });
    });

    describe('Failed State', function () {
      const failedIndex: InProgressIndex = {
        id: 'failed-index-id',
        name: 'failed_index',
        status: 'failed',
        error: 'Index creation failed',
        buildProgress: { active: false },
        fields: [{ field: 'test', value: 1 }],
      };

      it('shows delete action for failed index', function () {
        render(
          <IndexActions
            index={failedIndex}
            onDeleteFailedIndexClick={onDeleteFailedIndexClick}
          />
        );

        const actionsGroup = screen.getByTestId('index-actions');
        const deleteButton = within(actionsGroup).getByLabelText(
          'Drop Index failed_index'
        );
        expect(deleteButton).to.exist;
      });

      it('calls onDeleteFailedIndexClick when failed index delete is clicked', function () {
        render(
          <IndexActions
            index={failedIndex}
            onDeleteFailedIndexClick={onDeleteFailedIndexClick}
          />
        );

        const deleteButton = screen.getByLabelText('Drop Index failed_index');
        userEvent.click(deleteButton);

        expect(onDeleteFailedIndexClick).to.have.been.calledOnceWith(
          'failed_index'
        );
      });
    });
  });

  describe('Server Version Compatibility', function () {
    const testIndex = mockRegularIndex({
      name: 'version_test',
      buildProgress: { active: false },
    });

    const versionTestCases = [
      { version: '4.3.9', shouldHaveHide: false },
      { version: '4.4.0', shouldHaveHide: true },
      { version: '4.4.1', shouldHaveHide: true },
      { version: '5.0.0', shouldHaveHide: true },
      { version: '6.0.0', shouldHaveHide: true },
      { version: 'invalid-version', shouldHaveHide: true }, // Invalid versions default to true
    ];

    versionTestCases.forEach(({ version, shouldHaveHide }) => {
      it(`${
        shouldHaveHide ? 'shows' : 'hides'
      } hide action for server version ${version}`, function () {
        render(
          <IndexActions
            index={testIndex}
            serverVersion={version}
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        const actionsGroup = screen.getByTestId('index-actions');

        if (shouldHaveHide) {
          const hideButton = within(actionsGroup).getByLabelText(
            'Hide Index version_test'
          );
          expect(hideButton).to.exist;
        } else {
          expect(() =>
            within(actionsGroup).getByLabelText('Hide Index version_test')
          ).to.throw();
        }
      });
    });
  });

  describe('Action Event Handling', function () {
    const testIndex = mockRegularIndex({
      name: 'test_actions',
      buildProgress: { active: false },
    });

    it('calls onDeleteIndexClick for regular index delete', function () {
      render(
        <IndexActions
          index={testIndex}
          serverVersion="5.0.0"
          onDeleteIndexClick={onDeleteIndexClick}
          onHideIndexClick={onHideIndexClick}
          onUnhideIndexClick={onUnhideIndexClick}
        />
      );

      const deleteButton = screen.getByLabelText('Drop Index test_actions');
      userEvent.click(deleteButton);

      expect(onDeleteIndexClick).to.have.been.calledOnceWith('test_actions');
    });

    it('calls onDeleteIndexClick for building index cancel (regular index)', function () {
      const buildingIndex = mockRegularIndex({
        name: 'test_actions',
        buildProgress: { active: true, progress: 0.5 },
      });

      render(
        <IndexActions
          index={buildingIndex}
          serverVersion="5.0.0"
          onDeleteIndexClick={onDeleteIndexClick}
        />
      );

      const cancelButton = screen.getByLabelText('Cancel Index test_actions');
      userEvent.click(cancelButton);

      expect(onDeleteIndexClick).to.have.been.calledOnceWith('test_actions');
    });
  });

  describe('Duration Formatting', function () {
    const durationTestCases = [
      { secsRunning: 30, expectedPattern: /30\s*s/ },
      { secsRunning: 90, expectedPattern: /1\s*m.*30\s*s/ },
      { secsRunning: 3661, expectedPattern: /1\s*h.*1\s*m.*1\s*s/ },
      { secsRunning: 90061, expectedPattern: /1\s*d.*1\s*h.*1\s*m.*1\s*s/ },
      {
        secsRunning: 694861,
        expectedPattern: /1\s*w.*1\s*d.*1\s*h.*1\s*m.*1\s*s/,
      },
    ];

    durationTestCases.forEach(({ secsRunning, expectedPattern }) => {
      it(`formats ${secsRunning} seconds correctly`, function () {
        const index = mockRegularIndex({
          name: 'duration_test',
          buildProgress: { active: true, secsRunning },
        });

        render(
          <IndexActions
            index={index}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        expect(screen.getByText(/Building For…/)).to.exist;
        // The actual formatted text should contain the time units
        const buildingText = screen.getByText(/Building For…/).textContent;
        expect(buildingText).to.match(expectedPattern);
      });
    });

    it('shows duration instead of 0% when progress is 0', function () {
      const index = mockRegularIndex({
        name: 'zero_progress_with_time',
        buildProgress: { active: true, progress: 0, secsRunning: 120 },
      });

      render(
        <IndexActions
          index={index}
          serverVersion="5.0.0"
          onDeleteIndexClick={onDeleteIndexClick}
        />
      );

      // Should show duration, not "0%"
      expect(screen.getByText(/Building For…/)).to.exist;
      expect(screen.queryByText(/0%/)).to.not.exist;
    });
  });

  describe('Permission Error States', function () {
    describe('progressNotPermitted only', function () {
      it('shows building UI with "Building…" when active and progressNotPermitted', function () {
        // $indexStats succeeded (shows building: true), but $currentOp failed
        const index = mockRegularIndex({
          name: 'progress_not_permitted',
          buildProgress: {
            active: true,
            progressNotPermitted: true,
          },
        });

        render(
          <IndexActions
            index={index}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
          />
        );

        expect(screen.getByTestId('index-building-spinner')).to.exist;
        // Should show generic "Building…" without percentage or duration
        expect(screen.getByText('Building…')).to.exist;
        expect(screen.queryByText(/Building For…/)).to.not.exist;
        expect(screen.queryByText(/%/)).to.not.exist;
      });
    });

    describe('statsNotPermitted only', function () {
      it('shows ready actions when index not building and statsNotPermitted', function () {
        // $indexStats failed but $currentOp succeeded and shows no build in progress
        const index = mockRegularIndex({
          name: 'stats_not_permitted',
          buildProgress: {
            active: false,
            statsNotPermitted: true,
          },
        });

        render(
          <IndexActions
            index={index}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
          />
        );

        // Should show ready actions
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
        expect(screen.getByLabelText('Drop Index stats_not_permitted')).to
          .exist;
      });
    });

    describe('both statsNotPermitted and progressNotPermitted', function () {
      it('shows ready actions when both permissions denied but not active', function () {
        // Both $indexStats and $currentOp failed
        const index = mockRegularIndex({
          name: 'both_not_permitted',
          buildProgress: {
            active: false,
            statsNotPermitted: true,
            progressNotPermitted: true,
            msg: 'user is not permitted, user is not permitted',
          },
        });

        render(
          <IndexActions
            index={index}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
          />
        );

        // When both fail and we can't determine status, we show ready actions
        // (the "unknown" status badge is shown in the StatusField component, not here)
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
      });
    });
  });

  describe('Message (msg) Field Handling', function () {
    it('includes msg in buildProgress for building index', function () {
      // The msg field is passed to StatusField for tooltip display,
      // but the IndexActions component uses it when progressNotPermitted is true
      const index = mockRegularIndex({
        name: 'index_with_msg',
        buildProgress: {
          active: true,
          progress: 0.5,
          msg: 'Index Build: draining writes received during build',
        },
      });

      render(
        <IndexActions
          index={index}
          serverVersion="5.0.0"
          onDeleteIndexClick={onDeleteIndexClick}
        />
      );

      // Should show building UI with progress
      expect(screen.getByTestId('index-building-spinner')).to.exist;
      expect(screen.getByText('Building… 50%')).to.exist;
    });
  });
});
