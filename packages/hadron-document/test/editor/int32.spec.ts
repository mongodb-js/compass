import { Int32 } from 'bson';
import { Element } from '../..';
import { Int32Editor } from '../../src/editor';
import { expect } from 'chai';

describe('Int32Editor', function () {
  describe('#size', function () {
    const element = new Element('field', new Int32(12), false);
    const int32Editor = new Int32Editor(element);

    it('returns the number of characters', function () {
      expect(int32Editor.size()).to.equal(2);
    });
  });
});
