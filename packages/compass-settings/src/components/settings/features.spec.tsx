import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stub } from 'sinon';
import { expect } from 'chai';

import { FeaturesSettings } from './features';

describe('FeaturesSettings', function () {
  let container: HTMLElement;
  let handleChangeSpy: sinon.SinonStub;
  let currentValues: any;

  beforeEach(function () {
    currentValues = {};
    handleChangeSpy = stub();
    const component = () => (
      <FeaturesSettings
        handleChange={handleChangeSpy}
        preferenceStates={{}}
        currentValues={currentValues}
      />
    );
    const { rerender } = render(component());
    handleChangeSpy.callsFake((option, value) => {
      currentValues[option] = value;
      rerender(component());
    });
    container = screen.getByTestId('features-settings');
  });

  [
    'readOnly',
    'enableShell',
    'protectConnectionStrings',
    'showKerberosPasswordField',
  ].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`calls handleChange when ${option} is changed`, function () {
      expect(handleChangeSpy).to.not.have.been.called;
      const checkbox = within(container).getByTestId(option);
      userEvent.click(checkbox, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(handleChangeSpy).to.have.been.calledOnceWithExactly(option, true);
      expect(currentValues[option]).to.equal(true);
    });
  });

  [
    // 'maxTimeMS',
  ].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`calls handleChange when ${option} is changed`, function () {
      expect(handleChangeSpy).to.not.have.been.called;
      const field = within(container).getByTestId(option);
      userEvent.type(field, '42');
      expect(handleChangeSpy).to.have.been.calledWithExactly(option, 42);
      expect(currentValues[option]).to.equal(42);
      userEvent.clear(field);
      expect(handleChangeSpy).to.have.been.calledWithExactly(option, undefined);
      expect(currentValues[option]).to.equal(undefined);
    });
  });
});
