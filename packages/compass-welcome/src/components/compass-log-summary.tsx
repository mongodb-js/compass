/* eslint-disable no-console */
import React, { useEffect } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import { getChatStreamResponseFromAI } from '@mongodb-js/compass-generative-ai';
// import { testLog } from './test-log';
const testLog = 'ommitted log loading to avoid context sizes and costs for now';

const summaryContainerStyles = css({
  maxWidth: 'max(60vw, 400px)',
  marginBottom: spacing[600],
});

const doDebug = false;
function debugLog(...args: any[]) {
  if (!doDebug) {
    return;
  }
  console.log(...args);
}

type CompassLogSummaryProps = {
  //
};

// const buildPromptForLogSummary = (log: string) => {
//   return `
// ONLY RESPOND WITH TWO SENTENCES. MAX 1000 CHARACTERS.
// You are a professional log analyst.
// Given a log, summarize the log and provide a TWO SENTENCE MAX summary of the most important information.
// This log is from Compass, a MongoDB GUI.
// The log contains a lot of information about the user's actions in Compass.
// In the log are a lot of events, not all of them are important.
// Some events are not important at all.
// Some events are automatic, and therefore should be ignored.
// Focus on events that the user would have performed.
// Rules:
// 1. You MUST return no more than TWO sentences.
// 2. The first sentence must begin with "Last time you were in Compass you".
// 3. Keep your response short and concise.
// 4. Return your response in plain text, without any formatting.

// Summarize the following log:
// ${log}`;
// }

// You are a professional log analyst.

const buildPromptForLogSummarySystem = () => {
  return `
Given a log, summarize the log and provide a ONE or TWO SENTENCE MAX summary of the most important information.
Focus on events that the user would have performed.
This summary is to be shown to the user of Compass, a MongoDB GUI.
Rules:
1. You MUST return no more than TWO sentences.
2. The sentence must begin with "Last time you were in Compass you".
3. Keep your response short and concise.
4. Return your response in plain text, without any formatting.
5. ONLY ONE or TWO SENTENCES. MAX 600 CHARACTERS.
`;
};

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
const THROTTLE_MS = 15000;
// let completedSummary: string | null = null;
// const completedSummary = 'Last time you were in Compass you test test test test test test test test test test test test test test test test test test test test '
let completedSummary =
  "Last time you were in Compass you connected to multiple MongoDB clusters including a replica set and a load-balanced cluster, and performed database and collection statistics analysis as well as schema analysis on various databases. You also ran multiple aggregation and find queries, refreshed documents in collections like NYC.buildings and NYC.subway_entrances_2018, and encountered some connection and authorization errors. Don't worry, I'm not going to replace your job just yet.";

export const CompassLogSummary: React.FunctionComponent<
  CompassLogSummaryProps
> = (
  // eslint-disable-next-line no-empty-pattern
  {
    //
  }
) => {
  const [summary, setSummary] = React.useState<string>('');

  useEffect(() => {
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

    // Start loading.
    const abortController = new AbortController();
    const { signal } = abortController;
    const fetchCompassLogSummaryAndAnalyze = async () => {
      try {
        // TODO: Get Compass log.

        if (signal.aborted) {
          return;
        }

        if (completedSummary) {
          debugLog('aaa already completed summary:', completedSummary);
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

        const systemPrompt = buildPromptForLogSummarySystem();
        debugLog('aaa built prompt for log analysis:', systemPrompt);

        const aiAnalysisStream = getChatStreamResponseFromAI({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testLog },
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
            debugLog('aaa chunk a a received:', chunk);
            // debugLog(chunk); // Log each streamed chunk
            fullResponse += chunk; // Accumulate the response
            setSummary((summary) => summary + chunk);
          }
          completedSummary = fullResponse;
          debugLog('aaa Full response:', fullResponse);
        } catch (error) {
          console.error('aaa Failed to stream ai summary response:', error);

          return;
        }
      } catch (error) {
        console.error('aaa Failed to fetch AI response for summary:', error);
      }
    };
    void fetchCompassLogSummaryAndAnalyze();

    return () => {
      abortController.abort();
    };
  }, []);

  return <div className={summaryContainerStyles}>{summary}</div>;
};

export default CompassLogSummary;
