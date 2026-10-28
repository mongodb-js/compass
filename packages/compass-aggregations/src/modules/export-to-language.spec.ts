import { expect } from 'chai';
import { exportToLanguage } from './export-to-language';

describe('export-to-language module', function () {
  describe('#exportToLanguage', function () {
    it('returns the export to language thunk', function () {
      expect(exportToLanguage()).to.be.a('function');
    });
  });
});
