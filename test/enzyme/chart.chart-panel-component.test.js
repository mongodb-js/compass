/* eslint no-unused-vars: 0, no-unused-expressions: 0, new-cap: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const { mount } = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { DropdownButton } = require('react-bootstrap');
const {DragDropContext} = require('react-dnd');
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
