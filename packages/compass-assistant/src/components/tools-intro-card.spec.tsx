import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ToolsIntroCard } from './tools-intro-card';
import { CompassAssistantProvider } from '../compass-assistant-provider';
import type {
  AtlasAuthService,
  AtlasService,
} from '@mongodb-js/atlas-service/provider';
import type {
  AtlasAiService,
  ToolsController,
} from '@mongodb-js/compass-generative-ai/provider';

describe('ToolsIntroCard', function () {
  const defaultProps = {
    onDismiss: sinon.stub(),
  };

  function renderWithProvider(
    props = defaultProps,
    { projectId }: { projectId?: string } = {}
  ) {
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

    return render(
      <Provider
        projectId={projectId}
        appNameForPrompt="Test"
        originForPrompt="test"
      >
        <ToolsIntroCard {...props} />
      </Provider>
    );
  }

  it('renders the card with title and badge', function () {
    renderWithProvider();

    expect(screen.getByText('Tools to talk to your data')).to.exist;
    expect(screen.getByText('New')).to.exist;
  });

  it('mentions settings in the description text when projectId is not provided', function () {
    renderWithProvider();

    expect(
      screen.getByText(/Explore your data effortlessly with natural language/)
    ).to.exist;
    expect(screen.getByText(/for this chat or manage them in Settings/)).to
      .exist;
  });

  it('mentions project settings in the description text when projectId is provided', function () {
    renderWithProvider({ ...defaultProps }, { projectId: 'test-project-id' });

    expect(
      screen.getByText(/Explore your data effortlessly with natural language/)
    ).to.exist;
    expect(
      screen.getByText(
        /for this chat or manage them project-wide in Project Settings/
      )
    ).to.exist;
  });

  describe('View Settings button', function () {
    it('renders View Settings button when projectId is provided', function () {
      renderWithProvider({ ...defaultProps }, { projectId: 'test-project-id' });

      expect(screen.getByTestId('tools-intro-card-view-settings')).to.exist;
      expect(screen.getByText('View Settings')).to.exist;
    });

    it('does not render View Settings button when projectId is not provided', function () {
      renderWithProvider({ ...defaultProps });

      expect(screen.queryByTestId('tools-intro-card-view-settings')).to.not
        .exist;
    });
  });

  describe('Dismiss button', function () {
    it('renders close button', function () {
      const onDismiss = sinon.stub();
      renderWithProvider({ ...defaultProps, onDismiss });

      expect(screen.getByTestId('tools-intro-card-close')).to.exist;
      expect(screen.getByLabelText('Dismiss')).to.exist;
    });

    it('calls onDismiss when close button is clicked', function () {
      const onDismiss = sinon.stub();
      renderWithProvider({ ...defaultProps, onDismiss });

      const button = screen.getByTestId('tools-intro-card-close');
      userEvent.click(button);

      expect(onDismiss.calledOnce).to.be.true;
    });
  });

  describe('Learn more link based on project ID', function () {
    it('shows Atlas docs link when projectId is provided', function () {
      renderWithProvider({ ...defaultProps }, { projectId: 'test-project-id' });

      const link = screen.getByTestId('tools-intro-card-learn-more');
      expect(link).to.exist;
      expect(link).to.have.attribute(
        'href',
        'https://www.mongodb.com/docs/atlas/atlas-ui/query-with-natural-language/data-explorer-ai-assistant/'
      );
    });

    it('shows Compass docs link when projectId is not provided', function () {
      renderWithProvider({ ...defaultProps });

      const link = screen.getByTestId('tools-intro-card-learn-more');
      expect(link).to.exist;
      expect(link).to.have.attribute(
        'href',
        'https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/'
      );
    });
  });
});
