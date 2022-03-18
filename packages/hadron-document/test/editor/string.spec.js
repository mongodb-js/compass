const { Element } = require('../../lib');
const { StringEditor } = require('../../lib/editor');
const { expect } = require('chai');

describe('StringEditor', () => {
  describe('#size', () => {
    const element = new Element('name', 'test', false);
    const stringEditor = new StringEditor(element);

    it('returns the number of characters', () => {
      expect(stringEditor.size()).to.equal(4);
    });
  });
});
