'use strict';

const _ = require('lodash');
const React = require('react');
const openIndexHelpLink = require('../index-link-helper');

/**
 * Component for the type column.
 */
class TypeColumn extends React.Component {

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
    openIndexHelpLink(evt.target.parentNode.innerText);
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
