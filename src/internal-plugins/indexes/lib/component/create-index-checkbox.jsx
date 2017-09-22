const React = require('react');
const PropTypes = require('prop-types');
const Action = require('../action/index-actions');

/**
 * Component for the create index checkbox form.
 */
class CreateIndexCheckbox extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = {
      checked: false
    };
  }

  /**
   * Update stored state value when input field changes and
   * fire update option action to submit value to add index form.
   *
   * @param {Object} evt - The input change event.
   */
  handleCheckbox(evt) {
    // don't use preventDefault with React checkboxes
    // https://facebook.github.io/react/docs/forms.html#potential-issues-with-checkboxes-and-radio-buttons
    evt.stopPropagation();
    this.setState({ checked: evt.target.checked });
    Action.updateOption(this.props.option, evt.target.checked, this.props.isParam);
  }

  /**
   * Render the create index checkbox form.
   *
   * @returns {React.Component} The create index checkbox form.
   */
  render() {
    return (
      <div className="create-index-checkbox">
        <label>
        <input
          type="checkbox"
          checked={this.state.checked}
          className="create-index-checkbox-input"
          onChange={this.handleCheckbox.bind(this)} />
        <p className="create-index-checkbox-description">
          {this.props.description}
        </p>
        </label>
      </div>
    );
  }
}

CreateIndexCheckbox.displayName = 'CreateIndexCheckbox';

CreateIndexCheckbox.propTypes = {
  description: PropTypes.string.isRequired,
  isParam: PropTypes.bool.isRequired,
  option: PropTypes.string.isRequired
};

module.exports = CreateIndexCheckbox;
