import Store from 'stores';

describe('CollectionStatsStore [Store]', () => {
  beforeEach(() => {
    Store.state = Store.getInitialState();
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

  it('defaults raw document count to invalid', () => {
    expect(Store.state.rawDocumentCount).to.be.equal(0);
  });

  it('defaults raw document count to invalid', () => {
    expect(Store.state.rawTotalDocumentSize).to.be.equal(0);
  });

  it('defaults raw document count to invalid', () => {
    expect(Store.state.rawAvgDocumentSize).to.be.equal(0);
  });

  it('defaults raw document count to invalid', () => {
    expect(Store.state.rawIndexCount).to.be.equal(0);
  });

  it('defaults raw document count to invalid', () => {
    expect(Store.state.rawTotalIndexSize).to.be.equal(0);
  });

  it('defaults raw document count to invalid', () => {
    expect(Store.state.rawAvgIndexSize).to.be.equal(0);
  });
});
