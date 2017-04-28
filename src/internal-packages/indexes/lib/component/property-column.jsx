const _ = require('lodash');
const format = require('util').format;
const React = require('react');
const PropTypes = require('prop-types');
const openIndexHelpLink = require('../index-link-helper');
const ReactTooltip = require('react-tooltip');

const TOOLTIP_ID = 'index-property';

/**
 * Component for the property column.
 */
class PropertyColumn extends React.Component {

  _clickHelp(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    openIndexHelpLink(evt.target.parentNode.innerText);
  }

  _link() {
    return (<i className="link" onClick={this._clickHelp.bind(this)} />);
  }

  _partialTooltip() {
    return format('partialFilterExpression: %j', this.props.index.extra.partialFilterExpression);
  }

  _ttlTooltip() {
    return format('expireAfterSeconds: %d', this.props.index.extra.expireAfterSeconds);
  }

  /**
   * Render cardinality info.
   *
   * @returns {React.Component} The cardianlity info.
   */
  renderCardinality() {
    if (this.props.index.cardinality === 'compound') {
      return (
        <div className="property cardinality">
          {this.props.index.cardinality}
          {this._link()}
        </div>
      );
    }
  }

  /**
   * Render the property column
   *
   * @param {String} prop - The property.
   *
   * @returns {React.Component} The property component.
   */
  renderProperty(prop) {
    const tooltipOptions = {
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true
    };

    if (prop === 'ttl') {
      tooltipOptions['data-tip'] = this._ttlTooltip();
      return (
        <div {...tooltipOptions} key={prop} className="property">
          {prop}
          {this._link()}
        </div>
      );
    } else if (prop === 'partial') {
      tooltipOptions['data-tip'] = this._partialTooltip();
      return (
        <div {...tooltipOptions} key={prop} className="property">
          {prop}
          {this._link()}
        </div>
      );
    }
    return (
      <div key={prop} className="property">
        {prop}
        {this._link()}
      </div>
    );
  }

  /**
   * Render the property column.
   *
   * @returns {React.Component} The property column.
   */
  render() {
    const properties = _.map(this.props.index.properties, (prop) => {
      return this.renderProperty(prop);
    });
    return (
      <td className="property-column">
        <div className="properties">
          {properties}
          <ReactTooltip id={TOOLTIP_ID} />
          {this.renderCardinality()}
        </div>
      </td>
    );
  }

}

PropertyColumn.displayProperty = 'PropertyColumn';

PropertyColumn.propTypes = {
  index: PropTypes.object.isRequired
};

module.exports = PropertyColumn;
