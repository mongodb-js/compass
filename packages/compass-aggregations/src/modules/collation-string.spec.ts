import { expect } from 'chai';
import { collationStringChanged } from './collation-string';
import configureStore from '../../test/configure-store';

describe('collation string module', function () {
  let store: Awaited<ReturnType<typeof configureStore>>['plugin']['store'];

  beforeEach(async function () {
    store = (await configureStore()).plugin.store;
  });

  it('starts with an empty, valid collation', function () {
    expect(store.getState().collationString).to.deep.equal({
      text: '',
      value: null,
      isValid: true,
    });
  });

  it('stores the parsed collation for valid text', async function () {
    await store.dispatch(collationStringChanged("{locale: 'simple'}"));

    expect(store.getState().collationString).to.deep.equal({
      text: "{locale: 'simple'}",
      value: { locale: 'simple' },
      isValid: true,
    });
  });

  it('marks text that does not parse as invalid', async function () {
    await store.dispatch(collationStringChanged("locale 'simple'}"));

    expect(store.getState().collationString).to.deep.equal({
      text: "locale 'simple'}",
      value: null,
      isValid: false,
    });
  });

  it('updates the text before the collation has been parsed', function () {
    void store.dispatch(collationStringChanged("{locale: 'simple'}"));

    expect(store.getState().collationString.text).to.equal(
      "{locale: 'simple'}"
    );
  });

  it('ignores the result for text that has since changed', async function () {
    const stale = store.dispatch(collationStringChanged("locale 'simple'}"));
    await store.dispatch(collationStringChanged("{locale: 'fr'}"));
    await stale;

    expect(store.getState().collationString).to.deep.equal({
      text: "{locale: 'fr'}",
      value: { locale: 'fr' },
      isValid: true,
    });
  });
});
