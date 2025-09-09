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
      it('boundary: buildProgress = 0 (exactly) shows ready actions', function () {
        const exactlyZeroIndex = mockRegularIndex({
          name: 'exactly_zero',
          buildProgress: 0,
        });

        render(
          <IndexActions
            index={exactlyZeroIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should show ready actions, not building UI
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
        expect(screen.getByLabelText('Drop Index exactly_zero')).to.exist;
        expect(screen.getByLabelText('Hide Index exactly_zero')).to.exist;
      });

      it('boundary: buildProgress = 0.000001 (just above 0) shows building UI', function () {
        const barelyBuildingIndex = mockRegularIndex({
          name: 'barely_building',
          buildProgress: 0.000001,
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
        expect(screen.getByText('Building... 0%')).to.exist; // Math.trunc rounds down
        expect(screen.getByLabelText('Cancel Index barely_building')).to.exist;
      });

      it('boundary: buildProgress = 0.999999 (just below 1) shows building UI', function () {
        const almostCompleteIndex = mockRegularIndex({
          name: 'almost_complete',
          buildProgress: 0.999999,
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

      it('boundary: buildProgress = 1 (exactly) shows ready actions', function () {
        const exactlyOneIndex = mockRegularIndex({
          name: 'exactly_one',
          buildProgress: 1,
        });

        render(
          <IndexActions
            index={exactlyOneIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should show ready actions, not building UI
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
        expect(screen.getByLabelText('Drop Index exactly_one')).to.exist;
        expect(screen.getByLabelText('Hide Index exactly_one')).to.exist;
      });
    });

    describe('Permission handling (currentOp unavailable)', function () {
      it('handles missing currentOp permission correctly (buildProgress defaults to 0)', function () {
        // This simulates what happens when currentOp permission is not available
        // The index-detail-helper defaults buildProgress to 0
        const noPermissionIndex = mockRegularIndex({
          name: 'no_permission_index',
          buildProgress: 0, // This is what gets set when currentOp permission is unavailable
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

    describe('Extreme buildProgress values', function () {
      it('handles negative buildProgress as ready', function () {
        const negativeIndex = mockRegularIndex({
          name: 'negative_progress',
          buildProgress: -0.1,
        });

        render(
          <IndexActions
            index={negativeIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should treat as ready (negative should not show building UI)
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
      });

      it('handles buildProgress > 1 as ready', function () {
        const overOneIndex = mockRegularIndex({
          name: 'over_one',
          buildProgress: 1.1,
        });

        render(
          <IndexActions
            index={overOneIndex}
            serverVersion="5.0.0"
            onDeleteIndexClick={onDeleteIndexClick}
            onHideIndexClick={onHideIndexClick}
            onUnhideIndexClick={onUnhideIndexClick}
          />
        );

        // Should treat as ready (>1 should not show building UI)
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
        expect(screen.getByTestId('index-actions')).to.exist;
      });
    });
  });

  describe('Building State Tests', function () {
    const buildingIndexes = [
      { buildProgress: 0.1, expectedPercent: '10' },
      { buildProgress: 0.25, expectedPercent: '25' },
      { buildProgress: 0.5, expectedPercent: '50' },
      { buildProgress: 0.75, expectedPercent: '75' },
      { buildProgress: 0.99, expectedPercent: '99' },
    ];

    buildingIndexes.forEach(({ buildProgress, expectedPercent }) => {
      it(`shows building UI for buildProgress ${buildProgress} (${expectedPercent}%)`, function () {
        const buildingIndex = mockRegularIndex({
          name: 'building_index',
          buildProgress,
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
        expect(screen.getByText(`Building... ${expectedPercent}%`)).to.exist;

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
        buildProgress: 0,
        fields: [{ field: 'test', value: 1 }],
      };

      it('shows no actions for creating index', function () {
        render(
          <IndexActions
            index={creatingIndex}
            onDeleteFailedIndexClick={onDeleteFailedIndexClick}
          />
        );

        // For creating indexes, there should be no actions group rendered at all
        // since there are no actions available
        expect(screen.queryByTestId('index-actions')).to.not.exist;

        // Also should not show building spinner for creating state
        expect(screen.queryByTestId('index-building-spinner')).to.not.exist;
      });
    });

    describe('Failed State', function () {
      const failedIndex: InProgressIndex = {
        id: 'failed-index-id',
        name: 'failed_index',
        status: 'failed',
        error: 'Index creation failed',
        buildProgress: 0,
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
      buildProgress: 0,
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
          ).to.throw;
        }
      });
    });
  });

  describe('Action Event Handling', function () {
    const testIndex = mockRegularIndex({
      name: 'test_actions',
      buildProgress: 0,
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
        buildProgress: 0.5,
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
});
