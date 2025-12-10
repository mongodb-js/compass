import { expect } from 'chai';
import {
  buildFindQueryPrompt,
  buildAggregateQueryPrompt,
  type PromptContextOptions,
} from './gen-ai-prompt';
import { toJSString } from 'mongodb-query-parser';
import { ObjectId } from 'bson';

const OPTIONS: PromptContextOptions = {
  userInput: 'Find all users older than 30',
  databaseName: 'airbnb',
  collectionName: 'listings',
  userId: 'test-user-id',
  enableStorage: false,
  requestId: 'test-request-id',
  schema: {
    _id: {
      types: [
        {
          bsonType: 'ObjectId',
        },
      ],
    },
    userId: {
      types: [
        {
          bsonType: 'ObjectId',
        },
      ],
    },
  },
  sampleDocuments: [
    {
      _id: new ObjectId('68a2dfe93d5adb16ebf4c866'),
      userId: new ObjectId('68a2dfe93d5adb16ebf4c865'),
    },
  ],
};

describe('GenAI Prompts', function () {
  it('buildFindQueryPrompt', function () {
    const { prompt, metadata } = buildFindQueryPrompt(OPTIONS);

    expect(metadata.instructions).to.be.a('string');
    expect(metadata.instructions).to.include(
      'The current date is',
      'includes date instruction'
    );
    expect(metadata.userId).to.equal(OPTIONS.userId);
    expect(metadata.store).to.equal('false');
    expect(metadata.requestId).to.equal(OPTIONS.requestId);

    expect(prompt).to.be.a('string');
    expect(prompt).to.include(
      'Write a query that does the following:',
      'includes user prompt'
    );
    expect(prompt).to.include(OPTIONS.userInput, 'includes user prompt');
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
      toJSString(OPTIONS.schema),
      'includes actual schema'
    );
    expect(prompt).to.include(
      'Sample documents from the collection:',
      'includes sample documents text'
    );
    expect(prompt).to.include(
      toJSString(OPTIONS.sampleDocuments),
      'includes actual sample documents'
    );
  });

  it('buildAggregateQueryPrompt', function () {
    const { prompt, metadata } = buildAggregateQueryPrompt(OPTIONS);

    expect(metadata.instructions).to.be.a('string');
    expect(metadata.instructions).to.include(
      'The current date is',
      'includes date instruction'
    );
    expect(metadata.userId).to.equal(OPTIONS.userId);
    expect(metadata.store).to.equal('false');
    expect(metadata.requestId).to.equal(OPTIONS.requestId);

    expect(prompt).to.be.a('string');
    expect(prompt).to.include(
      'Generate an aggregation that does the following:',
      'includes user prompt'
    );
    expect(prompt).to.include(OPTIONS.userInput, 'includes user prompt');
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
      toJSString(OPTIONS.schema),
      'includes actual schema'
    );
    expect(prompt).to.include(
      'Sample documents from the collection:',
      'includes sample documents text'
    );
    expect(prompt).to.include(
      toJSString(OPTIONS.sampleDocuments),
      'includes actual sample documents'
    );
  });

  it('throws if user prompt exceeds the max size', function () {
    try {
      buildFindQueryPrompt({
        ...OPTIONS,
        userInput: 'a'.repeat(512001),
      });
      expect.fail('Expected buildFindQueryPrompt to throw');
    } catch (err) {
      expect(err).to.have.property(
        'message',
        'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
      );
    }
  });

  context('handles large sample documents', function () {
    it('sends all the sample docs if within limits', function () {
      const sampleDocuments = [
        { a: '1' },
        { a: '2' },
        { a: '3' },
        { a: '4'.repeat(5120) },
      ];
      const prompt = buildFindQueryPrompt({
        ...OPTIONS,
        sampleDocuments,
      }).prompt;

      expect(prompt).to.include(toJSString(sampleDocuments));
    });
    it('sends only one sample doc if all exceed limits', function () {
      const sampleDocuments = [
        { a: '1'.repeat(5120) },
        { a: '2'.repeat(5120001) },
        { a: '3'.repeat(5120001) },
        { a: '4'.repeat(5120001) },
      ];
      const prompt = buildFindQueryPrompt({
        ...OPTIONS,
        sampleDocuments,
      }).prompt;
      expect(prompt).to.include(toJSString([sampleDocuments[0]]));
    });
    it('should not send sample docs if even one exceeds limits', function () {
      const sampleDocuments = [
        { a: '1'.repeat(5120001) },
        { a: '2'.repeat(5120001) },
        { a: '3'.repeat(5120001) },
        { a: '4'.repeat(5120001) },
      ];
      const prompt = buildFindQueryPrompt({
        ...OPTIONS,
        sampleDocuments,
      }).prompt;
      expect(prompt).to.not.include('Sample document from the collection:');
      expect(prompt).to.not.include('Sample documents from the collection:');
    });
  });

  context('with enableStorage set to true', function () {
    it('sets store to true in metadata when building find query prompt', function () {
      const { metadata } = buildFindQueryPrompt({
        ...OPTIONS,
        enableStorage: true,
      });
      expect(metadata.store).to.equal('true');
      expect((metadata as any).sensitiveStorage).to.equal('sensitive');
    });
    it('sets store to true in metadata when building aggregate query prompt', function () {
      const { metadata } = buildAggregateQueryPrompt({
        ...OPTIONS,
        enableStorage: true,
      });
      expect(metadata.store).to.equal('true');
      expect((metadata as any).sensitiveStorage).to.equal('sensitive');
    });
  });
});
