const { Element } = require('../../lib');
const { Int32 } = require('bson');
const { Int32Editor } = require('../../lib/editor');
const { expect } = require('chai');

describe('Int32Editor', () => {
  describe('#size', () => {
    const element = new Element('field', new Int32(12), false);
    const int32Editor = new Int32Editor(element);

    it('returns the number of characters', () => {
      expect(int32Editor.size()).to.equal(2);
    });
  });
});
