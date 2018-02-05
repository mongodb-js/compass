import { Element } from 'hadron-document';
import { Double } from 'bson';
import { DoubleEditor } from 'components/editor';

describe('DoubleEditor', () => {
  describe('#size', () => {
    const element = new Element('field', new Double(12.2), false);
    const doubleEditor = new DoubleEditor(element);

    it('returns the number of characters', () => {
      expect(doubleEditor.size()).to.equal(4);
    });
  });
});
