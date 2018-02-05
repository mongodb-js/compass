import { Element } from 'hadron-document';
import { UndefinedEditor } from 'components/editor';

describe('UndefinedEditor', () => {
  describe('#size', () => {
    const element = new Element('field', undefined, false);
    const undefinedEditor = new UndefinedEditor(element);

    it('returns the number of characters', () => {
      expect(undefinedEditor.size()).to.equal(9);
    });
  });

  describe('#value', () => {
    const element = new Element('field', undefined, false);
    const undefinedEditor = new UndefinedEditor(element);

    it('returns the string undefined', () => {
      expect(undefinedEditor.value()).to.equal('undefined');
    });
  });
});
