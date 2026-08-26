import React from 'react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { renderHook } from '@mongodb-js/testing-library-compass';
import type { AnyAction } from 'redux';
import {
  AtlasSignInStoreContext,
  useAtlasSignInStatus,
} from './atlas-signin-store-context';
import type { AtlasSignInStatus } from './atlas-signin-store-context';
import { AtlasSignInActions } from './atlas-signin-reducer';
import { configureStore } from './atlas-signin-store';

function renderWithState(actions: AnyAction[]) {
  const store = configureStore({ atlasAuthService: {} as any });
  for (const action of actions) {
    store.dispatch(action);
  }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store} context={AtlasSignInStoreContext}>
      {children}
    </Provider>
  );
  return {
    store,
    status: renderHook(() => useAtlasSignInStatus(), { wrapper }).result,
  };
}

const USER = { sub: '1234' };
const RESTORING = [{ type: AtlasSignInActions.RestoringStart }];
const SUCCESS = [
  { type: AtlasSignInActions.RestoringStart },
  { type: AtlasSignInActions.RestoringSuccess, userInfo: USER },
];

describe('useAtlasSignInStatus', function () {
  const cases: [string, AnyAction[], AtlasSignInStatus][] = [
    ['initial', [], { user: null, state: 'initial' }],
    ['restoring', RESTORING, { user: null, state: 'restoring' }],
    [
      'in-progress',
      [{ type: AtlasSignInActions.Start }],
      { user: null, state: 'in-progress' },
    ],
    [
      'unauthenticated',
      [...RESTORING, { type: AtlasSignInActions.RestoringFailed }],
      { user: null, state: 'unauthenticated' },
    ],
    ['success', SUCCESS, { user: USER, state: 'success' }],
    [
      'error',
      [
        { type: AtlasSignInActions.Start },
        { type: AtlasSignInActions.Error, error: 'Whoops!' },
      ],
      { user: null, state: 'error' },
    ],
    [
      'canceled',
      [{ type: AtlasSignInActions.Cancel }],
      { user: null, state: 'canceled' },
    ],
    [
      'timed-out',
      [{ type: AtlasSignInActions.TimedOut }],
      { user: null, state: 'timed-out' },
    ],
  ];

  for (const [state, actions, expected] of cases) {
    it(`reports the status for the '${state}' state`, function () {
      const { store, status } = renderWithState(actions);
      expect(store.getState()).to.have.property('state', state);
      expect(status.current).to.deep.equal(expected);
    });
  }

  it('does not report a resolved or signed in state while a sign in started during restore is still in flight', function () {
    const { store, status } = renderWithState([
      ...RESTORING,
      { type: AtlasSignInActions.Start },
      // The restore finishes after the manual attempt started, the reducer
      // ignores it.
      { type: AtlasSignInActions.RestoringSuccess, userInfo: USER },
    ]);
    expect(store.getState()).to.have.property('state', 'in-progress');
    // The user looks signed out here, so anything acting on that (telemetry,
    // for example) has to wait for the state to resolve.
    expect(status.current).to.deep.equal({
      user: null,
      state: 'in-progress',
    });
  });
});
