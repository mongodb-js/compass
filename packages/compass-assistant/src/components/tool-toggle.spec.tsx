import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { AVAILABLE_TOOLS, ToolToggle } from './tool-toggle';
import { expect } from 'chai';
import sinon from 'sinon';

describe('ToolToggle', function () {
  describe('rendering', function () {
    it('shows disabled icon when tool calling is disabled', function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      // The button should have a disabled bolt icon (gray color)
      const icon = button.querySelector('svg path[fill="#C1C7C6"]');
      expect(icon).to.exist;
    });

    it('shows active icon when tool calling is enabled', function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: true,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      // The button should have an active bolt icon (green color)
      const icon = button.querySelector('svg path[fill="#00A35C"]');
      expect(icon).to.exist;
    });
  });

  describe('popover behavior', function () {
    it('opens popover when button is clicked', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      expect(button.getAttribute('aria-expanded')).to.equal('false');

      userEvent.click(button);

      await waitFor(() => {
        expect(button.getAttribute('aria-expanded')).to.equal('true');
      });
    });

    it('displays the toggle switch in the popover', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });
      expect(screen.queryByTestId('tool-toggle-switch')).to.not.exist;

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
      });
    });

    it('displays the Learn more link', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Learn more/i });
        expect(link).to.exist;
        expect(link).to.have.attribute(
          'href',
          'https://mongodb.com/docs/atlas/ai-tools'
        );
        expect(link).to.have.attribute('target', '_blank');
      });
    });

    it('displays all available tools in the list', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        // Check for a sample of the tools
        AVAILABLE_TOOLS.forEach((tool) => {
          expect(screen.getByText(tool.name)).to.exist;
        });
      });
    });
  });

  describe('preference toggling', function () {
    it('toggle switch reflects current preference state - disabled', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
        expect(toggle.getAttribute('aria-checked')).to.equal('false');
      });
    });

    it('toggle switch reflects current preference state - enabled', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: true,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
        expect(toggle.getAttribute('aria-checked')).to.equal('true');
      });
    });

    it('clicking toggle switch enables tool calling when disabled', async function () {
      const { preferences } = render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const savePreferencesSpy = sinon.spy(preferences, 'savePreferences');

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
      });

      const toggle = screen.getByTestId('tool-toggle-switch');
      userEvent.click(toggle);

      await waitFor(() => {
        expect(savePreferencesSpy).to.have.been.calledOnce;
        expect(savePreferencesSpy).to.have.been.calledWith({
          enableGenAIDatabaseToolCalling: true,
        });
      });
    });

    it('clicking toggle switch disables tool calling when enabled', async function () {
      const { preferences } = render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: true,
        },
      });

      const savePreferencesSpy = sinon.spy(preferences, 'savePreferences');

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
      });

      const toggle = screen.getByTestId('tool-toggle-switch');
      userEvent.click(toggle);

      await waitFor(() => {
        expect(savePreferencesSpy).to.have.been.calledOnce;
        expect(savePreferencesSpy).to.have.been.calledWith({
          enableGenAIDatabaseToolCalling: false,
        });
      });
    });

    it('updates button icon after preference is toggled', async function () {
      const { preferences } = render(<ToolToggle />, {
        preferences: {
          enableGenAIDatabaseToolCalling: false,
        },
      });

      const savePreferencesSpy = sinon.spy(preferences, 'savePreferences');

      const button = screen.getByTestId('tool-toggle-button');

      // Initially should have disabled icon
      let disabledIcon = button.querySelector('svg path[fill="#C1C7C6"]');
      expect(disabledIcon).to.exist;

      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
      });

      const toggle = screen.getByTestId('tool-toggle-switch');
      userEvent.click(toggle);

      await waitFor(() => {
        expect(savePreferencesSpy).to.have.been.calledOnce;
      });

      // Wait for the preference to be updated and UI to reflect the change
      await waitFor(() => {
        // Should now have active icon
        const activeIcon = button.querySelector('svg path[fill="#00A35C"]');
        expect(activeIcon).to.exist;
        disabledIcon = button.querySelector('svg path[fill="#C1C7C6"]');
        expect(disabledIcon).to.not.exist;
      });
    });
  });
});
