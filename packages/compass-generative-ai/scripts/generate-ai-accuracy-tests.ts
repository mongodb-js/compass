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
import { promises as fs } from 'fs';
import os from 'os';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import path from 'path';
import OpenAI from 'openai';
import { toJSString } from 'mongodb-query-parser';

import { generateMQL, parseShellString } from './ai-accuracy-tests';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

type Fixtures = {
  [dbName: string]: {
    [colName: string]: Document;
  };
};

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

  const fixtureFiles = (
    await fs.readdir(path.join(__dirname, 'fixtures'), 'utf-8')
  ).filter((f) => f.endsWith('.json'));

  const fixtures: Fixtures = {};

  for (const fixture of fixtureFiles) {
    // Skip delimiter dataset for this.
    if (fixture.includes('delimiter')) continue;

    const fileContent = await fs.readFile(
      path.join(__dirname, 'fixtures', fixture),
      'utf-8'
    );

    const [db, coll] = fixture.split('.');

    const ejson = EJSON.parse(fileContent);

    fixtures[db] = { [coll]: EJSON.serialize(ejson.data) };

    await mongoClient.db(db).collection(coll).insertMany(ejson.data);

    if (ejson.indexes) {
      for (const index of ejson.indexes) {
        await mongoClient.db(db).collection(coll).createIndex(index);
      }
    }
  }
  // console.log('inserted docs into the db, ', mongoClient);

  return {
    cluster,
    fixtures,
    mongoClient,
  };
}

function createSuggestPromptPrompt({
  databaseName,
  collectionName,
  fixtures,
}: {
  databaseName: string;
  collectionName: string;
  fixtures: Fixtures;
}) {
  const sampleDocShellSyntaxString = toJSString(
    EJSON.deserialize(fixtures[databaseName][collectionName][0]),
    2
  );

  const prompt = `
I'm looking to make a natural language prompt to MongoDB query language test.
These will be used to benchmark how good an ai model is at generating queries from a prompt and the schema of a collection.
What is a natural language question/prompt someone would ask of this collection which would generate a complex aggregation pipeline?
At least 5 stages, string or array manipulation may help here.
These must create similar results every time regardless of light interpretation.
Keep the result of running the generated pipeline predictable and consistent.
Keep your response concise, it will be be parsed by a machine.
Dataset: ${databaseName} ${collectionName}
Example document from dataset:
${sampleDocShellSyntaxString}
`;

  // Real world scenarios.

  //   const prompt = `
  // Suggest a natural language prompt for querying a dataset.

  // Keep your response concise, it will be be parsed by a machine.
  // Dataset: ${databaseName} ${collectionName}
  // Example document from dataset:
  // ${sampleDocShellSyntaxString}
  // `;

  return {
    prompt,
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

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: suggestPromptPrompt }],
      model: 'gpt-3.5-turbo',
    });

    if (response.choices && response.choices.length > 0) {
      return {
        prompt:
          response.choices[0].message.content?.trim() || 'No response from ai',
      };
    }
    throw new Error('No valid prompt generated.');
  } catch (error) {
    console.error('Failed to generate prompt:', error);
    throw error;
  }
}

async function main() {
  const { cluster, mongoClient, fixtures } = await setup();

  try {
    // const fixtureToUse =
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
    const response = await generateMQL({
      type: 'aggregation',
      databaseName,
      mongoClient,
      collectionName,
      userInput: prompt,
      // includeSampleDocuments,
    });

    const aggregation = response?.content?.aggregation ?? {};

    // console.log('about to mongo client ', mongoClient);

    const collection = mongoClient.db(databaseName).collection(collectionName);
    const cursor = collection.aggregate(
      parseShellString(aggregation?.pipeline)
    );

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
    // console.log('finally');
    await mongoClient?.close();
    await cluster?.close();
  }
}

void main();
