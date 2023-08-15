import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { OIDCSettings } from './oidc-settings';

describe('OIDCSettings', function () {
  let container: HTMLElement;
  let onChangeSpy: sinon.SinonSpy;

  beforeEach(function () {
    onChangeSpy = spy();
    render(
      <OIDCSettings
        onChange={onChangeSpy}
        preferenceStates={{}}
        currentValues={{} as any}
      />
    );
    container = screen.getByTestId('oidc-settings');
  });

  ['showOIDCDeviceAuthFlow'].forEach((option) => {
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
