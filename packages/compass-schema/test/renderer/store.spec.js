import configureStore from 'stores';

describe('CompassSchemaStore [Store]', () => {
  describe('#configureStore', () => {
    it('returns a store', () => {
      expect(configureStore()).to.not.equal(undefined);
    });
  });
});
