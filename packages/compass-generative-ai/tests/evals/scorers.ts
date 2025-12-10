import type { ConversationEvalScorer } from './types';
import { Factuality as _Factuality } from 'autoevals';
import { allText } from './utils';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { parseXmlToMmsJsonResponse } from '../../src/utils/xml-to-mms-response';

const logger = createNoopLogger();

export const Factuality: ConversationEvalScorer = ({
  input,
  output,
  expected,
}) => {
  return _Factuality({
    input: allText(input.messages),
    output: JSON.stringify(
      parseXmlToMmsJsonResponse(allText(output.messages), logger)
    ),
    expected: JSON.stringify(
      parseXmlToMmsJsonResponse(allText(expected.messages), logger)
    ),
    model: 'gpt-4.1',
    temperature: undefined,
  });
};
