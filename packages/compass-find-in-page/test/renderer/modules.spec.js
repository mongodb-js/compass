import reducer, {
  TOGGLE_STATUS,
  SEARCH_TERM,
  STOP_FIND,
  FIND,
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus
} from 'modules';

describe('index module', () => {
  describe('#dispatchStopFind', () => {
    it('returns stop find action type', () => {
      expect(dispatchStopFind()).to.deep.equal({
        type: STOP_FIND
      });
    });
  });

  describe('#dispatchStopFind', () => {
    it('returns find action type', () => {
      expect(dispatchFind('searchTerm', true, false)).to.deep.equal({
        val: 'searchTerm',
        findNext: false,
        forward: true,
        type: FIND
      });
    });
  });

  describe('#toggleStatus', () => {
    it('returns a toggle status action type', () => {
      expect(toggleStatus()).to.deep.equal({
        type: TOGGLE_STATUS
      });
    });
  });

  describe('#setSearchTerm', () => {
    it('returns a search term action type', () => {
      expect(setSearchTerm('search value')).to.deep.equal({
        searchTerm: 'search value',
        type: SEARCH_TERM
      });
    });
  });

  describe('#reducer', () => {
    context('action type is toggleStatus', () => {
      it('enabled is set to true', () => {
        expect(reducer(undefined, toggleStatus())).to.deep.equal({
          searching: false,
          searchTerm: '',
          enabled: true
        });
      });
    });

    context('action type is setSearchTerm', () => {
      it('search value is in state', () => {
        expect(reducer(undefined, setSearchTerm('search value'))).to.deep.equal({
          searchTerm: 'search value',
          searching: false,
          enabled: false
        });
      });
    });

    context('action type is dispatchFind', () => {
      it('searching is set to true', () => {
        expect(reducer(undefined, dispatchFind('value', true, true))).to.deep.equal({
          searching: true,
          searchTerm: '',
          enabled: false
        });
      });
    });

    context('action type is dispatchStopFind', () => {
      it('searching is set to false', () => {
        expect(reducer(undefined, dispatchStopFind())).to.deep.equal({
          searching: false,
          searchTerm: '',
          enabled: false
        });
      });
    });
  });
});
