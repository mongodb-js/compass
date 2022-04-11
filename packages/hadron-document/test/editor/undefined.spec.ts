import { Element } from '../..';
import { UndefinedEditor } from '../../src/editor';
import { expect } from 'chai';

describe('UndefinedEditor', function () {
  describe('#size', function () {
    const element = new Element('field', undefined, false);
    const undefinedEditor = new UndefinedEditor(element);

    it('returns the number of characters', function () {
      expect(undefinedEditor.size()).to.equal(9);
    });
  });

  describe('#value', function () {
    const element = new Element('field', undefined, false);
    const undefinedEditor = new UndefinedEditor(element);

    it('returns the string undefined', function () {
      expect(undefinedEditor.value()).to.equal('undefined');
    });
  });
});
