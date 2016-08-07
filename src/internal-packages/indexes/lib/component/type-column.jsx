'use strict';

const _ = require('lodash');
const React = require('react');

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
    if (this.props.type === 'text') {
      return (
        <div className={`property ${this.props.index.type}`} title={this._textTooltip()}>
          {this.props.index.type}
          <i className='link' />
        </div>
      );
    }
    return (
      <div className={`property ${this.props.index.type}`}>
        {this.props.index.type}
        <i className='link' />
      </div>
    );
  }

  _textTooltip() {
    var info = _.pick(this.props.index.extra, ['weights', 'default_language', 'language_override']);
    return _.map(info, (v, k) => {
      return format('%s: %j', k, v);
    }).join('\n');
  }
}

TypeColumn.displayType = 'TypeColumn';

module.exports = TypeColumn;
