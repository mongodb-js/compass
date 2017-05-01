const React = require('react');
const PropTypes = require('prop-types');
const Button = require('react-bootstrap').Button;
const d3 = require('d3');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:explain:stage');

let zIndexCounter = 100;

class StageComponent extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      detailsOpen: false
    };
  }

  componentDidMount() {
    this.drawArc();
  }

  componentDidUpdate() {
    this.drawArc();
  }

  static getNewZIndex() {
    return zIndexCounter++;
  }

  getDetails() {
    if (!this.state.detailsOpen) {
      return null;
    }
    const detailsJSON = JSON.stringify(this.props.details, null, ' ') || '{}';
    return (
      <div className="details-output">
        <pre>
          <code>{detailsJSON}</code>
        </pre>
      </div>
    );
  }

  getHighlightSections() {
    return _.map(this.props.highlights, (value, name) => {
      if (_.isBoolean(value)) {
        value = value ? 'yes' : 'no';
      }
      return (
        <li key={_.camelCase(name)} className="key-value-pair">
          <span className="key">{name}</span>
          <span className="value">{value}</span>
        </li>
      );
    });
  }

  detailsButtonClicked() {
    const detailsOpen = !this.state.detailsOpen;
    this.setState({
      detailsOpen: detailsOpen
    });
  }

  drawArc() {
    // inputs from explain plan stage
    const totalExMillis = this.props.totalExecTimeMS;
    const curStageExMillis = this.props.curStageExecTimeMS;
    const prevStageExMillis = this.props.prevStageExecTimeMS;

    // transforms to get the right percentage of arc for each piece of the clock
    const curArcStart = ((prevStageExMillis / totalExMillis) * 2 * Math.PI) || 0;
    const curArcEnd = (((curStageExMillis) / totalExMillis) * 2 * Math.PI) || 0;

    const prevArcStart = 0;
    const prevArcEnd = curArcStart;

    const clockWidth = 60;
    const clockHeight = 60;

    const arcGen = d3.svg.arc();

    // Create the SVG container, and apply a transform such that the origin is the
    // center of the canvas. This way, we don't need to position arcs individually.
    const svgClock = d3.select(this.refs.clock).selectAll('svg').data([null])
      .enter().append('svg')
      .attr('width', clockWidth)
      .attr('height', clockHeight)
      .append('g')
      .attr('transform', 'translate(' + clockWidth / 2 + ',' + clockHeight / 2 + ')');

    // Add the prevStageArc arc
    svgClock.append('path')
      .attr('class', 'prevArcPath')
      .style('fill', '#dfdfdf');

    d3.select(this.refs.clock).select('.prevArcPath')
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

    d3.select(this.refs.clock).select('.currArcPath')
      .attr('d', arcGen({
        startAngle: curArcStart,
        endAngle: curArcEnd,
        innerRadius: 24,
        outerRadius: 29
      }));
  }

  renderShardView() {
    const left = this.props.x + this.props.xoffset;
    const top = this.props.y + this.props.yoffset;

    return (
      <div className="explain-stage explain-stage-is-shard" style={{
        zIndex: this.state.detailsOpen ? StageComponent.getNewZIndex() : 'initial',
        top: top,
        left: left
      }}>
        <h3 className="stage-header">{this.props.name}</h3>
      </div>
    );
  }

  renderStageView() {
    const left = this.props.x + this.props.xoffset;
    const top = this.props.y + this.props.yoffset;
    const deltaExecTime = this.props.curStageExecTimeMS - this.props.prevStageExecTimeMS;

    return (
      <div className="explain-stage" style={{
        zIndex: this.state.detailsOpen ? StageComponent.getNewZIndex() : 'initial',
        top: top,
        left: left
      }}>
        <h3 className="stage-header">{this.props.name}</h3>
        <ul className="core">
          <li className="key-value-pair nReturned">
            <span className="key">nReturned</span>
            <span className="value">{this.props.nReturned}</span>
          </li>
          <li className="key-value-pair exec-time">
            <span className="key">Execution Time</span>
            <span className="value">
              <div className="clock" ref="clock">
                <div className="face">
                  <span>{deltaExecTime}</span>
                  ms
                </div>
              </div>
            </span>
          </li>
        </ul>
        <ul className="highlighted">
          {this.getHighlightSections()}
        </ul>
        <div className="details">
          <Button
            bsSize="xsmall"
            bsStyle="default"
            className={this.state.detailsOpen ? 'active' : ''}
            onClick={this.detailsButtonClicked.bind(this)}
          >Details</Button>
          {this.getDetails()}
        </div>
      </div>
    );
  }

  /**
   * Render Summary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  render() {
    return this.props.isShard ?
      this.renderShardView() : this.renderStageView();
  }
}

StageComponent.propTypes = {
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
};

StageComponent.defaultProps = {
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
};

module.exports = StageComponent;
