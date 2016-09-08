'use strict';

const _ = require('lodash');
const format = require('util').format;
const React = require('react');

/**
 * Component for the property column.
 */
class PropertyColumn extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the property column.
   *
   * @returns {React.Component} The property column.
   */
  render() {
    var properties = _.map(this.props.index.properties, (prop) => {
      return this.renderProperty(prop);
    });
    return (
      <td className='property-column'>
        <div className='properties'>
          {properties}
          {this.renderCardinality()}
        </div>
      </td>
    );
  }

  /**
   * Render cardinality info.
   *
   * @returns {React.Component} The cardianlity info.
   */
  renderCardinality() {
    if (this.props.index.cardinality === 'compound') {
      return (
        <div className='property cardinality'>
          {this.props.index.cardinality}
          <i className='link' />
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
    if (prop === 'ttl') {
      return (
        <div key={prop} className='property' data-toggle='tooltip' title={this._ttlTooltip()}>
          {prop}
          <i className='link' />
        </div>
      );
    } else if (prop === 'partial') {
      return (
        <div key={prop} className='property' data-toggle='tooltip' title={this._partialTooltip()}>
          {prop}
          <i className='link' />
        </div>
      );
    } else {
      return (
        <div key={prop} className='property'>
          {prop}
          <i className='link' />
        </div>
      );
    }
  }

  partialTooltip() {
    return format('partialFilterExpression: %j', this.props.index.extra.partialFilterExpression);
  }

  ttlTooltip() {
    return format('expireAfterSeconds: %d', this.props.index.extra.expireAfterSeconds);
  }
}

PropertyColumn.displayProperty = 'PropertyColumn';

module.exports = PropertyColumn;
