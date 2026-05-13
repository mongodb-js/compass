import React from 'react';
import {
  screen,
  renderWithConnections,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import DesktopWelcomeTab from './desktop-welcome-tab';

const renderDesktopWelcomeTab = (
  preferences: {
    enableCreatingNewConnections?: boolean;
    enableMcpServer?: boolean;
  } = {}
) => {
  return renderWithConnections(<DesktopWelcomeTab />, {
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
    } catch (err: any) {
      expect(err.message).to.not.equal(
        'add-new-connection-button should not be rendered'
      );
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

  context('MCP welcome section', function () {
    it('renders the MCP section when enableMcpServer is false', function () {
      renderDesktopWelcomeTab({
        enableCreatingNewConnections: true,
        enableMcpServer: false,
      });
      expect(screen.getByTestId('welcome-tab-mcp-section')).to.exist;
    });

    it('hides the MCP section when enableMcpServer is true', function () {
      renderDesktopWelcomeTab({
        enableCreatingNewConnections: true,
        enableMcpServer: true,
      });
      expect(screen.queryByTestId('welcome-tab-mcp-section')).to.equal(null);
    });

    it('emits open-compass-settings with "mcp" on button click', function () {
      const { globalAppRegistry } = renderDesktopWelcomeTab({
        enableCreatingNewConnections: true,
        enableMcpServer: false,
      });
      const emitSpy = sinon.spy(globalAppRegistry, 'emit');
      userEvent.click(screen.getByTestId('welcome-tab-mcp-setup-button'));
      expect(emitSpy).to.have.been.calledWith('open-compass-settings', 'mcp');
    });
  });
});
