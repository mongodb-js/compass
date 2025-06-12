import React from 'react';
import {
  renderWithConnections,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import { expect } from 'chai';

import Settings from './settings';
import { INITIAL_STATE } from '../../modules/settings';

function renderSettings(
  props: Partial<React.ComponentProps<typeof Settings>> = {},
  preferences: {
    enableAggregationBuilderExtraOptions?: boolean;
  } = {}
) {
  return renderWithConnections(
    <Settings
      isExpanded={false}
      isCommenting={false}
      applySettings={() => {}}
      toggleSettingsIsExpanded={() => {}}
      toggleSettingsIsCommentMode={() => {}}
      setSettingsSampleSize={() => {}}
      setSettingsLimit={() => {}}
      limit={INITIAL_STATE.sampleSize}
      largeLimit={INITIAL_STATE.limit}
      settings={INITIAL_STATE}
      {...props}
    />,
    {
      preferences,
    }
  );
}

const largeLimitOptionTestId = 'aggregation-settings-limit-input';

describe('Settings [Component]', function () {
  let applySettingsSpy: sinon.SinonSpy;
  let toggleSettingsIsExpandedSpy: sinon.SinonSpy;

  context('when the component is not atlas deployed', function () {
    it('is hidden by default', function () {
      renderSettings();
      expect(screen.queryByText('Settings')).to.not.exist;
    });

    it('is rendered when isExpanded=true', function () {
      renderSettings({
        isExpanded: true,
      });
      expect(screen.getByText('Settings')).to.be.visible;
    });

    it('shows the large limit option', function () {
      renderSettings({
        isExpanded: true,
      });
      expect(screen.getByTestId(largeLimitOptionTestId)).to.be.visible;
    });

    describe('When opened', function () {
      beforeEach(function () {
        applySettingsSpy = sinon.spy();
        toggleSettingsIsExpandedSpy = sinon.spy();
      });

      it('should close when Cancel is clicked', function () {
        renderSettings({
          isExpanded: true,
          applySettings: applySettingsSpy,
          toggleSettingsIsExpanded: toggleSettingsIsExpandedSpy,
        });
        userEvent.click(screen.getByTestId('aggregation-settings-cancel'));
        expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
      });

      it('should update the settings, re-run the pipeline, and Close', function () {
        renderSettings({
          isExpanded: true,
          applySettings: applySettingsSpy,
          toggleSettingsIsExpanded: toggleSettingsIsExpandedSpy,
        });
        userEvent.click(screen.getByTestId('aggregation-settings-apply'));

        expect(applySettingsSpy.calledOnce).to.equal(true);
        expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
      });
    });
  });

  context('when the component is atlas deployed', function () {
    beforeEach(function () {
      renderSettings(
        {
          isExpanded: true,
        },
        {
          enableAggregationBuilderExtraOptions: false,
        }
      );
    });

    it('hides the large limit option', function () {
      expect(screen.queryByTestId(largeLimitOptionTestId)).to.not.exist;
    });
  });
});
