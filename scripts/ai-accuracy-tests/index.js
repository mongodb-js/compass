'use strict';
// To run these tests against cloud-dev:
// > ATLAS_PUBLIC_KEY="..." \
//   ATLAS_PRIVATE_KEY="..." \
//   AI_TESTS_ATTEMPTS_PER_TEST=100 \
//     node scripts/ai-accuracy-tests/index.js

// To run these tests with local mms:
// First create an API key in your Atlas organization with
// the permissions "Organization Member".
// Then using that key run:
// > ATLAS_PUBLIC_KEY="..." \
//   ATLAS_PRIVATE_KEY="..." \
//   AI_TESTS_BACKEND=atlas-local \
//     node scripts/ai-accuracy-tests/index.js

const { MongoCluster } = require('mongodb-runner');
const fs = require('fs').promises;
const os = require('os');
const assert = require('assert');
const ejsonShellParser = require('ejson-shell-parser');
const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');
const { getSimplifiedSchema } = require('mongodb-schema');
const path = require('path');

const DigestClient = require('digest-fetch');
const nodeFetch = require('node-fetch');
const decomment = require('decomment');

const DEFAULT_ATTEMPTS_PER_TEST = 10;
const DEFAULT_MIN_ACCURACY = 0.8;

const MAX_TIMEOUTS_PER_TEST = 10;

const ATTEMPTS_PER_TEST = process.env.AI_TESTS_ATTEMPTS_PER_TEST
  ? +process.env.AI_TESTS_ATTEMPTS_PER_TEST
  : DEFAULT_ATTEMPTS_PER_TEST;

const USE_SAMPLE_DOCS = process.env.AI_TESTS_USE_SAMPLE_DOCS === 'true';

const BACKEND = process.env.AI_TESTS_BACKEND || 'atlas-dev';

if (!['atlas-dev', 'atlas-local', 'compass'].includes(BACKEND)) {
  throw new Error('Unknown backend');
}

const fetch = (() => {
  if (BACKEND === 'atlas-dev' || BACKEND === 'atlas-local') {
    const ATLAS_PUBLIC_KEY = process.env.ATLAS_PUBLIC_KEY;
    const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY;

    if (!(ATLAS_PUBLIC_KEY || ATLAS_PRIVATE_KEY)) {
      throw new Error('ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY are required.');
    }

    const client = new DigestClient(ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, {
      algorithm: 'MD5',
    });

    return client.fetch.bind(client);
  }

  return nodeFetch;
})();

const backendBaseUrl =
  process.env.AI_TESTS_BACKEND_URL ||
  (BACKEND === 'atlas-dev'
    ? 'https://cloud-dev.mongodb.com/api/private'
    : BACKEND === 'atlas-local'
    ? 'http://localhost:8080/api/private'
    : 'http://localhost:8080');

let httpErrors = 0;

async function fetchAtlasPrivateApi(path, init = {}) {
  const url = `${backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  return await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      'User-Agent': 'Compass AI Accuracy tests',
    },
  })
    .then(async (res) => [res, await res.json()])
    .then(([res, data]) => {
      if (res.ok && data) {
        console.info(data);
        return data;
      }

      const errorCode = data?.errorCode || '-';

      const error = new Error(
        `Request failed: ${res.status} - ${res.statusText}: ${errorCode}`
      );

      error.status = res.status;
      error.errorCode = errorCode;

      httpErrors++;

      return Promise.reject(error);
    });
}

function generateFindQuery(options) {
  return fetchAtlasPrivateApi('/ai/api/v1/mql-query', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

function generateAggregation(options) {
  return fetchAtlasPrivateApi('/ai/api/v1/mql-aggregation', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

const parseShellString = (shellSyntaxString) => {
  if (shellSyntaxString === null || shellSyntaxString === undefined) {
    return shellSyntaxString;
  }

  const parsed = ejsonShellParser.default(decomment(shellSyntaxString));

  if (!parsed) {
    throw new Error(`Failed to parse shell syntax: \n"${shellSyntaxString}"`);
  }

  return parsed;
};

let cluster;
let mongoClient;

const generateMQL = async ({
  type,
  databaseName,
  collectionName,
  userInput,
}) => {
  const collection = mongoClient.db(databaseName).collection(collectionName);
  const schema = await getSimplifiedSchema(collection.find());
  const sample = await collection.find().limit(2).toArray();

  if (type === 'aggregation') {
    return await generateAggregation({
      schema: schema,
      collectionName,
      databaseName,
      sampleDocuments: USE_SAMPLE_DOCS ? sample : undefined,
      userInput,
    });
  }

  return await generateFindQuery({
    schema: schema,
    collectionName,
    databaseName,
    sampleDocuments: USE_SAMPLE_DOCS ? sample : undefined,
    userInput,
  });
};

// eslint-disable-next-line complexity
const runOnce = async (
  {
    type,
    databaseName,
    collectionName,
    userInput,
    assertResponse,
    assertResult,
    acceptAggregationResponse,
  },
  usageStats
) => {
  const response = await generateMQL({
    type,
    databaseName,
    collectionName,
    userInput,
  });

  usageStats.push({ promptTokens: 1, completionTokens: 1 });

  try {
    if (assertResponse) {
      await assertResponse(response.content);
    }

    const collection = mongoClient.db(databaseName).collection(collectionName);

    const aggregation = response?.content?.aggregation ?? {};
    const query = response?.content?.query ?? {};

    if (assertResult) {
      let cursor;

      if (
        type === 'aggregation' ||
        (type === 'query' &&
          acceptAggregationResponse &&
          aggregation.pipeline &&
          aggregation.pipeline !== '[]')
      ) {
        cursor = collection.aggregate(parseShellString(aggregation?.pipeline));
      } else {
        cursor = collection.find(parseShellString(query.filter));

        if (query.project) {
          cursor = cursor.project(parseShellString(query.project));
        }

        if (query.sort) {
          cursor = cursor.sort(parseShellString(query.sort));
        }

        if (query.limit) {
          cursor = cursor.limit(parseShellString(query.limit));
        }

        if (query.skip) {
          cursor = cursor.skip(parseShellString(query.skip));
        }
      }

      const result = (await cursor.toArray()).map((doc) =>
        EJSON.serialize(doc)
      );

      await assertResult(result);
    }
  } catch (error) {
    const newError = new Error('Inaccurate query generated');
    newError.errorCode = 'INACCURATE_QUERY_GENERATED';
    newError.query = error.message;
    newError.prompt = response.prompt;
    newError.causedBy = error;
    throw error;
  }
};

const runTest = async (testOptions) => {
  const usageStats = [];
  const attempts = ATTEMPTS_PER_TEST;
  let fails = 0;
  let timeouts = 0;

  for (let i = 0; i < attempts; i++) {
    if (timeouts >= MAX_TIMEOUTS_PER_TEST) {
      throw new Error('Too many timeouts');
    }

    try {
      console.info('---------------------------------------------------');
      console.info('Running', JSON.stringify(testOptions.userInput));
      console.info('Attempt', i + 1, 'of', attempts, 'Failures:', fails);
      await runOnce(testOptions, usageStats);

      console.info('OK');
    } catch (e) {
      if (e.errorCode === 'GATEWAY_TIMEOUT') {
        i--;
        timeouts++;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.error(e);
        console.info('FAILED');
        fails++;
      }
    }
  }

  const accuracy = (attempts - fails) / attempts;

  return { accuracy, timeouts, usageStats };
};

const fixtures = {};

async function setup() {
  cluster = await MongoCluster.start({
    tmpDir: os.tmpdir(),
    topology: 'standalone',
  });

  mongoClient = new MongoClient(cluster.connectionString);

  const fixtureFiles = (
    await fs.readdir(path.join(__dirname, 'fixtures'), 'utf-8')
  ).filter((f) => f.endsWith('.json'));

  for (const fixture of fixtureFiles) {
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
}

async function teardown() {
  await mongoClient?.close();
  await cluster?.close();
}

const isDeepStrictEqualTo = (expected) => (actual) =>
  assert.deepStrictEqual(actual, expected);

const isDeepStrictEqualToFixtures = (db, coll, comparator) => (actual) => {
  const expected = fixtures[db][coll].filter(comparator);
  assert.deepStrictEqual(actual, expected);
};

const anyOf = (assertions) => (actual) => {
  const errors = [];
  for (const assertion of assertions) {
    try {
      assertion(actual);
    } catch (e) {
      errors.push(e);
    }
  }

  if (errors.length === assertions.length) {
    throw errors[errors.length - 1];
  }
};

const tests = [
  {
    type: 'query',
    databaseName: 'netflix',
    collectionName: 'movies',
    userInput: 'find all the movies released in 1983',
    assertResult: isDeepStrictEqualToFixtures(
      'netflix',
      'movies',
      (doc) => doc._id.$oid === '573b864df29313caabe35593'
    ),
  },
  {
    type: 'query',
    databaseName: 'netflix',
    collectionName: 'movies',
    userInput:
      'find three movies with alien in the title, show earliest movies first, only the _id, title and year',
    assertResult: isDeepStrictEqualTo([
      {
        _id: {
          $oid: '573b864ef29313caabe3907a',
        },
        title: "Alien 3: Collector's Edition",
        year: '1992',
      },
      {
        _id: {
          $oid: '573b864ef29313caabe39507',
        },
        title: 'Alien Chaser',
        year: '1996',
      },
      {
        _id: {
          $oid: '573b864df29313caabe36f05',
        },
        title: 'Alien Files',
        year: '1999',
      },
    ]),
  },
  {
    type: 'query',
    databaseName: 'NYC',
    collectionName: 'parking_2015',
    userInput:
      'find all the violations for the violation code 21 and only return the car plate',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          _id: {
            $oid: '5735040085629ed4fa8394a5',
          },
          'Plate ID': 'FPG1269',
        },
        {
          _id: {
            $oid: '5735040085629ed4fa8394bd',
          },
          'Plate ID': 'T645263C',
        },
      ]),
      isDeepStrictEqualTo([
        {
          'Plate ID': 'FPG1269',
        },
        {
          'Plate ID': 'T645263C',
        },
      ]),
    ]),
  },
  {
    type: 'query',
    databaseName: 'berlin',
    collectionName: 'cocktailbars',
    userInput:
      'all the bars 10km from the berlin center, hint: use $nearSphere and $geometry',
    assertResult: isDeepStrictEqualToFixtures(
      'berlin',
      'cocktailbars',
      (doc) => doc._id.$oid === '5ca652bf56618187558b4de3'
    ),
  },
  {
    type: 'query',
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      'Return all the properties of type "Hotel" and with ratings lte 70',
    assertResult: isDeepStrictEqualToFixtures(
      'sample_airbnb',
      'listingsAndReviews',
      (doc) => doc._id === '10115921'
    ),
  },
  {
    // Test for how we pass aggregations instead of query properties.
    type: 'query',
    acceptAggregationResponse: true,
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      'what is the bed count that occurs the most? return it in a field called bedCount',
    assertResult: isDeepStrictEqualTo([
      {
        bedCount: 1,
      },
    ]),
  },
  {
    type: 'query',
    databaseName: 'delimiters',
    collectionName: 'filter',
    userInput: 'get all docs where filter is true',
    assertResult: isDeepStrictEqualTo([
      {
        _id: '1',
        filter: true,
      },
    ]),
  },
  {
    type: 'aggregation',
    databaseName: 'netflix',
    collectionName: 'movies',
    userInput: 'find all the movies released in 1983',
    assertResult: isDeepStrictEqualTo([
      {
        _id: {
          $oid: '573b864df29313caabe35593',
        },
        title: 'Smokey and the Bandit Part 3',
        year: '1983',
        id: '168',
      },
    ]),
  },
];

async function main() {
  try {
    await setup();
    const table = [];

    let anyFailed = false;

    for (const test of tests) {
      const {
        accuracy,
        // usageStats
      } = await runTest(test);
      const minAccuracy = test.minAccuracy ?? DEFAULT_MIN_ACCURACY;
      const failed = accuracy < minAccuracy;

      table.push({
        Type: test.type.slice(0, 1).toUpperCase(),
        'User Input': test.userInput.slice(0, 50),
        Namespace: `${test.databaseName}.${test.collectionName}`,
        Accuracy: accuracy,
        // 'Prompt Tokens': usageStats[0]?.promptTokens,
        // 'Completion Tokens': usageStats[0]?.completionTokens,
        Pass: failed ? '✗' : '✓',
      });

      anyFailed = anyFailed || failed;
    }

    console.table(table, [
      'Type',
      'User Input',
      'Namespace',
      'Accuracy',
      // 'Prompt Tokens',
      // 'Completion Tokens',
      'Pass',
    ]);

    console.log('\nTotal HTTP errors received', httpErrors);

    if (anyFailed) {
      process.exit(1);
    }
  } finally {
    await teardown();
  }
}

main();
