import { expect } from 'chai';
import {
  buildFindQueryPrompt,
  buildAggregateQueryPrompt,
  type UserPromptForQueryOptions,
} from './gen-ai-prompt';

const OPTIONS: UserPromptForQueryOptions = {
  userPrompt: 'Find all users older than 30',
  databaseName: 'testDB',
  collectionName: 'users',
  schema: {
    name: 'string',
    age: 'number',
    email: 'string',
  },
  sampleDocuments: [{ name: 'Alice', age: 25, email: 'alice@example.com' }],
};

describe('GenAI Prompts', function () {
  it('buildFindQueryPrompt', function () {
    const {
      prompt,
      metadata: { instructions },
    } = buildFindQueryPrompt(OPTIONS);

    expect(instructions).to.be.a('string');
    expect(instructions).to.include(
      'The current date is',
      'includes date instruction'
    );

    expect(prompt).to.be.a('string');
    expect(prompt).to.include(
      `Write a query that does the following: "${OPTIONS.userPrompt}"`,
      'includes user prompt'
    );
    expect(prompt).to.include(
      `Database name: "${OPTIONS.databaseName}"`,
      'includes database name'
    );
    expect(prompt).to.include(
      `Collection name: "${OPTIONS.collectionName}"`,
      'includes collection name'
    );
    expect(prompt).to.include(
      'Schema from a sample of documents from the collection:',
      'includes schema text'
    );
    expect(prompt).to.include(
      JSON.stringify(OPTIONS.schema),
      'includes actual schema'
    );
    expect(prompt).to.include(
      'Sample documents from the collection:',
      'includes sample documents text'
    );
    expect(prompt).to.include(
      JSON.stringify(OPTIONS.sampleDocuments),
      'includes actual sample documents'
    );
  });

  it('buildAggregateQueryPrompt', function () {
    const {
      prompt,
      metadata: { instructions },
    } = buildAggregateQueryPrompt(OPTIONS);

    expect(instructions).to.be.a('string');
    expect(instructions).to.include(
      'The current date is',
      'includes date instruction'
    );

    expect(prompt).to.be.a('string');
    expect(prompt).to.include(
      `Generate an aggregation that does the following: "${OPTIONS.userPrompt}"`,
      'includes user prompt'
    );
    expect(prompt).to.include(
      `Database name: "${OPTIONS.databaseName}"`,
      'includes database name'
    );
    expect(prompt).to.include(
      `Collection name: "${OPTIONS.collectionName}"`,
      'includes collection name'
    );
    expect(prompt).to.include(
      'Schema from a sample of documents from the collection:',
      'includes schema text'
    );
    expect(prompt).to.include(
      JSON.stringify(OPTIONS.schema),
      'includes actual schema'
    );
    expect(prompt).to.include(
      'Sample documents from the collection:',
      'includes sample documents text'
    );
    expect(prompt).to.include(
      JSON.stringify(OPTIONS.sampleDocuments),
      'includes actual sample documents'
    );
  });
});
