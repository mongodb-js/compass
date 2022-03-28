import { expect } from 'chai';

import reducer, {
  TOGGLE_STATUS,
  SEARCH_TERM,
  STOP_FIND,
  FIND,
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus,
} from '.';

describe('index module', function () {
  describe('#dispatchStopFind', function () {
    it('returns stop find action type', function () {
      expect(dispatchStopFind()).to.deep.equal({
        type: STOP_FIND,
      });
    });
  });

  describe('#dispatchFind', function () {
    it('returns find action type', function () {
      expect(dispatchFind('pineapple', true, false)).to.deep.equal({
        searchTerm: 'pineapple',
        findNext: false,
        forward: true,
        type: FIND,
      });
    });
  });

  describe('#toggleStatus', function () {
    it('returns a toggle status action type', function () {
      expect(toggleStatus()).to.deep.equal({
        type: TOGGLE_STATUS,
      });
    });
  });

  describe('#setSearchTerm', function () {
    it('returns a search term action type', function () {
      expect(setSearchTerm('pineapples')).to.deep.equal({
        searchTerm: 'pineapples',
        type: SEARCH_TERM,
      });
    });
  });

  describe('#reducer', function () {
    context('action type is toggleStatus', function () {
      it('enabled is set to true', function () {
        expect(reducer(undefined, toggleStatus())).to.deep.equal({
          searching: false,
          searchTerm: '',
          enabled: true,
        });
      });
    });

    context('action type is setSearchTerm', function () {
      it('search value is in state', function () {
        expect(reducer(undefined, setSearchTerm('search value'))).to.deep.equal(
          {
            searchTerm: 'search value',
            searching: false,
            enabled: false,
          }
        );
      });
    });

    context('action type is dispatchFind', function () {
      it('searching is set to true', function () {
        expect(
          reducer(undefined, dispatchFind('value', true, true))
        ).to.deep.equal({
          searching: true,
          searchTerm: '',
          enabled: false,
        });
      });
    });

    context('action type is dispatchStopFind', function () {
      it('searching is set to false', function () {
        expect(reducer(undefined, dispatchStopFind())).to.deep.equal({
          searching: false,
          searchTerm: '',
          enabled: false,
        });
      });
    });
  });
});
