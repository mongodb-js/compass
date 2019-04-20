import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import isBoolean from 'lodash.isboolean';
import camelCase from 'lodash.camelcase';
import d3 from 'd3';
import { Button } from 'react-bootstrap';

import styles from './explain-stage.less';

/**
 * Reference to the clock div.
 */
let clock = '';

/**
 * Visibility of fields.
 */
let zIndexCounter = 100;

/**
 * The ExplainStage component.
 */
class ExplainStage extends Component {
  static displayName = 'ExplainStageComponent';

  static propTypes = {
    name: PropTypes.string.isRequired,
    nReturned: PropTypes.number.isRequired,
    highlights: PropTypes.object.isRequired,
    curStageExecTimeMS: PropTypes.number.isRequired,
    prevStageExecTimeMS: PropTypes.number.isRequired,
    totalExecTimeMS: PropTypes.number.isRequired,
    isShard: PropTypes.bool.isRequired,
    details: PropTypes.object.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    xoffset: PropTypes.number.isRequired,
    yoffset: PropTypes.number.isRequired
  }

  static defaultProps = {
    name: '',
    nReturned: 0,
    isShard: false,
    totalExecTimeMS: 1,
    curStageExecTimeMS: 0,
    prevStageExecTimeMS: 0,
    x: 0,
    y: 0,
    xoffset: 0,
    yoffset: 0,
    details: {}
  }

  constructor(props) {
    super(props);

    this.state = { detailsOpen: false };
  }

  /**
   * Draws arc after component mounting.
   */
  componentDidMount() {
    this.drawArc();
  }

  /**
   * Draws arc after component updating.
   */
  componentDidUpdate() {
    this.drawArc();
  }

  /**
   * Gets new ZIndex.
   *
   * @returns {Number}
   */
  getNewZIndex() {
    return zIndexCounter++;
  }

  /**
   * Gets details.
   *
   * @returns {React.Component}
   */
  getDetails() {
    if (!this.state.detailsOpen) {
      return null;
    }

    const detailsJSON = JSON.stringify(this.props.details, null, ' ') || '{}';

    return (
      <div className={classnames(styles['details-output'])}>
        <pre>
          <code>{detailsJSON}</code>
        </pre>
      </div>
    );
  }

  /**
   * Gets highlight sections.
   *
   * @returns {React.Component} Key value list.
   */
  getHighlightSections() {
    return map(this.props.highlights, (value, name) => {
      if (isBoolean(value)) {
        value = value ? 'yes' : 'no';
      }

      return (
        <li key={camelCase(name)} className={classnames(styles['key-value-pair'])}>
          <span className={classnames(styles.key)}>{name}</span>
          <span className={classnames(styles.value)}>{value}</span>
        </li>
      );
    });
  }

  /**
   * Details button clicked handler.
   */
  detailsButtonClicked() {
    const detailsOpen = !this.state.detailsOpen;

    this.setState({detailsOpen});
  }

  /**
   * Draws arc.
   */
  drawArc() {
    // Inputs from explain plan stage
    const totalExMillis = this.props.totalExecTimeMS;
    const curStageExMillis = this.props.curStageExecTimeMS;
    const prevStageExMillis = this.props.prevStageExecTimeMS;

    // Transforms to get the right percentage of arc for each piece of the clock
    const curArcStart = ((prevStageExMillis / totalExMillis) * 2 * Math.PI) || 0;
    const curArcEnd = (((curStageExMillis) / totalExMillis) * 2 * Math.PI) || 0;

    const prevArcStart = 0;
    const prevArcEnd = curArcStart;

    const clockWidth = 60;
    const clockHeight = 60;

    const arcGen = d3.svg.arc();

    // Create the SVG container, and apply a transform such that the origin is the
    // center of the canvas. This way, we don't need to position arcs individually.
    const svgClock = d3.select(clock)
      .selectAll('svg')
      .data([null])
      .enter().append('svg')
      .attr('width', clockWidth)
      .attr('height', clockHeight)
      .append('g')
      .attr('transform', `translate(${clockWidth / 2},${clockHeight / 2})`);

    // Add the prevStageArc arc
    svgClock.append('path')
      .attr('class', 'prevArcPath')
      .style('fill', '#dfdfdf');

    d3.select(clock)
      .select('.prevArcPath')
      .attr('d', arcGen({
        startAngle: prevArcStart,
        endAngle: prevArcEnd,
        innerRadius: 24,
        outerRadius: 29
      }));

    // Add the curStageArc arc in blue
    svgClock.append('path')
      .attr('class', 'currArcPath')
      .style('fill', '#43B1E5');

    d3.select(clock)
      .select('.currArcPath')
      .attr('d', arcGen({
        startAngle: curArcStart,
        endAngle: curArcEnd,
        innerRadius: 24,
        outerRadius: 29
      }));
  }

  /**
   * Renders shard view.
   *
   * @returns {React.Component} The shard view.
   */
  renderShardView() {
    const left = this.props.x + this.props.xoffset;
    const top = this.props.y + this.props.yoffset;

    return (
      <div
        className={classnames(styles['explain-stage'], styles['explain-stage-is-shard'])}
        style={{
          zIndex: this.state.detailsOpen ? this.getNewZIndex() : 'initial',
          top,
          left
        }}
      >
        <h3 className={classnames(styles['stage-header'])}>{this.props.name}</h3>
      </div>
    );
  }

  /**
   * Renders stage view.
   *
   * @returns {React.Component} The stage view.
   */
  renderStageView() {
    const left = this.props.x + this.props.xoffset;
    const top = this.props.y + this.props.yoffset;
    const deltaExecTime = this.props.curStageExecTimeMS - this.props.prevStageExecTimeMS;

    return (
      <div
        className={classnames(styles['explain-stage'])}
        style={{
          zIndex: this.state.detailsOpen ? this.getNewZIndex() : 'initial',
          top,
          left
        }}
      >
        <h3 className={classnames(styles['stage-header'])}>{this.props.name}</h3>
        <ul className={classnames(styles.core)}>
          <li className={classnames(styles['key-value-pair'], styles.nReturned)}>
            <span className={classnames(styles.key)}>nReturned</span>
            <span className={classnames(styles.value)}>{this.props.nReturned}</span>
          </li>
          <li className={classnames(styles['key-value-pair'], styles['exec-time'])}>
            <span className={classnames(styles.key)}>Execution Time</span>
            <span className={classnames(styles.value)}>
              <div
                className={classnames(styles.clock)}
                ref={(inst) => { clock = inst; }}
              >
                <div className={classnames(styles.face)}>
                  <span>{deltaExecTime}</span>
                  ms
                </div>
              </div>
            </span>
          </li>
        </ul>
        <ul className={classnames(styles.highlighted)}>
          {this.getHighlightSections()}
        </ul>
        <div className={classnames(styles.details)}>
          <Button
            bsSize="xsmall"
            bsStyle="default"
            className={this.state.detailsOpen ? 'active' : ''}
            onClick={this.detailsButtonClicked.bind(this)}
          >
            Details
          </Button>
          {this.getDetails()}
        </div>
      </div>
    );
  }

  /**
   * Renders ExplainStage.
   *
   * @returns {React.Component}
   */
  render() {
    return this.props.isShard ? this.renderShardView() : this.renderStageView();
  }
}

export default ExplainStage;
