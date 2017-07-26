const React = require('react');
const Actions = require('../actions');
const FontAwesome = require('react-fontawesome');

class ShowQueryHistoryButton extends React.Component {
  constructor(props) {
    super(props);
    this.handleCollapse = this.handleCollapse.bind(this);
  }

  handleCollapse() {
    Actions.toggleCollapse();
  }

  /**
   * Render ShowQueryHistoryButton.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <button
        id="query_history_button"
        key="query-history-button"
        className="btn btn-default btn-sm query-history-button query-history-button-expand"
        data-test-id="query-history-button"
        type="button"
        onClick={this.handleCollapse}
      >
        <FontAwesome name="history" className="query-history-button-icon"/>
      </button>
    );
  }
}

ShowQueryHistoryButton.displayName = 'ShowQueryHistoryButton';

module.exports = ShowQueryHistoryButton;
