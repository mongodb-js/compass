import React from 'react';
import { Provider } from '../stores/context';
import { configureStore } from '../stores/query-bar-store';
import { useIsLastAppliedQueryOutdated } from './hooks';
import { renderHook, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { applyQuery, changeField } from '../stores/query-bar-reducer';

describe('useIsLastAppliedQueryOutdated', function () {
  function render(source = 'foo') {
    const store = configureStore({}, {
      preferences: {
        getPreferences() {
          return {};
        },
      },
      logger: {
        debug() {
          // noop
        },
      },
    } as any);

    const hook = renderHook(
      () => {
        return useIsLastAppliedQueryOutdated(source);
      },
      {
        wrapper({ children }) {
          return <Provider store={store}>{children}</Provider>;
        },
      }
    );
    return { store, hook };
  }

  afterEach(cleanup);

  it('should return `false` when no queries were applied', function () {
    const { hook } = render();
    expect(hook.result.current).to.eq(false);
  });

  it('should return `false` if query was last applied from the same source', function () {
    const { hook, store } = render();

    store.dispatch(changeField('filter', '{ foo: 1 }'));
    store.dispatch(applyQuery('foo'));

    expect(hook.result.current).to.eq(false);
  });

  it('should return `false` if query was applied from the different source but not changed', function () {
    const { hook, store } = render();

    store.dispatch(changeField('filter', '{ foo: 1 }'));
    store.dispatch(applyQuery('foo'));

    store.dispatch(changeField('filter', '{"foo": 1}'));
    store.dispatch(applyQuery('bar'));

    expect(hook.result.current).to.eq(false);
  });

  it('should return `true` if query was applied from the different source and changed', function () {
    const { hook, store } = render();

    store.dispatch(changeField('filter', '{ foo: 1 }'));
    store.dispatch(applyQuery('foo'));

    store.dispatch(changeField('filter', '{"bar": 1}'));
    store.dispatch(applyQuery('bar'));

    expect(hook.result.current).to.eq(true);
  });
});
