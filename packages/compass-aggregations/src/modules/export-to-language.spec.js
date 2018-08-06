import { exportToLanguage } from 'modules/export-to-language';

describe('export-to-language module', () => {
  describe('#exportToLanguage', () => {
    it('returns the export to language thunk', () => {
      expect(exportToLanguage()).to.be.a('function');
    });
  });
});
