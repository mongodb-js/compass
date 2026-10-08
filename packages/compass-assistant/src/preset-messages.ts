import type { TranslateFn } from '@mongodb-js/compass-components';
import type { AssistantMessage } from './compass-assistant-provider';
import { translateEnglish } from './utils';

export const getNonGenuineWarningMessage = (
  t: TranslateFn = translateEnglish
): AssistantMessage => ({
  id: 'non-genuine-warning',
  parts: [
    {
      type: 'text',
      text: 'The user is connected to a non-genuine MongoDB server. This causes many features to work differently or not work at all, make sure to always warn the user about this.',
    },
  ],
  metadata: {
    displayText: t(
      'assistant.preset.nonGenuineWarning',
      'You are connected to **a non-genuine MongoDB server**. MongoDB Assistant will not provide accurate guidance for non-genuine hosts, and we encourage users to use real MongoDB deployments to take full advantage of our developer tools.'
    ),
    isPermanent: true,
  },
  role: 'system',
});
