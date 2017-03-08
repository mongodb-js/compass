/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const mockDataService = require('./mock-data-service');
const app = require('hadron-app');
const _ = require('lodash');

describe('mockDataService', function() {
  describe('errors and returns', function() {
    context('when providing custom errors', function() {
      before(mockDataService.before({
        count: new Error('count error')
      }));
      after(mockDataService.after());

      it('returns the error provided', function(done) {
        app.dataService.count('foo.bar', {}, {}, (err, res) => {
          expect(err).to.be.an('error');
          expect(err.message).to.be.equal('count error');
          expect(res).to.be.undefined;
          done();
        });
      });

      it('returns null for methods without explicit error', function(done) {
        app.dataService.find('foo.bar', {}, {}, (err, res) => {
          expect(err).to.be.null;
          expect(res).to.be.undefined;
          done();
        });
      });
    });
    context('when providing custom return values', function() {
      before(mockDataService.before({}, {
        find: [{_id: 1, foo: true}, {_id: 2, foo: false}]
      }));
      after(mockDataService.after());

      it('returns the result value provided', function(done) {
        app.dataService.find('foo.bar', {}, {}, (err, res) => {
          expect(err).to.be.null;
          expect(res).to.be.an('array');
          expect(res).to.have.lengthOf(2);
          expect(res[0]).to.have.all.keys('_id', 'foo');
          done();
        });
      });

      it('returns undefined for methods without explicit result', function(done) {
        app.dataService.count('foo.bar', {}, {}, (err, res) => {
          expect(err).to.be.null;
          expect(res).to.be.undefined;
          done();
        });
      });
    });
  });

  describe('before and after hooks', function() {
    it('should replace hadron-app data-service with the mock version', function() {
      mockDataService.before()();
      expect(app.dataService.isMocked).to.be.true;
    });
    it('has sinon spies on its methods', function() {
      app.dataService.find('foo.bar', 'filter', 'options', (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.undefined;
        expect(app.dataService.find.lastCall.args).to.have.lengthOf(4);
      });
    });
    it('works with nested levels of before/after calls', function() {
      app.dataService.level = 1;
      mockDataService.before()();
      app.dataService.level = 2;
      mockDataService.before()();
      expect(app.dataService.level).to.be.undefined;
      mockDataService.after()();
      expect(app.dataService.level).to.be.equal(2);
      mockDataService.after()();
      expect(app.dataService.level).to.be.equal(1);
    });
    it('replaces the original data-service', function() {
      mockDataService.after()();
      expect(_.get(app.dataService, 'isMocked')).to.be.undefined;
    });
  });
});
