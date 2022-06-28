import AppRegistry from 'hadron-app-registry';
import configureStore from '../../src/stores/recent-list-store';
import { comparableQuery } from './';

describe('comparableQuery', () => {
  let store;
  let appRegistry;

  beforeEach(() => {
    appRegistry = new AppRegistry();
    store = configureStore({ localAppRegistry: appRegistry });
  });

  it('strips ampersand properties', () => {
    const recent = { ns: 'foo', filter: { foo: 1 } };

    store.addRecent(recent);
    expect(store.state.items.length).to.equal(1);

    const query = store.state.items.at(0);

    // make sure it has the things we're going to strip
    const serialized = query.serialize();
    expect(serialized).to.haveOwnProperty('_id');
    expect(serialized).to.haveOwnProperty('_lastExecuted');
    expect(serialized).to.haveOwnProperty('_ns');

    expect(comparableQuery(query)).to.deep.equal({
      filter: { foo: 1 }
    });
  });
});
