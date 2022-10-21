import { expect } from 'chai';
import reducer, {
  INITIAL_STATE,
  changeDatabaseName,
  CHANGE_DATABASE_NAME
} from './database-name';

describe('create database name module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, changeDatabaseName('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDatabaseName', function() {
    it('returns the action', function() {
      expect(changeDatabaseName('test')).to.deep.equal({
        type: CHANGE_DATABASE_NAME,
        name: 'test',
        collections: []
      });
    });
  });
});
