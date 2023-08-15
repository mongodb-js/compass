import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { PrivacySettings } from './privacy';

describe('PrivacySettings', function () {
  let container: HTMLElement;
  let onChangeSpy: sinon.SinonSpy;

  beforeEach(function () {
    onChangeSpy = spy();
    render(
      <PrivacySettings
        onChange={onChangeSpy}
        preferenceStates={{}}
        currentValues={{} as any}
      />
    );
    container = screen.getByTestId('privacy-settings');
  });

  [
    'autoUpdates',
    'enableMaps',
    'trackUsageStatistics',
    'enableFeedbackPanel',
  ].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`calls onChange when ${option} is changed`, function () {
      expect(onChangeSpy.calledOnce).to.be.false;
      const checkbox = within(container).getByTestId(option);
      userEvent.click(checkbox, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onChangeSpy.calledWith(option, true)).to.be.true;
    });
  });
});
