const React = require('react');
const Actions = require('../actions');
const FontAwesome = require('react-fontawesome');


class ShowQueryHistoryButton extends React.Component {
  constructor(props) {
    super(props);
    this.unCollapse = this.unCollapse.bind(this);
  }

  unCollapse() {
    Actions.unCollapse();
  }

  collapse() {
    Actions.collapse();
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
        onClick={this.unCollapse}
      >
        <FontAwesome name="history" className="query-history-button-icon"/>
      </button>
    );
  }
}

ShowQueryHistoryButton.displayName = 'ShowQueryHistoryButton';

module.exports = ShowQueryHistoryButton;
