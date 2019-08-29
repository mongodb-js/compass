const React = require('react');
const sinon = require('sinon');
const chaiEnzyme = require('chai-enzyme');
const chai = require('chai');
const expect = chai.expect;
const { mount } = require('enzyme');
const { ViewSwitcher } = require('../');

chai.use(chaiEnzyme());

describe('<ViewSwitcher />', () => {
  const onClick = sinon.spy();
  const component = mount(
    <ViewSwitcher
      label="Edit Mode"
      buttonLabels={[ 'Chart Builder', 'JSON Editor' ]}
      activeButton='json-editor'
      dataTestId="chart-view-switcher"
      onClick={onClick}
    />
  );

  it('renders the switcher label', () => {
    expect(component.find('.view-switcher-label').at(0)).to.contain.text('Edit Mode');
  });

  it('sets the data-test-id', () => {
    expect(component.find('[data-test-id="chart-view-switcher-chart-builder"]').at(0)).
      to.contain.text('Chart Builder');
    expect(component.find('[data-test-id="chart-view-switcher-json-editor"]').at(0)).
      to.contain.text('JSON Editor');
  });

  context('when clicking on the view switcher', () => {
    before(() => {
      component.find('button').first().simulate('click');
    });

    it('executes the onClick function', () => {
      expect(onClick.called).to.be.true;
    });
  });

  context('when providing icon class names', () => {
    const iconComponent = mount(
      <ViewSwitcher
        label="Edit Mode"
        buttonLabels={[ 'Chart Builder', 'JSON Editor' ]}
        iconClassNames={['list', 'table']}
        activeButton='json-editor'
        dataTestId="chart-view-switcher"
        onClick={onClick}
      />
    );

    it('adds an icon to the button', () => {
      expect(iconComponent.find('i.list')).to.be.present();
      expect(iconComponent.find('i.table')).to.be.present();
    });
  });

  context('when showLabels prop is set to false', () => {
    const noLabelComponent = mount(
      <ViewSwitcher
        label="Edit Mode"
        buttonLabels={[ 'List', 'Table' ]}
        iconClassNames={['list', 'table']}
        showLabels={false}
        activeButton='json-editor'
        dataTestId="chart-view-switcher"
        onClick={onClick}
      />
    );

    it('component contains no text', () => {
      expect(noLabelComponent.find('[data-test-id="chart-view-switcher-list"]').at(0)).
        to.have.text('');
      expect(noLabelComponent.find('[data-test-id="chart-view-switcher-table"]').at(0)).
        to.have.text('');
    });
  });
});
