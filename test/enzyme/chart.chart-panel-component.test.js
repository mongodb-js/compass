/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const { mount } = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { DropdownButton } = require('react-bootstrap');
const {
  CHART_CHANNEL_ENUM,
  CHART_TYPE_ENUM
} = require('../../src/internal-packages/chart/lib/constants');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());


describe('<ChartPanel />', function() {
  beforeEach(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();

    this.OptionSelector = require('../../src/internal-packages/app/lib/components/option-selector');
    app.appRegistry.registerComponent('App.OptionSelector', this.OptionSelector);

    this.ChartPanel = require('../../src/internal-packages/chart/lib/components/chart-panel');
    this.EncodingChannel = require('../../src/internal-packages/chart/lib/components/encoding-channel');
    this.DraggableField = require('../../src/internal-packages/chart/lib/components/draggable-field');
  });

  context('for the area chart type', function() {
    it('renders when in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          chartType={CHART_TYPE_ENUM.AREA}
          encodedChannels={{}}
        />
      );
      const dropdown = component.find(DropdownButton);
      expect(dropdown.find('button')).to.have.text('area ');
    });

    it('renders with placeholders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          chartType={CHART_TYPE_ENUM.AREA}
          encodedChannels={{}}
        />
      );
      const xChannel = component.find('#chart-panel-channel-x');
      const yChannel = component.find('#chart-panel-channel-y');
      expect(xChannel).to.have.text('drop a field here');
      expect(yChannel).to.have.text('drop a field here');
    });

    it('renders when channels have been encoded', function() {
      const encodedChannels = {
        [CHART_CHANNEL_ENUM.X]: {
          field: 'field.path.age',
          type: 'quantitative'
        },
        [CHART_CHANNEL_ENUM.Y]: {
          field: 'field.path.height',
          type: 'quantitative'
        }
      };
      const component = mount(
        <this.ChartPanel
          chartType={CHART_TYPE_ENUM.AREA}
          encodedChannels={encodedChannels}
        />
      );
      const xChannel = component.find('#chart-panel-channel-x');
      const yChannel = component.find('#chart-panel-channel-y');
      expect(xChannel).to.have.descendants(this.DraggableField);
      expect(yChannel).to.have.descendants(this.DraggableField);
    });
  });

  context('for the bar chart type', function() {
    it('renders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          chartType={CHART_TYPE_ENUM.BAR}
          encodedChannels={{}}
        />
      );
      const dropdown = component.find(DropdownButton);
      expect(dropdown.find('button')).to.have.text('bar ');
    });
  });

  context('for the point chart type', function() {
    it('renders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          chartType={CHART_TYPE_ENUM.POINT}
          encodedChannels={{}}
        />
      );
      const dropdown = component.find(DropdownButton);
      expect(dropdown.find('button')).to.have.text('point ');
    });
  });

  context('for the line chart type', function() {
    it('renders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          chartType={CHART_TYPE_ENUM.LINE}
          encodedChannels={{}}
        />
      );
      const dropdown = component.find(DropdownButton);
      expect(dropdown.find('button')).to.have.text('line ');
    });
  });
});
