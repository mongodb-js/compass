import { Eval } from 'braintrust';
import type {
  ConversationEvalCaseExpected,
  ConversationEvalCaseInput,
  ConversationTaskOutput,
} from './types';
import { makeChatbotCall } from './chatbot-api';
import { Factuality } from './scorers';
import { generateGenAiEvalCases } from './use-cases';

const GEN_AI_PROJECT_NAME = 'Compass Gen AI';

void Eval<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>(GEN_AI_PROJECT_NAME, {
  data: async () => {
    return await generateGenAiEvalCases();
  },
  task: makeChatbotCall,
  scores: [Factuality],
});
