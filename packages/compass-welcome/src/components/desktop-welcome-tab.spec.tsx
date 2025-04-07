import React from 'react';
import {
  screen,
  renderWithConnections,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import DesktopWelcomeTab from './desktop-welcome-tab';

const renderDesktopWelcomeTab = (
  preferences: {
    enableCreatingNewConnections?: boolean;
  } = {}
) => {
  renderWithConnections(<DesktopWelcomeTab />, {
    preferences,
  });
};

describe('DesktopWelcomeTab', function () {
  it('renders with title', function () {
    renderDesktopWelcomeTab();
    expect(screen.getByText('Welcome to MongoDB Compass')).to.exist;
  });

  it('does not render create cluster button when enableCreatingNewConnections is false', function () {
    renderDesktopWelcomeTab({ enableCreatingNewConnections: false });
    try {
      screen.getByTestId('add-new-connection-button');
      expect.fail('add-new-connection-button should not be rendered');
    } catch {
      // noop
    }
  });

  context('when enableCreatingNewConnections is true', function () {
    it('renders info text', function () {
      renderDesktopWelcomeTab({ enableCreatingNewConnections: true });
      expect(
        screen.getByText('To get started, connect to an existing server or')
      ).to.exist;
    });

    it('renders create cluster button', function () {
      renderDesktopWelcomeTab({ enableCreatingNewConnections: true });
      expect(screen.getByTestId('add-new-connection-button')).to.exist;
    });

    it('renders atlas help section', function () {
      renderDesktopWelcomeTab({ enableCreatingNewConnections: true });
      expect(screen.getByTestId('welcome-tab-atlas-help-section')).to.exist;
    });
  });
});
