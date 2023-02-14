import { exportToLanguage } from './export-to-language';
import { expect } from 'chai';

describe('export-to-language module', function () {
  describe('#exportToLanguage', function () {
    it('returns the export to language thunk', function () {
      expect(exportToLanguage()).to.be.a('function');
    });
  });
});
