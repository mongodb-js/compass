import { Element } from '../..';
import { NullEditor } from '../../lib/editor';
import { expect } from 'chai';

describe('NullEditor', function () {
  describe('#size', function () {
    const element = new Element('field', null, false);
    const nullEditor = new NullEditor(element);

    it('returns the number of characters', function () {
      expect(nullEditor.size()).to.equal(4);
    });
  });

  describe('#value', function () {
    const element = new Element('field', null, false);
    const nullEditor = new NullEditor(element);

    it('returns the string null', function () {
      expect(nullEditor.value()).to.equal('null');
    });
  });
});
