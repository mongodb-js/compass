const { expect } = require('chai');
const IndexStore = require('../../../lib/stores');

describe('IndexStore', () => {
  describe('#getInitialState', () => {
    it('initializes with an empty current connection', () => {
      expect(IndexStore.state.currentConnection.username).to.equal('');
    });
  });
});
