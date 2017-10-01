const _ = require('lodash');
const format = require('util').format;
const React = require('react');
const PropTypes = require('prop-types');
const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');
const getIndexHelpLink = require('../index-link-helper');
const ReactTooltip = require('react-tooltip');

const TOOLTIP_ID = 'index-type';

/**
 * Component for the type column.
 */
class TypeColumn extends React.Component {

  _textTooltip() {
    const info = _.pick(this.props.index.extra, ['weights', 'default_language', 'language_override']);
    return _.map(info, (v, k) => {
      return format('%s: %j', k, v);
    }).join('<br />');
  }

  /**
   * Render the type div.
   *
   * @returns {React.Component} The type div.
   */
  renderType() {
    let tooltipOptions = {};
    if (this.props.index.type === 'text') {
      const tooltipText = `${this._textTooltip()}`;
      tooltipOptions = {
        'data-tip': tooltipText,
        'data-for': TOOLTIP_ID,
        'data-effect': 'solid',
        'data-multiline': true,
        'data-border': true
      };
    }
    return (
      <div {...tooltipOptions} className={`property ${this.props.index.type}`} data-test-id="index-table-type">
        {this.props.index.type}
        <InfoSprinkle
          helpLink={getIndexHelpLink(this.props.index.type.toUpperCase())}
          onClickHandler={shell.openExternal}
        />
      </div>
    );
  }

  /**
   * Render the type column.
   *
   * @returns {React.Component} The type column.
   */
  render() {
    return (
      <td className="type-column">
        {this.renderType()}
        <ReactTooltip id={TOOLTIP_ID} />
      </td>
    );
  }
}

TypeColumn.displayType = 'TypeColumn';

TypeColumn.propTypes = {
  index: PropTypes.object.isRequired
};

module.exports = TypeColumn;
