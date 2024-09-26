import { expect } from 'chai';
import { type GlobalWritesStore } from '.';
import { setupStore } from '../../tests/create-store';

describe('GlobalWritesStore Store', function () {
  let store: GlobalWritesStore;
  beforeEach(function () {
    store = setupStore(
      {
        namespace: 'test.coll',
      },
      {
        atlasService: {} as any,
      }
    );
  });

  it('sets the namespace', function () {
    expect(store.getState().namespace).to.equal('test.coll');
  });
});
