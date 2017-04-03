const { expect } = require('chai');
const { selector } = require('../');

describe('#selector', () => {
  it('returns the data-test-id selector', () => {
    expect(selector('test')).to.equal("[data-test-id='test']");
  });
});
