/* eslint no-unused-expressions: 0 */
const constructQuerySegment = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/segment-query');
const { expect } = require('chai');

describe('Aggregation Pipeline Builder', function() {
  describe('Query Segment', function() {
    context('when no query properties are present', function() {
      it('has an empty query segment', function() {
        const state = {
          queryCache: {}
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.be.empty;
      });
    });
    context('when a single query property is present', function() {
      it('has an $match stage in the query segment', function() {
        const state = {
          queryCache: {
            filter: {foo: 'bar'}
          }
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $match: {
            foo: 'bar'
          }
        });
      });
      it('has an $sort stage in the query segment', function() {
        const state = {
          queryCache: {
            sort: {
              foo: 1,
              bar: 1
            }
          }
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $sort: {
            foo: 1,
            bar: 1
          }
        });
      });
      it('has an $skip stage in the query segment', function() {
        const state = {
          queryCache: {
            skip: 200
          }
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $skip: 200
        });
      });
      it('has an $limit stage in the query segment', function() {
        const state = {
          queryCache: {
            limit: 999
          }
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $limit: 999
        });
      });
      it('has an $sample stage in the query segment', function() {
        const state = {
          queryCache: {
            limit: 10,
            sample: true
          }
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $sample: {
            size: 10
          }
        });
      });
    });
    context('when all query properties are present', function() {
      it('has the stages in the right order', function() {
        const state = {
          queryCache: {
            filter: {foo: 'bar'},
            sort: {baz: 1},
            skip: 20,
            limit: 10,
            sample: true
          }
        };
        const result = constructQuerySegment(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(4);
        expect(result[0]).to.have.keys('$match');
        expect(result[1]).to.have.keys('$sort');
        expect(result[2]).to.have.keys('$skip');
        expect(result[3]).to.have.keys('$sample');
      });
    });
  });
});
