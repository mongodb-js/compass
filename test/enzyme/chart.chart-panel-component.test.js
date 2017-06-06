/* eslint no-unused-vars: 0, no-unused-expressions: 0, new-cap: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const { mount } = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { DragDropContext } = require('react-dnd');

const BarChartRole = require('../../src/internal-packages/chart/lib/chart-types/bar.json');
const AreaChartRole = require('../../src/internal-packages/chart/lib/chart-types/area.json');
const LineChartRole = require('../../src/internal-packages/chart/lib/chart-types/line.json');
const ScatterPlotRole = require('../../src/internal-packages/chart/lib/chart-types/scatter.json');

const AVAILABLE_CHART_ROLES = [ScatterPlotRole, BarChartRole, LineChartRole, AreaChartRole];

const {
  CHART_CHANNEL_ENUM,
  CHART_TYPE_ENUM
} = require('../../src/internal-packages/chart/lib/constants');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());


describe('<ChartPanel />', function() {
  before(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();

    const ChartPanel = require('../../src/internal-packages/chart/lib/components/chart-panel');

    // @KeyboardTsundoku: fake backend is required to prevent the error
    // 'Cannot have two HTML5 backends at the same time.''
    const fakeBackend = {
      setup: () => {},
      teardown: () => {},
      connectDropTarget: () => {},
      connectDragSource: () => {}
    };

    // @KeyboardTsundoku: wrapping field panel in DragDropContext to avoid the error
    // "Invariant Violation: Could not find the drag and drop manager in the context
    //  of DraggableField. Make sure to wrap the top-level component of your app with DragDropContext."
    this.ChartPanel = DragDropContext(() => {return fakeBackend;})(ChartPanel);
    this.EncodingChannel = require('../../src/internal-packages/chart/lib/components/encoding-channel');
    this.DraggableField = require('../../src/internal-packages/chart/lib/components/draggable-field');
  });

  context('for the area chart type', function() {
    it('renders when in the initial state', function() {
      const component = mount(
        <this.ChartPanel
        availableChartRoles={AVAILABLE_CHART_ROLES}
        chartType="Area Chart"
        encodedChannels={{}}
        />
      );
      expect(component.find('.chart-type-picker-title')).to.include.text('Area Chart');
      expect(component.find('.chart-type-picker-title span i')).to.have.className('mms-icon-chart-area');
    });

    it('renders with placeholders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          availableChartRoles={AVAILABLE_CHART_ROLES}
          chartType="Area Chart"
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
          fieldName: 'age',
          type: 'quantitative'
        },
        [CHART_CHANNEL_ENUM.Y]: {
          field: 'field.path.height',
          fieldName: 'height',
          type: 'quantitative'
        }
      };
      const component = mount(
        <this.ChartPanel
          availableChartRoles={AVAILABLE_CHART_ROLES}
          chartType="Area Chart"
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
          availableChartRoles={AVAILABLE_CHART_ROLES}
          chartType="Bar Chart"
          encodedChannels={{}}
        />
      );
      expect(component.find('.chart-type-picker-title')).to.include.text('Bar Chart');
      expect(component.find('.chart-type-picker-title span i')).to.have.className('mms-icon-chart-bar');
    });
  });

  context('for the point chart type', function() {
    it('renders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          availableChartRoles={AVAILABLE_CHART_ROLES}
          chartType="Scatter Plot"
          encodedChannels={{}}
        />
      );
      expect(component.find('.chart-type-picker-title')).to.include.text('Scatter Plot');
      expect(component.find('.chart-type-picker-title span i')).to.have.className('mms-icon-chart-scatter');
    });
  });

  context('for the line chart type', function() {
    it('renders in the initial state', function() {
      const component = mount(
        <this.ChartPanel
          availableChartRoles={AVAILABLE_CHART_ROLES}
          chartType="Line Chart"
          encodedChannels={{}}
        />
      );
      expect(component.find('.chart-type-picker-title')).to.include.text('Line Chart');
      expect(component.find('.chart-type-picker-title span i')).to.have.className('mms-icon-chart-line');
    });
  });

  context('for a chart that has no icon', function() {
    it('renders in the initial state with no icon', function() {
      const chartRoles = AVAILABLE_CHART_ROLES.concat([{
        'name': 'Magic Bar Chart',
        'order': 14,
        'specType': 'vega-lite',
        'channels': [
          { 'name': 'x', 'required': true },
          { 'name': 'y', 'required': true },
          { 'name': 'color', 'required': false },
          { 'name': 'detail', 'required': false }
        ],
        'spec': {
          'mark': 'bar'
        }
      }]);
      const component = mount(
        <this.ChartPanel
          availableChartRoles={chartRoles}
          chartType="Magic Bar Chart"
          encodedChannels={{}}
        />
      );
      console.info(chartRoles);
      console.log(component.debug());
      expect(component.find('.chart-type-picker-title')).to.include.text('Magic Bar Chart');
      expect(component.find('.chart-type-picker-title span i')).to.have.className('chart-type-picker-no-icon');
    });
  });
});
