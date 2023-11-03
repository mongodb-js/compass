import React, { createContext, useContext } from 'react';
import { cleanup, render } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { createStore as createRefluxStore } from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { AppRegistryProvider, registerHadronPlugin } from './';
import { createStore } from 'redux';
import { connect } from 'react-redux';

describe('registerHadronPlugin', function () {
  afterEach(cleanup);

  it('allows registering plugins with a reflux-ish store', function () {
    const component = sinon.stub().callsFake(() => <></>);
    const activate = sinon.stub().returns({ store: { state: { foo: 'bar' } } });
    const Plugin = registerHadronPlugin({
      name: 'refluxish',
      component,
      activate,
    });
    expect(Plugin.displayName).to.equal('refluxish');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate).to.have.been.calledOnce;
    expect(activate.firstCall.args[0]).to.deep.equal({});
    expect(activate.firstCall.args[1]).to.have.property('localAppRegistry');
    expect(activate.firstCall.args[1]).to.have.property('globalAppRegistry');
    expect(component).to.have.been.calledOnceWith({
      store: { state: { foo: 'bar' } },
      actions: undefined,
      foo: 'bar',
    });
  });

  it('allows registering plugins with a proper reflux store', function () {
    const component = sinon.stub().callsFake(() => <></>);
    const store = createRefluxStore({
      mixins: [StateMixin.store],
      getInitialState() {
        return { foo: 'bar' };
      },
    });
    const activate = sinon.stub().returns({ store });
    const Plugin = registerHadronPlugin({
      name: 'reflux',
      component,
      activate,
    });
    expect(Plugin.displayName).to.equal('reflux');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate).to.have.been.calledOnce;
    expect(activate.firstCall.args[0]).to.deep.equal({});
    expect(activate.firstCall.args[1]).to.have.property('localAppRegistry');
    expect(activate.firstCall.args[1]).to.have.property('globalAppRegistry');
    expect(component).to.have.been.calledOnceWith({
      store,
      actions: undefined,
      foo: 'bar',
    });
  });

  it('allows registering plugins with a redux store', function () {
    const connector = connect(({ counter }) => ({ counter }));
    const component = sinon.stub().callsFake(() => <></>);
    const store = createStore(
      (state: { counter: number } | undefined, action: { type: 'inc' }) => {
        state ??= { counter: 0 };
        if (action.type === 'inc') return { counter: state.counter + 1 };
        return state;
      }
    );
    const activate = sinon.stub().returns({ store });
    const Plugin = registerHadronPlugin({
      name: 'redux',
      component: connector(component),
      activate,
    });
    expect(Plugin.displayName).to.equal('redux');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate).to.have.been.calledOnce;
    expect(activate.firstCall.args[0]).to.deep.equal({});
    expect(activate.firstCall.args[1]).to.have.property('localAppRegistry');
    expect(activate.firstCall.args[1]).to.have.property('globalAppRegistry');
    expect(component).to.have.been.calledWith({
      counter: 0,
      dispatch: store.dispatch,
    });
    store.dispatch({ type: 'inc' });
    expect(component).to.have.been.calledWith({
      counter: 1,
      dispatch: store.dispatch,
    });
  });

  it('allows registering a plugin with external services dependencies', function () {
    const dummy = { value: 'blah' };
    const blahContext = createContext(dummy);
    const useBlah = () => useContext(blahContext);

    const connector = connect();
    const component = sinon.stub().callsFake(() => <></>);
    const store = createStore(() => ({}));
    const activate = sinon.stub().returns({ store });
    const Plugin = registerHadronPlugin(
      {
        name: 'service1',
        component: connector(component),
        activate,
      },
      {
        blah: useBlah,
      }
    );
    expect(Plugin.displayName).to.equal('service1');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate.firstCall.args[1]).to.have.property('blah', dummy);
  });
});
