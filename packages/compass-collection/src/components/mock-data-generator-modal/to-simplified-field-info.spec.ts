import { expect } from 'chai';
import toSimplifiedFieldInfo from './to-simplified-field-info';
import type { SimplifiedFieldInfoTree } from './to-simplified-field-info';

describe('toSimplifiedFieldInfo', function () {
  it('simple case with minimal nesting and no arrays', function () {
    const input = {
      'user.name': {
        type: 'String' as const,
        sampleValues: ['John'],
        probability: 1.0,
      },
      'user.age': {
        type: 'Number' as const,
        sampleValues: [25, 30],
        probability: 0.8,
      },
      'user.profile.bio': {
        type: 'String' as const,
        sampleValues: ['Software engineer'],
        probability: 0.9,
      },
      'user.profile.isVerified': {
        type: 'Boolean' as const,
        sampleValues: [true, false],
        probability: 0.7,
      },
      'metadata.createdAt': {
        type: 'Date' as const,
        sampleValues: [new Date('2023-01-01')],
        probability: 1.0,
      },
      'metadata.objectId': {
        type: 'ObjectId' as const,
        sampleValues: ['642d766b7300158b1f22e972'],
        probability: 1.0,
      },
    };

    const result = toSimplifiedFieldInfo(input);

    const expected: SimplifiedFieldInfoTree = {
      user: {
        name: 'String',
        age: 'Number',
        profile: {
          bio: 'String',
          isVerified: 'Boolean',
        },
      },
      metadata: {
        createdAt: 'Date',
        objectId: 'ObjectId',
      },
    };

    expect(result).to.deep.equal(expected);
  });

  it('handles nested arrays of primitives', function () {
    const input = {
      'tags[]': {
        type: 'String' as const,
        sampleValues: ['red', 'blue', 'green'],
        probability: 1.0,
      },
      'scores[]': {
        type: 'Number' as const,
        sampleValues: [85, 92, 78],
        probability: 0.9,
      },
      'matrix[][]': {
        type: 'Number' as const,
        sampleValues: [1, 2, 3, 4],
        probability: 1.0,
      },
      'flags[]': {
        type: 'Boolean' as const,
        sampleValues: [true, false],
        probability: 0.8,
      },
      'timestamps[]': {
        type: 'Date' as const,
        sampleValues: [new Date('2023-01-01'), new Date('2023-06-15')],
        probability: 0.7,
      },
      'ids[]': {
        type: 'ObjectId' as const,
        sampleValues: ['642d766b7300158b1f22e972', '642d766b7300158b1f22e973'],
        probability: 1.0,
      },
    };

    const result = toSimplifiedFieldInfo(input);

    const expected: SimplifiedFieldInfoTree = {
      'tags[]': 'String',
      'scores[]': 'Number',
      'matrix[][]': 'Number',
      'flags[]': 'Boolean',
      'timestamps[]': 'Date',
      'ids[]': 'ObjectId',
    };

    expect(result).to.deep.equal(expected);
  });

  it('handles nested arrays of documents', function () {
    const input = {
      'items[].id': {
        type: 'Number' as const,
        sampleValues: [1, 2],
        probability: 1.0,
      },
      'items[].name': {
        type: 'String' as const,
        sampleValues: ['Item A', 'Item B'],
        probability: 1.0,
      },
      'items[].metadata.createdBy': {
        type: 'String' as const,
        sampleValues: ['admin', 'user'],
        probability: 0.9,
      },
      'items[].metadata.tags[]': {
        type: 'String' as const,
        sampleValues: ['urgent', 'review', 'approved'],
        probability: 0.8,
      },
      'items[].price': {
        type: 'Decimal128' as const,
        sampleValues: [19.99, 29.99],
        probability: 0.95,
      },
      'items[].binary': {
        type: 'Binary' as const,
        sampleValues: ['dGVzdA=='],
        probability: 0.3,
      },
    };

    const result = toSimplifiedFieldInfo(input);

    const expected: SimplifiedFieldInfoTree = {
      'items[]': {
        id: 'Number',
        name: 'String',
        metadata: {
          createdBy: 'String',
          'tags[]': 'String',
        },
        price: 'Decimal128',
        binary: 'Binary',
      },
    };

    expect(result).to.deep.equal(expected);
  });

  it('handles nested arrays of arrays', function () {
    // Input based on complex nested array structures
    const input = {
      'cube[][][]': {
        type: 'Number' as const,
        sampleValues: [1, 2, 3, 4, 5, 6, 7, 8],
        probability: 1.0,
      },
      'matrix[][].x': {
        type: 'Number' as const,
        sampleValues: [1, 3],
        probability: 1.0,
      },
      'matrix[][].y': {
        type: 'Number' as const,
        sampleValues: [2, 4],
        probability: 1.0,
      },
      'teams[].members[]': {
        type: 'String' as const,
        sampleValues: ['Alice', 'Bob', 'Charlie'],
        probability: 1.0,
      },
      'teams[].name': {
        type: 'String' as const,
        sampleValues: ['Team A', 'Team B'],
        probability: 1.0,
      },
      'complex[][].data[]': {
        type: 'Long' as const,
        sampleValues: [123456789, 987654321],
        probability: 0.9,
      },
      'complex[][].regex': {
        type: 'RegExp' as const,
        sampleValues: ['pattern'],
        probability: 0.6,
      },
      'complex[][].code': {
        type: 'Code' as const,
        sampleValues: ['function() {}'],
        probability: 0.4,
      },
      'nested[][].symbols[]': {
        type: 'Symbol' as const,
        sampleValues: ['symbol1', 'symbol2'],
        probability: 0.5,
      },
      'timestamps[][].created': {
        type: 'Timestamp' as const,
        sampleValues: [4294967297],
        probability: 0.8,
      },
      'keys[][].max': {
        type: 'MaxKey' as const,
        sampleValues: ['MaxKey'],
        probability: 0.2,
      },
      'keys[][].min': {
        type: 'MinKey' as const,
        sampleValues: ['MinKey'],
        probability: 0.2,
      },
    };

    const result = toSimplifiedFieldInfo(input);

    const expected: SimplifiedFieldInfoTree = {
      'cube[][][]': 'Number',
      'matrix[][]': {
        x: 'Number',
        y: 'Number',
      },
      'teams[]': {
        'members[]': 'String',
        name: 'String',
      },
      'complex[][]': {
        'data[]': 'Long',
        regex: 'RegExp',
        code: 'Code',
      },
      'nested[][]': {
        'symbols[]': 'Symbol',
      },
      'timestamps[][]': {
        created: 'Timestamp',
      },
      'keys[][]': {
        max: 'MaxKey',
        min: 'MinKey',
      },
    };

    expect(result).to.deep.equal(expected);
  });
});
