'use strict';

const _ = require('lodash');
const React = require('react');
const Action = require('../action/index-actions');
const IndexHelpStore = require('../store/index-help-store');

/**
 * Component for the type column.
 */
class TypeColumn extends React.Component {

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
   * Render the type column.
   *
   * @returns {React.Component} The type column.
   */
  render() {
    return (
      <td className='type-column'>
        {this.renderType()}
      </td>
    );
  }

  /**
   * Render the type div.
   */
  renderType() {
    if (this.props.index.type === 'text') {
      return (
        <div className={`property ${this.props.index.type}`} title={this._textTooltip()}>
          {this.props.index.type}
          {this._link()}
        </div>
      );
    }
    return (
      <div className={`property ${this.props.index.type}`}>
        {this.props.index.type}
        {this._link()}
      </div>
    );
  }

  _clickHelp(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.indexHelp(evt.target.parentNode.innerText);
  }

  _link() {
    return (<i className='link' onClick={this._clickHelp.bind(this)} />);
  }

  _textTooltip() {
    let info = _.pick(this.props.index.extra, ['weights', 'default_language', 'language_override']);
    return _.map(info, (v, k) => {
      return format('%s: %j', k, v);
    }).join('\n');
  }
}

TypeColumn.displayType = 'TypeColumn';

module.exports = TypeColumn;
