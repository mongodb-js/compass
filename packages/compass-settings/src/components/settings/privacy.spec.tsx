import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { PrivacySettings } from './privacy';

describe('PrivacySettings', function () {
  let container: HTMLElement;
  let handleChangeSpy: sinon.SinonSpy;

  beforeEach(function () {
    handleChangeSpy = spy();
    render(<PrivacySettings handleChange={handleChangeSpy} />);
    container = screen.getByTestId('privacy-settings');
  });

  [
    'autoUpdates',
    'enableMaps',
    'trackErrors',
    'trackUsageStatistics',
    'enableFeedbackPanel',
  ].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`calls handleChange when ${option} is changed`, function () {
      expect(handleChangeSpy.calledOnce).to.be.false;
      const checkbox = within(container).getByTestId(option);
      userEvent.click(checkbox, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(handleChangeSpy.calledWith(option, true)).to.be.true;
    });
  });
});
