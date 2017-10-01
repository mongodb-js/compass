/* eslint no-unused-expressions: 0 */
/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const _ = require('lodash');

const shallow = require('enzyme').shallow;
const mount = require('enzyme').mount;

const QueryBar = require('../../src/internal-plugins/query/lib/component/query-bar');
const QueryOption = require('../../src/internal-plugins/query/lib/component/query-option');
const OptionsToggle = require('../../src/internal-plugins/query/lib/component/options-toggle');
const debug = require('debug')('mongodb-compass:test:validation');

chai.use(chaiEnzyme());

describe('<QueryBar />', () => {
  context('with layout ["filter", "project", ["sort", "skip", "limit"]]', () => {
    const layout = ['filter', 'project', ['sort', 'skip', 'limit']];

    context('when rendering the button label', () => {
      it('defaults to "Apply"', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component.find('#apply_button')).to.have.text('Apply');
      });
      it('sets a custom label', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} buttonLabel={'Analyze'} />);
        expect(component.find('#apply_button')).to.have.text('Analyze');
      });
    });

    context('when rendering in collapsed state', () => {
      it('has only one <QueryOption />', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component.find(QueryOption)).to.have.lengthOf(1);
      });
      it('has no option groups', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component.find('.querybar-option-group')).to.have.lengthOf(0);
      });
      it('has an <OptionsToggle />', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component.find(OptionsToggle)).to.have.lengthOf(1);
      });
      it('does not contain the focus class by default', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component).to.not.have.className('querybar-has-focus');
      });
      it('contains the focus class on focus', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        component.setState({hasFocus: true});
        expect(component.find('.querybar-option-container')).to.have.className('querybar-has-focus');
      });
    });
    context('when rendering in expanded state', () => {
      it('has all 5 <QueryOption />s', () => {
        const component = shallow(<QueryBar layout={layout} expanded={true} />);
        expect(component.find(QueryOption)).to.have.lengthOf(5);
      });
      it('has one .query-option-group div', () => {
        const component = shallow(<QueryBar layout={layout} expanded={true} />);
        expect(component.find('.querybar-option-group')).to.have.lengthOf(1);
      });
      it('does not contain the focus class by default', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component).to.not.have.className('querybar-has-focus');
      });
      it('contains the focus class on focus', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        component.setState({hasFocus: true});
        expect(component.find('.querybar-option-container')).to.have.className('querybar-has-focus');
      });
    });
  });

  context('with layout ["filter"]', () => {
    const layout = ['filter'];
    context('when rendering in collapsed state', () => {
      it('has only one <QueryOption />', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component.find(QueryOption)).to.have.lengthOf(1);
      });
      it('has no <OptionsToggle />', () => {
        const component = shallow(<QueryBar layout={layout} expanded={false} />);
        expect(component.find(OptionsToggle)).to.have.lengthOf(0);
      });
    });
    context('when rendering in expanded state', () => {
      it('has only one <QueryOption />', () => {
        const component = shallow(<QueryBar layout={layout} expanded={true} />);
        expect(component.find(QueryOption)).to.have.lengthOf(1);
      });
      it('has no <OptionsToggle />', () => {
        const component = shallow(<QueryBar layout={layout} expanded={true} />);
        expect(component.find(OptionsToggle)).to.have.lengthOf(0);
      });
    });
  });
});
