const React = require('react');
const PropTypes = require('prop-types');
const FontAwesome = require('react-fontawesome');
const QueryActions = require('../action');

class OptionsToggle extends React.Component {

  onClick() {
    QueryActions.toggleQueryOptions();
  }

  render() {
    const symbol = this.props.expanded ? 'caret-down' : 'caret-right';

    return (
      <div
        className="querybar-options-toggle"
        onClick={this.onClick.bind(this)}
        data-test-id="querybar-options-toggle">
        <FontAwesome fixedWidth name={symbol} />
        <span>Options</span>
      </div>
    );
  }
}


OptionsToggle.propTypes = {
  expanded: PropTypes.bool.isRequired
};

OptionsToggle.displayName = 'OptionsToggle';

module.exports = OptionsToggle;
