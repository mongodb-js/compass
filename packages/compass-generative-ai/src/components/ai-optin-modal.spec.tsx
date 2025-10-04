import { render, screen } from '@mongodb-js/testing-library-compass';
import React from 'react';
import { expect } from 'chai';
import { AIOptInModal } from './ai-optin-modal';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import Sinon from 'sinon';

let mockPreferences: PreferencesAccess;

describe('AIOptInModal Component', function () {
  const sandbox = Sinon.createSandbox();
  const onOptInClickStub = sandbox.stub();

  const baseProps = {
    projectId: 'ab123',
    isCloudOptIn: true,
    isOptInModalVisible: true,
    isOptInInProgress: false,
    onOptInModalClose: () => {},
    onOptInClick: onOptInClickStub,
  };

  beforeEach(async function () {
    mockPreferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('with cloud opt-in environment', function () {
    it('should show the correct modal title and description', function () {
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      expect(
        screen.getByRole('heading', {
          name: 'Use AI Features in Data Explorer',
        })
      ).to.exist;
      expect(
        screen.getByText(
          'AI-powered features in Data Explorer supply users with an intelligent toolset to build faster and smarter with MongoDB.'
        )
      ).to.exist;
    });

    it('should show an info banner', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: true,
      });

      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );

      const banner = screen.getByTestId('ai-optin-cloud-banner');
      expect(banner).to.exist;
    });

    it('should show the Use AI Features and Not now buttons', function () {
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      expect(screen.getByText('Use AI Features')).to.exist;
      expect(screen.getByText('Not now')).to.exist;
    });
  });

  describe('with non-cloud opt-in environment', function () {
    it('should show the correct modal title and not show the banner', function () {
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} isCloudOptIn={false} />
        </PreferencesProvider>
      );
      expect(screen.getByText('Use AI Features in Compass')).to.exist;
      expect(
        screen.getByText(
          'AI-powered features in Compass supply users with an intelligent toolset to build faster and smarter with MongoDB.'
        )
      ).to.exist;
    });

    it('should not show the banner', function () {
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} isCloudOptIn={false} />
        </PreferencesProvider>
      );
      expect(screen.queryByTestId('ai-optin-cloud-banner')).to.not.exist;
    });

    it('should show the Use AI Features and Not now buttons', function () {
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      expect(screen.getByText('Use AI Features')).to.exist;
      expect(screen.getByText('Not now')).to.exist;
    });
  });

  it('should show the opt in button enabled when project AI setting is enabled', async function () {
    await mockPreferences.savePreferences({
      enableGenAIFeaturesAtlasProject: true,
    });
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps} />
      </PreferencesProvider>
    );
    const button = screen.getByText('Use AI Features').closest('button');
    expect(button?.style.cursor).to.not.equal('not-allowed');
  });

  describe('conditional banner messages', function () {
    it('should show warning banner when AI features are disabled', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: false,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      expect(
        screen.getByText(
          /AI features are disabled for project users with data access/
        )
      ).to.exist;
      expect(
        screen.getByText(/Project Owners can enable Data Explorer AI features/)
      ).to.exist;
    });

    it('should show info banner with correct copy when only the "Sending Sample Field Values in DE Gen AI Features" setting is disabled', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: true,
        enableGenAISampleDocumentPassing: false,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      expect(
        screen.getByText(
          /AI features are enabled for project users with data access/
        )
      ).to.exist;
      expect(
        screen.getByText(
          /enable sending sample field values in Data Explorer AI features/
        )
      ).to.exist;
    });

    it('should show info banner with correct copy when both project settings are enabled', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: true,
        enableGenAISampleDocumentPassing: true,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      expect(
        screen.getByText(
          /AI features are enabled for project users with data access/
        )
      ).to.exist;
      expect(
        screen.getByText(/Project Owners can disable Data Explorer AI features/)
      ).to.exist;
    });
  });

  describe('button click behavior', function () {
    it('should not call onOptInClick when main AI features are disabled', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: false,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      const button = screen.getByText('Use AI Features');
      button.click();
      expect(onOptInClickStub).not.to.have.been.called;
    });

    it('should call onOptInClick when main AI features are enabled', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: true,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal {...baseProps} />
        </PreferencesProvider>
      );
      const button = screen.getByText('Use AI Features');
      button.click();
      expect(onOptInClickStub).to.have.been.calledOnce;
    });
  });
});
