import { Element } from '../..';
import { StringEditor } from '../../lib/editor';
import { expect } from 'chai';

describe('StringEditor', function () {
  describe('#size', function () {
    const element = new Element('name', 'test', false);
    const stringEditor = new StringEditor(element);

    it('returns the number of characters', function () {
      expect(stringEditor.size()).to.equal(4);
    });
  });
});
