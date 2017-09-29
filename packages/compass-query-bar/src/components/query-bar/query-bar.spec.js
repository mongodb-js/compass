import React from 'react';
import { shallow } from 'enzyme';

import QueryBar from 'components/query-bar';
import QueryOption from 'components/query-option';
import OptionsToggle from 'components/options-toggle';

describe('QueryBar [Component]', function() {
  let actions;

  beforeEach((done) => {
    actions = { toggleQueryOptions: sinon.stub() };
    done();
  });

  afterEach((done) => {
    actions = null;
    done();
  });

  describe('#rendering', function() {
    describe('with layout ["filter", "project", ["sort", "skip", "limit"]]', function() {
      const layout = ['filter', 'project', ['sort', 'skip', 'limit']];

      describe('when rendering the button label', function() {
        it('defaults to "Apply"', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component.find('[data-test-id="query-bar-apply-filter-button"]')).to.have.text('Apply');
        });

        it('sets a custom label', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} buttonLabel={'Analyze'} />);
          expect(component.find('[data-test-id="query-bar-apply-filter-button"]')).to.have.text('Analyze');
        });
      });

      describe('when rendering in collapsed state', function() {
        it('has only one <QueryOption />', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component.find(QueryOption)).to.have.lengthOf(1);
        });

        it('has no option groups', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component.find('.querybar-option-group')).to.have.lengthOf(0);
        });

        it('has an <OptionsToggle />', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component.find(OptionsToggle)).to.have.lengthOf(1);
        });

        it('does not contain the focus class by default', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component).to.not.have.className('querybar-has-focus');
        });

        it('contains the focus class on focus', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);

          component.setState({ hasFocus: true });
          expect(component.find('.querybar-option-container')).to.have.className('querybar-has-focus');
        });
      });

      describe('when rendering in expanded state', function() {
        it('has all 5 <QueryOption />s', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded />);
          expect(component.find(QueryOption)).to.have.lengthOf(5);
        });

        it('has one .query-option-group div', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded />);
          expect(component.find('.querybar-option-group')).to.have.lengthOf(1);
        });

        it('does not contain the focus class by default', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded />);
          expect(component).to.not.have.className('querybar-has-focus');
        });

        it('contains the focus class on focus', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded />);

          component.setState({hasFocus: true});
          expect(component.find('.querybar-option-container')).to.have.className('querybar-has-focus');
        });
      });
    });

    describe('with layout ["filter"]', function() {
      const layout = ['filter'];

      describe('when rendering in collapsed state', function() {
        it('has only one <QueryOption />', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component.find(QueryOption)).to.have.lengthOf(1);
        });

        it('has no <OptionsToggle />', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded={false} />);
          expect(component.find(OptionsToggle)).to.have.lengthOf(0);
        });
      });

      describe('when rendering in expanded state', function() {
        it('has only one <QueryOption />', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded />);
          expect(component.find(QueryOption)).to.have.lengthOf(1);
        });

        it('has no <OptionsToggle />', function() {
          const component = shallow(<QueryBar actions={actions} layout={layout} expanded />);
          expect(component.find(OptionsToggle)).to.have.lengthOf(0);
        });
      });
    });
  });
});
