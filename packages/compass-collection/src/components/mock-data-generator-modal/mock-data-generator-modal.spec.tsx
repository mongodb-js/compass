import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import { UnconnectedMockDataGeneratorModal as MockDataGeneratorModal } from './mock-data-generator-modal';
import { MockDataGeneratorStep } from './types';
import { StepButtonLabelMap } from './constants';

describe('MockDataGeneratorModal', () => {
  const sandbox = Sinon.createSandbox();
  let onClose: Sinon.SinonSpy;

  beforeEach(() => {
    onClose = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const onNextStep = Sinon.stub();
  const onPreviousStep = Sinon.stub();

  function renderModal({
    isOpen = true,
    currentStep = MockDataGeneratorStep.AI_DISCLAIMER,
  } = {}) {
    return render(
      <MockDataGeneratorModal
        isOpen={isOpen}
        onClose={onClose}
        currentStep={currentStep}
        onNextStep={onNextStep}
        onPreviousStep={onPreviousStep}
      />
    );
  }

  it('renders the modal when isOpen is true', () => {
    renderModal();

    expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
  });

  it('does not render the modal when isOpen is false', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist;
  });

  it('calls onClose when the modal is closed', () => {
    renderModal();

    screen.getByLabelText('Close modal').click();

    expect(onClose.calledOnce).to.be.true;
  });

  it('calls onClose when the cancel button is clicked', () => {
    renderModal();

    screen.getByText('Cancel').click();

    expect(onClose.calledOnce).to.be.true;
  });

  it('disables the Back button on the first step', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: 'Back' }).getAttribute('aria-disabled')
    ).to.equal('true');
  });

  describe('when rendering the modal in a specific step', () => {
    const steps = Object.keys(
      StepButtonLabelMap
    ) as unknown as MockDataGeneratorStep[];

    steps.forEach((currentStep) => {
      it(`renders the button with the correct label when the user is in step "${currentStep}"`, () => {
        renderModal({ currentStep });
        expect(screen.getByTestId('next-step-button')).to.have.text(
          StepButtonLabelMap[currentStep]
        );
      });
    });
  });
});
