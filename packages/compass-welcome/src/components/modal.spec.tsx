import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';

import { WelcomeModal } from './modal';

describe('WelcomeModal', function () {
  let closeModalSpy: SinonSpy;
  let renderWelcomeModal: (
    props: Partial<ComponentProps<typeof WelcomeModal>>
  ) => void;

  beforeEach(function () {
    closeModalSpy = spy();

    renderWelcomeModal = (
      props: Partial<ComponentProps<typeof WelcomeModal>> = {}
    ) => {
      render(
        <WelcomeModal
          networkTraffic={true}
          isOpen={false}
          closeModal={closeModalSpy}
          {...props}
        />
      );
    };
  });

  it('renders', function () {
    renderWelcomeModal({ isOpen: true });

    const container = screen.queryByTestId('welcome-modal');
    expect(container).to.be.visible;
  });

  it('closes when clicking the Start button', function () {
    renderWelcomeModal({ isOpen: true });
    const startButton = screen.getByText('Start').closest('button');
    expect(startButton).to.be.visible;
    userEvent.click(startButton as Element);
    expect(closeModalSpy.calledOnceWith()).to.be.true;
  });

  it('closes when clicking the close button', function () {
    renderWelcomeModal({ isOpen: true });
    const closeButton = screen.getByLabelText('Close modal');
    userEvent.click(closeButton);
    expect(closeModalSpy.calledOnceWith()).to.be.true;
  });

  it('closes when clicking the settings link and asks to open the settings', function () {
    renderWelcomeModal({ isOpen: true });
    const settingsLink = screen.getByText('Settings');
    userEvent.click(settingsLink);
    expect(closeModalSpy.calledOnceWith(true)).to.be.true;
  });

  it('has no settings link when networkTraffic is false', function () {
    renderWelcomeModal({ isOpen: true, networkTraffic: false });
    const settingsLink = screen.queryByText('Settings');
    expect(settingsLink).to.not.exist;
  });
});
