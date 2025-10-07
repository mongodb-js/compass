import { expect } from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import { startMockAssistantServer } from '../helpers/assistant-service';
import type { MockAssistantResponse } from '../helpers/assistant-service';
import { openSettingsModal } from '../helpers/commands';

async function setAIFeatures(browser: CompassBrowser, newValue: boolean) {
  await openSettingsModal(browser, 'ai');

  // Wait for AI settings content to be visible
  const aiSettingsContent = browser.$(
    Selectors.ArtificialIntelligenceSettingsContent
  );
  await aiSettingsContent.waitForDisplayed();

  const currentValue =
    (await browser
      .$(Selectors.SettingsInputElement('enableGenAIFeatures'))
      .getAttribute('aria-checked')) === 'true';

  if (currentValue !== newValue) {
    await browser.clickParent(
      Selectors.SettingsInputElement('enableGenAIFeatures')
    );
    await browser.clickVisible(Selectors.SaveSettingsButton);
  }

  await browser.clickVisible(Selectors.CloseSettingsModalButton);
}

async function setAIOptIn(browser: CompassBrowser, enabled: boolean) {
  // Reset the opt-in preference by using the execute command
  await browser.execute((value: boolean) => {
    // Access the preferences API to reset the opt-in
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ipcRenderer } = require('electron');
    ipcRenderer.invoke('compass:save-preferences', {
      optInGenAIFeatures: value,
    });
  }, enabled);

  await browser.pause(100);
}

describe('MongoDB Assistant', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let openAssistantDrawer: () => Promise<void>;

  let mockAtlasServer: Awaited<ReturnType<typeof startMockAtlasServiceServer>>;
  let mockAssistantServer: Awaited<ReturnType<typeof startMockAssistantServer>>;
  let clearChat: () => Promise<void>;
  let sendMessage: (
    text: string,
    options?: {
      response?: MockAssistantResponse;
    }
  ) => Promise<void>;
  let getDisplayedMessages: () => Promise<
    {
      text: string;
      role: 'user' | 'assistant';
    }[]
  >;

  const testMessage = 'What is MongoDB?';
  const testResponse = 'MongoDB is a database.';

  before(async function () {
    skipForWeb(this, 'ai assistant not yet available in compass-web');

    process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN = 'true';

    // Start a mock Atlas service for feature flag checks
    mockAtlasServer = await startMockAtlasServiceServer();

    // Start a mock Assistant server for AI chat responses
    mockAssistantServer = await startMockAssistantServer();

    // Set env vars: one for feature flag checks, one for assistant API
    process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE =
      mockAtlasServer.endpoint;
    process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE =
      mockAssistantServer.endpoint;

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    openAssistantDrawer = async () => {
      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed();
      await drawerButton.waitForClickable();
      await drawerButton.click();
    };

    clearChat = async () => {
      const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
      if (await clearChatButton.isDisplayed()) {
        await clearChatButton.click();
        const confirmButton = browser.$(
          Selectors.AssistantConfirmClearChatModalConfirmButton
        );
        await confirmButton.waitForClickable();
        await confirmButton.click();
      }
    };

    sendMessage = async (
      text: string,
      {
        response = {
          status: 200,
          body: testResponse,
        },
      }: { response?: MockAssistantResponse } = {}
    ) => {
      mockAssistantServer.setResponse(response);

      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      await chatInput.waitForDisplayed();
      await chatInput.setValue(text);
      const submitButton = browser.$(Selectors.AssistantChatSubmitButton);
      await submitButton.click();
    };

    getDisplayedMessages = async () => {
      // Wait for the messages container to be visible
      const chatMessages = browser.$(Selectors.AssistantChatMessages);
      await chatMessages.waitForDisplayed();

      // Get all individual message elements
      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const displayedMessages = [];
      for (const messageElement of messageElements) {
        const textElements = await messageElement.$$('p').getElements();
        const isAssistantMessage =
          textElements.length !== 1 &&
          (await textElements[0].getText()) === 'MongoDB Assistant';
        // Get the message text content.
        // In case of Assistant messages, skip the MongoDB Assistant text.
        const text = isAssistantMessage
          ? await textElements[1].getText()
          : await textElements[0].getText();

        displayedMessages.push({
          text: text,
          role: isAssistantMessage ? ('assistant' as const) : ('user' as const),
        });
      }

      return displayedMessages;
    };
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await mockAtlasServer.stop();
    await mockAssistantServer.stop();

    delete process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN;
    delete process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE;
    delete process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE;

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    mockAssistantServer.clearRequests();
    await clearChat();

    await screenshotIfFailed(compass, this.currentTest);
  });

  describe('drawer visibility', function () {
    it('shows the assistant drawer button when AI features are enabled', async function () {
      await setAIFeatures(browser, true);

      // AI Features are enabled by default so the drawer button should be visible.
      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed();
      expect(await drawerButton.isDisplayed()).to.be.true;
    });

    it('does not show the assistant drawer button when AI features are disabled', async function () {
      await setAIFeatures(browser, false);

      // Assistant drawer button should not be visible
      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed({ reverse: true });
      expect(await drawerButton.isDisplayed()).to.be.false;

      await setAIFeatures(browser, true);
    });

    it('can close and open the assistant drawer', async function () {
      await openAssistantDrawer();

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed();

      await browser.clickVisible(Selectors.AssistantDrawerCloseButton);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed({
        reverse: true,
      });

      await browser.clickVisible(Selectors.AssistantDrawerButton);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed();
    });
  });

  describe('before opt-in', function () {
    beforeEach(async function () {
      await setAIOptIn(browser, false);
    });

    it('does not send the message if the user declines the opt-in', async function () {
      await openAssistantDrawer();

      await sendMessage(testMessage);

      // Wait for opt-in modal and decline it
      const declineLink = browser.$(Selectors.AIOptInModalDeclineLink);
      await declineLink.waitForDisplayed();
      await declineLink.click();

      // Wait for the modal to close
      const optInModal = browser.$(Selectors.AIOptInModal);
      await optInModal.waitForDisplayed({ reverse: true });

      // Verify the input was not cleared after sending
      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      expect(await chatInput.getValue()).not.to.equal(testMessage);

      // Verify the message is not displayed in the chat
      const chatMessages = browser.$(Selectors.AssistantChatMessages);
      expect(await chatMessages.getText()).to.not.include(testMessage);

      expect(mockAssistantServer.getRequests()).to.be.empty;
    });

    it('sends the message if the user opts in', async function () {
      await openAssistantDrawer();

      await sendMessage(testMessage);

      const optInModal = browser.$(Selectors.AIOptInModal);
      await optInModal.waitForDisplayed();
      expect(await optInModal.isDisplayed()).to.be.true;

      const acceptButton = browser.$(Selectors.AIOptInModalAcceptButton);
      await acceptButton.waitForClickable();
      await acceptButton.click();

      await optInModal.waitForDisplayed({ reverse: true });

      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      expect(await chatInput.getValue()).to.equal('');

      expect(await getDisplayedMessages()).to.deep.equal([
        { text: testMessage, role: 'user' },
        { text: testResponse, role: 'assistant' },
      ]);
    });
  });

  describe('after opt-in', function () {
    beforeEach(async function () {
      await setAIOptIn(browser, true);

      await openAssistantDrawer();
    });

    describe('clear chat button', function () {
      it('appears only after a message is sent', async function () {
        const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
        expect(await clearChatButton.isDisplayed()).to.be.false;
      });

      it('should clear the chat when the user clicks the clear chat button', async function () {
        await openAssistantDrawer();
        await sendMessage(testMessage);
        await sendMessage(testMessage);
        expect(await getDisplayedMessages()).to.deep.equal([
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
        ]);

        await clearChat();

        expect(await getDisplayedMessages()).to.deep.equal([]);
      });
    });

    it('displays multiple messages correctly', async function () {
      await sendMessage(testMessage);

      await sendMessage('This is a different message', {
        response: {
          status: 200,
          body: 'This is a different response',
        },
      });

      expect(await getDisplayedMessages()).to.deep.equal([
        { text: testMessage, role: 'user' },
        { text: testResponse, role: 'assistant' },
        { text: 'This is a different message', role: 'user' },
        { text: 'This is a different response', role: 'assistant' },
      ]);
    });

    it('can copy assistant message to clipboard', async function () {
      await sendMessage(testMessage);

      await browser.pause(100);

      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const assistantMessage = messageElements[1];

      const copyButton = assistantMessage.$('[aria-label="Copy message"]');
      await copyButton.waitForDisplayed();
      await copyButton.click();

      await browser.pause(100);

      const clipboardText = await browser.execute(() => {
        return navigator.clipboard.readText();
      });

      expect(clipboardText).to.equal(testResponse);
    });

    it('can submit feedback with text', async function () {
      await sendMessage(testMessage);

      await browser.pause(100);

      // Get all message elements
      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const assistantMessage = messageElements[1];

      const thumbsDownButton = assistantMessage.$(
        '[aria-label="Dislike this message"]'
      );
      await thumbsDownButton.waitForDisplayed();
      await thumbsDownButton.click();

      const feedbackTextarea = assistantMessage.$('textarea');
      await feedbackTextarea.waitForDisplayed();

      await feedbackTextarea.setValue('This is a test feedback');

      const submitButton = browser.$('button*=Submit');
      await submitButton.waitForClickable();
      await submitButton.click();

      await feedbackTextarea.waitForDisplayed({ reverse: true });

      const thumbsDownButtonAfter = assistantMessage.$(
        '[aria-label="Dislike this message"]'
      );
      expect(await thumbsDownButtonAfter.getAttribute('aria-checked')).to.equal(
        'true'
      );
    });
  });
});
