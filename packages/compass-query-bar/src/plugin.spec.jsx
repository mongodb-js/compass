import React from 'react';
import { mount, shallow } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import QueryBarPlugin from './plugin';
import configureStore from './stores';
import configureActions from './actions';
import OptionEditor from './components/option-editor';

const mockQueryHistoryRole = {
  name: 'Query History',
  // eslint-disable-next-line react/display-name
  component: () => <div>Query history</div>,
  configureStore: () => ({}),
  configureActions: () => {},
  storeName: 'Query.History',
  actionName: 'Query.History.Actions',
};

describe('QueryBar [Plugin]', function () {
  let store;
  let actions;
  let component;

  const globalAppRegistry = new AppRegistry();
  globalAppRegistry.registerRole('Query.QueryHistory', mockQueryHistoryRole);

  const localAppRegistry = new AppRegistry();
  localAppRegistry.registerStore('Query.History', {
    onActivated: () => {},
  });
  localAppRegistry.registerAction('Query.History.Actions', {
    actions: true,
  });

  beforeEach(function () {
    actions = configureActions();
    store = configureStore({
      actions,
      globalAppRegistry,
      localAppRegistry,
    });
  });

  afterEach(function () {
    actions = null;
    store = null;
    component.unmount();
    component = null;
  });

  it('should contain a <StoreConnector /> with a store prop', function () {
    component = shallow(<QueryBarPlugin store={store} actions={actions} />);
    expect(component.find(StoreConnector).first().props('store')).to.be.an(
      'object'
    );
  });

  describe('when a valid query is inputted', function () {
    beforeEach(function () {
      store.setState({
        valid: false,
        filterString: 'a',
        filterValid: false,
      });

      component = mount(
        <QueryBarPlugin store={store} actions={actions} />
      );

      // Set the ace editor input value.
      const aceEditor = component.find('[id="query-bar-option-input-filter"]').first();
      aceEditor.simulate('change', '{a: 3}');
    });

    it('updates the store state to valid', function () {
      expect(store.state.valid).to.equal(true);
      expect(store.state.filterString).to.equal('{a: 3}');
    });
  });

  describe('when find is clicked', function () {
    let calledApply = false;

    beforeEach(function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          onApply={() => {
            calledApply = true;
          }}
        />
      );

      // Click the filter button.
      component
        .find({ 'data-test-id': 'query-bar-apply-filter-button' })
        .props()
        .onClick();
    });

    afterEach(function () {
      calledApply = false;
    });

    it('it calls the onApply prop', async function () {
      expect(calledApply).to.equal(true);
    });
  });

  describe('when the plugin is rendered with or without a query history button', function () {
    it('query history button renders by default', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('button[data-test-id="query-history-button"]')).to
        .exist;
    });

    it('query history button renders when showQueryHistoryButton prop is passed and set to true', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          showQueryHistoryButton
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('button[data-test-id="query-history-button"]')).to
        .exist;
    });

    it('query history button does not render when showQueryHistoryButton prop is passed and set to false', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          showQueryHistoryButton={false}
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('button[data-test-id="query-history-button"]')).to
        .not.exist;
    });
  });

  describe('when rendered with or without an export to language button', function () {
    it('export to language button renderes by default', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          showExportToLanguageButton
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('#query-bar-menu-actions')).to.exist;
    });

    it('export to language button renderes when showExportToLanguageButton prop is passed and set to true', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          showExportToLanguageButton
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('#query-bar-menu-actions')).to.exist;
    });

    it('export to language button does not render when showExportToLanguageButton prop is passed and set to false', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          showExportToLanguageButton={false}
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('#query-bar-menu-actions')).to.not.exist;
    });
  });

  describe('a user is able to provide custom placeholders for the input fields', function () {
    const queryOptions = [
      'project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS'
    ];

    it('the input fields have a placeholder by default', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          queryOptions={queryOptions}
          expanded
          serverVersion="3.4.0"
        />
      );

      expect(component.find('button[data-test-id="query-bar-options-toggle"]'))
        .to.exist;
      component
        .find('button[data-test-id="query-bar-options-toggle"]')
        .simulate('click');
      expect(component.find('OptionEditor[label="filter"]').prop('placeholder'))
        .to.not.be.empty;
      expect(
        component.find('OptionEditor[label="project"]').prop('placeholder')
      ).to.not.be.empty;
      expect(
        component.find('OptionEditor[label="collation"]').prop('placeholder')
      ).to.not.be.empty;
      expect(component.find('OptionEditor[label="sort"]').prop('placeholder'))
        .to.not.be.empty;
      expect(
        component.find('QueryOption[label="Max Time MS"]').prop('placeholder')
      ).to.not.be.empty;
      expect(component.find('QueryOption[label="skip"]').prop('placeholder')).to
        .not.be.empty;
      expect(component.find('QueryOption[label="limit"]').prop('placeholder'))
        .to.not.be.empty;
    });

    it('the input fields placeholders can be modified', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          queryOptions={queryOptions}
          sortOptionPlaceholder="{ field: -1 }"
          expanded
          serverVersion="3.4.0"
          filterPlaceholder="{field: 'matchValue'}"
          projectPlaceholder="{field: 1}"
          collationPlaceholder="{locale: 'fr' }"
          sortPlaceholder="{field: 1}"
          skipPlaceholder="10"
          limitPlaceholder="20"
          maxTimeMSPlaceholder="50000"
        />
      );

      expect(component.find('button[data-test-id="query-bar-options-toggle"]'))
        .to.exist;
      component
        .find('button[data-test-id="query-bar-options-toggle"]')
        .simulate('click');
      expect(
        component.find('OptionEditor[label="filter"]').prop('placeholder')
      ).to.equal("{field: 'matchValue'}");
      expect(
        component.find('OptionEditor[label="project"]').prop('placeholder')
      ).to.equal('{field: 1}');
      expect(
        component.find('OptionEditor[label="collation"]').prop('placeholder')
      ).to.equal("{locale: 'fr' }");
      expect(
        component.find('OptionEditor[label="sort"]').prop('placeholder')
      ).to.equal('{field: 1}');
      expect(
        component.find('QueryOption[label="Max Time MS"]').prop('placeholder')
      ).to.equal('50000');
      expect(
        component.find('QueryOption[label="skip"]').prop('placeholder')
      ).to.equal('10');
      expect(
        component.find('QueryOption[label="limit"]').prop('placeholder')
      ).to.equal('20');
    });
  });
});
