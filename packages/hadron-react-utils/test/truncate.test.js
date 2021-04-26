const { expect } = require('chai');
const { truncate } = require('../');

describe('#truncate', () => {
  context('when a limit is provided', () => {
    const value = truncate('testing', 3);

    it('truncates the string at the limit and adds elipsis', () => {
      expect(value).to.equal('tes...');
    });
  });

  context('when a limit is not provided', () => {
    const value = truncate('testing');

    it('does not truncate the string', () => {
      expect(value).to.equal('testing');
    });
  });
});
