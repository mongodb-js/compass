import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import Sinon from 'sinon';
import { WelcomeModal } from '../index';

describe('WelcomeModal', function () {
  it('renders if was not shown before', function () {
    render(<WelcomeModal></WelcomeModal>, {
      preferences: { showedNetworkOptIn: false },
    });
    expect(screen.getByTestId('welcome-modal')).to.be.visible;
  });

  it('closes when clicking the Start button', async function () {
    render(<WelcomeModal></WelcomeModal>, {
      preferences: { showedNetworkOptIn: false },
    });
    const startButton = screen.getByRole('button', { name: 'Start' });
    expect(startButton).to.be.visible;
    userEvent.click(startButton);
    await waitFor(() => {
      expect(() => screen.getByTestId('welcome-modal')).to.throw();
    });
  });

  it('closes when clicking the close button', async function () {
    render(<WelcomeModal></WelcomeModal>, {
      preferences: { showedNetworkOptIn: false },
    });
    const closeButton = screen.getByLabelText('Close modal');
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(() => screen.getByTestId('welcome-modal')).to.throw();
    });
  });

  it('closes when clicking the settings link and asks to open the settings', async function () {
    const { globalAppRegistry } = render(<WelcomeModal></WelcomeModal>, {
      preferences: { showedNetworkOptIn: false },
    });
    const emitSpy = Sinon.spy(globalAppRegistry, 'emit');
    const settingsLink = screen.getByText('Settings');
    userEvent.click(settingsLink);
    await waitFor(() => {
      expect(() => screen.getByTestId('welcome-modal')).to.throw();
    });
    expect(emitSpy).to.have.been.called;
  });

  it('has no settings link when networkTraffic is false', function () {
    render(<WelcomeModal></WelcomeModal>, {
      preferences: { showedNetworkOptIn: false, networkTraffic: false },
    });
    const settingsLink = screen.queryByText('Settings');
    expect(settingsLink).to.not.exist;
  });
});
