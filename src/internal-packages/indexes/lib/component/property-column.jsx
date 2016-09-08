'use strict';

const _ = require('lodash');
const format = require('util').format;
const React = require('react');
const Action = require('../action/index-actions');
const IndexHelpStore = require('../store/index-help-store');

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
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeHelp = IndexHelpStore.listen(this.handleIndexHelp.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeHelp();
  }

  /**
   * Handle index help.
   */
  handleIndexHelp() {
    debug('Opened help link in a new tab.');
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
    if (prop === 'ttl') {
      return (
        <div key={prop} className='property' data-toggle='tooltip' title={this._ttlTooltip()}>
          {prop}
          {this._link()}
        </div>
      );
    } else if (prop === 'partial') {
      return (
        <div key={prop} className='property' data-toggle='tooltip' title={this._partialTooltip()}>
          {prop}
          {this._link()}
        </div>
      );
    } else {
      return (
        <div key={prop} className='property'>
          {prop}
          {this._link()}
        </div>
      );
    }
  }

  _clickHelp(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.indexHelp(evt.target.parentNode.innerText);
  }

  _link() {
    return (<i className='link' onClick={this._clickHelp.bind(this)} />);
  }

  _partialTooltip() {
    return format('partialFilterExpression: %j', this.props.index.extra.partialFilterExpression);
  }

  _ttlTooltip() {
    return format('expireAfterSeconds: %d', this.props.index.extra.expireAfterSeconds);
  }
}

PropertyColumn.displayProperty = 'PropertyColumn';

module.exports = PropertyColumn;
