import configureStore from 'stores';

describe('CollectionStatsStore [Store]', () => {
  let store;

  beforeEach(() => {
    store = configureStore();
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
});
