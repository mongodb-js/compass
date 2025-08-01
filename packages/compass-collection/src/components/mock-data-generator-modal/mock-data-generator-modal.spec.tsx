import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import MockDataGeneratorModal from './mock-data-generator-modal';
import { MockDataGeneratorStep } from './types';
import { StepButtonLabelMap } from './constants';

describe('MockDataGeneratorModal', () => {
  const sandbox = Sinon.createSandbox();
  let setIsOpen: Sinon.SinonSpy;

  beforeEach(() => {
    setIsOpen = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function renderModal({
    isOpen = true,
    currentStep = MockDataGeneratorStep.AI_DISCLAIMER,
  } = {}) {
    function MockDataGeneratorModalWrapper() {
      const [currentStepStateMock, setCurrentStepStateMock] =
        React.useState<MockDataGeneratorStep>(currentStep);
      return (
        <MockDataGeneratorModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          currentStep={currentStepStateMock}
          setCurrentStep={(step) => {
            setCurrentStepStateMock(step);
          }}
        />
      );
    }
    return render(<MockDataGeneratorModalWrapper />);
  }

  it('renders the modal when isOpen is true', () => {
    renderModal();

    expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
  });

  it('does not render the modal when isOpen is false', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist;
  });

  it('calls setIsOpen(false) when the modal is closed', () => {
    renderModal();

    screen.getByLabelText('Close modal').click();

    expect(setIsOpen.calledOnceWith(false)).to.be.true;
  });

  it('calls setIsOpen(false) when the cancel button is clicked', () => {
    renderModal();

    screen.getByText('Cancel').click();

    expect(setIsOpen.calledOnceWith(false)).to.be.true;
  });

  it('disables the Back button on the first step', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: 'Back' }).getAttribute('aria-disabled')
    ).to.equal('true');
  });

  describe('when rendering the modal in a specific step', () => {
    const steps = Object.values(MockDataGeneratorStep).filter(
      (step) => typeof step === 'number'
    ) as MockDataGeneratorStep[];

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
