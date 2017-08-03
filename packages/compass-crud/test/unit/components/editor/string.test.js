const { expect } = require('chai');
const { Element } = require('hadron-document');
const { StringEditor } = require('../../../../lib/components/editor');

describe('StringEditor', () => {
  describe('#size', () => {
    const element = new Element('name', 'test', false);
    const stringEditor = new StringEditor(element);

    it('returns the number of characters', () => {
      expect(stringEditor.size()).to.equal(4);
    });
  });
});
