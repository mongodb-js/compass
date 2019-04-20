import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import d3 from 'd3';
import { ExplainStage } from 'components/explain-stage';

import STAGE_CARD_PROPERTIES from 'constants/stage-card-properties';

import styles from './explain-tree.less';

/**
 * Reference to the tree div.
 */
let tree = '';

/**
 * The ExplainTree component.
 */
class ExplainTree extends Component {
  static displayName = 'ExplainTreeComponent';

  static propTypes = {
    nodes: PropTypes.array,
    links: PropTypes.array,
    width: PropTypes.number,
    height: PropTypes.number
  }

  static defaultProps = { nodes: [], links: [], width: 0, height: 0 };

  /**
   * After mounting component draw links
   */
  componentDidMount() {
    this.drawLinks();
  }

  /**
   * After updating component draw links
   */
  componentDidUpdate() {
    this.drawLinks();
  }

  /**
   * Renders ExplainStage component.
   *
   * @returns {React.Component} The rendered component.
   */
  getStages() {
    return map(this.props.nodes, (stage) => (<ExplainStage {...stage} />));
  }

  /**
   * Draws links
   */
  drawLinks() {
    // Right angle links between nodes
    const elbow = (d) => `M${d.source.x + d.source.x_size / 2},${d.source.y}
    V${d.target.y - STAGE_CARD_PROPERTIES.VERTICAL_PADDING / 2}
    H${d.target.x + STAGE_CARD_PROPERTIES.DEFAULT_CARD_WIDTH / 2}
    V${d.target.y}`;
    const svg = d3.select(tree).selectAll('svg.links').data([null]);

    svg.enter().append('svg')
      .attr('class', 'links')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g');

    // Remove unneeded event handlers
    svg.on('dblclick.zoom', null)
      .on('touchstart.zoom', null)
      .on('mousewheel.zoom', null)
      .on('MozMousePixelScroll.zoom', null);

    // Links are svg elements
    const links = svg.select('g')
      .selectAll('path.link')
      .data(this.props.links, (d) => d.target.key);

    links.enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#dee0e3')
      .attr('stroke-width', '6px')
      .attr('d', elbow);

    links.exit().remove();
  }

  /**
   * Renders ExplainTree component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <div
          className={classnames(styles['explain-tree'])}
          style={{ height: this.props.height, width: this.props.width }}
          ref={(inst) => { tree = inst; }}
        >
          {this.getStages()}
        </div>
      </div>
    );
  }
}

export default ExplainTree;
