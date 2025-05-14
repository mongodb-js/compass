import repl from 'node:repl';
import fs from 'node:fs/promises';
import { VoyageAIClient } from 'voyageai'; // Adjust import as needed
import { MongoClient, Binary, BSON } from 'mongodb';
import http from 'node:http';
import { GridFSBucket } from 'mongodb';

// COMMAND:
// node --no-warnings --env-file=.env --experimental-strip-types prompt.mts
/**
 * Interactive REPL tool for searching movie reviews and posters using MongoDB vector search and VoyageAI embeddings.
 *
 * Features:
 * - Connects to a MongoDB database with collections for movie reviews and poster images.
 * - Uses VoyageAI to generate vector embeddings for text and multimodal queries.
 * - Caches query vectors in a local `queries.jsonl` file to avoid redundant API calls.
 * - Provides two main REPL commands:
 *   - `r(query: string)`: Search for movie reviews semantically similar to the query.
 *   - `i(query: string)`: Search for movie posters semantically similar to the query and display them in a local web server.
 * - Ensures required MongoDB vector search indexes exist and are queryable.
 * - Serves a simple HTML page at http://localhost:2390 to display poster search results.
 *
 * Environment Variables:
 * - `MONGODB_URI`: MongoDB connection string.
 * - `VOYAGE_API_KEY`: API key for VoyageAI.
 *
 * @module prompt
 */

/**
 * HOW TO RUN:
 *
 * 1. Ensure you have a `.env` file with the following variables:
 *    MONGODB_URI=<your-mongodb-uri>
 *    VOYAGE_API_KEY=<your-voyageai-api-key>
 *
 * 2. Install dependencies:
 *    npm install mongodb voyageai
 *
 * 3. Run the script with Node.js (v20+ recommended):
 *    node --no-warnings --env-file=.env --experimental-strip-types prompt.mts
 *
 * 4. In the REPL:
 *    - Use `await r('your query')` to search reviews.
 *    - Use `await i('your query')` to search posters (see results at http://localhost:2390).
 *
 * 5. All queries and their vectors are cached in `queries.jsonl`.
 */

const EJSON = BSON.EJSON;

// Replace with your actual connection strings and API keys
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('you must provide MONGODB_URI in the env');
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
if (!VOYAGE_API_KEY)
  throw new Error('you must provide VOYAGE_API_KEY in the env');

const voyage = new VoyageAIClient({ apiKey: VOYAGE_API_KEY });
const mongoClient = new MongoClient(MONGODB_URI);
await mongoClient.connect();

const movies = mongoClient.db('movies');
const bucket = new GridFSBucket(movies);
const imageFiles = movies.collection('fs.files');
const reviews = movies.collection('reviews');

const queriesFile = await fs.open('queries.jsonl', 'a');

console.log('\n');

async function ensureIndexes() {
  function indexDefFor(
    name: string
  ): (
    index: { name: string; queryable: boolean },
    _: number,
    __: any
  ) => boolean {
    return (idx) => idx.name === name && idx.queryable;
  }

  let reviewSearchIndexes = (await reviews
    .listSearchIndexes()
    .toArray()) as unknown as { name: string; queryable: boolean }[];
  let imageSearchIndexes = (await imageFiles
    .listSearchIndexes()
    .toArray()) as unknown as { name: string; queryable: boolean }[];

  let tries = 0;
  while (
    (!reviewSearchIndexes.some(indexDefFor('real_for_real_index')) ||
      !imageSearchIndexes.some(indexDefFor('poster_vec_index'))) &&
    tries < 3
  ) {
    console.log(`Waiting for indexes to appear (try ${tries + 1})...`);
    await new Promise((res) => setTimeout(res, 2000));
    reviewSearchIndexes = (await reviews
      .listSearchIndexes()
      .toArray()) as unknown as { name: string; queryable: boolean }[];
    imageSearchIndexes = (await imageFiles
      .listSearchIndexes()
      .toArray()) as unknown as { name: string; queryable: boolean }[];
    tries++;
  }

  if (!reviewSearchIndexes.some(indexDefFor('real_for_real_index'))) {
    console.log('Creating review vector search index: real_for_real_index');
    await reviews.createSearchIndex({
      name: 'real_for_real_index',
      type: 'vectorSearch',
      definition: {
        fields: [
          {
            type: 'vector',
            path: 'review_vec',
            numDimensions: 1024,
            similarity: 'dotProduct',
          },
        ],
      },
    });
  } else {
    console.log(
      'Review vector search index already exists and is queryable: real_for_real_index'
    );
  }

  if (!imageSearchIndexes.some(indexDefFor('poster_vec_index'))) {
    console.log('Creating poster vector search index: poster_vec_index');
    await imageFiles.createSearchIndex({
      name: 'poster_vec_index',
      type: 'vectorSearch',
      definition: {
        fields: [
          {
            type: 'vector',
            path: 'metadata.vector',
            numDimensions: 1024,
            similarity: 'dotProduct',
          },
        ],
      },
    });
  } else {
    console.log(
      'Poster vector search index already exists and is queryable: poster_vec_index'
    );
  }

  while (
    !reviewSearchIndexes.some(indexDefFor('real_for_real_index')) ||
    !imageSearchIndexes.some(indexDefFor('poster_vec_index'))
  ) {
    console.log('Waiting for all indexes to be ready and queryable...');
    await new Promise((res) => setTimeout(res, 2000));
    reviewSearchIndexes = (await reviews
      .listSearchIndexes()
      .toArray()) as unknown as { name: string; queryable: boolean }[];
    imageSearchIndexes = (await imageFiles
      .listSearchIndexes()
      .toArray()) as unknown as { name: string; queryable: boolean }[];
  }
  console.log('All required indexes are ready and queryable.');
}

await ensureIndexes();

async function getCachedVector(query: string): Promise<Binary | null> {
  // Read the file from the beginning using fs.readFile
  const content = await fs.readFile('queries.jsonl', { encoding: 'utf8' });
  const lines = content.split('\n').filter((l) => Boolean(l));
  for (const line of lines) {
    try {
      const entry = EJSON.parse(line, { relaxed: false });
      if (entry.query === query && entry.vector) {
        // entry.vector is EJSON, convert to Binary
        return entry.vector;
      }
    } catch {
      /* ignore parse errors */
    }
  }
  return null;
}

async function r(query: string) {
  await mongoClient.connect();

  // Try to get vector from cache
  let vector = await getCachedVector(query);

  if (vector == null) {
    // Get vector from VoyageAI
    const response = await voyage.embed({
      model: 'voyage-3-large',
      input: query,
    });

    vector = Binary.fromFloat32Array(
      new Float32Array(response.data[0].embedding)
    );
    await queriesFile.appendFile(EJSON.stringify({ query, vector }) + '\n');
  }

  // Run vector search aggregation
  const pipeline = [
    {
      $vectorSearch: {
        index: 'real_for_real_index',
        path: 'review_vec',
        queryVector: vector,
        numCandidates: replInstance.context.numCandidates,
        limit: replInstance.context.limit,
      },
    },
    {
      $project: {
        _id: 0,
        review: 1,
        rating: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  const results = await reviews.aggregate(pipeline).toArray();
  return results;
}

let html = (content) => `
  <!DOCTYPE html>
  <html lang="en">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <body>${content}</body>
  </html>
`;

let lastHtml = html('<h2>No posters searched yet.</h2>');
let server: http.Server | null = null;

// Start HTTP server
server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(lastHtml);
});
console.log('Images: http://localhost:2390');
server.listen(2390, 'localhost', () => {});

async function i(query: string) {
  await mongoClient.connect();

  // Try to get vector from cache
  let vector = await getCachedVector(query);

  if (vector == null) {
    const inputs = [{ content: [{ type: 'text', text: query }] }];

    const response = await voyage.multimodalEmbed({
      inputs,
      model: 'voyage-multimodal-3',
    });
    vector = Binary.fromFloat32Array(
      new Float32Array(response.data[0].embedding)
    );
    await queriesFile.appendFile(EJSON.stringify({ query, vector }) + '\n');
  }

  // Vector search for poster files (assume 'poster_vec' field in files collection)
  const filesCollection = movies.collection('fs.files');
  const pipeline = [
    {
      $vectorSearch: {
        index: 'poster_vec_index',
        path: 'metadata.vector',
        queryVector: vector,
        numCandidates: replInstance.context.numCandidates,
        limit: replInstance.context.limit,
      },
    },
    {
      $project: {
        _id: 1,
        filename: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];
  const files = await filesCollection.aggregate(pipeline).toArray();

  // Fetch image data from GridFS and build HTML
  let imageHtml = '<h2>Posters for: ' + query + '</h2>';
  for (const file of files) {
    try {
      const downloadStream = bucket.openDownloadStream(file._id);
      const chunks: Buffer[] = [];
      for await (const chunk of downloadStream) {
        chunks.push(chunk as Buffer);
      }
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      imageHtml += `<div style="display:inline-block;margin:8px;"><img src="data:image/jpeg;base64,${base64}" style="max-width:200px;max-height:300px;"/><br>${file.filename}</div>`;
    } catch (e) {
      imageHtml += `<div>Error loading poster: ${file.filename}</div>`;
    }
  }
  lastHtml = html(imageHtml);
  return files.map((f) => f.filename);
}

console.log('Use `r(string)` to search for reviews.');
console.log('Use `i(string)` to search posters.');
console.log('All queries are saved to queries.jsonl');
console.log('\n');

const replInstance = repl.start({ prompt: 'niva_neal ✨ ' });
replInstance.context.r = r;
replInstance.context.i = i;
replInstance.context.numCandidates = 100;
replInstance.context.limit = 5;

replInstance.on('exit', async () => {
  console.log('bye bye 👋');
  await mongoClient.close();
  await queriesFile.close();
  server?.close();
  replInstance.close();
  process.exit();
});
