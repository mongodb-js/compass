import type { EvalScorer } from 'braintrust';

export type Message = {
  content: string;
};
type InputMessage = Message & { role: 'user' };
type OutputMessage = Message;
type ExpectedMessage = OutputMessage;

export type ConversationEvalCaseInput = {
  messages: InputMessage[];
  instructions: Message;
};

export type ConversationEvalCaseExpected = {
  messages: OutputMessage[];
};

export type ConversationTaskOutput = {
  messages: ExpectedMessage[];
};

export type ConversationEvalScorer = EvalScorer<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>;
