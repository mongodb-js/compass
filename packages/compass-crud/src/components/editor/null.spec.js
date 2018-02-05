import { Element } from 'hadron-document';
import { NullEditor } from 'components/editor';

describe('NullEditor', () => {
  describe('#size', () => {
    const element = new Element('field', null, false);
    const nullEditor = new NullEditor(element);

    it('returns the number of characters', () => {
      expect(nullEditor.size()).to.equal(4);
    });
  });

  describe('#value', () => {
    const element = new Element('field', null, false);
    const nullEditor = new NullEditor(element);

    it('returns the string null', () => {
      expect(nullEditor.value()).to.equal('null');
    });
  });
});
