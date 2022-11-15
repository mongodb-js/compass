import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { FeaturesSettings } from './features';

describe('FeaturesSettings', function () {
  let container: HTMLElement;
  let handleChangeSpy: sinon.SinonSpy;

  beforeEach(function () {
    handleChangeSpy = spy();
    render(
      <FeaturesSettings
        handleChange={handleChangeSpy}
        preferenceStates={{}}
        checkboxValues={{} as any}
      />
    );
    container = screen.getByTestId('features-settings');
  });

  ['readOnly', 'enableShell', 'protectConnectionStrings'].forEach((option) => {
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
