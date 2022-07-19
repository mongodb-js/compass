import OpenAI from 'openai-api';
import type { Document } from 'mongodb';
import fs from 'fs';
import path from 'path';

import { extractStages } from './extract-stages';

const openaiClient = new OpenAI(process.env.OPEN_AI_API_KEY || 'no_key_in_env');

let data: string;

async function getTrainingData(): Promise<string> {
  if (!data) {
    data = await fs.promises.readFile(
      // TODO: Better static asset loading.
      path.resolve('..', 'compass-nlp-query', 'ai-training-input.txt'),
      'utf8'
    );
  }

  return data;
}

const createPipelineFromText = (text: string) => {
  const stages = extractStages(text);

  return stages.map(
    ({
      operator,
      parsedSource,
    }: {
      operator: string;
      parsedSource: Document;
    }) => ({
      [operator]: parsedSource,
    })
  );
};

// Testing pipeline from text:
// console.log('[{$match : {quantity : {$gte : 10}}}]');
// console.log('\n\nrunning:\n')
// console.log(createPipelineFromText('[{$match : {quantity : {$gte : 10}}}]'));

// Throws an error if can't parse.
export function parseMQLFromAIText(aiGeneratedMQLText: string): Document[] {
  // TODO: Some basic sanitation on the text generated.
  // This depends on what sort of outputs the ai generates.

  // Maybe todo: We could check here if each stage it suggests is valid.
  // Probably fine to just ship to server for now and show those errors then.

  // return JSON.parse(aiGeneratedMQLText) as Document[];

  return createPipelineFromText(aiGeneratedMQLText);
}

export async function getMQLForNaturalLanguageText(
  naturalLanguageText: string
) {
  // We currently build a prompt for open ai with the training data
  // in the prompt. The training data is a bunch of questions and responses
  // The AI generates an answer for the prompt given by the user.
  const trainingData = await getTrainingData();
  const aiInput = `${trainingData}Q:${naturalLanguageText}\nA:`;

  const gptResponse = await openaiClient.complete({
    engine: 'davinci',
    prompt: aiInput,
    temperature: 0.3,
    maxTokens: 400,
    topP: 1,
    frequencyPenalty: 0.2,
    presencePenalty: 0,
    stop: ['\n'],
  });

  console.log('gpt input (excluding training data):', naturalLanguageText);
  console.log('gpt response:');
  console.log(gptResponse.data.choices[0].text);
  return gptResponse.data.choices[0].text;
}
