/* eslint-disable no-console */
/**
 * This script is used to generate tests for the ai-accuracy-tests script.
 * It works in a few steps:
 * 1. Prompts the ai to generate natural language prompts that someone might ask of a dataset.
 * 2. Uses the generate prompt to ask for a generated query or aggregation.
 * 3. Runs the generated query or aggregation with the dataset to get back the resulting
 * documents. This is done multiple times. When the results are fairly consistent then
 * we likely have a good test case and that is outputted.
 * 
 * This does have a chance to introduce bias, so we shouldn't rely only on these tests.
 * It can be a good brainstorming tool.
 * 
 * Usage: 
 * 
 * > ATLAS_PUBLIC_KEY="..." \
     ATLAS_PRIVATE_KEY="..." \
     OPENAI_API_KEY="..." \
     AI_TESTS_BACKEND=atlas-local \
      npm run generate-ai-accuracy-test
**/

import { MongoCluster } from 'mongodb-runner';
import os from 'os';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import { getSimplifiedSchema } from 'mongodb-schema';

import { SchemaFormatter } from './schema';
import { extractDelimitedText, parseShellString } from './ai-response';
import { createAIChatCompletion } from './ai-backend';
import { loadFixturesToDB } from './fixtures';
import {
  createSuggestPromptPrompt,
  getAggregationSystemPrompt,
  getAggregationUserPrompt,
} from './prompt';
import type { Fixtures } from './fixtures';

async function setup(): Promise<{
  cluster: MongoCluster;
  mongoClient: MongoClient;
  fixtures: Fixtures;
}> {
  const cluster = await MongoCluster.start({
    tmpDir: os.tmpdir(),
    topology: 'standalone',
  });

  const mongoClient = new MongoClient(cluster.connectionString);

  const fixtures = await loadFixturesToDB({
    mongoClient,
  });

  return {
    cluster,
    fixtures,
    mongoClient,
  };
}

async function createPromptQuestion({
  databaseName,
  collectionName,
  fixtures,
}: {
  databaseName: string;
  collectionName: string;
  fixtures: Fixtures;
}): Promise<{
  prompt: string;
}> {
  try {
    const { prompt: suggestPromptPrompt } = createSuggestPromptPrompt({
      databaseName,
      collectionName,
      fixtures,
    });
    console.log('SuggestPromptPrompt:');
    console.log(suggestPromptPrompt);

    const response = await createAIChatCompletion({
      user: suggestPromptPrompt,
      backend: 'openai',
    });

    return {
      prompt: response.content.trim() || 'No response from ai',
    };
  } catch (error) {
    console.error('Failed to generate prompt:', error);
    throw error;
  }
}

async function generateAggregation({
  databaseName,
  mongoClient,
  collectionName,
  userInput,
  includeSampleDocuments,
}: {
  databaseName: string;
  mongoClient: MongoClient;
  collectionName: string;
  userInput: string;
  includeSampleDocuments?: boolean;
}): Promise<string> {
  const collection = mongoClient.db(databaseName).collection(collectionName);
  const simplifiedSchema = await getSimplifiedSchema(collection.find());
  const sample = await collection.find().limit(2).toArray();

  const response = await createAIChatCompletion({
    system: getAggregationSystemPrompt(),
    user: getAggregationUserPrompt({
      databaseName,
      schema: new SchemaFormatter().format(simplifiedSchema),
      collectionName,
      userInput,
      sampleDocuments: includeSampleDocuments ? sample : undefined,
    }),
    backend: 'openai',
  });

  return extractDelimitedText(response.content?.trim() || '', 'aggregation');
}

async function main() {
  const { cluster, mongoClient, fixtures } = await setup();

  // Skip delimiter dataset for this, ain't much in there.
  delete fixtures['delimiter'];

  try {
    // const databaseName = 'sample_airbnb';
    // const collectionName = 'listingsAndReviews';

    const databaseName =
      Object.keys(fixtures)[
        Math.floor(Math.random() * Object.keys(fixtures).length)
      ];
    const collectionName = Object.keys(fixtures[databaseName])[
      Math.floor(Math.random() * Object.keys(fixtures[databaseName]).length)
    ];

    // 1. Prompt the ai to generate natural language prompts that someone might ask of the dataset.
    const { prompt } = await createPromptQuestion({
      databaseName,
      collectionName,
      fixtures,
    });

    console.log('\n___\nGenerated Prompt:');
    console.log(prompt);

    // 2. Use the generate prompt to generate an aggregation.
    const aggregation = await generateAggregation({
      databaseName,
      mongoClient,
      collectionName,
      userInput: prompt,
      // includeSampleDocuments,
    });

    console.log('aggregation', aggregation);

    const collection = mongoClient.db(databaseName).collection(collectionName);
    const cursor = collection.aggregate(parseShellString(aggregation));

    const result = (await cursor.toArray()).map((doc) => EJSON.serialize(doc));

    console.log('\n___\nResult:');
    console.log(result);

    // 3. Runs the generated query or aggregation with the dataset to get back the resulting
    // documents. This is done multiple times. When the results are fairly consistent then
    // we likely have a good test case and that is outputted.

    // const resultsSet = new Set();
    // for (let i = 0; i < 5; i++) {
    //   const results = await executeQuery(prompt, fixture);
    //   resultsSet.add(JSON.stringify(results));
    //   if (resultsSet.size > 1) {
    //     console.log('Inconsistent results, trying again...');
    //     // TODO: go again
    //   }
    // }
  } finally {
    await mongoClient?.close();
    await cluster?.close();
  }
}

void main();
