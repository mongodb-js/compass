import React from 'react';
import { mount, shallow } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';
import { expect } from 'chai';

import QueryBarPlugin from './plugin';
import configureStore from './stores';
import configureActions from './actions';
import OptionEditor from './components/legacy-option-editor';

describe('QueryBar [Plugin]', function () {
  let store;
  let actions;
  let component;

  beforeEach(function () {
    actions = configureActions();
    store = configureStore({
      actions: actions,
    });
  });

  afterEach(function () {
    actions = null;
    store = null;
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
        <QueryBarPlugin store={store} actions={actions} layout={['filter']} />
      );

      // Set the ace editor input value.
      component.find(OptionEditor).instance().editor.session.setValue('{a: 3}');
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
          layout={['filter']}
          onApply={() => {
            calledApply = true;
          }}
        />
      );

      // Click the filter button.
      component
        .find({ 'data-testid': 'query-bar-apply-filter-button' })
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
    const layout = ['filter'];

    it('query history button renderes by default', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('button[data-testid="query-history-button"]')).to
        .exist;
    });

    it('query history button renderes when showQueryHistoryButton prop is passed and set to true', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showQueryHistoryButton
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('button[data-testid="query-history-button"]')).to
        .exist;
    });

    it('query history button does not render when showQueryHistoryButton prop is passed and set to false', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          showQueryHistoryButton={false}
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('button[data-testid="query-history-button"]')).to
        .not.exist;
    });
  });

  describe('when rendered with or without an export to language button', function () {
    const layout = ['filter'];

    it('export to language button renderes by default', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
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
          layout={layout}
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
          layout={layout}
          showExportToLanguageButton={false}
          expanded
          serverVersion="3.4.0"
        />
      );
      expect(component.find('#query-bar-menu-actions')).to.not.exist;
    });
  });

  describe('a user is able to provide custom placeholders for the input fields', function () {
    const layout = [
      'filter',
      'project',
      ['sort', 'maxTimeMS'],
      ['collation', 'skip', 'limit'],
    ];

    it('the input fields have a placeholder by default', function () {
      component = mount(
        <QueryBarPlugin
          store={store}
          actions={actions}
          layout={layout}
          expanded
          serverVersion="3.4.0"
        />
      );

      expect(component.find('button[data-testid="query-bar-options-toggle"]'))
        .to.exist;
      component
        .find('button[data-testid="query-bar-options-toggle"]')
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
          layout={layout}
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

      expect(component.find('button[data-testid="query-bar-options-toggle"]'))
        .to.exist;
      component
        .find('button[data-testid="query-bar-options-toggle"]')
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
