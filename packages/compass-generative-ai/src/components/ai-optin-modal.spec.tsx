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
        name: 'Use AI Features in Data Explorer',
      })
    ).to.exist;
  });
  it('should show the Not now link', function () {
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
    expect(screen.getByText('Not now')).to.exist;
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
    const button = screen.getByText('Use AI Features').closest('button');
    expect(button?.getAttribute('aria-disabled')).to.equal('false');
  });

  it('should disable the opt in button if project AI setting is disabled', async function () {
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
    const button = screen.getByText('Use AI Features').closest('button');
    expect(button?.getAttribute('aria-disabled')).to.equal('true');
  });

  describe('conditional banner messages', function () {
    it('should show warning banner when AI features are disabled', async function () {
      await mockPreferences.savePreferences({
        enableGenAIFeaturesAtlasProject: false,
        enableGenAISampleDocumentPassingOnAtlasProject: false,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal
            projectId="ab123"
            isOptInModalVisible={true}
            isOptInInProgress={false}
            onOptInModalClose={() => {}}
            onOptInClick={() => {}}
          />
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
        enableGenAISampleDocumentPassingOnAtlasProject: false,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal
            projectId="ab123"
            isOptInModalVisible={true}
            isOptInInProgress={false}
            onOptInModalClose={() => {}}
            onOptInClick={() => {}}
          />
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
        enableGenAISampleDocumentPassingOnAtlasProject: true,
      });
      render(
        <PreferencesProvider value={mockPreferences}>
          <AIOptInModal
            projectId="ab123"
            isOptInModalVisible={true}
            isOptInInProgress={false}
            onOptInModalClose={() => {}}
            onOptInClick={() => {}}
          />
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
      let onOptInClickCalled = false;
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
            onOptInClick={() => {
              onOptInClickCalled = true;
            }}
          />
        </PreferencesProvider>
      );
      const button = screen.getByText('Use AI Features');
      button.click();
      expect(onOptInClickCalled).to.be.false;
    });

    it('should call onOptInClick when main AI features are enabled', async function () {
      let onOptInClickCalled = false;
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
            onOptInClick={() => {
              onOptInClickCalled = true;
            }}
          />
        </PreferencesProvider>
      );
      const button = screen.getByText('Use AI Features');
      button.click();
      expect(onOptInClickCalled).to.be.true;
    });
  });
});
