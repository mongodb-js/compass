import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import MockDataGeneratorModal from './mock-data-generator-modal';
import { MockDataGeneratorSteps } from './types.ts';

describe('MockDataGeneratorModal', function () {
  const sandbox = Sinon.createSandbox();
  let setIsOpen: Sinon.SinonSpy;

  beforeEach(function () {
    setIsOpen = sandbox.spy();
  });

  afterEach(function () {
    sandbox.restore();
  });

  const renderModal = () => {
    return render(
      <MockDataGeneratorModal isOpen={true} setIsOpen={setIsOpen} />
    );
  };

  it('renders the modal when isOpen is true', function () {
    renderModal();

    expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
  });

  it('calls setIsOpen(false) when the modal is closed', function () {
    renderModal();

    screen.getByLabelText('Close modal').click();

    expect(setIsOpen.calledOnceWith(false)).to.be.true;
  });

  it('calls setIsOpen(false) when the cancel button is clicked', function () {
    renderModal();

    screen.getByText('Cancel').click();

    expect(setIsOpen.calledOnceWith(false)).to.be.true;
  });

  it('renders the first step by default', function () {
    renderModal();

    expect(
      screen.getByTestId(
        `generate-mock-data-step-${MockDataGeneratorSteps.AI_DISCLAIMER}`
      )
    ).to.exist;
  });
});
