import React from 'react';
import { shallow } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';
import QueryBarPlugin from './plugin';
import configureStore from 'stores';
import configureActions from 'actions';

describe('QueryBar [Plugin]', () => {
  let component;
  let store;
  let actions;

  beforeEach(function() {
    actions = configureActions();
    store = configureStore({
      actions: actions
    });
    component = shallow(<QueryBarPlugin store={store} actions={actions} />);
  });

  afterEach(function() {
    actions = null;
    store = null;
    component = null;
  });

  it('should contain a <StoreConnector /> with a store prop', function() {
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });
});
