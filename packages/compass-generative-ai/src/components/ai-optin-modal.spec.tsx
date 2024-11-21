import React from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { AIOptInModal } from './ai-optin-modal';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

let mockPreferences: PreferencesAccess;

describe('AIOptInModal Component', function () {
  beforeEach(async function () {
    mockPreferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    cleanup();
  });

  it('should show the modal title', function () {
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal
          projectId="ab123"
          isOptInModalVisible={true}
          isOptInInProgress={false}
          onOptInModalClose={() => {}}
          onOptInClick={() => {}}
        ></AIOptInModal>
      </PreferencesProvider>
    );
    expect(
      screen.getByRole('heading', {
        name: 'Use natural language to generate queries and pipelines',
      })
    ).to.exist;
  });
  it('should show the cancel button', function () {
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal
          projectId="ab123"
          isOptInModalVisible={true}
          isOptInInProgress={false}
          onOptInModalClose={() => {}}
          onOptInClick={() => {}}
        >
          {' '}
        </AIOptInModal>
      </PreferencesProvider>
    );
    const button = screen.getByText('Cancel').closest('button');
    expect(button).to.not.match('disabled');
  });

  it('should show the opt in button enabled when project AI setting is enabled', async function () {
    await mockPreferences.savePreferences({
      enableGenAIFeaturesAtlasProject: true,
    });
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal
          projectId="ab123"
          isOptInModalVisible={true}
          isOptInInProgress={false}
          onOptInModalClose={() => {}}
          onOptInClick={() => {}}
        >
          {' '}
        </AIOptInModal>
      </PreferencesProvider>
    );
    const button = screen.getByText('Use Natural Language').closest('button');
    expect(button?.getAttribute('aria-disabled')).to.equal('false');
  });

  it('should disable the opt in button if project AI setting is disabled ', async function () {
    await mockPreferences.savePreferences({
      enableGenAIFeaturesAtlasProject: false,
    });
    render(
      <PreferencesProvider value={mockPreferences}>
        <AIOptInModal
          projectId="ab123"
          isOptInModalVisible={true}
          isOptInInProgress={false}
          onOptInModalClose={() => {}}
          onOptInClick={() => {}}
        >
          {' '}
        </AIOptInModal>
      </PreferencesProvider>
    );
    const button = screen.getByText('Use Natural Language').closest('button');
    expect(button?.getAttribute('aria-disabled')).to.equal('true');
  });
});
