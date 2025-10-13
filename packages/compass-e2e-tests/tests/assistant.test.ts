import { expect } from 'chai';

import clipboard from 'clipboardy';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
  skipForWeb,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import { startMockAssistantServer } from '../helpers/assistant-service';
import type { MockAssistantResponse } from '../helpers/assistant-service';
import { isTestingWeb } from '../helpers/test-runner-context';

import { context } from '../helpers/test-runner-context';

describe('MongoDB Assistant', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  let mockAtlasServer: Awaited<ReturnType<typeof startMockAtlasServiceServer>>;
  let mockAssistantServer: Awaited<ReturnType<typeof startMockAssistantServer>>;
  let sendMessage: (
    text: string,
    options?: {
      response?: MockAssistantResponse;
      expectedResult?: 'success' | 'opt-in';
    }
  ) => Promise<void>;
  let setAIOptIn: (newValue: boolean) => Promise<void>;
  let setAIFeatures: (newValue: boolean) => Promise<void>;

  const testMessage = 'What is MongoDB?';
  const testResponse = 'MongoDB is a database.';
  const dbName = 'test';
  const collectionName = 'entryPoints';

  before(async function () {
    mockAtlasServer = await startMockAtlasServiceServer();
    mockAssistantServer = await startMockAssistantServer();

    process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE =
      mockAtlasServer.endpoint;

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());

    sendMessage = async (
      text: string,
      {
        response = {
          status: 200,
          body: testResponse,
        },
        expectedResult = 'success',
      }: {
        response?: MockAssistantResponse;
        expectedResult?: 'success' | 'opt-in';
      } = {}
    ) => {
      const existingMessages = await getDisplayedMessages(browser);

      mockAssistantServer.setResponse(response);
      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      await chatInput.waitForDisplayed();
      await chatInput.setValue(text);
      await browser.clickVisible(Selectors.AssistantChatSubmitButton);

      switch (expectedResult) {
        case 'success':
          await browser.waitUntil(async () => {
            const newMessages = await getDisplayedMessages(browser);
            return (
              newMessages.length > existingMessages.length &&
              newMessages.some(
                (message) =>
                  message.text === response?.body &&
                  message.role === 'assistant'
              ) &&
              newMessages.some(
                (message) => message.text === text && message.role === 'user'
              )
            );
          });
          break;
        case 'opt-in':
          await browser
            .$(Selectors.AIOptInModalAcceptButton)
            .waitForDisplayed();
      }
    };

    const setup = async () => {
      browser = compass.browser;
      await setAIFeatures(true);

      await browser.setupDefaultConnections();
      await browser.connectToDefaults();
      await browser.selectConnectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        Selectors.CreateDatabaseButton,
        false
      );
      await browser.addDatabase(dbName, collectionName);

      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        dbName,
        collectionName,
        'Aggregations'
      );
    };

    setAIFeatures = async (newValue: boolean) => {
      if (isTestingWeb()) {
        await browser.setEnv(
          'COMPASS_OVERRIDE_ENABLE_AI_FEATURES',
          newValue ? 'true' : 'false'
        );
      }
      await browser.setFeature('enableGenAIFeatures', newValue);

      if (newValue) {
        await browser.$(Selectors.AssistantDrawerButton).waitForDisplayed();
      } else {
        await browser.$(Selectors.AssistantDrawerButton).waitForDisplayed({
          reverse: true,
        });
      }
    };

    setAIOptIn = async (newValue: boolean) => {
      if (
        isTestingWeb() ||
        ((await browser.getFeature('optInGenAIFeatures')) === true &&
          newValue === false)
      ) {
        await cleanup(compass);
        // Reseting the opt-in to false can be tricky so it's best to start over in this case.
        compass = await init(this.test?.fullTitle(), { firstRun: true });
        await setup();

        if (isTestingWeb()) {
          await setAIFeatures(true);
        }
        await browser.setFeature(
          'optInGenAIFeatures',
          newValue ? 'true' : 'false'
        );
        return;
      }

      await browser.setFeature('optInGenAIFeatures', newValue);
    };

    await setup();
  });

  after(async function () {
    await mockAtlasServer.stop();
    await mockAssistantServer.stop();

    delete process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE;

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    mockAssistantServer.clearRequests();
    await clearChat(browser);

    await screenshotIfFailed(compass, this.currentTest);
  });

  describe('drawer visibility', function () {
    it('shows the assistant drawer button when AI features are enabled', async function () {
      await setAIFeatures(true);

      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed();
      expect(await drawerButton.isDisplayed()).to.be.true;
    });

    it('does not show the assistant drawer button when AI features are disabled', async function () {
      // we cannot opt back out on web because it is stored server-side
      skipForWeb(
        this,
        'E2E testing for assistant drawer visibility on compass-web is not yet implemented'
      );

      await setAIFeatures(false);

      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed({ reverse: true });

      await setAIFeatures(true);
    });

    it('can close and open the assistant drawer', async function () {
      await openAssistantDrawer(browser);

      await browser.clickVisible(Selectors.AssistantDrawerCloseButton);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed({
        reverse: true,
      });

      await browser.clickVisible(Selectors.AssistantDrawerButton);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed();
    });
  });

  describe('before opt-in', function () {
    // we cannot opt back out on web because it is stored server-side
    before(async function () {
      skipForWeb(
        this,
        'E2E testing for opt-in on compass-web is not yet implemented'
      );
      await setAIOptIn(false);
    });

    it('does not send the message if the user declines the opt-in', async function () {
      await openAssistantDrawer(browser);

      await sendMessage(testMessage, { expectedResult: 'opt-in' });

      await browser.clickVisible(Selectors.AIOptInModalDeclineLink);

      const optInModal = browser.$(Selectors.AIOptInModal);
      await optInModal.waitForDisplayed({ reverse: true });

      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      expect(await chatInput.getValue()).not.to.equal(testMessage);

      expect(await getDisplayedMessages(browser)).to.deep.equal([]);

      expect(mockAssistantServer.getRequests()).to.be.empty;
    });

    describe('entry points', function () {
      it('should display opt-in modal for connection error entry point', async function () {
        await browser.connectWithConnectionString(
          'mongodb-invalid://localhost:27017',
          { connectionStatus: 'failure' }
        );
        await browser.clickVisible(
          browser.$(Selectors.ConnectionToastErrorDebugButton)
        );

        const optInModal = browser.$(Selectors.AIOptInModal);
        await optInModal.waitForDisplayed();
        expect(await optInModal.isDisplayed()).to.be.true;

        await browser.clickVisible(Selectors.AIOptInModalDeclineLink);

        await optInModal.waitForDisplayed({ reverse: true });

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });

      it('should display opt-in modal for explain plan entry point', async function () {
        await useExplainPlanEntryPoint(browser);

        const optInModal = browser.$(Selectors.AIOptInModal);
        await optInModal.waitForDisplayed();
        expect(await optInModal.isDisplayed()).to.be.true;

        await browser.clickVisible(Selectors.AIOptInModalDeclineLink);

        await optInModal.waitForDisplayed({ reverse: true });

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });
    });
  });

  describe('opting in', function () {
    before(async function () {
      // we cannot opt back out on web because it is stored server-side
      skipForWeb(
        this,
        'E2E testing for opt-in on compass-web is not yet implemented'
      );
      await setAIOptIn(false);
      await openAssistantDrawer(browser);
    });

    it('sends the message if the user opts in', async function () {
      await sendMessage(testMessage, { expectedResult: 'opt-in' });

      const optInModal = browser.$(Selectors.AIOptInModal);
      await optInModal.waitForDisplayed();
      expect(await optInModal.isDisplayed()).to.be.true;

      await browser.clickVisible(Selectors.AIOptInModalAcceptButton);

      await optInModal.waitForDisplayed({ reverse: true });

      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      expect(await chatInput.getValue()).to.equal('');

      expect(await getDisplayedMessages(browser)).to.deep.equal([
        { text: testMessage, role: 'user' },
        { text: testResponse, role: 'assistant' },
      ]);
    });
  });

  describe('after opt-in', function () {
    before(async function () {
      await setAIOptIn(true);
      await openAssistantDrawer(browser);
    });

    describe('clear chat button', function () {
      it('appears only after a message is sent', async function () {
        const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
        expect(await clearChatButton.isDisplayed()).to.be.false;
      });

      it('should clear the chat when the user clicks the clear chat button', async function () {
        await sendMessage(testMessage);
        await sendMessage(testMessage);

        expect(await getDisplayedMessages(browser)).to.deep.equal([
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
        ]);

        await clearChat(browser);

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });
    });

    it('displays multiple messages correctly', async function () {
      await sendMessage(testMessage, {
        response: {
          status: 200,
          body: testResponse,
        },
      });

      await sendMessage('This is a different message', {
        response: {
          status: 200,
          body: 'This is a different response',
        },
      });

      expect(await getDisplayedMessages(browser)).to.deep.equal([
        { text: testMessage, role: 'user' },
        { text: testResponse, role: 'assistant' },
        { text: 'This is a different message', role: 'user' },
        { text: 'This is a different response', role: 'assistant' },
      ]);
    });

    it('can copy assistant message to clipboard', async function () {
      if (context.disableClipboardUsage) {
        this.skip();
      }

      await sendMessage(testMessage);

      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const assistantMessage = messageElements[1];

      // sanity check
      expect(await assistantMessage.getText()).to.equal(testResponse);

      await browser.clickVisible(
        assistantMessage.$('[aria-label="Copy message"]')
      );

      await browser.waitUntil(async () => {
        const text = await clipboard.read();

        const isValid = text === testResponse;
        if (!isValid) {
          console.log(text);
        }

        return isValid;
      });
    });

    it('can submit feedback with text', async function () {
      await sendMessage(testMessage);

      // Get all message elements
      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const assistantMessage = messageElements[1];

      const thumbsDownButton = assistantMessage.$(
        '[aria-label="Dislike this message"]'
      );
      await browser.clickVisible(thumbsDownButton);

      const feedbackTextarea = assistantMessage.$('textarea');
      await feedbackTextarea.waitForDisplayed();
      await feedbackTextarea.setValue('This is a test feedback');

      await browser.clickVisible(browser.$('button*=Submit'));

      await feedbackTextarea.waitForDisplayed({ reverse: true });

      const thumbsDownButtonAfter = assistantMessage.$(
        '[aria-label="Dislike this message"]'
      );
      expect(await thumbsDownButtonAfter.getAttribute('aria-checked')).to.equal(
        'true'
      );
    });

    describe('entry points', function () {
      describe('explain plan entry point', function () {
        before(async function () {
          await setAIOptIn(true);
          await setAIFeatures(true);

          mockAssistantServer.setResponse({
            status: 200,
            body: 'You should create an index.',
          });
        });

        it('opens assistant with explain plan prompt when clicking "Interpret for me"', async function () {
          await useExplainPlanEntryPoint(browser);

          await browser.clickVisible('button*=Confirm');

          await browser.waitUntil(async () => {
            return (await getDisplayedMessages(browser)).length === 2;
          });

          expect(await getDisplayedMessages(browser)).deep.equal([
            {
              text: 'Interpret this explain plan output for me.',
              role: 'user',
            },
            { text: 'You should create an index.', role: 'assistant' },
          ]);

          expect(mockAssistantServer.getRequests()).to.have.lengthOf(1);
        });

        it('does not send request when user cancels confirmation', async function () {
          await useExplainPlanEntryPoint(browser);

          const chatMessages = browser.$(Selectors.AssistantChatMessages);
          await chatMessages.waitForDisplayed();
          expect(await chatMessages.getText()).to.include(
            'Please confirm your request'
          );

          // Click Cancel button
          await browser.clickVisible('button*=Cancel');

          // Wait a bit to ensure no request is sent
          await browser.pause(300);

          const finalMessages = await getDisplayedMessages(browser);
          expect(finalMessages.length).to.equal(0);

          expect(await chatMessages.getText()).to.include(
            'Please confirm your request'
          );
          expect(await chatMessages.getText()).to.include('Request cancelled');

          // Verify no assistant request was made
          expect(mockAssistantServer.getRequests()).to.be.empty;
        });
      });

      describe('error message entry point', function () {
        before(function () {
          mockAssistantServer.setResponse({
            status: 200,
            body: 'You should review the connection string.',
          });
        });

        it('opens assistant with error message view prompt when clicking "Debug for me"', async function () {
          await browser.connectWithConnectionString(
            'mongodb-invalid://localhost:27017',
            { connectionStatus: 'failure' }
          );
          await browser.clickVisible(
            browser.$(Selectors.ConnectionToastErrorDebugButton)
          );

          const messages = await getDisplayedMessages(browser);
          expect(messages).deep.equal([
            {
              text: 'Diagnose why my Compass connection is failing and help me debug it.',
              role: 'user',
            },
            {
              text: 'You should review the connection string.',
              role: 'assistant',
            },
          ]);

          expect(mockAssistantServer.getRequests()).to.have.lengthOf(1);
        });
      });
    });
  });
});

async function openAssistantDrawer(browser: CompassBrowser) {
  await browser.clickVisible(Selectors.AssistantDrawerButton);
}

async function clearChat(browser: CompassBrowser) {
  const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
  if (await clearChatButton.isDisplayed()) {
    await browser.clickVisible(clearChatButton);
    await browser.clickVisible(
      Selectors.AssistantConfirmClearChatModalConfirmButton
    );
  }
}

async function getDisplayedMessages(browser: CompassBrowser) {
  await browser.$(Selectors.AssistantChatMessages).waitForDisplayed();

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
}

async function useExplainPlanEntryPoint(browser: CompassBrowser) {
  await browser.clickVisible(Selectors.AggregationExplainButton);

  await browser.clickVisible(Selectors.ExplainPlanInterpretButton);

  await browser.$(Selectors.AggregationExplainModal).waitForDisplayed({
    reverse: true,
  });

  await browser.$(Selectors.AssistantChatMessages).waitForDisplayed();
}
