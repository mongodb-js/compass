/* eslint react/no-multi-comp: 0 */
const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const TreeStagesStore = require('../stores/tree-stages');
const ExplainStage = require('./explain-stage');
const _ = require('lodash');
const d3 = require('d3');
const constants = require('../constants');

// const debug = require('debug')('mongodb-compass:compass-explain:details-tree');

class ExplainTree extends React.Component {

  componentDidMount() {
    this.drawLinks();
  }

  componentDidUpdate() {
    this.drawLinks();
  }

  getStages() {
    return _.map(this.props.nodes, (stage) => {
      return <ExplainStage {...stage} />;
    });
  }

  drawLinks() {
    // right angle links between nodes
    const elbow = function(d) {
      return 'M' + (d.source.x + d.source.x_size / 2) + ',' + d.source.y +
        'V' + (d.target.y - constants.VERTICAL_PADDING / 2) +
        'H' + (d.target.x + constants.DEFAULT_CARD_WIDTH / 2) +
        'V' + d.target.y;
    };

    const svg = d3.select(this.refs.stages).selectAll('svg.links').data([null]);

    svg.enter().append('svg')
      .attr('class', 'links')
      .attr('width', '100%')
      .attr('height', '100%')
    .append('g');

    // remove unneeded event handlers
    svg.on('dblclick.zoom', null)
      .on('touchstart.zoom', null)
      .on('mousewheel.zoom', null)
      .on('MozMousePixelScroll.zoom', null);

    // links are svg elements
    const links = svg.select('g').selectAll('path.link')
      .data(this.props.links, function(d) { return d.target.key; });

    links.enter().append('path')
      .attr('class', 'link')
      .attr('d', elbow);

    links.exit().remove();
  }

  /**
   * Render ExplainTree Component.
   *
   * @returns {React.Component} The tree view of the explain output.
   */
  render() {
    return (
      <div>
        <div className="explain-tree" style={{height: this.props.height, width: this.props.width}} ref="stages">
          {this.getStages()}
        </div>
      </div>
    );
  }
}

ExplainTree.propTypes = {
  nodes: React.PropTypes.array,
  links: React.PropTypes.array,
  width: React.PropTypes.number,
  height: React.PropTypes.number
};

ExplainTree.defaultProps = {
  nodes: [],
  links: [],
  width: 0,
  height: 0
};

ExplainTree.displayName = 'ExplainTree';


/**
 * ExplainTree connected to the TreeStages store.
 */
class ConnectedExplainTree extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={TreeStagesStore}>
        <ExplainTree />
      </StoreConnector>
    );
  }
}

ConnectedExplainTree.displayName = 'ConnectedExplainTree';

module.exports = ConnectedExplainTree;
module.exports.ExplainTree = ExplainTree;
