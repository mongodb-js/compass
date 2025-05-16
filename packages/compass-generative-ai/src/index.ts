import { registerHadronPlugin } from 'hadron-app-registry';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';
import { AtlasAiPlugin } from './components';
import { atlasAiServiceLocator } from './provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { activatePlugin } from './store/atlas-ai-store';

export const CompassGenerativeAIPlugin = registerHadronPlugin(
  {
    name: 'CompassGenerativeAI',
    component: AtlasAiPlugin,
    activate: activatePlugin,
  },
  {
    atlasAuthService: atlasAuthServiceLocator,
    atlasAiService: atlasAiServiceLocator,
    preferences: preferencesLocator,
  }
);

export {
  AIExperienceEntry,
  GenerativeAIInput,
  createAIPlaceholderHTMLPlaceholder,
} from './components';

import {
  // getResponseFromLocalAI,
  getChatResponseFromLocalAI,
} from './local-ai-service';
import {
  getResponseFromOpenAI,
  getStreamResponseFromOpenAI,
} from './not-local-ai-service';

export { getStreamResponseFromDocsAI } from './docs-ai-service';

const useLocalAI = true;

export function getChatStreamResponseFromAI({
  messages,
  signal,
}: {
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
  signal: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  if (useLocalAI) {
    return getChatResponseFromLocalAI({
      messages,
      signal,
    });
  } else {
    return getStreamResponseFromOpenAI({
      messages,
      signal,
    });
  }
}

export function getChatResponseFromAI({
  messages,
  signal,
}: {
  messages: { role: 'user' | 'system'; content: string }[];
  signal: AbortSignal;
}) {
  // Only open ai supported for this for now.
  return getResponseFromOpenAI({
    messages,
    signal,
  });
}

// export function getStreamResponseFromAI({
//   prompt,
//   signal,
// }: {
//   prompt: string;
//   signal?: AbortSignal;
// }): AsyncGenerator<string, void, unknown> {
//   if (useLocalAI) {
//     return getResponseFromLocalAI({
//       prompt,
//       signal,
//     });
//   } else {
//     return getStreamResponseFromOpenAI({
//       messages: [
//         { role: 'user', content: prompt }
//       ],
//       signal
//     });
//   }
// }
