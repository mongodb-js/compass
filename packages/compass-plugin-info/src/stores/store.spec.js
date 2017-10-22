import Store from 'stores';

describe('SecurityStore [Store]', () => {
  beforeEach(() => {
    Store.state = Store.getInitialState();
  });

  it('defaults isVisible to false', () => {
    expect(Store.state.isVisible).to.equal(false);
  });

  it('defaults the plugin list to empty', () => {
    expect(Store.state.plugins).to.deep.equal([]);
  });

  describe('#show', () => {
    it('sets isVisible to true', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isVisible).to.equal(true);
        done();
      });
      Store.show();
    });
  });

  describe('#hide', () => {
    it('sets isVisible to false', () => {
      Store.hide();
      expect(Store.state.isVisible).to.equal(false);
    });
  });

  describe('#trust', () => {
    it('sets the plugin trust to true', () => {

    });

    it('persists the changes', () => {

    });
  });

  describe('#untrust', () => {
    it('sets the plugin trust to false', () => {

    });

    it('persists the changes', () => {

    });
  });

  describe('#setup', () => {

  });
});
