/* eslint-disable no-console */
import React, { useCallback, useEffect } from 'react';
import { css, Icon, IconButton, spacing } from '@mongodb-js/compass-components';
import { getChatStreamResponseFromAI } from '@mongodb-js/compass-generative-ai';
import { connect } from 'react-redux';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Schema } from 'mongodb-schema';

import type { RootState } from '../stores/store';

const summaryContainerStyles = css({
  padding: spacing[200],
  display: 'flex',
});

const summaryStyles = css({
  // padding: spacing[200],
});

const summaryActionsStyles = css({
  marginLeft: 'auto',
});

const doDebug = true;
function debugLog(...args: any[]) {
  if (!doDebug) {
    return;
  }
  console.log(...args);
}

type SchemaSummaryProps = {
  schema: Schema | null;
  namespace: string;
};

const buildPromptForSummarySystem = (): string => {
  return `
Given a MongoDB collection's schema, summarize the schema and provide a ONE to THREE SENTENCE MAX summary of the most important information.
Focus on things that the user may be interested in, like outliers, or ranges/trends.
This summary is to be shown to the user of Compass, a MongoDB GUI.
Rules:
1. You MUST return no more than THREE sentences.
2. Keep your response short and concise.
3. Return your response in plain text, with markdown formatting.
4. ONLY ONE or TWO SENTENCES. MAX 600 CHARACTERS.
`;
};

function buildUserPrompt({ schema }: { schema: Schema }): string {
  return `
${schema}
`;
}

async function* asyncGeneratorWithTimeout(whatToYield: string) {
  const characterArray = whatToYield.split('');
  // Simulate a delay for each yield, and randomize the delay time.
  // Yield a random amount of next characters from the string, no more than 5.
  // Until there are no characters left in the string.
  while (characterArray.length > 0) {
    const randomIndex = Math.min(
      3,
      Math.ceil(Math.random() * Math.random() * characterArray.length)
    );
    const randomCharacters = characterArray.splice(0, randomIndex); // Remove the characters from the array
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 70))
    );
    yield randomCharacters.join(''); // Yield the random characters
    debugLog('aaa Yielding:', randomCharacters.join(''));
  }
}

let lastRun = 0;
const THROTTLE_MS = 2000;
// let completedSummary: string | null = null;
let completedSummary = 'Schema looks great! Wow nice job';

export const SchemaSummary: React.FunctionComponent<SchemaSummaryProps> = ({
  schema,
}) => {
  // TODO: Keep a map of collection ns -> schema (total hack, this should be in the store).
  const [summary, setSummary] = React.useState<string>('');

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const fetchSchemaSummaryAndAnalyze = useCallback((schema: Schema) => {
    // Throttle the AI analysis to avoid overloading the system.
    const now = Date.now();
    if (now - lastRun < THROTTLE_MS) {
      debugLog('aaa Throttling AI analysis of log');
      return;
    }
    lastRun = now;
    debugLog('aaa about to perform AI analysis of log');

    // For hot reloading:
    setSummary('');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Start loading.
    abortControllerRef.current = new AbortController();
    const abortController = abortControllerRef.current;
    const { signal } = abortController;
    const _fetchSchemaSummaryAndAnalyze = async (schema: Schema) => {
      try {
        // TODO: Get Compass log.

        if (signal.aborted) {
          return;
        }

        const systemPrompt = buildPromptForSummarySystem();
        const userPrompt = buildUserPrompt({
          schema,
        });
        debugLog(
          'aaa built prompt for schema analysis:',
          systemPrompt,
          '\n',
          userPrompt
        );

        if (completedSummary) {
          debugLog('aaa already completed schema summary:', completedSummary);
          // setSummary(completedSummary);
          // If we want to simulate streaming:
          for await (const value of asyncGeneratorWithTimeout(
            completedSummary
          )) {
            if (signal.aborted) {
              return;
            }
            setSummary((summary) => summary + value);
          }
          return;
        }

        // TODO
        return;

        const aiAnalysisStream = getChatStreamResponseFromAI({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          signal,
        });
        debugLog('aaa aiAnalysisStream:', aiAnalysisStream);

        let fullResponse = '';
        try {
          for await (const chunk of aiAnalysisStream) {
            if (signal.aborted) {
              return;
            }
            debugLog('aaa chunk a a schema  received:', chunk);
            // debugLog(chunk); // Log each streamed chunk
            fullResponse += chunk; // Accumulate the response
            setSummary((summary) => summary + chunk);
          }
          completedSummary = fullResponse;
          debugLog('aaa Full response:', fullResponse);
        } catch (error) {
          console.error(
            'aaa Failed to stream ai schema summary response:',
            error
          );

          return;
        }
      } catch (error) {
        console.error(
          'aaa Failed to fetch AI response for schema summary:',
          error
        );
      }
    };
    void _fetchSchemaSummaryAndAnalyze(schema);
    return abortController;
  }, []);

  useEffect(() => {
    if (!schema) {
      return;
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [schema]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!schema) {
    return null;
  }

  return (
    <div className={summaryContainerStyles}>
      <div className={summaryStyles}>
        {/* {summary} */}
        <Markdown remarkPlugins={[remarkGfm]}>{summary}</Markdown>
      </div>
      <div className={summaryActionsStyles}>
        <IconButton
          aria-label="Refresh"
          title="Refresh"
          onClick={() => fetchSchemaSummaryAndAnalyze(schema)}
        >
          <Icon glyph="Refresh"></Icon>
        </IconButton>
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => ({
    namespace: state.schemaAnalysis.namespace,
    schema: state.schemaAnalysis.schema,
    sampleSize: state.schemaAnalysis.schema?.count ?? 0,
  }),
  {}
)(SchemaSummary);
