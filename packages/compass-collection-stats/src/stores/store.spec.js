import configurestore from 'stores';

describe('CollectionStatsstore [store]', () => {
  describe('#configurestore', () => {
    let store;

    beforeEach(() => {
      store = configurestore();
    });

    it('defaults document count to invalid', () => {
      expect(store.state.documentCount).to.be.equal('N/A');
    });

    it('defaults document count to invalid', () => {
      expect(store.state.totalDocumentSize).to.be.equal('N/A');
    });

    it('defaults document count to invalid', () => {
      expect(store.state.avgDocumentSize).to.be.equal('N/A');
    });

    it('defaults document count to invalid', () => {
      expect(store.state.indexCount).to.be.equal('N/A');
    });

    it('defaults document count to invalid', () => {
      expect(store.state.totalIndexSize).to.be.equal('N/A');
    });

    it('defaults document count to invalid', () => {
      expect(store.state.avgIndexSize).to.be.equal('N/A');
    });

    it('defaults raw document count to invalid', () => {
      expect(store.state.rawDocumentCount).to.be.equal(0);
    });

    it('defaults raw document count to invalid', () => {
      expect(store.state.rawTotalDocumentSize).to.be.equal(0);
    });

    it('defaults raw document count to invalid', () => {
      expect(store.state.rawAvgDocumentSize).to.be.equal(0);
    });

    it('defaults raw document count to invalid', () => {
      expect(store.state.rawIndexCount).to.be.equal(0);
    });

    it('defaults raw document count to invalid', () => {
      expect(store.state.rawTotalIndexSize).to.be.equal(0);
    });

    it('defaults raw document count to invalid', () => {
      expect(store.state.rawAvgIndexSize).to.be.equal(0);
    });
  });
});
