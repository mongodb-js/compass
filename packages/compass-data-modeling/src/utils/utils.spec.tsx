import { expect } from 'chai';
import {
  isRelationshipInvolvingField,
  isRelationshipOfAField,
  isSameFieldOrAncestor,
  dualSourceHandlerDebounce,
} from './utils';
import type { Relationship } from '../services/data-model-storage';

describe('isSameFieldOrAncestor', function () {
  it('should return true for the same field', function () {
    expect(isSameFieldOrAncestor(['a', 'b'], ['a', 'b'])).to.be.true;
  });

  it('should return true for a child field', function () {
    expect(isSameFieldOrAncestor(['a', 'b'], ['a', 'b', 'c'])).to.be.true;
  });

  it('should return false for a parent field', function () {
    expect(isSameFieldOrAncestor(['a', 'b', 'c'], ['a', 'b'])).to.be.false;
  });

  it('should return false for another field', function () {
    expect(isSameFieldOrAncestor(['a', 'b'], ['a', 'c'])).to.be.false;
  });
});

describe('isRelationshipOfAField', function () {
  const relationship: Relationship['relationship'] = [
    { ns: 'db.coll1', fields: ['a', 'b'], cardinality: 1 },
    { ns: 'db.coll2', fields: ['c', 'd'], cardinality: 1 },
  ];

  it('should return true for exact match', function () {
    expect(isRelationshipOfAField(relationship, 'db.coll1', ['a', 'b'])).to.be
      .true;
    expect(isRelationshipOfAField(relationship, 'db.coll2', ['c', 'd'])).to.be
      .true;
  });

  it('should return false for other fields', function () {
    expect(isRelationshipOfAField(relationship, 'db.coll1', ['a'])).to.be.false;
    expect(isRelationshipOfAField(relationship, 'db.coll1', ['a', 'c'])).to.be
      .false;
  });

  it('should handle incomplete relationships', function () {
    expect(
      isRelationshipOfAField(
        [{ ns: null, fields: null, cardinality: 1 }, relationship[1]],
        'db.coll2',
        ['c', 'd']
      )
    ).to.be.true;
    expect(
      isRelationshipOfAField(
        [{ ns: 'db.coll2', fields: null, cardinality: 1 }, relationship[1]],
        'db.coll2',
        ['c', 'd']
      )
    ).to.be.true;
  });
});

describe('isRelationshipInvolvingAField', function () {
  const relationship: Relationship['relationship'] = [
    { ns: 'db.coll1', fields: ['a', 'b'], cardinality: 1 },
    { ns: 'db.coll2', fields: ['c', 'd', 'e'], cardinality: 1 },
  ];

  it('should return true for exact match', function () {
    expect(isRelationshipInvolvingField(relationship, 'db.coll1', ['a', 'b']))
      .to.be.true;
    expect(
      isRelationshipInvolvingField(relationship, 'db.coll2', ['c', 'd', 'e'])
    ).to.be.true;
  });

  it('should return true for fields that are on the path (ancestors)', function () {
    expect(isRelationshipInvolvingField(relationship, 'db.coll1', ['a'])).to.be
      .true;
    expect(isRelationshipInvolvingField(relationship, 'db.coll2', ['c', 'd']))
      .to.be.true;
    expect(isRelationshipInvolvingField(relationship, 'db.coll2', ['c'])).to.be
      .true;
  });

  it('should return false fields that are not on the path', function () {
    expect(
      isRelationshipInvolvingField(relationship, 'db.coll1', ['a', 'b', 'c'])
    ).to.be.false;
    expect(isRelationshipInvolvingField(relationship, 'db.coll2', ['g'])).to.be
      .false;
  });

  it('should handle incomplete relationships', function () {
    expect(
      isRelationshipInvolvingField(
        [{ ns: null, fields: null, cardinality: 1 }, relationship[1]],
        'db.coll2',
        ['c', 'd']
      )
    ).to.be.true;
    expect(
      isRelationshipInvolvingField(
        [{ ns: 'db.coll2', fields: null, cardinality: 1 }, relationship[1]],
        'db.coll2',
        ['c', 'd']
      )
    ).to.be.true;
  });
});

describe('dualSourceHandlerDebounce', function () {
  it('should invoke the original handler only once for dual invocations', function () {
    const timestamps = [0, 0, 200, 400, 401];
    let invocationCount = 0;
    const handler = () => {
      invocationCount++;
    };
    const [handler1, handler2] = dualSourceHandlerDebounce(
      handler,
      2,
      () => timestamps.shift()!
    );
    handler1();
    expect(invocationCount).to.equal(1);
    handler2();
    expect(invocationCount).to.equal(1);
    handler1();
    expect(invocationCount).to.equal(2);
    handler2();
    expect(invocationCount).to.equal(3);
    handler1();
    expect(invocationCount).to.equal(3);
  });
});
