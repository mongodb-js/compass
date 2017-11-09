import Store from 'stores';

describe('CollectionStatsStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('defaults document count to invalid', () => {
    expect(Store.state.documentCount).to.be.equal('N/A');
  });

  it('defaults document count to invalid', () => {
    expect(Store.state.totalDocumentSize).to.be.equal('N/A');
  });

  it('defaults document count to invalid', () => {
    expect(Store.state.avgDocumentSize).to.be.equal('N/A');
  });

  it('defaults document count to invalid', () => {
    expect(Store.state.indexCount).to.be.equal('N/A');
  });

  it('defaults document count to invalid', () => {
    expect(Store.state.totalIndexSize).to.be.equal('N/A');
  });

  it('defaults document count to invalid', () => {
    expect(Store.state.avgIndexSize).to.be.equal('N/A');
  });
});
