import { expect } from 'chai';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type Message = {
  text: string;
  role: 'assistant' | 'user';
};

export async function openAssistantDrawer(browser: CompassBrowser) {
  if (!(await browser.$(Selectors.AssistantDrawerCloseButton).isDisplayed())) {
    await browser.clickVisible(Selectors.AssistantDrawerButton);
  }
  await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed();
}

export async function clearChat(browser: CompassBrowser): Promise<void> {
  const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
  if (await clearChatButton.isDisplayed()) {
    await browser.clickVisible(clearChatButton);
    await browser.clickVisible(
      Selectors.AssistantConfirmClearChatModalConfirmButton
    );
  }
}

export async function getDisplayedMessages(
  browser: CompassBrowser
): Promise<Message[]> {
  await browser.$(Selectors.AssistantChatMessages).waitForDisplayed();

  const messageElements = await browser
    .$$(Selectors.AssistantChatMessage)
    .getElements();

  const displayedMessages: Message[] = [];

  for (const messageElement of messageElements) {
    const text = await messageElement.getText();
    const role = await messageElement.getAttribute('data-role');
    if (role !== 'user' && role !== 'assistant') {
      throw new Error(
        `Expected data-role to be "user | assistant", got ${role}`
      );
    }
    displayedMessages.push({ text, role });
  }

  return displayedMessages;
}

export async function waitForMessages(
  browser: CompassBrowser,
  expectedMessages: Message[]
) {
  let lastDisplayedMessages: Message[] = [];

  try {
    await browser.waitUntil(async () => {
      // the text streams so the message may not be complete immediately
      try {
        lastDisplayedMessages = await browser.getDisplayedMessages();
        expect(lastDisplayedMessages).deep.equal(expectedMessages);
      } catch {
        return false;
      }
      return true;
    });
  } catch {
    console.log(
      'Last displayed messages:',
      JSON.stringify(lastDisplayedMessages)
    );
    throw new Error('Expected messages not found');
  }
}
