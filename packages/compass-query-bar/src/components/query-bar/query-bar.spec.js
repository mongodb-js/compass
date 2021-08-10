import React from 'react';
import { shallow } from 'enzyme';

import QueryBar from '../query-bar';
import QueryOption from '../query-option';
import OptionsToggle from '../options-toggle';
import configureStore from '../../stores';
import configureActions from '../../actions';

import styles from '../query-bar/query-bar.less';

describe('QueryBar [Component]', function() {
  let actions;
  let store;

  beforeEach((done) => {
    actions = configureActions();
    store = configureStore({
      actions: actions
    });
    done();
  });

  afterEach((done) => {
    actions = null;
    store = null;
    done();
  });

  describe('#rendering', function() {
    describe('with layout ["filter", "project", ["sort", "maxTimeMS"], ["collation", "skip", "limit"]]', function() {
      const layout = ['filter', 'project', ['sort', 'maxTimeMS'], ['collation', 'skip', 'limit']];

      describe('when rendering the button label', function() {
        it('defaults to "Apply"', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component.find('[data-test-id="query-bar-apply-filter-button"]')).to.have.text('Apply');
        });

        it('sets a custom label', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              buttonLabel={'Analyze'}
              serverVersion="3.4.0" />
          );
          expect(component.find('[data-test-id="query-bar-apply-filter-button"]')).to.have.text('Analyze');
        });
      });

      describe('when rendering in collapsed state', function() {
        it('has only one <QueryOption />', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component.find(QueryOption)).to.have.lengthOf(1);
        });

        it('has no option groups', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component.find('.querybar-option-group')).to.have.lengthOf(0);
        });

        it('has an <OptionsToggle />', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component.find(OptionsToggle)).to.have.lengthOf(1);
        });

        it('does not contain the focus class by default', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component).to.not.have.className(styles['has-focus']);
        });

        it('contains the focus class on focus', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );

          component.setState({ hasFocus: true });
          expect(component.find(`.${styles['option-container']}`)).to.have.className(styles['has-focus']);
        });

        it('has a query history button', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0"
            />
          );
          expect(component.find(`.${styles['query-history-button']}`)).to.be.present();
        });
      });

      describe('when rendering in expanded state', function() {
        it('has all 6 <QueryOption />s', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded
              serverVersion="3.4.0" />
          );
          expect(component.find(QueryOption)).to.have.lengthOf(7);
        });

        it('has one .query-option-group div', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded
              serverVersion="3.4.0" />
          );
          expect(component.find(`.${styles['option-group']}`)).to.have.lengthOf(2);
        });

        it('does not contain the focus class by default', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded
              serverVersion="3.4.0" />
          );
          expect(component).to.not.have.className(styles['has-focus']);
        });

        it('contains the focus class on focus', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded
              serverVersion="3.4.0" />
          );

          component.setState({hasFocus: true});
          expect(component.find(`.${styles['option-container']}`)).to.have.className(styles['has-focus']);
        });
      });
    });

    describe('with layout ["filter"]', function() {
      const layout = ['filter'];

      describe('when rendering in collapsed state', function() {
        it('has only one <QueryOption />', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component.find(QueryOption)).to.have.lengthOf(1);
        });

        it('has no <OptionsToggle />', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded={false}
              serverVersion="3.4.0" />
          );
          expect(component.find(OptionsToggle)).to.have.lengthOf(0);
        });
      });

      describe('when rendering in expanded state', function() {
        it('has only one <QueryOption />', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded
              serverVersion="3.4.0" />
          );
          expect(component.find(QueryOption)).to.have.lengthOf(1);
        });

        it('has no <OptionsToggle />', function() {
          const component = shallow(
            <QueryBar
              store={store}
              actions={actions}
              layout={layout}
              expanded serverVersion="3.4.0" />
          );
          expect(component.find(OptionsToggle)).to.have.lengthOf(0);
        });
      });
    });

    describe('when rendered with or without a query history button', function() {
      const layout = ['filter'];

      it('query history button renderes by default', function() {
        const component = shallow(
          <QueryBar
            store={store}
            actions={actions}
            layout={layout}
            expanded
            serverVersion="3.4.0" />
        );
        expect(component.find('button[data-test-id="query-history-button"]')).to.exist;
      });


      it('query history button renderes when showQueryHistoryButton prop is passed and set to true', function() {
        const component = shallow(
          <QueryBar
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
        const component = shallow(
          <QueryBar
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
        const component = shallow(
          <QueryBar
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
        const component = shallow(
          <QueryBar
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
        const component = shallow(
          <QueryBar
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
        const component = mount(
          <QueryBar
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

      it('the query bar renders the specified sort option placeholder', function() {
        const component = mount(
          <QueryBar
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
});
