/* eslint no-unused-expressions: 0 */
/* eslint no-unused-vars: 0 */
const chai = require('chai');
const { mount } = require('enzyme');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const { MenuItem } = require('react-bootstrap');

const OptionSelector = require('../../src/internal-packages/app/lib/components/option-selector');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());


describe('<OptionSelector />', function() {
  it('renders a minimal option selector', function() {
    const actionOptions = {warn: 'Warning', error: 'Error'};
    const component = mount(
      <OptionSelector
        id="action-selector"
        options={actionOptions}
      />
    );
    expect(component.find(MenuItem)).to.have.length(2);
    expect(component.find('[htmlFor="action-selector"]')).to.not.exist;
  });

  it('renders a option selector with a label', function() {
    const actionOptions = {warn: 'Warning', error: 'Error'};
    const component = mount(
      <OptionSelector
        id="action-selector"
        options={actionOptions}
        label="Star Wars"
      />
    );
    expect(component.find('[htmlFor="action-selector"]')).to.have.text('Star Wars');
  });
});
