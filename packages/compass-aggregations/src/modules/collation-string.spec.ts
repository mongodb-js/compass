import { expect } from 'chai';
import { spy } from 'sinon';
import { collationStringChanged } from './collation-string';
import { runAggregation } from './aggregation';
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
      isParsing: false,
    });
  });

  it('stores the parsed collation for valid text', async function () {
    await store.dispatch(collationStringChanged("{locale: 'simple'}"));

    expect(store.getState().collationString).to.deep.equal({
      text: "{locale: 'simple'}",
      value: { locale: 'simple' },
      isValid: true,
      isParsing: false,
    });
  });

  it('marks text that does not parse as invalid', async function () {
    await store.dispatch(collationStringChanged("locale 'simple'}"));

    expect(store.getState().collationString).to.deep.equal({
      text: "locale 'simple'}",
      value: null,
      isValid: false,
      isParsing: false,
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
      isParsing: false,
    });
  });

  it('runs with the new collation while it is still being parsed', async function () {
    const aggregate = spy(() => Promise.resolve([]));
    const { store } = (await configureStore({ pipeline: [] }, { aggregate }))
      .plugin;
    await store.dispatch(collationStringChanged("{locale: 'simple'}"));

    void store.dispatch(collationStringChanged("{locale: 'fr'}"));
    await store.dispatch(runAggregation());

    expect(aggregate.lastCall.args.at(2)).to.have.deep.property('collation', {
      locale: 'fr',
    });
  });
});
