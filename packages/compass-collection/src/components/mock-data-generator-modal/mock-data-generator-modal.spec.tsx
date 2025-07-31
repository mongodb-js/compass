import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import MockDataGeneratorModal from './mock-data-generator-modal';
import { MockDataGeneratorStep } from './types';

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

  it('renders the correct step when currentStep is set', () => {
    renderModal({ currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION });

    expect(
      screen.getByTestId(
        `generate-mock-data-step-${MockDataGeneratorStep.SCHEMA_CONFIRMATION}`
      )
    ).to.exist;
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

  it('renders the next step button with the correct label on each step', () => {
    renderModal();

    expect(screen.getByTestId('next-step-button')).to.have.text(
      'Use Natural Language'
    );
    screen.getByTestId('next-step-button').click();
    expect(screen.getByTestId('next-step-button')).to.have.text('Confirm');
    screen.getByTestId('next-step-button').click();
    expect(screen.getByTestId('next-step-button')).to.have.text('Next');
    screen.getByTestId('next-step-button').click();
    expect(screen.getByTestId('next-step-button')).to.have.text('Next');
    screen.getByTestId('next-step-button').click();
    expect(screen.getByTestId('next-step-button')).to.have.text(
      'Generate Script'
    );
    screen.getByTestId('next-step-button').click();
    expect(screen.getByTestId('next-step-button')).to.have.text('Done');
  });

  it('renders the first step by default', () => {
    renderModal();

    expect(
      screen.getByTestId(
        `generate-mock-data-step-${MockDataGeneratorStep.AI_DISCLAIMER}`
      )
    ).to.exist;
  });
});
