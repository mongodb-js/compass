const React = require('react');
const FontAwesome = require('react-fontawesome');
const QueryActions = require('../action');

class OptionsToggle extends React.Component {

  onClick() {
    QueryActions.toggleQueryOptions();
  }

  render() {
    const symbol = this.props.expanded ? 'caret-down' : 'caret-right';

    return (
<<<<<<< HEAD
      <div
        className="querybar-options-toggle"
        onClick={this.onClick.bind(this)}
        data-test-id="querybar-options-toggle">
=======
      <div className="querybar-options-toggle" onClick={this.onClick.bind(this)}>
>>>>>>> COMPASS-630 COMPASS-631 implement advanced query bar
        <FontAwesome fixedWidth name={symbol} />
        <span>Options</span>
      </div>
    );
  }
}


OptionsToggle.propTypes = {
  expanded: React.PropTypes.bool.isRequired
};

OptionsToggle.displayName = 'OptionsToggle';

module.exports = OptionsToggle;
