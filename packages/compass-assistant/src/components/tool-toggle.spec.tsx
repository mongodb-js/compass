import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { DATABASE_TOOLS, ToolToggle } from './tool-toggle';
import { expect } from 'chai';
import sinon from 'sinon';
import { CompassAssistantProvider } from '../compass-assistant-provider';
import type {
  AtlasAuthService,
  AtlasService,
} from '@mongodb-js/atlas-service/provider';
import type {
  AtlasAiService,
  ToolsController,
} from '@mongodb-js/compass-generative-ai/provider';
import { renderWithProvider } from '../../test/utils';

describe('ToolToggle', function () {
  describe('rendering', function () {
    it('shows disabled icon when tool calling is disabled', function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: false,
      });

      const button = screen.getByTestId('tool-toggle-button');
      // The button should have a disabled bolt icon (gray color)
      const icon = button.querySelector('svg path[fill="#C1C7C6"]');
      expect(icon).to.exist;
    });

    it('shows active icon when tool calling is enabled', function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: true,
      });

      const button = screen.getByTestId('tool-toggle-button');
      // The button should have an active bolt icon (green color)
      const icon = button.querySelector('svg path[fill="#00A35C"]');
      expect(icon).to.exist;
    });
  });

  describe('popover behavior', function () {
    it('opens popover when button is clicked', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: false,
      });

      const button = screen.getByTestId('tool-toggle-button');
      expect(button.getAttribute('aria-expanded')).to.equal('false');

      userEvent.click(button);

      await waitFor(() => {
        expect(button.getAttribute('aria-expanded')).to.equal('true');
      });
    });

    it('displays the toggle switch in the popover', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: false,
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
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: false,
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Learn more/i });
        expect(link).to.exist;
        expect(link).to.have.attribute(
          'href',
          'https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/'
        );
        expect(link).to.have.attribute('target', '_blank');
      });
    });

    it('displays all available tools in the list', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: false,
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        // Check for a sample of the tools
        for (const tool of DATABASE_TOOLS) {
          expect(screen.getByText(tool.name)).to.exist;
        }
      });
    });
  });

  describe('description text based on enableGenAIToolCallingAtlasProject', function () {
    it('shows "currently enabled and require approval" text when both preferences are enabled', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: true,
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/These are currently enabled and require approval/i)
        ).to.exist;
      });
    });

    it('shows "currently disabled" text when enableGenAIToolCalling is false', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: true,
        enableGenAIToolCalling: false,
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/These are currently disabled/i)).to.exist;
      });
    });

    it('shows "currently disabled" text when enableGenAIToolCallingAtlasProject is false', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: false,
        enableGenAIToolCalling: true,
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/These are currently disabled/i)).to.exist;
      });
    });

    it('shows "currently disabled" when both preferences are false', async function () {
      renderWithProvider(<ToolToggle />, {
        enableGenAIToolCallingAtlasProject: false,
        enableGenAIToolCalling: false,
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/These are currently disabled/i)).to.exist;
      });
    });
  });

  describe('preference toggling', function () {
    it('toggle switch is disabled if enableGenAIToolCallingAtlasProject is false', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIToolCallingAtlasProject: false,
          enableGenAIToolCalling: true,
        },
      });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const toggle = screen.getByTestId('tool-toggle-switch');
        expect(toggle).to.exist;
        expect(toggle.getAttribute('aria-disabled')).to.equal('true');

        // and also unchecked even though enableGenAIToolCalling is true
        expect(toggle.getAttribute('aria-checked')).to.equal('false');
      });
    });

    it('toggle switch reflects current preference state - disabled', async function () {
      render(<ToolToggle />, {
        preferences: {
          enableGenAIToolCallingAtlasProject: true,
          enableGenAIToolCalling: false,
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
          enableGenAIToolCallingAtlasProject: true,
          enableGenAIToolCalling: true,
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
          enableGenAIToolCallingAtlasProject: true,
          enableGenAIToolCalling: false,
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
          enableGenAIToolCalling: true,
        });
      });
    });

    it('clicking toggle switch disables tool calling when enabled', async function () {
      const { preferences } = render(<ToolToggle />, {
        preferences: {
          enableGenAIToolCallingAtlasProject: true,
          enableGenAIToolCalling: true,
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
          enableGenAIToolCalling: false,
        });
      });
    });

    it('updates button icon after preference is toggled', async function () {
      const { preferences } = render(<ToolToggle />, {
        preferences: {
          enableGenAIToolCallingAtlasProject: true,
          enableGenAIToolCalling: false,
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

  describe('shows Data Explorer link when projectId is provided', function () {
    function renderWithProvider({ projectId }: { projectId?: string } = {}) {
      const mockAtlasService = {
        assistantApiEndpoint: sinon
          .stub()
          .returns('https://example.com/assistant/api/v1'),
      };
      const mockAtlasAiService = {
        ensureAiFeatureAccess: sinon.stub().resolves(),
      };
      const mockToolsController = {
        setActiveTools: sinon.stub().resolves(),
        getActiveTools: sinon.stub().returns({}),
        setContext: sinon.stub().resolves(),
      };
      const mockAtlasAuthService = {
        getOrganizationId: sinon.stub().returns('test-org-id'),
      };

      const Provider = CompassAssistantProvider.withMockServices({
        atlasService: mockAtlasService as unknown as AtlasService,
        atlasAiService: mockAtlasAiService as unknown as AtlasAiService,
        toolsController: mockToolsController as unknown as ToolsController,
        atlasAuthService: mockAtlasAuthService as unknown as AtlasAuthService,
      });

      const { container } = render(
        <Provider
          projectId={projectId}
          appNameForPrompt="Test"
          originForPrompt="test"
        >
          <ToolToggle />
        </Provider>,
        {
          preferences: {
            enableGenAIToolCallingAtlasProject: true,
            enableGenAIToolCalling: false,
          },
        }
      );

      return { container };
    }

    it('shows Atlas docs link when projectId is provided', async function () {
      renderWithProvider({ projectId: 'test-project-id' });

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Learn more/i });
        expect(link).to.exist;
        expect(link).to.have.attribute(
          'href',
          'https://www.mongodb.com/docs/atlas/atlas-ui/query-with-natural-language/data-explorer-ai-assistant/'
        );
      });
    });

    it('shows Compass docs link when projectId is not provided', async function () {
      renderWithProvider();

      const button = screen.getByTestId('tool-toggle-button');
      userEvent.click(button);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Learn more/i });
        expect(link).to.exist;
        expect(link).to.have.attribute(
          'href',
          'https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/'
        );
      });
    });
  });
});
