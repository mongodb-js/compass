import React from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { AIOptInModal } from './ai-optin-modal';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

let mockPreferences: PreferencesAccess;

describe('AIOptInModal Component', function () {
  const baseProps = {
    projectId: 'ab123',
    isCloudOptIn: true,
    isOptInModalVisible: true,
    isOptInInProgress: false,
    onOptInModalClose: () => {},
    onOptInClick: () => {},
  };

  beforeEach(async function () {
    mockPreferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    cleanup();
  });

  it('should show the modal title', function () {
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps}></AIOptInModal>
      </PreferencesProvider>
    );
    expect(
      screen.getByRole('heading', {
        name: 'Opt-in Gen AI-Powered features',
      })
    ).to.exist;
  });
  it('should show the not now link', function () {
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps}></AIOptInModal>
      </PreferencesProvider>
    );
    const link = screen.getByText('Not now');
    expect(link).to.exist;
  });

  it('should show the opt in button enabled when project AI setting is enabled', async function () {
    await mockPreferences.savePreferences({
      enableGenAIFeaturesAtlasProject: true,
    });
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps}></AIOptInModal>
      </PreferencesProvider>
    );
    const button = screen.getByText('Opt-in AI features');
    expect(button).to.exist;
  });

  it('should show an info banner in a cloud opt-in', async function () {
    await mockPreferences.savePreferences({
      enableGenAIFeaturesAtlasProject: true,
    });
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps} isCloudOptIn={true}></AIOptInModal>
      </PreferencesProvider>
    );
    const banner = screen.getByTestId('ai-optin-cloud-banner');
    expect(banner).to.exist;
  });

  it('should not show a banner in non-cloud environment', function () {
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps} isCloudOptIn={false}></AIOptInModal>
      </PreferencesProvider>
    );
    const banner = screen.queryByTestId('ai-optin-cloud-banner');
    expect(banner).to.not.exist;
  });

  it('should disable the opt in button if project AI setting is disabled ', async function () {
    await mockPreferences.savePreferences({
      enableGenAIFeaturesAtlasProject: false,
    });
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal {...baseProps}></AIOptInModal>
      </PreferencesProvider>
    );
    const button = screen.getByText('AI features disabled');
    expect(button).to.exist;
  });
});
