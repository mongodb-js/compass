import React from 'react';
import { mount, shallow } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';

import QueryBarPlugin from './plugin';
import configureStore from './stores';
import configureActions from './actions';
import OptionEditor from './components/option-editor';

describe('QueryBar [Plugin]', () => {
  let store;
  let actions;

  beforeEach(function() {
    actions = configureActions();
    store = configureStore({
      actions: actions
    });
  });

  afterEach(function() {
    actions = null;
    store = null;
  });

  it('should contain a <StoreConnector /> with a store prop', function() {
    const component = shallow(<QueryBarPlugin store={store} actions={actions} />);
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });

  describe('when an input occurs and find is clicked', function() {
    it('it calls onApply and update the store with the query', async function() {
      store.setState({
        valid: false,
        filterString: 'a',
        filterValid: false
      });

      let calledApply = false;
      const component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={['filter']}
          onApply={() => {
            calledApply = true;
          }}
        />
      );

      // Set the ace editor input value.
      component.find(OptionEditor).instance().editor.session.setValue(
        '{a: 3}'
      );

      expect(store.state.valid).to.equal(true);
      expect(store.state.filterString).to.equal('{a: 3}');

      // Click the filter button.
      component.find(
        {'data-test-id': 'query-bar-apply-filter-button'}
      ).props().onClick();

      expect(calledApply).to.equal(true);
    });
  });
});
