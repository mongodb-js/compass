import { expect } from 'chai';
import { isPipelineSearchQueryable } from './view-search-queryable'; // Adjust the import path as necessary
import type { Document } from 'mongodb';

describe('isPipelineSearchQueryable', () => {
  it('should return true for a valid pipeline with $addFields stage', () => {
    const pipeline: Document[] = [{ $addFields: { testField: 'testValue' } }];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(true);
  });

  it('should return true for a valid pipeline with $set stage', () => {
    const pipeline: Document[] = [{ $set: { testField: 'testValue' } }];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(true);
  });

  it('should return true for a valid pipeline with $match stage using $expr', () => {
    const pipeline: Document[] = [
      { $match: { $expr: { $eq: ['$field', 'value'] } } },
    ];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(true);
  });

  it('should return false for a pipeline with an unsupported stage', () => {
    const pipeline: Document[] = [{ $group: { _id: '$field' } }];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(false);
  });

  it('should return false for a $match stage without $expr', () => {
    const pipeline: Document[] = [{ $match: { nonExprKey: 'someValue' } }];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(false);
  });

  it('should return false for a $match stage with $expr and additional fields', () => {
    const pipeline: Document[] = [
      {
        $match: { $expr: { $eq: ['$field', 'value'] }, anotherField: 'value' },
      },
    ];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(false);
  });

  it('should return true for an empty pipeline', () => {
    const pipeline: Document[] = [];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(true);
  });

  it('should return false if any stage in the pipeline is invalid', () => {
    const pipeline: Document[] = [
      { $addFields: { testField: 'testValue' } },
      { $match: { $expr: { $eq: ['$field', 'value'] } } },
      { $group: { _id: '$field' } },
    ];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(false);
  });

  it('should handle a pipeline with multiple valid stages', () => {
    const pipeline: Document[] = [
      { $addFields: { field1: 'value1' } },
      { $match: { $expr: { $eq: ['$field', 'value'] } } },
      { $set: { field2: 'value2' } },
    ];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(true);
  });

  it('should return false for a $match stage with no conditions', () => {
    const pipeline: Document[] = [{ $match: {} }];
    expect(isPipelineSearchQueryable(pipeline)).to.equal(false);
  });
});
