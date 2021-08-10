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
  let component;

  beforeEach(function() {
    actions = configureActions();
    store = configureStore({
      actions: actions
    });
  });

  afterEach(function() {
    actions = null;
    store = null;
    component = null;
  });

  it('should contain a <StoreConnector /> with a store prop', function() {
    component = shallow(<QueryBarPlugin store={store} actions={actions} />);
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });

  describe('when a valid query is inputted', function() {
    beforeEach(() => {
      store.setState({
        valid: false,
        filterString: 'a',
        filterValid: false
      });

      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={['filter']}
        />
      );

      // Set the ace editor input value.
      component.find(OptionEditor).instance().editor.session.setValue(
        '{a: 3}'
      );
    });

    it('updates the store state to valid', () => {
      expect(store.state.valid).to.equal(true);
      expect(store.state.filterString).to.equal('{a: 3}');
    });
  });

  describe('when find is clicked', function() {
    let calledApply = false;

    beforeEach(() => {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={['filter']}
          onApply={() => {
            calledApply = true;
          }}
        />
      );

      // Click the filter button.
      component.find(
        {'data-test-id': 'query-bar-apply-filter-button'}
      ).props().onClick();
    });

    afterEach(() => {
      calledApply = false;
    });

    it('it calls the onApply prop', async function() {
      expect(calledApply).to.equal(true);
    });
  });

  describe('when the plugin is rendered with or without a query history button', function() {
    const layout = ['filter'];

    it('query history button renderes by default', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          expanded
          serverVersion="3.4.0" />
      );
      expect(component.find('button[data-test-id="query-history-button"]')).to.exist;
    });

    it('query history button renderes when showQueryHistoryButton prop is passed and set to true', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showQueryHistoryButton
          expanded
          serverVersion="3.4.0" />
      );
      expect(component.find('button[data-test-id="query-history-button"]')).to.exist;
    });

    it('query history button does not render when showQueryHistoryButton prop is passed and set to false', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showQueryHistoryButton={false}
          expanded
          serverVersion="3.4.0" />
      );
      expect(component.find('button[data-test-id="query-history-button"]')).to.not.exist;
    });
  });

  describe('when rendered with or without an export to language button', function() {
    const layout = ['filter'];

    it('export to language button renderes by default', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showExportToLanguageButton
          expanded
          serverVersion="3.4.0" />
      );
      expect(component.find('#query-bar-menu-actions')).to.exist;
    });

    it('export to language button renderes when showExportToLanguageButton prop is passed and set to true', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showExportToLanguageButton
          expanded
          serverVersion="3.4.0" />
      );
      expect(component.find('#query-bar-menu-actions')).to.exist;
    });

    it('export to language button does not render when showExportToLanguageButton prop is passed and set to false', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showExportToLanguageButton={false}
          expanded
          serverVersion="3.4.0" />
      );
      expect(component.find('#query-bar-menu-actions')).to.not.exist;
    });
  });

  describe('the correct sort placeholder is rendered when the component receives a custom sort placeholder', function() {
    const layout = ['filter', 'project', 'sort'];

    it('square bracket sorts placeholder is rendered by default', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          expanded
          serverVersion="3.4.0" />
      );

      expect(component.find('div[data-test-id="query-bar-options-toggle"]')).to.exist;
      component.find('div[data-test-id="query-bar-options-toggle"]').simulate('click');
      expect(component.find('OptionEditor[label="sort"][placeholder="{ field: -1 } or [[\'field\', -1]]"]')).to.exist;
    });

    it('the query bar renders the specified sort option placeholder that is passed as a prop', function() {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          sortOptionPlaceholder="{ field: -1 }"
          expanded
          serverVersion="3.4.0" />
      );

      expect(component.find('div[data-test-id="query-bar-options-toggle"]')).to.exist;
      component.find('div[data-test-id="query-bar-options-toggle"]').simulate('click');
      expect(component.find('OptionEditor[label="sort"][placeholder="{ field: -1 } or [[\'field\', -1]]"]')).to.not.exist;
      expect(component.find('OptionEditor[label="sort"][placeholder="{ field: -1 }"]')).to.exist;
    });
  });
});
